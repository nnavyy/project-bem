import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashToken, signToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rateLimit";
import { RoleAdmin } from "@prisma/client";

type Body = {
  username?: string;
  token?: string;
};

/**
 * POST /api/login/admin
 * Login untuk ADMIN / HEAD_ADMIN pakai username + token.
 */
// Rate limit config: max 10 failed/success requests per 15 minutes per IP
const RATE_LIMIT_OPTIONS = { maxRequests: 10, windowMs: 15 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const rl = checkRateLimit(ip, RATE_LIMIT_OPTIONS);
  if (rl.limited) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login. Coba lagi beberapa menit." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.resetInMs / 1000)),
          "X-RateLimit-Limit": String(RATE_LIMIT_OPTIONS.maxRequests),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Body JSON tidak valid" },
      { status: 400 },
    );
  }

  const username = (body.username ?? "").trim();
  const tokenPlain = (body.token ?? "").trim();

  if (!username || !tokenPlain) {
    return NextResponse.json(
      { error: "Username dan token wajib diisi" },
      { status: 400 },
    );
  }

  const admin = await prisma.admin.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      nama: true,
      role: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive) {
    return NextResponse.json(
      { error: "Username atau token salah" },
      { status: 401 },
    );
  }

  const tokenHash = hashToken(tokenPlain);

  const tokenRecord = await prisma.tokenAdmin.findUnique({
    where: { tokenHash },
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

  if (!tokenRecord) {
    await logAktivitas({
      adminId: admin.id,
      aksi: "LOGIN_GAGAL",
      dataBefore: null,
      dataAfter: null,
      ipAddress: ip,
      userAgent: ua,
      keterangan: "Token tidak ditemukan (hash mismatch)",
    });

    return NextResponse.json(
      { error: "Username atau token salah" },
      { status: 401 },
    );
  }

  if (tokenRecord.tokenRole !== admin.role) {
    await logAktivitas({
      adminId: admin.id,
      aksi: "LOGIN_GAGAL",
      tokenId: tokenRecord.id,
      ipAddress: ip,
      userAgent: ua,
      keterangan: `Role token tidak cocok. tokenRole=${tokenRecord.tokenRole} adminRole=${admin.role}`,
    });

    return NextResponse.json(
      { error: "Username atau token salah" },
      { status: 401 },
    );
  }

  if (tokenRecord.isRevoked) {
    await logAktivitas({
      adminId: admin.id,
      aksi: "LOGIN_GAGAL",
      tokenId: tokenRecord.id,
      ipAddress: ip,
      userAgent: ua,
      keterangan: "Token sudah direvoke",
    });

    return NextResponse.json(
      { error: "Token sudah tidak aktif" },
      { status: 401 },
    );
  }

  if (!tokenRecord.isPermanent) {
    const exp = tokenRecord.expiredAt;
    if (exp && exp.getTime() <= Date.now()) {
      await logAktivitas({
        adminId: admin.id,
        aksi: "LOGIN_GAGAL",
        tokenId: tokenRecord.id,
        ipAddress: ip,
        userAgent: ua,
        keterangan: "Token sudah expired",
      });

      return NextResponse.json(
        { error: "Token sudah expired" },
        { status: 401 },
      );
    }
  }

  if (tokenRecord.adminId && tokenRecord.adminId !== admin.id) {
    await logAktivitas({
      adminId: admin.id,
      aksi: "LOGIN_GAGAL",
      tokenId: tokenRecord.id,
      ipAddress: ip,
      userAgent: ua,
      keterangan: `Token sudah diklaim oleh admin lain (adminId=${tokenRecord.adminId})`,
    });

    return NextResponse.json(
      { error: "Username atau token salah" },
      { status: 401 },
    );
  }

  const now = new Date();
  if (!tokenRecord.adminId || !tokenRecord.claimedAt) {
    await prisma.tokenAdmin.update({
      where: { id: tokenRecord.id },
      data: {
        adminId: admin.id,
        claimedAt: tokenRecord.claimedAt ?? now,
      },
    });
  }

  if (tokenRecord.isSingleUse) {
    await prisma.tokenAdmin.update({
      where: { id: tokenRecord.id },
      data: {
        isRevoked: true,
        revokedAt: now,
      },
    });
  }

  const jwt = await signToken({
    id: admin.id,
    role: admin.role === RoleAdmin.HEAD_ADMIN ? "HEAD_ADMIN" : admin.role === RoleAdmin.SUPER_ADMIN ? "SUPER_ADMIN" : "ADMIN",
  });

  await logAktivitas({
    adminId: admin.id,
    aksi: "LOGIN",
    tokenId: tokenRecord.id,
    ipAddress: ip,
    userAgent: ua,
    keterangan: tokenRecord.isSingleUse
      ? "Login sukses (token single-use direvoke setelah login)"
      : "Login sukses",
  });

  const redirect =
    admin.role === RoleAdmin.SUPER_ADMIN
      ? "/dashboard/superadmin"
      : admin.role === RoleAdmin.HEAD_ADMIN
        ? "/dashboard/headadmin"
        : "/dashboard/admin";

  const res = NextResponse.json({ redirect }, { status: 200 });

  const cookieOptions = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24,
  };

  res.cookies.set("next-auth.session-token", jwt, cookieOptions);
  if (process.env.NODE_ENV === "production") {
    res.cookies.set("__Secure-next-auth.session-token", jwt, cookieOptions);
  }

  const roleCookie =
    admin.role === RoleAdmin.SUPER_ADMIN ? "superadmin" : admin.role === RoleAdmin.HEAD_ADMIN ? "headadmin" : "admin";
  res.cookies.set("role", roleCookie, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}

export async function GET() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
