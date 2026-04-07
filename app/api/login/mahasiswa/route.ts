import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, hashPassword, signToken } from "@/lib/auth";
import { getRequestMeta } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rateLimit";

// Rate limit config: max 10 requests per 15 minutes per IP
const RATE_LIMIT_OPTIONS = { maxRequests: 10, windowMs: 15 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const { ip } = getRequestMeta(req);

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

  try {
    const { nim, email, password } = (await req.json()) as {
      nim: string;
      email: string;
      password: string;
    };

    // 🔍 Cek mahasiswa berdasarkan NIM
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { nim },
    });

    if (!mahasiswa) {
      return NextResponse.json(
        { error: "NIM tersebut belum terdaftar, silahkan kontak CS." },
        { status: 404 },
      );
    }

    // Cek email (jika diisi)
    if (mahasiswa.email && mahasiswa.email !== email) {
      return NextResponse.json({ error: "Email tidak cocok" }, { status: 401 });
    }

    // 🔑 Bandingkan password
    const isBcryptHash =
      mahasiswa.password.startsWith("$2a$") ||
      mahasiswa.password.startsWith("$2b$");
    const validPassword = isBcryptHash
      ? await comparePassword(password, mahasiswa.password)
      : password === mahasiswa.password;

    if (!validPassword) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    // Upgrade otomatis password plaintext lama ke bcrypt hash.
    if (!isBcryptHash) {
      const hashed = await hashPassword(password);
      await prisma.mahasiswa.update({
        where: { id: mahasiswa.id },
        data: { password: hashed },
      });
    }

    // ✅ Sign JWT via jose (konsisten dengan admin login, 24 jam TTL)
    // Diperpendek dari 7d ke 24h untuk membatasi window eksposur token bocor.
    const sessionToken = await signToken({
      id: mahasiswa.id,
      role: "MAHASISWA",
    });

    const res = NextResponse.json({
      message: "Login berhasil",
      redirect: "/dashboard/mahasiswa",
    });

    const cookieOptions = {
      httpOnly: true,
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 jam
    };

    res.cookies.set("next-auth.session-token", sessionToken, cookieOptions);
    res.cookies.set("role", "mahasiswa", {
      ...cookieOptions,
      httpOnly: false, // role cookie perlu bisa dibaca JS untuk redirect di middleware fallback
    });

    return res;
  } catch (err) {
    console.error("Error login mahasiswa:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
