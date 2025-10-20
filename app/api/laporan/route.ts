import { NextResponse, NextRequest  } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// bikin tipe token sesuai payload login kamu
interface TokenPayload {
  id: string;
  role: string;
  email?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { judul, isi } = body;

    // Ambil token dari middleware login
    const token = (await getToken({ req })) as TokenPayload | null;

    // Pastikan token valid dan role mahasiswa
    if (!token || token.role !== "mahasiswa") {
      return NextResponse.json(
        { message: "Unauthorized, hanya mahasiswa yang bisa kirim laporan" },
        { status: 401 }
      );
    }

    // Buat laporan baru
    const laporan = await prisma.laporan.create({
      data: {
        judul,
        isi,
        mahasiswaId: token.id, // id dari mahasiswa yang login
      },
    });

    return NextResponse.json(laporan, { status: 201 });
  } catch (error) {
    console.error("Error POST laporan:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = (await getToken({ req })) as TokenPayload | null;

    // Hanya admin yang bisa lihat semua laporan
    if (!token || token.role !== "Admin") {
      return NextResponse.json(
        { message: "Unauthorized, hanya admin yang bisa lihat laporan" },
        { status: 401 }
      );
    }

    const laporan = await prisma.laporan.findMany({
      include: {
        mahasiswa: {
          select: {
            nama: true,
            nim: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(laporan, { status: 200 });
  } catch (error) {
    console.error("Error GET laporan:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
