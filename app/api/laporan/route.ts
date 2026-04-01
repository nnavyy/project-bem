import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET laporan
// - MAHASISWA: hanya miliknya sendiri
// - ADMIN/HEAD_ADMIN: semua laporan
// Include relasi yang dibutuhkan headadmin/admin untuk monitoring
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const where =
      user.role === "MAHASISWA" ? { mahasiswaId: user.id } : undefined;

    const laporan = await prisma.laporan.findMany({
      where,
      include: {
        mahasiswa: {
          select: {
            id: true,
            nim: true,
            nama: true,
            email: true,
            jurusan: true,
          },
        },
        adminTindak: {
          select: { id: true, username: true, nama: true, role: true },
        },
        tindakLanjut: {
          orderBy: { createdAt: "asc" },
          include: {
            admin: {
              select: { id: true, username: true, nama: true, role: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(laporan);
  } catch (err) {
    console.error("Error GET /api/laporan:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST laporan (MAHASISWA)
// Support field baru: jenisKeluhan, tanggalKejadian, lokasi, lampiranUrl
export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== "MAHASISWA") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      judul?: string;
      isi?: string;
      jenisKeluhan?: "RUANGAN" | "DOSEN" | "RUANG_LINGKUP";
      tanggalKejadian?: string | null;
      lokasi?: string | null;
      lampiranUrl?: string | null;
    };

    const judul = body.judul?.trim();
    const isi = body.isi?.trim();

    if (!judul || !isi) {
      return NextResponse.json(
        { message: "Judul dan isi wajib diisi" },
        { status: 400 },
      );
    }

    const laporan = await prisma.laporan.create({
      data: {
        judul,
        isi,
        jenisKeluhan: body.jenisKeluhan ?? undefined,
        tanggalKejadian: body.tanggalKejadian
          ? new Date(body.tanggalKejadian)
          : null,
        lokasi: body.lokasi ?? null,
        lampiranUrl: body.lampiranUrl ?? null,
        mahasiswaId: user.id,
      },
      include: {
        mahasiswa: {
          select: {
            id: true,
            nim: true,
            nama: true,
            email: true,
            jurusan: true,
          },
        },
      },
    });

    // Tidak ada log admin di sini (aksi mahasiswa).
    return NextResponse.json(laporan, { status: 201 });
  } catch (err) {
    console.error("Error POST /api/laporan:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
