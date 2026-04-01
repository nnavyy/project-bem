import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyToken(req);
  if (!user || user.role !== "HEAD_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const token = await prisma.tokenAdmin.findUnique({ where: { id } });
  if (!token) {
    return NextResponse.json({ message: "Token tidak ditemukan" }, { status: 404 });
  }

  await prisma.tokenAdmin.delete({ where: { id } });
  return NextResponse.json({ message: "Token berhasil dihapus" });
}
