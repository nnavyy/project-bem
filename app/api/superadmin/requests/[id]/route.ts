import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { logAktivitas, getRequestMeta } from "@/lib/logger";

/**
 * PATCH /api/superadmin/requests/[id]
 * Approve atau Reject sebuah request — hanya SUPER_ADMIN
 * Body: { action: "APPROVE" | "REJECT" }
 */
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
  const body = await req.json() as { action?: "APPROVE" | "REJECT" };

  if (body.action !== "APPROVE" && body.action !== "REJECT") {
    return NextResponse.json({ message: "action harus APPROVE atau REJECT" }, { status: 400 });
  }

  const request = await prisma.requestApproval.findUnique({
    where: { id },
    include: {
      token: true,
      pengaju: { select: { id: true, username: true, nama: true } },
    },
  });

  if (!request) {
    return NextResponse.json({ message: "Request tidak ditemukan" }, { status: 404 });
  }

  if (request.status !== "PENDING") {
    return NextResponse.json(
      { message: `Request sudah ${request.status === "APPROVED" ? "disetujui" : "ditolak"}.` },
      { status: 409 },
    );
  }

  const newStatus = body.action === "APPROVE" ? "APPROVED" : "REJECTED";

  // ── GENERATE_TOKEN_HEADADMIN ──
  if (request.jenis === "GENERATE_TOKEN_HEADADMIN") {
    if (body.action === "APPROVE" && request.tokenId) {
      // Aktifkan token (isRevoked=false)
      await prisma.tokenAdmin.update({
        where: { id: request.tokenId },
        data: { isRevoked: false },
      });

      await logAktivitas({
        adminId: user.id,
        aksi: "APPROVE_REQUEST",
        entityType: "RequestApproval",
        entityId: id,
        tokenId: request.tokenId,
        ipAddress: ip,
        userAgent: ua,
        keterangan: `Request generate token HEAD_ADMIN dari @${request.pengaju.username} disetujui.`,
      });
    } else if (body.action === "REJECT" && request.tokenId) {
      // Hard delete token yang terkunci agar tidak mengotori DB
      await prisma.tokenAdmin.delete({ where: { id: request.tokenId } });

      await logAktivitas({
        adminId: user.id,
        aksi: "REJECT_REQUEST",
        entityType: "RequestApproval",
        entityId: id,
        ipAddress: ip,
        userAgent: ua,
        keterangan: `Request generate token HEAD_ADMIN dari @${request.pengaju.username} ditolak. Token dihapus.`,
      });
    }
  }

  // ── REVOKE_TOKEN_HEADADMIN ──
  if (request.jenis === "REVOKE_TOKEN_HEADADMIN") {
    if (body.action === "APPROVE" && request.tokenId) {
      // Eksekusi revoke
      await prisma.tokenAdmin.update({
        where: { id: request.tokenId },
        data: { isRevoked: true, revokedAt: new Date() },
      });

      await logAktivitas({
        adminId: user.id,
        aksi: "APPROVE_REQUEST",
        entityType: "RequestApproval",
        entityId: id,
        tokenId: request.tokenId,
        ipAddress: ip,
        userAgent: ua,
        keterangan: `Request revoke token HEAD_ADMIN dari @${request.pengaju.username} disetujui dan token direvoke.`,
      });
    } else {
      await logAktivitas({
        adminId: user.id,
        aksi: "REJECT_REQUEST",
        entityType: "RequestApproval",
        entityId: id,
        tokenId: request.tokenId ?? undefined,
        ipAddress: ip,
        userAgent: ua,
        keterangan: `Request revoke token HEAD_ADMIN dari @${request.pengaju.username} ditolak.`,
      });
    }
  }

  // ── CREATE_HEADADMIN ──
  if (request.jenis === "CREATE_HEADADMIN") {
    if (body.action === "APPROVE" && request.catatanAdmin) {
      // Parse data akun dari catatanAdmin
      const accountData = JSON.parse(request.catatanAdmin) as { username: string; nama: string; role: string };
      
      // Cek apakah username sudah terpakai (mungkin sudah dibuat saat menunggu approval)
      const existing = await prisma.admin.findUnique({ where: { username: accountData.username } });
      if (existing) {
        return NextResponse.json(
          { message: `Username "${accountData.username}" sudah digunakan. Request tidak bisa diproses.` },
          { status: 409 },
        );
      }

      // Buat akun HEAD_ADMIN
      const created = await prisma.admin.create({
        data: {
          username: accountData.username,
          nama: accountData.nama,
          role: "HEAD_ADMIN",
          isActive: true,
        },
      });

      await logAktivitas({
        adminId: user.id,
        aksi: "APPROVE_REQUEST",
        entityType: "Admin",
        entityId: created.id,
        ipAddress: ip,
        userAgent: ua,
        keterangan: `Request pembuatan akun HEAD_ADMIN "${accountData.username}" dari @${request.pengaju.username} disetujui. Akun berhasil dibuat.`,
      });
    } else {
      await logAktivitas({
        adminId: user.id,
        aksi: "REJECT_REQUEST",
        entityType: "RequestApproval",
        entityId: id,
        ipAddress: ip,
        userAgent: ua,
        keterangan: `Request pembuatan akun HEAD_ADMIN dari @${request.pengaju.username} ditolak.`,
      });
    }
  }

  // Update status request
  const updated = await prisma.requestApproval.update({
    where: { id },
    data: {
      status: newStatus,
      diprosesByAdmin: user.id,
      // Hapus plain token dari catatan setelah reject (bersihkan)
      catatanAdmin: body.action === "REJECT" ? null : request.catatanAdmin,
    },
    include: {
      pengaju: { select: { id: true, username: true, nama: true, role: true } },
      pemroses: { select: { id: true, username: true, nama: true, role: true } },
      token: {
        select: { id: true, tokenRole: true, isRevoked: true, adminId: true },
      },
    },
  });

  return NextResponse.json({
    message: body.action === "APPROVE" ? "Request berhasil disetujui" : "Request berhasil ditolak",
    data: {
      ...updated,
      // Saat approve generate token, kembalikan plain token agar bisa ditampilkan ke pengaju
      plainToken: body.action === "APPROVE" && request.jenis === "GENERATE_TOKEN_HEADADMIN"
        ? request.catatanAdmin
        : null,
    },
  });
}
