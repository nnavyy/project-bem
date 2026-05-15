import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretValue =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  "dev-only-secret-change-this";

// 🔒 SECURITY: Validate secret in production
if (
  process.env.NODE_ENV === "production" &&
  secretValue === "dev-only-secret-change-this"
) {
  throw new Error(
    "CRITICAL SECURITY ERROR: NEXTAUTH_SECRET must be set in production environment. " +
      "Generate a strong secret with: openssl rand -base64 32",
  );
}

const secret = new TextEncoder().encode(secretValue);

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
    // ── 2a. Fully public routes (no auth needed) ──────────────────────────
    const publicApiRoutes = [
      "/api/login/", // Login endpoints
      "/api/chatbot", // Chatbot accessible dari public page
      "/api/logout", // Logout handles own auth internally
      "/api/health",
      "/api/public/",
    ];
    const isPublicRoute = publicApiRoutes.some((route) =>
      pathname.startsWith(route),
    );
    if (isPublicRoute) return NextResponse.next();

    // ── 2b. Semi-public routes: GET = public, mutasi = butuh auth ─────────
    // Blog dan portofolio bisa dibaca tanpa login (public page),
    // tapi POST/PUT/DELETE tetap dijaga oleh auth check di route handler.
    const semiPublicGetRoutes = ["/api/blog", "/api/portofolio"];
    const isSemiPublicGet =
      req.method === "GET" &&
      semiPublicGetRoutes.some((route) => pathname.startsWith(route));
    if (isSemiPublicGet) return NextResponse.next();

    // ── 2c. Semua route lain butuh JWT ────────────────────────────────────
    if (!role) {
      return NextResponse.json(
        { error: "Unauthorized - Valid session required" },
        { status: 401 },
      );
    }

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
