import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const role = req.cookies.get('role')?.value?.toLowerCase()

  if (!role) {
    if (pathname.startsWith('/dashboard/mahasiswa')) {
      return NextResponse.redirect(new URL('/login/mahasiswa', req.url))
    }

    if (
      pathname.startsWith('/dashboard/admin') ||
      pathname.startsWith('/dashboard/headadmin')
    ) {
      return NextResponse.redirect(new URL('/login/admin', req.url))
    }
  }

  if (role === 'mahasiswa' && !pathname.startsWith('/dashboard/mahasiswa')) {
    return NextResponse.redirect(new URL('/dashboard/mahasiswa', req.url))
  }

  if (role === 'admin' && !pathname.startsWith('/dashboard/admin')) {
    return NextResponse.redirect(new URL('/dashboard/admin', req.url))
  }

  if (role === 'headadmin' && !pathname.startsWith('/dashboard/headadmin')) {
    return NextResponse.redirect(new URL('/dashboard/headadmin', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/mahasiswa/:path*',
    '/dashboard/admin/:path*',
    '/dashboard/headadmin/:path*',
  ],
}
