import prisma from "./prisma";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// STRING UTILS
// ─────────────────────────────────────────────────────────────

/**
 * Ubah judul / string sembarang menjadi URL slug yang aman.
 *
 * Contoh:
 *   slugify("Ini Judul Blog!")  →  "ini-judul-blog"
 *   slugify("  hello   world") →  "hello-world"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // hapus combining accents (é → e, dll)
    .replace(/[^a-z0-9\s-]/g, "") // hapus karakter selain huruf, angka, spasi, dash
    .replace(/\s+/g, "-") // ganti spasi dengan dash
    .replace(/-+/g, "-") // collapse multiple dash jadi satu
    .replace(/^-|-$/g, ""); // buang dash di awal/akhir
}

/**
 * Pastikan slug yang dihasilkan unik di tabel Blog.
 *
 * Kalau `base` sudah ada di DB, akan ditambahkan suffix angka:
 *   "judul-blog" → "judul-blog-2" → "judul-blog-3" → dst.
 *
 * @param base       - Slug dasar (biasanya dari slugify(judul))
 * @param excludeId  - ID blog yang sedang di-update (biar gak bentrok sama dirinya sendiri)
 */
export async function ensureUniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const safeBase = base.trim() || "post";
  let candidate = safeBase;
  let suffix = 1;

  while (true) {
    const existing = await prisma.blog.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;

    suffix += 1;
    candidate = `${safeBase}-${suffix}`;
  }
}

// ─────────────────────────────────────────────────────────────
// DATE UTILS
// ─────────────────────────────────────────────────────────────

/**
 * Konversi semua field bertipe Date dalam sebuah objek menjadi ISO string.
 * Berguna sebelum menyimpan data ke kolom JSON Prisma (dataBefore / dataAfter),
 * karena Prisma tidak menerima objek Date di kolom Json.
 *
 * Contoh:
 *   serializeDates({ id: "1", updatedAt: new Date() })
 *   → { id: "1", updatedAt: "2025-01-01T00:00:00.000Z" }
 */
export function serializeDates(
  obj: Record<string, unknown>,
): Prisma.InputJsonValue {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (value instanceof Date) return [key, value.toISOString()];
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        return [key, serializeDates(value as Record<string, unknown>)];
      }
      return [key, value];
    }),
  ) as Prisma.InputJsonValue;
}
