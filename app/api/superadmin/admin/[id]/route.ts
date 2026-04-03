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
    // Menggunakan executeRaw untuk semua bulk update/delete karena PrismaNeonHttp
    // akan melempar error "Transactions are not supported in HTTP mode" pada updateMany/deleteMany

    // 1. Revoke semua token aktif admin ini
    await prisma.$executeRaw`UPDATE "TokenAdmin" SET "isRevoked" = true, "revokedAt" = NOW() WHERE "adminId" = ${id} AND "isRevoked" = false`;

    // 2. Unlink dari laporan (set ditindakOleh = null)
    await prisma.$executeRaw`UPDATE "Laporan" SET "ditindakOleh" = null WHERE "ditindakOleh" = ${id}`;

    // 3. Hapus tindakLanjutLaporan yang dibuat oleh admin ini
    await prisma.$executeRaw`DELETE FROM "TindakLanjutLaporan" WHERE "adminId" = ${id}`;

    // 4. Unlink blog
    await prisma.$executeRaw`UPDATE "Blog" SET "penulisId" = null WHERE "penulisId" = ${id}`;

    // 5. Hapus galeri dari portofolio milik admin ini, lalu hapus portofolionya
    const portofolios = await prisma.portofolio.findMany({
      where: { adminId: id },
      select: { id: true },
    });
    for (const p of portofolios) {
      await prisma.$executeRaw`DELETE FROM "Galeri" WHERE "portofolioId" = ${p.id}`;
      await prisma.$executeRaw`DELETE FROM "Portofolio" WHERE id = ${p.id}`;
    }

    // 6. Hapus log aktivitas admin ini
    await prisma.$executeRaw`DELETE FROM "LogAktivitasAdmin" WHERE "adminId" = ${id}`;

    // 7. Unlink token yang di-generate oleh admin
    await prisma.$executeRaw`UPDATE "TokenAdmin" SET "generatedBy" = null WHERE "generatedBy" = ${id}`;

    // 8. Unlink token yang dimiliki admin
    await prisma.$executeRaw`UPDATE "TokenAdmin" SET "adminId" = null WHERE "adminId" = ${id}`;

    // 9. Handle request approval — diajukanOleh
    await prisma.$executeRaw`DELETE FROM "RequestApproval" WHERE "diajukanOleh" = ${id}`;

    // 10. Unlink request yang diproses oleh admin ini
    await prisma.$executeRaw`UPDATE "RequestApproval" SET "diprosesByAdmin" = null WHERE "diprosesByAdmin" = ${id}`;

    // Log before delete (use superadmin's own id, not the target's)
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

    // 11. Hapus admin secara manual
    await prisma.$executeRaw`DELETE FROM "Admin" WHERE id = ${id}`;

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
