import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET laporan
export async function GET(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const laporan =
    user.role === "MAHASISWA"
      ? await prisma.laporan.findMany({
          where: { mahasiswaId: user.id },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.laporan.findMany({
          orderBy: { createdAt: "desc" },
        });

  return NextResponse.json(laporan);
}

// POST laporan (mahasiswa)
export async function POST(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user || user.role !== "MAHASISWA")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { judul, isi } = await req.json();

  const laporan = await prisma.laporan.create({
    data: {
      judul,
      isi,
      mahasiswaId: user.id,
    },
  });

  return NextResponse.json(laporan, { status: 201 });
}
