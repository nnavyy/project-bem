import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";

/**
 * DELETE /api/superadmin/logs
 * Bersihkan log aktivitas. Hanya SUPER_ADMIN.
 *
 * Query params:
 *   ?mode=all          → hapus semua log
 *   ?mode=before&date=ISO_DATE → hapus log sebelum tanggal tertentu
 */
export async function DELETE(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);
  const user = await verifyToken(req);

  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "all";
  const dateParam = searchParams.get("date");

  try {
    let deletedCount = 0;

    if (mode === "before") {
      if (!dateParam) {
        return NextResponse.json(
          { message: "Parameter 'date' diperlukan untuk mode 'before'" },
          { status: 400 },
        );
      }
      const before = new Date(dateParam);
      if (isNaN(before.getTime())) {
        return NextResponse.json(
          { message: "Format tanggal tidak valid" },
          { status: 400 },
        );
      }

      const result = await prisma.logAktivitasAdmin.deleteMany({
        where: { createdAt: { lt: before } },
      });
      deletedCount = result.count;

      // Log the clear action itself (after deleting old logs)
      await logAktivitas({
        adminId: user.id,
        aksi: "DELETE_ADMIN", // closest available aksi for bulk delete
        entityType: "LogAktivitasAdmin",
        dataAfter: { deletedCount, mode: "before", before: before.toISOString() },
        ipAddress: ip,
        userAgent: ua,
        keterangan: `Log aktivitas sebelum ${before.toLocaleDateString("id-ID")} dibersihkan (${deletedCount} entri dihapus).`,
      });
    } else {
      // mode === "all" — delete all logs EXCEPT the current action (log after)
      const result = await prisma.logAktivitasAdmin.deleteMany({});
      deletedCount = result.count;

      // Log the clear action itself
      await logAktivitas({
        adminId: user.id,
        aksi: "DELETE_ADMIN",
        entityType: "LogAktivitasAdmin",
        dataAfter: { deletedCount, mode: "all" },
        ipAddress: ip,
        userAgent: ua,
        keterangan: `Seluruh log aktivitas dibersihkan (${deletedCount} entri dihapus).`,
      });
    }

    return NextResponse.json({
      message: `${deletedCount} log aktivitas berhasil dihapus.`,
      deletedCount,
    });
  } catch (err) {
    console.error("Error DELETE /api/superadmin/logs:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
