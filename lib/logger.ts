import prisma from "./prisma";
import { Prisma } from "@prisma/client";

export type ActivityAction =
  | "LOGIN"
  | "LOGIN_GAGAL"
  | "LOGOUT"
  | "CREATE_ADMIN"
  | "UPDATE_ADMIN"
  | "CREATE_BLOG"
  | "UPDATE_BLOG"
  | "DELETE_BLOG"
  | "CREATE_PORTOFOLIO"
  | "UPDATE_PORTOFOLIO"
  | "DELETE_PORTOFOLIO"
  | "CREATE_GALERI"
  | "UPDATE_GALERI"
  | "DELETE_GALERI"
  | "UPDATE_STATUS_LAPORAN"
  | "TAMBAH_TINDAKLANJUT"
  | "GENERATE_TOKEN"
  | "REVOKE_TOKEN";

export interface LogOptions {
  adminId: string;
  aksi: ActivityAction;
  entityType?: string;
  entityId?: string;
  dataBefore?: Prisma.InputJsonValue | null;
  dataAfter?: Prisma.InputJsonValue | null;
  tokenId?: string;
  ipAddress?: string;
  userAgent?: string;
  keterangan?: string;
}

/**
 * Catat aktivitas admin ke tabel LogAktivitasAdmin.
 *
 * Fungsi ini TIDAK melempar error — kegagalan penulisan log tidak boleh
 * menggagalkan operasi utama yang sedang berjalan.
 *
 * Panduan penggunaan kolom:
 *  - LOGIN / LOGIN_GAGAL / LOGOUT → entityType & entityId = null
 *  - CREATE → dataBefore = null,  dataAfter = data baru
 *  - UPDATE → dataBefore = data lama, dataAfter = data baru
 *  - DELETE → dataBefore = data lama, dataAfter = null
 */
export async function logAktivitas(opts: LogOptions): Promise<void> {
  try {
    await prisma.logAktivitasAdmin.create({
      data: {
        adminId: opts.adminId,
        // avoid hard dependency on Prisma enum export in TS:
        // pass action as raw string expected by DB enum
        aksi: opts.aksi as unknown as Prisma.LogAktivitasAdminCreateInput["aksi"],
        entityType: opts.entityType ?? null,
        entityId: opts.entityId ?? null,
        // Untuk kolom Json? di Prisma:
        // - undefined → tidak mengirim field
        // - null      → simpan JSON null (gunakan Prisma.JsonNull)
        dataBefore:
          opts.dataBefore === undefined
            ? undefined
            : opts.dataBefore === null
              ? Prisma.JsonNull
              : opts.dataBefore,
        dataAfter:
          opts.dataAfter === undefined
            ? undefined
            : opts.dataAfter === null
              ? Prisma.JsonNull
              : opts.dataAfter,
        tokenId: opts.tokenId ?? null,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
        keterangan: opts.keterangan ?? null,
      },
    });
  } catch (err) {
    // Gagal log → cukup print ke console, jangan hentikan request
    console.error("[logAktivitas] Gagal menulis log aktivitas:", err);
  }
}

/**
 * Helper: ambil IP dan User-Agent dari header request.
 * Gunakan ini di setiap route agar konsisten.
 *
 * Contoh pemakaian:
 *   const { ip, ua } = getRequestMeta(req);
 */
export function getRequestMeta(req: Request): {
  ip: string;
  ua: string | undefined;
} {
  const headers =
    req instanceof Request
      ? req.headers
      : (req as { headers: Headers }).headers;
  const ip =
    headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? "unknown";
  const ua = headers.get("user-agent") ?? undefined;
  return { ip, ua };
}
