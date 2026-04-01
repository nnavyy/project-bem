import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, generateAdminToken, hashToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";
import { RoleAdmin } from "@prisma/client";

type Body = {
  tokenRole?: "ADMIN" | "HEAD_ADMIN";
  /**
   * Opsional: token langsung di-assign ke admin tertentu.
   * Kalau diisi, endpoint akan revoke token aktif admin tsb (enforce 1 aktif),
   * lalu membuat token baru untuk admin itu.
   */
  adminId?: string;
  /**
   * Kalau tidak permanent:
   * - expiredAt boleh diisi ISO string.
   * - kalau tidak diisi, default 1 hari dari sekarang.
   */
  expiredAt?: string | null;
  isPermanent?: boolean;
  /**
   * Kalau true, token hangus setelah 1x login sukses.
   */
  isSingleUse?: boolean;
};

function computeExpiry(
  isPermanent: boolean,
  expiredAt?: string | null,
): Date | null {
  if (isPermanent) return null;
  if (expiredAt) return new Date(expiredAt);
  // default 1 hari
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  try {
    const user = await verifyToken(req);
    if (!user || user.role !== "HEAD_ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const headAdmin = await prisma.admin.findUnique({ where: { id: user.id } });
    if (
      !headAdmin ||
      headAdmin.role !== RoleAdmin.HEAD_ADMIN ||
      !headAdmin.isActive
    ) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    const tokenRole = body.tokenRole ?? "ADMIN";
    const isPermanent = Boolean(body.isPermanent ?? false);
    const isSingleUse = Boolean(body.isSingleUse ?? false);
    const adminId = body.adminId ?? null;

    if (tokenRole !== "ADMIN" && tokenRole !== "HEAD_ADMIN") {
      return NextResponse.json(
        { error: "Role token tidak valid" },
        { status: 400 },
      );
    }

    // Jika token dibuat untuk HEAD_ADMIN, batasi hanya untuk bootstrap/dev flow:
    // (Kalau kamu memang mau headadmin bisa generate token headadmin lain, hapus guard ini.)
    // Di requirement awal: token headadmin spesial dibuat developer langsung di DB.
    if (tokenRole === "HEAD_ADMIN") {
      return NextResponse.json(
        {
          error: "Token HEAD_ADMIN hanya dibuat oleh developer (bootstrap DB).",
        },
        { status: 400 },
      );
    }

    // Optional: validasi adminId target
    let targetAdmin: {
      id: string;
      username: string;
      nama: string;
      role: RoleAdmin;
      isActive: boolean;
    } | null = null;
    if (adminId) {
      targetAdmin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          username: true,
          nama: true,
          role: true,
          isActive: true,
        },
      });

      if (!targetAdmin) {
        return NextResponse.json(
          { error: "adminId tidak ditemukan" },
          { status: 404 },
        );
      }
      if (!targetAdmin.isActive) {
        return NextResponse.json(
          { error: "Admin target sedang nonaktif" },
          { status: 400 },
        );
      }
      if (targetAdmin.role !== RoleAdmin.ADMIN) {
        return NextResponse.json(
          { error: "Token ini hanya untuk role ADMIN" },
          { status: 400 },
        );
      }
    }

    const plainToken = generateAdminToken(tokenRole);
    const tokenHash = hashToken(plainToken);
    const expiredAt = computeExpiry(isPermanent, body.expiredAt ?? null);

    // Enforce "1 token aktif per admin" jika token langsung di-assign ke admin tertentu.
    // Definisi aktif: isRevoked=false AND (isPermanent=true OR expiredAt > now)
    if (adminId) {
      const now = new Date();

      const activeTokens = await prisma.tokenAdmin.findMany({
        where: {
          adminId,
          tokenRole: RoleAdmin.ADMIN,
          isRevoked: false,
          OR: [{ isPermanent: true }, { expiredAt: { gt: now } }],
        },
        select: {
          id: true,
          tokenRole: true,
          expiredAt: true,
          isPermanent: true,
          isRevoked: true,
        },
      });

      if (activeTokens.length > 0) {
        await prisma.tokenAdmin.updateMany({
          where: { id: { in: activeTokens.map((t) => t.id) } },
          data: { isRevoked: true, revokedAt: now },
        });
      }
    }

    // Create token record (store only hash)
    const created = await prisma.tokenAdmin.create({
      data: {
        tokenHash,
        tokenRole: RoleAdmin.ADMIN,
        adminId: adminId ?? undefined,
        generatedBy: headAdmin.id,
        isPermanent,
        expiredAt: isPermanent ? null : expiredAt,
        isSingleUse,
        // isRevoked default false
      },
      include: {
        admin: { select: { id: true, username: true, nama: true, role: true } },
        headAdmin: {
          select: { id: true, username: true, nama: true, role: true },
        },
      },
    });

    // Log generation (do not log plain token)
    await logAktivitas({
      adminId: headAdmin.id,
      aksi: "GENERATE_TOKEN",
      entityType: "TokenAdmin",
      entityId: created.id,
      dataBefore: null,
      dataAfter: {
        id: created.id,
        tokenRole: created.tokenRole,
        adminId: created.adminId,
        generatedBy: created.generatedBy,
        isPermanent: created.isPermanent,
        expiredAt: created.expiredAt,
        isSingleUse: created.isSingleUse,
        createdAt: created.createdAt,
      },
      ipAddress: ip,
      userAgent: ua,
      keterangan: adminId
        ? `Generate token untuk adminId=${adminId}`
        : "Generate token (belum di-assign ke admin)",
    });

    return NextResponse.json(
      {
        message: "Token baru dibuat",
        // token hanya ditampilkan sekali
        token: plainToken,
        tokenId: created.id,
        tokenRole: created.tokenRole,
        // info meta (tanpa tokenHash)
        meta: {
          admin: created.admin,
          generatedBy: created.headAdmin,
          isPermanent: created.isPermanent,
          expiredAt: created.expiredAt,
          isSingleUse: created.isSingleUse,
          createdAt: created.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error POST /api/headadmin/generate-token:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
