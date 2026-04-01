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
      return NextResponse.json({ role: user.role, profile: mahasiswa });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { id: true, username: true, nama: true, role: true },
    });
    return NextResponse.json({ role: user.role, profile: admin });
  } catch (error) {
    console.error("Error /api/me:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
