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
    // 1. Revoke semua token aktif admin ini
    await prisma.tokenAdmin.updateMany({
      where: { adminId: id, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    // 2. Unlink dari laporan (set ditindakOleh = null) — onDelete: SetNull
    await prisma.laporan.updateMany({
      where: { ditindakOleh: id },
      data: { ditindakOleh: null },
    });

    // 3. Hapus tindakLanjutLaporan yang dibuat oleh admin ini — onDelete: Restrict
    await prisma.tindakLanjutLaporan.deleteMany({
      where: { adminId: id },
    });

    // 4. Unlink blog (set penulisId = null) — onDelete: SetNull
    await prisma.blog.updateMany({
      where: { penulisId: id },
      data: { penulisId: null },
    });

    // 5. Hapus galeri dari portofolio milik admin ini, lalu hapus portofolionya — onDelete: Restrict
    const portofolios = await prisma.portofolio.findMany({
      where: { adminId: id },
      select: { id: true },
    });
    if (portofolios.length > 0) {
      const portofolioIds = portofolios.map((p) => p.id);
      await prisma.galeri.deleteMany({
        where: { portofolioId: { in: portofolioIds } },
      });
      await prisma.portofolio.deleteMany({
        where: { adminId: id },
      });
    }

    // 6. Hapus log aktivitas admin ini — onDelete: Restrict
    await prisma.logAktivitasAdmin.deleteMany({
      where: { adminId: id },
    });

    // 7. Unlink token yang di-generate oleh admin (generatedBy) — onDelete: SetNull
    await prisma.tokenAdmin.updateMany({
      where: { generatedBy: id },
      data: { generatedBy: null },
    });

    // 8. Unlink token yang dimiliki admin (adminId) — onDelete: SetNull
    await prisma.tokenAdmin.updateMany({
      where: { adminId: id },
      data: { adminId: null },
    });

    // 9. Handle request approval — diajukanOleh onDelete: Restrict
    // Reject pending ones and delete all requests by this admin
    await prisma.requestApproval.deleteMany({
      where: { diajukanOleh: id },
    });

    // 10. Unlink request yang diproses oleh admin ini — onDelete: SetNull
    await prisma.requestApproval.updateMany({
      where: { diprosesByAdmin: id },
      data: { diprosesByAdmin: null },
    });

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

    // 11. Hapus admin secara manual menggunakan executeRaw untuk menghindari 
    // error "Transactions are not supported in HTTP mode" dari PrismaNeonHttp.
    // (Karena kita sudah membersihkan semua table terkait secara manual di atas, ini aman)
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
