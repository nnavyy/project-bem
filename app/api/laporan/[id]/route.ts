import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth"; // fungsi verifikasi JWT

// GET semua laporan
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let laporan;
    if (user.role === "MAHASISWA") {
      laporan = await prisma.laporan.findMany({
        where: { mahasiswaId: user.id },
        include: { mahasiswa: true, adminTindak: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      laporan = await prisma.laporan.findMany({
        include: { mahasiswa: true, adminTindak: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(laporan);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST buat laporan baru (mahasiswa)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req);

    if (!user || user.role !== "MAHASISWA") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { judul, isi } = await req.json();

    const laporan = await prisma.laporan.create({
      data: {
        judul,
        isi,
        mahasiswaId: user.id,
      },
    });

    return NextResponse.json(laporan, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
