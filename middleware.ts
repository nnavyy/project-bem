import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = [
  '/dashboard/mahasiswa',
  '/dashboard/admin',
  '/dashboard/headadmin'
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Bypass route yang bukan dashboard
  if (!protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const role = req.cookies.get('role')?.value

  // Belum login
  if (!role) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Mahasiswa
  if (role === 'mahasiswa' && !pathname.startsWith('/dashboard/mahasiswa')) {
    return NextResponse.redirect(new URL('/dashboard/mahasiswa', req.url))
  }

  // Admin
  if (role === 'ADMIN' && !pathname.startsWith('/dashboard/admin')) {
    return NextResponse.redirect(new URL('/dashboard/admin', req.url))
  }

  // Head Admin
  if (role === 'HEAD_ADMIN' && !pathname.startsWith('/dashboard/headadmin')) {
    return NextResponse.redirect(new URL('/dashboard/headadmin', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
