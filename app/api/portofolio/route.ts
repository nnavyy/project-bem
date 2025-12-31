import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET semua portofolio (bisa dilihat siapa pun)
export async function GET() {
  try {
    const data = await prisma.portofolio.findMany({
      include: { galeri: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error GET /portofolio:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST buat portofolio baru (ADMIN / HEAD_ADMIN)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { namaDivisi, deskripsi, fotoUtama, galeri } = await req.json();

    const created = await prisma.portofolio.create({
  data: {
    namaDivisi,
    deskripsi,
    fotoUtama,
    admin: {
      connect:  { id: String(user.id) },
    },
    galeri: {
      create: galeri || [], 
    },
  },
  include: { galeri: true },
});


    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Error POST /portofolio:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// PUT untuk update portofolio (ADMIN / HEAD_ADMIN)
export async function PUT(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, namaDivisi, deskripsi, fotoUtama } = await req.json();

    const updated = await prisma.portofolio.update({
      where: { id },
      data: { namaDivisi, deskripsi, fotoUtama },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error PUT /portofolio:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE portofolio
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    await prisma.portofolio.delete({ where: { id } });

    return NextResponse.json({ message: "Portofolio dihapus" });
  } catch (err) {
    console.error("Error DELETE /portofolio:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
