import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    "dev-only-secret-change-this",
);

/** Maps JWT role enum values to the URL segment / cookie role strings. */
const JWT_ROLE_MAP: Record<string, string> = {
  MAHASISWA: "mahasiswa",
  ADMIN: "admin",
  HEAD_ADMIN: "headadmin",
  SUPER_ADMIN: "superadmin",
};

/**
 * Attempt to extract and verify the NextAuth JWT from the request cookies.
 * Returns the normalised (lowercase) role string on success, or null on any
 * failure (expired, invalid signature, missing cookie, etc.).
 */
async function getRoleFromJwt(req: NextRequest): Promise<string | null> {
  // NextAuth stores the session JWT under different cookie names depending on
  // whether the site is served over HTTPS (__Secure- prefix) or HTTP.
  const token =
    req.cookies.get("__Secure-next-auth.session-token")?.value ??
    req.cookies.get("next-auth.session-token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);

    // The payload shape is: { id: string, role: "MAHASISWA" | "ADMIN" | ... }
    const jwtRole = (payload as { role?: string }).role;
    if (!jwtRole) return null;

    return JWT_ROLE_MAP[jwtRole.toUpperCase()] ?? null;
  } catch {
    // Covers: expired token, bad signature, malformed JWT, etc.
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Primary: verify JWT and extract role ─────────────────────────────
  const role = await getRoleFromJwt(req);

  // ── 2. Handle API routes (return JSON errors instead of redirects) ──────
  if (pathname.startsWith("/api/")) {
    // Public API routes that don't require authentication
    const publicApiRoutes = ["/api/login/", "/api/health", "/api/public/"];
    const isPublicRoute = publicApiRoutes.some((route) =>
      pathname.startsWith(route),
    );

    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Protected API routes require valid JWT
    if (!role) {
      return NextResponse.json(
        { error: "Unauthorized - Valid session required" },
        { status: 401 },
      );
    }

    // API route authorization can be added here if needed
    // For now, any authenticated user can access protected API routes
    return NextResponse.next();
  }

  // ── 3. No session at all → redirect to the appropriate login page ────────
  if (!role) {
    if (pathname.startsWith("/dashboard/mahasiswa")) {
      return NextResponse.redirect(new URL("/login/mahasiswa", req.url));
    }

    if (
      pathname.startsWith("/dashboard/admin") ||
      pathname.startsWith("/dashboard/headadmin") ||
      pathname.startsWith("/dashboard/superadmin")
    ) {
      return NextResponse.redirect(new URL("/login/admin", req.url));
    }

    // Shouldn't be reached given the matcher, but be safe.
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ── 4. Session exists → enforce role ↔ route alignment ──────────────────
  if (role === "mahasiswa" && !pathname.startsWith("/dashboard/mahasiswa")) {
    return NextResponse.redirect(new URL("/dashboard/mahasiswa", req.url));
  }

  if (role === "admin" && !pathname.startsWith("/dashboard/admin")) {
    return NextResponse.redirect(new URL("/dashboard/admin", req.url));
  }

  if (role === "headadmin" && !pathname.startsWith("/dashboard/headadmin")) {
    return NextResponse.redirect(new URL("/dashboard/headadmin", req.url));
  }

  if (role === "superadmin" && !pathname.startsWith("/dashboard/superadmin")) {
    return NextResponse.redirect(new URL("/dashboard/superadmin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/mahasiswa/:path*",
    "/dashboard/admin/:path*",
    "/dashboard/headadmin/:path*",
    "/dashboard/superadmin/:path*",
    "/api/:path*",
  ],
};
