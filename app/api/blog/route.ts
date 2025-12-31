import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma"; // pastiin export default di prisma.ts
import { verifyToken } from "@/lib/auth";

// GET semua blog (bisa diakses oleh semua user)
export async function GET() {
  try {
    const blogs = await prisma.blog.findMany({
      include: {
        penulis: {
          select: { id: true, nama: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // format biar cocok ditampilkan di dashboard kotak
    const formatted = blogs.map((b) => ({
      id: b.id,
      judul: b.judul,
      isi: b.isi,
      gambar: b.gambar,
      author: b.penulis?.nama || "BEM ITESA",
      role: b.penulis?.role || "ADMIN",
      createdAt: b.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Error GET /blog:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST buat blog baru (hanya ADMIN / HEAD_ADMIN)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req);

    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { judul, isi, gambar } = await req.json();

    if (!judul || !isi) {
      return NextResponse.json({ message: "Judul dan isi wajib diisi" }, { status: 400 });
    }

    const blog = await prisma.blog.create({
      data: {
        judul,
        isi,
        gambar,
        penulisId: user.id,
      },
      include: {
        penulis: { select: { id: true, nama: true, role: true } },
      },
    });

    return NextResponse.json(blog, { status: 201 });
  } catch (err) {
    console.error("Error POST /blog:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// PUT untuk update blog (admin)
export async function PUT(req: NextRequest) {
  try {
    const user = await verifyToken(req);

    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, judul, isi, gambar } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ID blog diperlukan" }, { status: 400 });
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: { judul, isi, gambar },
    });

    return NextResponse.json(blog);
  } catch (err) {
    console.error("Error PUT /blog:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE blog
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyToken(req);

    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ID blog diperlukan" }, { status: 400 });
    }

    await prisma.blog.delete({ where: { id } });

    return NextResponse.json({ message: "Blog berhasil dihapus" });
  } catch (err) {
    console.error("Error DELETE /blog:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
