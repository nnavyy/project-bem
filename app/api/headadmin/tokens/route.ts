import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, generateAdminToken, hashToken } from "@/lib/auth";
import { logAktivitas, getRequestMeta } from "@/lib/logger";
import { RoleAdmin } from "@prisma/client";

type CreateTokenBody = {
  tokenRole?: "ADMIN" | "HEAD_ADMIN";
  isPermanent?: boolean;
  isSingleUse?: boolean;
  expiredAt?: string; // ISO string
  adminId?: string | null; // optional: pre-assign token to a specific admin
};

/**
 * GET /api/headadmin/tokens
 * List semua token (tanpa pernah mengekspos tokenHash).
 * Hanya HEAD_ADMIN.
 */
export async function GET(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user || (user.role !== "HEAD_ADMIN" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tokens = await prisma.tokenAdmin.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tokenRole: true,
      adminId: true,
      generatedBy: true,
      expiredAt: true,
      isPermanent: true,
      isSingleUse: true,
      isRevoked: true,
      revokedAt: true,
      claimedAt: true,
      createdAt: true,
      admin: {
        select: {
          id: true,
          username: true,
          nama: true,
          role: true,
          isActive: true,
        },
      },
      headAdmin: {
        select: {
          id: true,
          username: true,
          nama: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  return NextResponse.json(tokens);
}

/**
 * POST /api/headadmin/tokens
 * Buat token baru untuk ADMIN / HEAD_ADMIN.
 *
 * Catatan penting:
 * - Plain token hanya ditampilkan SEKALI di response.
 * - DB menyimpan tokenHash (SHA-256), bukan plain token.
 * - Endpoint ini tidak akan pernah mengembalikan tokenHash.
 */
export async function POST(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user || (user.role !== "HEAD_ADMIN" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { ip, ua } = getRequestMeta(req);

  // Validasi bahwa admin yang request memang HEAD_ADMIN di DB (tidak berlaku untuk SUPER_ADMIN)
  let headAdmin: { id: string; role: string; isActive: boolean } | null = null;
  if (user.role === "HEAD_ADMIN") {
    headAdmin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, isActive: true },
    });

    if (
      !headAdmin ||
      headAdmin.role !== RoleAdmin.HEAD_ADMIN ||
      !headAdmin.isActive
    ) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  } else {
    // SUPER_ADMIN — gunakan ID dari token langsung
    headAdmin = { id: user.id, role: "SUPER_ADMIN", isActive: true };
  }

  let body: CreateTokenBody;
  try {
    body = (await req.json()) as CreateTokenBody;
  } catch {
    return NextResponse.json(
      { message: "Body JSON tidak valid" },
      { status: 400 },
    );
  }

  const tokenRole = body.tokenRole ?? "ADMIN";
  const isPermanent = body.isPermanent ?? false;
  const isSingleUse = body.isSingleUse ?? false;

  if (tokenRole !== "ADMIN" && tokenRole !== "HEAD_ADMIN") {
    return NextResponse.json(
      { message: "tokenRole tidak valid" },
      { status: 400 },
    );
  }

  // expiredAt:
  // - jika isPermanent: null
  // - jika body.expiredAt ada: parse
  // - else: default 1 hari
  let expiredAt: Date | null = null;
  if (!isPermanent) {
    if (body.expiredAt) {
      const d = new Date(body.expiredAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { message: "expiredAt tidak valid" },
          { status: 400 },
        );
      }
      expiredAt = d;
    } else {
      expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }

  // Optional: pre-assign token ke admin tertentu
  const adminId: string | null = body.adminId ?? null;
  if (adminId) {
    const target = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, role: true, isActive: true },
    });
    if (!target) {
      return NextResponse.json(
        { message: "adminId tidak ditemukan" },
        { status: 400 },
      );
    }
    if (!target.isActive) {
      return NextResponse.json(
        { message: "Admin target tidak aktif" },
        { status: 400 },
      );
    }
    // tokenRole harus cocok dengan role admin target (biar gak campur role)
    if (tokenRole === "ADMIN" && target.role !== RoleAdmin.ADMIN) {
      return NextResponse.json(
        { message: "adminId bukan role ADMIN" },
        { status: 400 },
      );
    }
    if (tokenRole === "HEAD_ADMIN" && target.role !== RoleAdmin.HEAD_ADMIN) {
      return NextResponse.json(
        { message: "adminId bukan role HEAD_ADMIN" },
        { status: 400 },
      );
    }
  }

  // Generate plain token (sekali tampil), lalu hash untuk DB
  const plainToken = generateAdminToken(tokenRole);
  const tokenHash = hashToken(plainToken);

  // Simpan token
  const created = await prisma.tokenAdmin.create({
    data: {
      tokenHash,
      tokenRole: tokenRole as RoleAdmin,
      isPermanent,
      isSingleUse,
      expiredAt,
      generatedBy: headAdmin.id,
      adminId, // boleh null (unclaimed) atau pre-assigned
    },
    select: {
      id: true,
      tokenRole: true,
      adminId: true,
      generatedBy: true,
      expiredAt: true,
      isPermanent: true,
      isSingleUse: true,
      isRevoked: true,
      revokedAt: true,
      claimedAt: true,
      createdAt: true,
    },
  });

  // Log aktivitas (tanpa menyimpan token plain di log)
  await logAktivitas({
    adminId: headAdmin.id,
    aksi: "GENERATE_TOKEN",
    entityType: "Token",
    entityId: created.id,
    dataBefore: null,
    dataAfter: {
      id: created.id,
      tokenRole: created.tokenRole,
      adminId: created.adminId,
      expiredAt: created.expiredAt,
      isPermanent: created.isPermanent,
      isSingleUse: created.isSingleUse,
      isRevoked: created.isRevoked,
      createdAt: created.createdAt,
    },
    ipAddress: ip,
    userAgent: ua,
    keterangan: adminId
      ? "Token dibuat dan di-assign ke admin"
      : "Token dibuat (belum diklaim)",
  });

  // Return: plainToken hanya sekali, tokenHash tidak pernah dikembalikan
  return NextResponse.json(
    {
      message: "Token baru dibuat",
      token: plainToken,
      data: created,
    },
    { status: 201 },
  );
}
