import bcrypt from "bcryptjs";
import { jwtVerify, JWTPayload as JoseJWTPayload } from "jose";
import { NextRequest } from "next/server";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

// Rename biar gak bentrok
interface AppJWTPayload extends JoseJWTPayload {
  id: string;
  email?: string;
  role: "MAHASISWA" | "ADMIN" | "HEAD_ADMIN";
}

// Fungsi verifikasi JWT
export async function verifyToken(req: NextRequest): Promise<AppJWTPayload | null> {
  try {
    const token =
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) return null;

    const { payload } = await jwtVerify(token, secret);

    // pastikan payload punya id dan role
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

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Bandingkan password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
