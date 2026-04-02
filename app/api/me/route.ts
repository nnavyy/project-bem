import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "MAHASISWA") {
      const mahasiswa = await prisma.mahasiswa.findUnique({
        where: { id: user.id },
        select: { id: true, nim: true, nama: true, email: true, jurusan: true },
      });

      if (!mahasiswa) {
        return NextResponse.json(
          { message: "Akun tidak ditemukan" },
          { status: 404 },
        );
      }

      return NextResponse.json({ role: user.role, profile: mahasiswa });
    }

    // ADMIN / HEAD_ADMIN
    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        isActive: true,
        isDeveloper: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan" },
        { status: 404 },
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { message: "Akun Anda telah dinonaktifkan. Hubungi Head Admin." },
        { status: 403 },
      );
    }

    // Jangan kembalikan isActive ke client
    const { isActive: _, ...profile } = admin;
    return NextResponse.json({ role: user.role, profile });
  } catch (error) {
    console.error("Error /api/me:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
