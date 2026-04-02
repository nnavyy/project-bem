import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  // Coba identifikasi siapa yang logout untuk keperluan audit log.
  // Kalau JWT sudah tidak valid sekalipun, tetap lanjut hapus cookie.
  try {
    const user = await verifyToken(req);
    if (user && (user.role === "ADMIN" || user.role === "HEAD_ADMIN" || user.role === "SUPER_ADMIN")) {
      await logAktivitas({
        adminId: user.id,
        aksi: "LOGOUT",
        ipAddress: ip,
        userAgent: ua,
        keterangan: "Admin logout",
      });
    }
  } catch {
    // Jangan gagalkan logout hanya karena log error
  }

  const res = NextResponse.json({ message: "Logout berhasil" });

  // Hapus semua cookie sesi yang mungkin aktif
  const cookieOpts = {
    path: "/",
    maxAge: 0,
  } as const;

  res.cookies.set("next-auth.session-token", "", cookieOpts);
  res.cookies.set("__Secure-next-auth.session-token", "", cookieOpts);
  res.cookies.set("role", "", cookieOpts);

  return res;
}
