import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Logout berhasil' });
  res.cookies.delete('role');
  return res;
}
