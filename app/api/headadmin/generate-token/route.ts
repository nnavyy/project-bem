// app/api/headadmin/generate-token/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  try {
    const { headAdminId } = await req.json(); // ID head admin yang generate

    // pastikan yang request memang head admin
    const headAdmin = await prisma.Admin.findUnique({ where: { id: headAdminId } });
    if (!headAdmin || headAdmin.role !== 'HEAD_ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // generate token unik
    const token = randomBytes(16).toString('hex');

    const newToken = await prisma.tokenAdmin.create({
      data: {
        token,
        generatedBy: headAdmin.id,
      },
    });

    return NextResponse.json({ message: 'Token baru dibuat', token: newToken.token });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
