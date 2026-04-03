import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";

/**
 * DELETE /api/superadmin/admin/[id]
 * Hapus akun admin secara permanen. Hanya SUPER_ADMIN.
 * - Tidak bisa menghapus akun SUPER_ADMIN
 * - Semua token aktif admin akan direvoke sebelum dihapus
 * - Log aktivitas, blog, dll yang punya relasi ke admin akan di-nullify (onDelete: SetNull) atau diblok (onDelete: Restrict)
 * - Jika ada laporan tindaklanjut yang masih terhubung, hapus akan gagal — perlu unlink dulu
 */
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

  // Cari admin target
  const target = await prisma.admin.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      nama: true,
      role: true,
      isActive: true,
    },
  });

  if (!target) {
    return NextResponse.json({ message: "Admin tidak ditemukan" }, { status: 404 });
  }

  // Tidak boleh hapus SUPER_ADMIN
  if (target.role === "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Akun Super Admin tidak dapat dihapus." },
      { status: 403 },
    );
  }

  // Tidak boleh hapus diri sendiri
  if (target.id === user.id) {
    return NextResponse.json(
      { message: "Anda tidak dapat menghapus akun Anda sendiri." },
      { status: 403 },
    );
  }

  try {
    // Revoke semua token aktif admin ini
    await prisma.tokenAdmin.updateMany({
      where: { adminId: id, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    // Unlink dari laporan (set ditindakOleh = null)
    await prisma.laporan.updateMany({
      where: { ditindakOleh: id },
      data: { ditindakOleh: null },
    });

    // Hapus tindakLanjutLaporan yang dibuat oleh admin ini
    await prisma.tindakLanjutLaporan.deleteMany({
      where: { adminId: id },
    });

    // Hapus request approval yang diajukan oleh admin ini (jika masih pending)
    await prisma.requestApproval.updateMany({
      where: { diajukanOleh: id, status: "PENDING" },
      data: { status: "REJECTED" },
    });

    // Log before delete
    await logAktivitas({
      adminId: user.id,
      aksi: "DELETE_ADMIN",
      entityType: "Admin",
      entityId: id,
      dataBefore: {
        id: target.id,
        username: target.username,
        nama: target.nama,
        role: target.role,
        isActive: target.isActive,
      },
      dataAfter: null,
      ipAddress: ip,
      userAgent: ua,
      keterangan: `Akun ${target.role} "@${target.username}" (${target.nama}) dihapus permanen oleh Super Admin.`,
    });

    // Hapus admin
    await prisma.admin.delete({ where: { id } });

    return NextResponse.json({
      message: `Akun "@${target.username}" berhasil dihapus.`,
    });
  } catch (err) {
    console.error("Error DELETE /api/superadmin/admin/[id]:", err);
    return NextResponse.json(
      { message: "Gagal menghapus admin. Mungkin masih ada data yang terhubung." },
      { status: 500 },
    );
  }
}
