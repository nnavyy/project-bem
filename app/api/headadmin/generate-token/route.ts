import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, generateAdminToken, hashToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";
import { RoleAdmin } from "@prisma/client";

type Body = {
  tokenRole?: "ADMIN" | "HEAD_ADMIN";
  adminId?: string;
  expiredAt?: string | null;
  isPermanent?: boolean;
  isSingleUse?: boolean;
};

function computeExpiry(isPermanent: boolean, expiredAt?: string | null): Date | null {
  if (isPermanent) return null;
  if (expiredAt) return new Date(expiredAt);
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "HEAD_ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const requester = await prisma.admin.findUnique({ where: { id: user.id } });
    if (!requester || !requester.isActive) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    const tokenRole = body.tokenRole ?? "ADMIN";
    const isPermanent = Boolean(body.isPermanent ?? false);
    const isSingleUse = Boolean(body.isSingleUse ?? false);
    const adminId = body.adminId ?? null;

    if (tokenRole !== "ADMIN" && tokenRole !== "HEAD_ADMIN") {
      return NextResponse.json({ error: "Role token tidak valid" }, { status: 400 });
    }

    // ── SUPER_ADMIN: bisa generate token ADMIN dan HEAD_ADMIN langsung ──
    if (user.role === "SUPER_ADMIN") {
      let targetAdmin = null;
      if (adminId) {
        targetAdmin = await prisma.admin.findUnique({
          where: { id: adminId },
          select: { id: true, username: true, nama: true, role: true, isActive: true },
        });
        if (!targetAdmin) return NextResponse.json({ error: "adminId tidak ditemukan" }, { status: 404 });
        if (!targetAdmin.isActive) return NextResponse.json({ error: "Admin target sedang nonaktif" }, { status: 400 });
        if (tokenRole === "ADMIN" && targetAdmin.role !== RoleAdmin.ADMIN)
          return NextResponse.json({ error: "Token ini hanya untuk role ADMIN" }, { status: 400 });
        if (tokenRole === "HEAD_ADMIN" && targetAdmin.role !== RoleAdmin.HEAD_ADMIN)
          return NextResponse.json({ error: "Token ini hanya untuk role HEAD_ADMIN" }, { status: 400 });
      }

      const plainToken = generateAdminToken(tokenRole);
      const tokenHash = hashToken(plainToken);
      const expiredAt = computeExpiry(isPermanent, body.expiredAt ?? null);

      if (adminId) {
        const now = new Date();
        const activeTokens = await prisma.tokenAdmin.findMany({
          where: { adminId, tokenRole: tokenRole as RoleAdmin, isRevoked: false, OR: [{ isPermanent: true }, { expiredAt: { gt: now } }] },
          select: { id: true },
        });
        if (activeTokens.length > 0) {
          for (const t of activeTokens) {
            await prisma.tokenAdmin.update({
              where: { id: t.id },
              data: { isRevoked: true, revokedAt: now },
            });
          }
        }
      }

      const created = await prisma.tokenAdmin.create({
        data: {
          tokenHash,
          tokenRole: tokenRole as RoleAdmin,
          adminId: adminId ?? undefined,
          generatedBy: requester.id,
          isPermanent,
          expiredAt: isPermanent ? null : expiredAt,
          isSingleUse,
        },
      });

      await logAktivitas({
        adminId: requester.id,
        aksi: "GENERATE_TOKEN",
        entityType: "TokenAdmin",
        entityId: created.id,
        dataBefore: null,
        dataAfter: { id: created.id, tokenRole: created.tokenRole, adminId: created.adminId, isPermanent: created.isPermanent },
        ipAddress: ip,
        userAgent: ua,
        keterangan: `Token ${tokenRole} dibuat langsung oleh SUPER_ADMIN`,
      });

      return NextResponse.json({
        message: "Token baru dibuat",
        token: plainToken,
        tokenId: created.id,
        tokenRole: created.tokenRole,
        meta: { 
          admin: targetAdmin ? { id: targetAdmin.id, username: targetAdmin.username, nama: targetAdmin.nama, role: targetAdmin.role } : null, 
          generatedBy: { id: requester.id, username: requester.username, nama: requester.nama, role: requester.role }, 
          isPermanent: created.isPermanent, 
          expiredAt: created.expiredAt, 
          isSingleUse: created.isSingleUse, 
          createdAt: created.createdAt 
        },
      }, { status: 201 });
    }

    // ── HEAD_ADMIN: hanya bisa generate token ADMIN ──
    if (tokenRole === "HEAD_ADMIN") {
      // Masukkan ke antrian RequestApproval (PENDING), generate token tapi belum bisa dipakai
      const plainToken = generateAdminToken("HEAD_ADMIN");
      const tokenHash = hashToken(plainToken);
      const expiredAt = computeExpiry(isPermanent, body.expiredAt ?? null);

      // Simpan token tapi tandai isRevoked=true dulu (pending approval)
      const created = await prisma.tokenAdmin.create({
        data: {
          tokenHash,
          tokenRole: RoleAdmin.HEAD_ADMIN,
          adminId: adminId ?? undefined,
          generatedBy: requester.id,
          isPermanent,
          expiredAt: isPermanent ? null : expiredAt,
          isSingleUse,
          isRevoked: true, // Locked sampai diapprove SUPER_ADMIN
        },
      });

      // Simpan plain token (sementara) di catatanAdmin request agar bisa ditampilkan setelah approve
      const request = await prisma.requestApproval.create({
        data: {
          jenis: "GENERATE_TOKEN_HEADADMIN",
          status: "PENDING",
          tokenId: created.id,
          diajukanOleh: user.id,
          catatanAdmin: plainToken, // plain token disimpan di sini, akan dihapus setelah approve/reject
        },
      });

      return NextResponse.json({
        message: "Request generate token HEAD_ADMIN berhasil diajukan. Token aktif setelah disetujui Super Admin.",
        pending: true,
        requestId: request.id,
      }, { status: 202 });
    }

    // ── HEAD_ADMIN: generate token ADMIN langsung ──
    let targetAdmin = null;
    if (adminId) {
      targetAdmin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { id: true, username: true, nama: true, role: true, isActive: true },
      });
      if (!targetAdmin) return NextResponse.json({ error: "adminId tidak ditemukan" }, { status: 404 });
      if (!targetAdmin.isActive) return NextResponse.json({ error: "Admin target sedang nonaktif" }, { status: 400 });
      if (targetAdmin.role !== RoleAdmin.ADMIN)
        return NextResponse.json({ error: "Token ini hanya untuk role ADMIN" }, { status: 400 });
    }

    const plainToken = generateAdminToken("ADMIN");
    const tokenHash = hashToken(plainToken);
    const expiredAt = computeExpiry(isPermanent, body.expiredAt ?? null);

    if (adminId) {
      const now = new Date();
      const activeTokens = await prisma.tokenAdmin.findMany({
        where: { adminId, tokenRole: RoleAdmin.ADMIN, isRevoked: false, OR: [{ isPermanent: true }, { expiredAt: { gt: now } }] },
        select: { id: true },
      });
      if (activeTokens.length > 0) {
        for (const t of activeTokens) {
          await prisma.tokenAdmin.update({
            where: { id: t.id },
            data: { isRevoked: true, revokedAt: now },
          });
        }
      }
    }

    const created = await prisma.tokenAdmin.create({
      data: {
        tokenHash,
        tokenRole: RoleAdmin.ADMIN,
        adminId: adminId ?? undefined,
        generatedBy: requester.id,
        isPermanent,
        expiredAt: isPermanent ? null : expiredAt,
        isSingleUse,
      },
    });

    await logAktivitas({
      adminId: requester.id,
      aksi: "GENERATE_TOKEN",
      entityType: "TokenAdmin",
      entityId: created.id,
      dataBefore: null,
      dataAfter: { id: created.id, tokenRole: created.tokenRole, adminId: created.adminId, isPermanent: created.isPermanent },
      ipAddress: ip,
      userAgent: ua,
      keterangan: adminId ? `Generate token ADMIN untuk adminId=${adminId}` : "Generate token ADMIN (belum di-assign)",
    });

    return NextResponse.json({
      message: "Token baru dibuat",
      token: plainToken,
      tokenId: created.id,
      tokenRole: created.tokenRole,
      meta: { 
        admin: targetAdmin ? { id: targetAdmin.id, username: targetAdmin.username, nama: targetAdmin.nama, role: targetAdmin.role } : null, 
        generatedBy: { id: requester.id, username: requester.username, nama: requester.nama, role: requester.role }, 
        isPermanent: created.isPermanent, 
        expiredAt: created.expiredAt, 
        isSingleUse: created.isSingleUse, 
        createdAt: created.createdAt 
      },
    }, { status: 201 });

  } catch (err) {
    console.error("Error POST /api/headadmin/generate-token:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
