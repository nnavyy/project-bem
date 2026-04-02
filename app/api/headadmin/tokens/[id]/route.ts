import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";

/**
 * Revoke token (soft delete) — dengan aturan:
 *
 * SUPER_ADMIN:
 * - Bisa revoke token ADMIN & HEAD_ADMIN milik siapapun langsung
 * - TIDAK bisa revoke token SUPER_ADMIN (protected)
 *
 * HEAD_ADMIN:
 * - Tidak bisa revoke token miliknya sendiri (token yang adminId == user.id)
 * - Tidak bisa revoke token yang generatedBy == null (developer/bootstrap)
 * - Revoke token HEAD_ADMIN lain → masuk RequestApproval (PENDING), butuh SUPER_ADMIN
 * - Revoke token ADMIN → langsung dieksekusi
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ip, ua } = getRequestMeta(req);

  const user = await verifyToken(req);
  if (!user || (user.role !== "HEAD_ADMIN" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const token = await prisma.tokenAdmin.findUnique({
    where: { id },
    include: {
      admin: { select: { id: true, username: true, nama: true, role: true, isDeveloper: true } },
      headAdmin: {
        select: { id: true, username: true, nama: true, role: true, isDeveloper: true },
      },
    },
  });

  if (!token) {
    return NextResponse.json(
      { message: "Token tidak ditemukan" },
      { status: 404 },
    );
  }

  // ── PROTEKSI: Token SUPER_ADMIN tidak bisa direvoke siapapun ──
  if (token.tokenRole === "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Aksi Ditolak: Token Super Admin tidak dapat di-revoke." },
      { status: 403 },
    );
  }

  // ── PROTEKSI: Token bootstrap (generatedBy=null) tidak bisa direvoke ──
  if (token.generatedBy === null) {
    return NextResponse.json(
      { message: "Aksi Ditolak: Token ini dibuat langsung oleh Sistem/Developer dan tidak dapat di-revoke." },
      { status: 403 },
    );
  }

  // ── SUPER_ADMIN: langsung revoke token ADMIN / HEAD_ADMIN ──
  if (user.role === "SUPER_ADMIN") {
    if (token.isRevoked) {
      return NextResponse.json({ message: "Token sudah direvoke" });
    }

    const updated = await prisma.tokenAdmin.update({
      where: { id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    await logAktivitas({
      adminId: user.id,
      aksi: "REVOKE_TOKEN",
      entityType: "TokenAdmin",
      entityId: updated.id,
      tokenId: updated.id,
      dataBefore: { isRevoked: false },
      dataAfter: { isRevoked: true, revokedAt: updated.revokedAt },
      ipAddress: ip,
      userAgent: ua,
      keterangan: "Token direvoke langsung oleh SUPER_ADMIN.",
    });

    return NextResponse.json({
      message: "Token berhasil direvoke",
      data: { id: updated.id, isRevoked: updated.isRevoked, revokedAt: updated.revokedAt },
    });
  }

  // ── HEAD_ADMIN: tidak boleh revoke token milik dirinya sendiri ──
  if (token.adminId === user.id) {
    return NextResponse.json(
      { message: "Aksi Ditolak: Anda tidak dapat merevoke token milik Anda sendiri." },
      { status: 403 },
    );
  }

  // ── HEAD_ADMIN: token ADMIN → langsung revoke ──
  if (token.tokenRole === "ADMIN") {
    if (token.isRevoked) {
      return NextResponse.json({ message: "Token sudah direvoke" });
    }

    const updated = await prisma.tokenAdmin.update({
      where: { id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    await logAktivitas({
      adminId: user.id,
      aksi: "REVOKE_TOKEN",
      entityType: "TokenAdmin",
      entityId: updated.id,
      tokenId: updated.id,
      dataBefore: { isRevoked: false },
      dataAfter: { isRevoked: true, revokedAt: updated.revokedAt },
      ipAddress: ip,
      userAgent: ua,
      keterangan: "Token ADMIN direvoke oleh HEAD_ADMIN.",
    });

    return NextResponse.json({
      message: "Token berhasil direvoke",
      data: { id: updated.id, isRevoked: updated.isRevoked, revokedAt: updated.revokedAt },
    });
  }

  // ── HEAD_ADMIN: token HEAD_ADMIN lain → masuk antrian approval ──
  if (token.tokenRole === "HEAD_ADMIN") {
    if (token.isRevoked) {
      return NextResponse.json({ message: "Token sudah direvoke" });
    }

    // Cek apakah sudah ada request pending untuk token ini
    const existingPending = await prisma.requestApproval.findFirst({
      where: {
        tokenId: token.id,
        jenis: "REVOKE_TOKEN_HEADADMIN",
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { message: "Request revoke untuk token ini sudah ada dan sedang menunggu persetujuan Super Admin." },
        { status: 409 },
      );
    }

    const request = await prisma.requestApproval.create({
      data: {
        jenis: "REVOKE_TOKEN_HEADADMIN",
        status: "PENDING",
        tokenId: token.id,
        diajukanOleh: user.id,
      },
    });

    return NextResponse.json({
      message: "Request revoke token HEAD_ADMIN berhasil diajukan. Menunggu persetujuan Super Admin.",
      pending: true,
      requestId: request.id,
    }, { status: 202 });
  }

  return NextResponse.json({ message: "Aksi tidak valid" }, { status: 400 });
}

/**
 * Backward-compat: previously this endpoint used DELETE for hard delete.
 * Now we disallow hard delete to preserve history/audit.
 */
export async function DELETE() {
  return NextResponse.json(
    { message: "Hard delete dinonaktifkan. Gunakan PATCH untuk revoke token." },
    { status: 405 },
  );
}
