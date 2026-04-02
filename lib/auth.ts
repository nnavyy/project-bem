import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT, JWTPayload as JoseJWTPayload } from "jose";
import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";

const secretValue =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  "dev-only-secret-change-this";
const secret = new TextEncoder().encode(secretValue);

// Rename biar gak bentrok dengan jose JWTPayload
interface AppJWTPayload extends JoseJWTPayload {
  id: string;
  email?: string;
  role: "MAHASISWA" | "ADMIN" | "HEAD_ADMIN" | "SUPER_ADMIN";
}

// ─────────────────────────────────────────────────────────────
// JWT — VERIFIKASI & SIGN
// ─────────────────────────────────────────────────────────────

/**
 * Verifikasi JWT dari cookie atau Authorization header.
 * Dipakai di semua API route untuk identify user yang sedang login.
 */
export async function verifyToken(
  req: NextRequest,
): Promise<AppJWTPayload | null> {
  try {
    const token =
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) return null;

    const { payload } = await jwtVerify(token, secret);

    if (
      !payload ||
      typeof payload.id !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return payload as AppJWTPayload;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

/**
 * Buat JWT session setelah login berhasil.
 * Expiry default 24 jam.
 */
export async function signToken(payload: {
  id: string;
  role: "MAHASISWA" | "ADMIN" | "HEAD_ADMIN" | "SUPER_ADMIN";
}): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

// ─────────────────────────────────────────────────────────────
// TOKEN ADMIN — GENERATE & HASH
// ─────────────────────────────────────────────────────────────

/**
 * Hash SHA-256 dari plain token admin.
 * Yang disimpan di DB adalah hash-nya, bukan plain text-nya.
 * Saat login, input token di-hash lalu dibandingkan dengan DB.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate token acak alphanumeric sesuai role:
 * - ADMIN      → 8 karakter
 * - HEAD_ADMIN → 16 karakter
 *
 * Token ini ditampilkan SEKALI ke headadmin saat generate,
 * lalu tidak pernah disimpan dalam bentuk plain di DB.
 */
export function generateAdminToken(role: "ADMIN" | "HEAD_ADMIN" | "SUPER_ADMIN"): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const length = role === "ADMIN" ? 8 : 16;
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

// ─────────────────────────────────────────────────────────────
// PASSWORD MAHASISWA — HASH & COMPARE
// ─────────────────────────────────────────────────────────────

/** Hash password menggunakan bcrypt (untuk mahasiswa). */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/** Bandingkan plain password dengan hash yang tersimpan di DB. */
export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
