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
      admin: {
        select: {
          id: true,
          username: true,
          nama: true,
          role: true,
          isDeveloper: true,
        },
      },
      headAdmin: {
        select: {
          id: true,
          username: true,
          nama: true,
          role: true,
          isDeveloper: true,
        },
      },
    },
  });

  if (!token) {
    return NextResponse.json(
      { message: "Token tidak ditemukan" },
      { status: 404 },
    );
  }

  // ── PROTEKSI: Token SUPER_ADMIN tidak bisa direvoke — tapi catat percobaan ──
  if (token.tokenRole === "SUPER_ADMIN") {
    // Log the attempt
    await logAktivitas({
      adminId: user.id,
      aksi: "REVOKE_TOKEN",
      entityType: "TokenAdmin",
      entityId: token.id,
      tokenId: token.id,
      dataBefore: { isRevoked: token.isRevoked, tokenRole: token.tokenRole },
      dataAfter: null,
      ipAddress: ip,
      userAgent: ua,
      keterangan: `PERCOBAAN revoke token SUPER_ADMIN oleh @${user.role} (${user.id}). Akses ditolak.`,
    });

    // Create a notification RequestApproval for superadmin
    const existingNotif = await prisma.requestApproval.findFirst({
      where: {
        tokenId: token.id,
        jenis: "REVOKE_TOKEN_SUPERADMIN",
        status: "PENDING",
      },
    });

    if (!existingNotif) {
      await prisma.requestApproval.create({
        data: {
          jenis: "REVOKE_TOKEN_SUPERADMIN",
          status: "PENDING",
          tokenId: token.id,
          diajukanOleh: user.id,
          catatanAdmin: `Percobaan revoke token Super Admin pada ${new Date().toISOString()}`,
        },
      });
    }

    return NextResponse.json(
      {
        message:
          "Aksi Ditolak: Token Super Admin tidak dapat di-revoke. Super Admin telah diberitahu.",
      },
      { status: 403 },
    );
  }

  // ── PROTEKSI: Token bootstrap (generatedBy=null) tidak bisa direvoke ──
  if (token.generatedBy === null) {
    return NextResponse.json(
      {
        message:
          "Aksi Ditolak: Token ini dibuat langsung oleh Sistem/Developer dan tidak dapat di-revoke.",
      },
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
      data: {
        id: updated.id,
        isRevoked: updated.isRevoked,
        revokedAt: updated.revokedAt,
      },
    });
  }

  // ── HEAD_ADMIN: tidak boleh revoke token milik dirinya sendiri ──
  if (token.adminId === user.id) {
    return NextResponse.json(
      {
        message:
          "Aksi Ditolak: Anda tidak dapat merevoke token milik Anda sendiri.",
      },
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
      data: {
        id: updated.id,
        isRevoked: updated.isRevoked,
        revokedAt: updated.revokedAt,
      },
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
        {
          message:
            "Request revoke untuk token ini sudah ada dan sedang menunggu persetujuan Super Admin.",
        },
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

    return NextResponse.json(
      {
        message:
          "Request revoke token HEAD_ADMIN berhasil diajukan. Menunggu persetujuan Super Admin.",
        pending: true,
        requestId: request.id,
      },
      { status: 202 },
    );
  }

  return NextResponse.json({ message: "Aksi tidak valid" }, { status: 400 });
}

/**
 * DELETE /api/headadmin/tokens/[id]
 * Hapus permanen token (History).
 * Hanya bisa dilakukan pada token yang sudah direvoke ATAU sudah dipakai (single-use) ATAU kadaluarsa.
 */
export async function DELETE(
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
  });

  if (!token) {
    return NextResponse.json(
      { message: "Token tidak ditemukan." },
      { status: 404 },
    );
  }

  // Apakah token ini layak dihapus? (sudah direvoke atau expired)
  const isExpired =
    !token.isPermanent &&
    token.expiredAt &&
    new Date(token.expiredAt) < new Date();
  
  if (!token.isRevoked && !isExpired) {
    return NextResponse.json(
      { message: "Hanya token yang sudah di-revoke atau kadaluarsa yang dapat dihapus." },
      { status: 400 },
    );
  }

  // SUPER_ADMIN bisa hapus apa saja. HEAD_ADMIN...
  if (user.role === "HEAD_ADMIN" && token.tokenRole === "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Aksi Ditolak: Anda tidak dapat menghapus history token Super Admin." },
      { status: 403 },
    );
  }

  try {
    // Unlink RequestApproval first
    await prisma.requestApproval.updateMany({
      where: { tokenId: id },
      data: { tokenId: null },
    });

    await prisma.tokenAdmin.delete({ where: { id } });

    await logAktivitas({
      adminId: user.id,
      aksi: "DELETE_TOKEN" as any,
      entityType: "TokenAdmin",
      entityId: id,
      ipAddress: ip,
      userAgent: ua,
      keterangan: `Token riwayat telah dihapus permanen.`,
    });

    return NextResponse.json({ message: "Riwayat token berhasil dihapus permanen." });
  } catch (err: any) {
    console.error("[Token Delete Error]", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menghapus history." },
      { status: 500 },
    );
  }
}
