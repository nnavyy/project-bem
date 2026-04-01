import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, hashPassword } from '@/lib/auth';
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { nim, email, password } = await req.json() as {
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
        { status: 404 }
      );
    }

    // Cek email (jika diisi)
    if (mahasiswa.email && mahasiswa.email !== email) {
      return NextResponse.json({ error: 'Email tidak cocok' }, { status: 401 });
    }

    // 🔑 Bandingkan password
    const isBcryptHash = mahasiswa.password.startsWith("$2a$") || mahasiswa.password.startsWith("$2b$");
    const validPassword = isBcryptHash
      ? await comparePassword(password, mahasiswa.password)
      : password === mahasiswa.password;

    if (!validPassword) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    // Upgrade otomatis password plaintext lama ke bcrypt hash.
    if (!isBcryptHash) {
      const hashed = await hashPassword(password);
      await prisma.mahasiswa.update({
        where: { id: mahasiswa.id },
        data: { password: hashed },
      });
    }

    const secret =
      process.env.NEXTAUTH_SECRET ||
      process.env.AUTH_SECRET ||
      process.env.JWT_SECRET ||
      "dev-only-secret-change-this";
    if (!secret) {
      return NextResponse.json({ error: "NEXTAUTH_SECRET belum diset" }, { status: 500 });
    }

    const sessionToken = jwt.sign(
      { id: mahasiswa.id, role: "MAHASISWA", email: mahasiswa.email },
      secret,
      { expiresIn: "7d" }
    );

    // ✅ Simpan cookie login dan arahkan ke dashboard mahasiswa
    const res = NextResponse.json({ 
      message: 'Login berhasil', 
      user: mahasiswa,
      redirect: '/dashboard/mahasiswa'
    });

    res.cookies.set('role', 'mahasiswa', {
      httpOnly: true,
      path: '/',
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
  } catch (err) {
    console.error('Error login mahasiswa:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
