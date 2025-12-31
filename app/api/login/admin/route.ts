import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    console.log('Prisma client:', prisma);
    const { username, token } = await req.json() as { username: string; token: string };

    const admin = await prisma.Admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 });
    }

    // Cek token valid atau belum dipakai
    const tokenData = await prisma.tokenAdmin.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 404 });
    }

    if (tokenData.isUsed && admin.role !== 'HEAD_ADMIN') {
      return NextResponse.json({ error: 'Token sudah digunakan' }, { status: 401 });
    }

    // Tandai token sudah digunakan (kecuali HEAD_ADMIN)
    if (admin.role !== 'HEAD_ADMIN') {
      await prisma.tokenAdmin.update({
        where: { id: tokenData.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
          adminId: admin.id,
        },
      });
    }

    // 📝 Catat log aktivitas login
    await prisma.logAktivitasAdmin.create({
      data: {
        adminId: admin.id,
        tokenId: tokenData.id,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    // 🍪 Simpan role di cookie
    const res = NextResponse.json({ 
      message: 'Login admin berhasil', 
      user: admin,
      redirect: admin.role === 'HEAD_ADMIN'
        ? '/dashboard/headadmin'
        : '/dashboard/admin'
    });
    
    res.cookies.set('role', admin.role, { 
      httpOnly: true,
      path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('Error login admin:', err);
    return NextResponse.json({ error: err.message || 'Server error', detail: err }, { status: 500 });
  }
}
