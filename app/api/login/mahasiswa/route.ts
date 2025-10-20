import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword } from '@/lib/auth';

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
      return NextResponse.json({ error: 'Mahasiswa tidak ditemukan' }, { status: 404 });
    }

    // Cek email (jika diisi)
    if (mahasiswa.email && mahasiswa.email !== email) {
      return NextResponse.json({ error: 'Email tidak cocok' }, { status: 401 });
    }

    // 🔑 Bandingkan password
    const validPassword = await comparePassword(password, mahasiswa.password);
    if (!validPassword) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    // ✅ Simpan cookie login dan arahkan ke dashboard mahasiswa
    const res = NextResponse.json({ 
      message: 'Login berhasil', 
      user: mahasiswa,
      redirect: '/dashboard/mahasiswa'
    });

    res.cookies.set('role', 'mahasiswa', { 
      httpOnly: true,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('Error login mahasiswa:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
