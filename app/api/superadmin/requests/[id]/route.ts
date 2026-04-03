import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { logAktivitas, getRequestMeta } from "@/lib/logger";

/**
 * PATCH /api/superadmin/requests/[id]
 * Approve atau Reject sebuah request — hanya SUPER_ADMIN
 * Body: { action: "APPROVE" | "REJECT" }
 *
 * NOTE: PrismaNeonHttp adapter tidak mendukung transactions.
 * Semua operasi dilakukan secara sequential tanpa implicit transaction.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { ip, ua } = getRequestMeta(req);
    const user = await verifyToken(req);

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json()) as { action?: "APPROVE" | "REJECT" };

    if (body.action !== "APPROVE" && body.action !== "REJECT") {
      return NextResponse.json(
        { message: "action harus APPROVE atau REJECT" },
        { status: 400 },
      );
    }

    // Ambil request TANPA include/nested relations (hindari implicit transaction)
    const request = await prisma.requestApproval.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json(
        { message: "Request tidak ditemukan" },
        { status: 404 },
      );
    }

    // Ambil info pengaju secara terpisah
    const pengaju = await prisma.admin.findUnique({
      where: { id: request.diajukanOleh },
      select: { id: true, username: true, nama: true, role: true },
    });

    if (!pengaju) {
      return NextResponse.json(
        { message: "Pengaju tidak ditemukan" },
        { status: 404 },
      );
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        {
          message: `Request sudah ${request.status === "APPROVED" ? "disetujui" : "ditolak"}.`,
        },
        { status: 409 },
      );
    }

    const newStatus = body.action === "APPROVE" ? "APPROVED" : "REJECTED";

    // ── GENERATE_TOKEN_HEADADMIN ──
    if (request.jenis === "GENERATE_TOKEN_HEADADMIN") {
      if (body.action === "APPROVE" && request.tokenId) {
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
          keterangan: `Request generate token HEAD_ADMIN dari @${pengaju.username} disetujui.`,
        });
      } else if (body.action === "REJECT" && request.tokenId) {
        // Sebelum delete token, unlink dari request dulu
        await prisma.requestApproval.update({
          where: { id },
          data: { tokenId: null },
        });

        await prisma.tokenAdmin.delete({ where: { id: request.tokenId } });

        await logAktivitas({
          adminId: user.id,
          aksi: "REJECT_REQUEST",
          entityType: "RequestApproval",
          entityId: id,
          ipAddress: ip,
          userAgent: ua,
          keterangan: `Request generate token HEAD_ADMIN dari @${pengaju.username} ditolak. Token dihapus.`,
        });
      }
    }

    // ── REVOKE_TOKEN_HEADADMIN ──
    if (request.jenis === "REVOKE_TOKEN_HEADADMIN") {
      if (body.action === "APPROVE" && request.tokenId) {
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
          keterangan: `Request revoke token HEAD_ADMIN dari @${pengaju.username} disetujui dan token direvoke.`,
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
          keterangan: `Request revoke token HEAD_ADMIN dari @${pengaju.username} ditolak.`,
        });
      }
    }

    // ── CREATE_HEADADMIN ──
    if (request.jenis === "CREATE_HEADADMIN") {
      if (body.action === "APPROVE" && request.catatanAdmin) {
        const accountData = JSON.parse(request.catatanAdmin) as {
          username: string;
          nama: string;
          role: string;
        };

        const existing = await prisma.admin.findUnique({
          where: { username: accountData.username },
        });
        if (existing) {
          return NextResponse.json(
            {
              message: `Username "${accountData.username}" sudah digunakan. Request tidak bisa diproses.`,
            },
            { status: 409 },
          );
        }

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
          keterangan: `Request pembuatan akun HEAD_ADMIN "${accountData.username}" dari @${pengaju.username} disetujui. Akun berhasil dibuat.`,
        });
      } else {
        await logAktivitas({
          adminId: user.id,
          aksi: "REJECT_REQUEST",
          entityType: "RequestApproval",
          entityId: id,
          ipAddress: ip,
          userAgent: ua,
          keterangan: `Request pembuatan akun HEAD_ADMIN dari @${pengaju.username} ditolak.`,
        });
      }
    }

    // ── REVOKE_TOKEN_SUPERADMIN ──
    if (request.jenis === "REVOKE_TOKEN_SUPERADMIN") {
      if (body.action === "APPROVE") {
        return NextResponse.json(
          {
            message:
              "Notifikasi percobaan revoke tidak dapat disetujui. Gunakan Tolak untuk menutup notifikasi ini.",
          },
          { status: 400 },
        );
      }
      await logAktivitas({
        adminId: user.id,
        aksi: "REJECT_REQUEST",
        entityType: "RequestApproval",
        entityId: id,
        ipAddress: ip,
        userAgent: ua,
        keterangan: `Notifikasi percobaan revoke token Super Admin dari @${pengaju.username} ditutup.`,
      });
    }

    // Update status request — TANPA include (hindari implicit transaction di NeonHttp)
    await prisma.requestApproval.update({
      where: { id },
      data: {
        status: newStatus,
        diprosesByAdmin: user.id,
        catatanAdmin: body.action === "REJECT" ? null : request.catatanAdmin,
      },
    });

    // Ambil data updated secara terpisah
    const updated = await prisma.requestApproval.findUnique({
      where: { id },
      select: {
        id: true,
        jenis: true,
        status: true,
        tokenId: true,
        catatanAdmin: true,
        createdAt: true,
        updatedAt: true,
        diajukanOleh: true,
        diprosesByAdmin: true,
      },
    });

    // Ambil relasi secara terpisah
    const pemroses = updated?.diprosesByAdmin
      ? await prisma.admin.findUnique({
          where: { id: updated.diprosesByAdmin },
          select: { id: true, username: true, nama: true, role: true },
        })
      : null;

    let tokenInfo = null;
    if (updated?.tokenId) {
      tokenInfo = await prisma.tokenAdmin.findUnique({
        where: { id: updated.tokenId },
        select: { id: true, tokenRole: true, isRevoked: true, adminId: true },
      });
    }

    return NextResponse.json({
      message:
        body.action === "APPROVE"
          ? "Request berhasil disetujui"
          : "Request berhasil ditolak",
      data: {
        ...updated,
        pengaju,
        pemroses,
        token: tokenInfo,
        plainToken:
          body.action === "APPROVE" &&
          request.jenis === "GENERATE_TOKEN_HEADADMIN"
            ? request.catatanAdmin
            : null,
      },
    });
  } catch (err: any) {
    console.error("[Approval API Error]", err);
    return NextResponse.json(
      { message: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/requests/[id]
 * Hapus permanen request yang sudah berstatus APPROVED atau REJECTED.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { ip, ua } = getRequestMeta(req);
    const user = await verifyToken(req);

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const request = await prisma.requestApproval.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json(
        { message: "Request tidak ditemukan" },
        { status: 404 },
      );
    }

    if (request.status === "PENDING") {
      return NextResponse.json(
        { message: "Tidak dapat menghapus request yang masih PENDING." },
        { status: 400 },
      );
    }

    await prisma.$executeRaw`DELETE FROM "RequestApproval" WHERE id = ${id}`;

    await logAktivitas({
      adminId: user.id,
      aksi: "DELETE_REQUEST" as any,
      entityType: "RequestApproval",
      entityId: id,
      ipAddress: ip,
      userAgent: ua,
      keterangan: `Request approval riwayat (${request.jenis}) berhasil dihapus.`,
    });

    return NextResponse.json({ message: "Riwayat request berhasil dihapus permanen." });
  } catch (err: any) {
    console.error("[Request Delete Error]", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menghapus history request." },
      { status: 500 },
    );
  }
}
