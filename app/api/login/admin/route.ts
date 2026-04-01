import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { username, token } = (await req.json()) as {
      username: string;
      token: string;
    };

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    // Cek token valid atau belum dipakai
    const tokenData = await prisma.tokenAdmin.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 404 });
    }

    if (tokenData.expiredAt && tokenData.expiredAt < new Date()) {
      return NextResponse.json({ error: "Token sudah kedaluwarsa" }, { status: 401 });
    }

    if (tokenData.tokenRole !== admin.role) {
      return NextResponse.json(
        { error: "Token tidak sesuai role akun ini" },
        { status: 403 }
      );
    }

    if (tokenData.adminId && tokenData.adminId !== admin.id) {
      return NextResponse.json({ error: "Token ini terikat ke admin lain" }, { status: 403 });
    }

    if (tokenData.isUsed && !tokenData.isPermanent) {
      return NextResponse.json({ error: "Token sudah digunakan" }, { status: 401 });
    }

    await prisma.tokenAdmin.update({
      where: { id: tokenData.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        adminId: tokenData.adminId ?? admin.id,
      },
    });

    // 📝 Catat log aktivitas login
    await prisma.logAktivitasAdmin.create({
      data: {
        adminId: admin.id,
        tokenId: tokenData.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    const secret =
      process.env.NEXTAUTH_SECRET ||
      process.env.AUTH_SECRET ||
      process.env.JWT_SECRET ||
      "dev-only-secret-change-this";
    if (!secret) {
      return NextResponse.json({ error: "NEXTAUTH_SECRET belum diset" }, { status: 500 });
    }

    const sessionToken = jwt.sign({ id: admin.id, role: admin.role }, secret, {
      expiresIn: "7d",
    });

    const normalizedRole = admin.role === "HEAD_ADMIN" ? "headadmin" : "admin";

    // 🍪 Simpan role di cookie
    const res = NextResponse.json({
      message: "Login admin berhasil",
      user: admin,
      redirect: admin.role === "HEAD_ADMIN" ? "/dashboard/headadmin" : "/dashboard/admin",
    });

    res.cookies.set("role", normalizedRole, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.set("next-auth.session-token", sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: unknown) {
    console.error("Error login admin:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
