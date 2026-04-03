import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ip, ua } = getRequestMeta(req);
  const user = await verifyToken(req);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const mhs = await prisma.mahasiswa.findUnique({
    where: { id },
    select: { id: true, nim: true, nama: true },
  });
  if (!mhs) return NextResponse.json({ message: "Mahasiswa tidak ditemukan." }, { status: 404 });

  await logAktivitas({
    adminId: user.id,
    aksi: "DELETE_ADMIN",
    entityType: "Mahasiswa",
    entityId: id,
    dataBefore: mhs,
    dataAfter: null,
    ipAddress: ip,
    userAgent: ua,
    keterangan: `Mahasiswa dihapus: ${mhs.nama} (${mhs.nim})`,
  });

  await prisma.mahasiswa.delete({ where: { id } });
  return NextResponse.json({ message: "Mahasiswa berhasil dihapus." });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ip, ua } = getRequestMeta(req);
  const user = await verifyToken(req);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const mhs = await prisma.mahasiswa.findUnique({
    where: { id },
    select: { id: true, nim: true, nama: true, email: true, jurusan: true },
  });
  if (!mhs) return NextResponse.json({ message: "Mahasiswa tidak ditemukan." }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (body.nama?.trim()) updateData.nama = body.nama.trim();
  if (body.email !== undefined) updateData.email = body.email?.trim() || null;
  if (body.jurusan !== undefined) updateData.jurusan = body.jurusan || null;
  if (body.password?.trim()) updateData.password = await hashPassword(body.password.trim());

  const updated = await prisma.mahasiswa.update({
    where: { id },
    data: updateData,
    select: { id: true, nim: true, nama: true, email: true, jurusan: true },
  });

  await logAktivitas({
    adminId: user.id,
    aksi: "UPDATE_ADMIN",
    entityType: "Mahasiswa",
    entityId: id,
    dataBefore: mhs,
    dataAfter: updated,
    ipAddress: ip,
    userAgent: ua,
    keterangan: `Data mahasiswa diperbarui: ${updated.nama} (${updated.nim})`,
  });

  return NextResponse.json({ message: "Data mahasiswa berhasil diperbarui.", data: updated });
}
