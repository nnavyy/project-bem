import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";

/**
 * Revoke token (soft delete).
 * - HEAD_ADMIN only
 * - Sets: isRevoked=true, revokedAt=now()
 * - Keeps record for history/audit
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ip, ua } = getRequestMeta(req);

  const user = await verifyToken(req);
  if (!user || user.role !== "HEAD_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const token = await prisma.tokenAdmin.findUnique({
    where: { id },
    include: {
      admin: { select: { id: true, username: true, nama: true, role: true } },
      headAdmin: {
        select: { id: true, username: true, nama: true, role: true },
      },
    },
  });

  if (!token) {
    return NextResponse.json(
      { message: "Token tidak ditemukan" },
      { status: 404 },
    );
  }

  if (token.generatedBy === null) {
    return NextResponse.json(
      { message: "Aksi Ditolak: Token ini dibuat langsung oleh Sistem/Developer dan bersifat permanen (tidak dapat di-revoke)." },
      { status: 403 },
    );
  }

  // Already revoked → idempotent success
  if (token.isRevoked) {
    return NextResponse.json({
      message: "Token sudah direvoke",
      data: {
        id: token.id,
        tokenRole: token.tokenRole,
        adminId: token.adminId,
        generatedBy: token.generatedBy,
        isRevoked: token.isRevoked,
        revokedAt: token.revokedAt,
        createdAt: token.createdAt,
        expiredAt: token.expiredAt,
        isPermanent: token.isPermanent,
        isSingleUse: token.isSingleUse,
        claimedAt: token.claimedAt,
      },
    });
  }

  const updated = await prisma.tokenAdmin.update({
    where: { id },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });

  // Audit log (best effort)
  await logAktivitas({
    adminId: user.id,
    aksi: "REVOKE_TOKEN",
    entityType: "TokenAdmin",
    entityId: updated.id,
    tokenId: updated.id,
    dataBefore: {
      id: token.id,
      tokenRole: token.tokenRole,
      adminId: token.adminId,
      generatedBy: token.generatedBy,
      isRevoked: token.isRevoked,
      revokedAt: token.revokedAt,
      createdAt: token.createdAt,
      expiredAt: token.expiredAt,
      isPermanent: token.isPermanent,
      isSingleUse: token.isSingleUse,
      claimedAt: token.claimedAt,
    },
    dataAfter: {
      id: updated.id,
      isRevoked: updated.isRevoked,
      revokedAt: updated.revokedAt,
    },
    ipAddress: ip,
    userAgent: ua,
    keterangan:
      "Token direvoke oleh HEAD_ADMIN (soft revoke, record tetap tersimpan untuk history).",
  });

  return NextResponse.json({
    message: "Token berhasil direvoke",
    data: {
      id: updated.id,
      tokenRole: updated.tokenRole,
      adminId: updated.adminId,
      generatedBy: updated.generatedBy,
      isRevoked: updated.isRevoked,
      revokedAt: updated.revokedAt,
      createdAt: updated.createdAt,
      expiredAt: updated.expiredAt,
      isPermanent: updated.isPermanent,
      isSingleUse: updated.isSingleUse,
      claimedAt: updated.claimedAt,
    },
  });
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
