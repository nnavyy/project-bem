import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type ActivityAction } from "@/lib/logger";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function parseIntParam(
  value: string | null,
  def: number,
  min: number,
  max: number,
): number {
  const n = value ? Number.parseInt(value, 10) : NaN;
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

/** Cast raw query-string value to ActivityAction — Prisma will throw at runtime if invalid. */
function toActivityAction(value: string): ActivityAction {
  return value as ActivityAction;
}

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// ─────────────────────────────────────────────────────────────
// GET /api/headadmin/logs
// ─────────────────────────────────────────────────────────────
/**
 * Lihat semua log aktivitas admin — hanya HEAD_ADMIN.
 *
 * Query params (semua opsional):
 *   page        → nomor halaman (default: 1)
 *   pageSize    → item per halaman, max 100 (default: 25)
 *   adminId     → filter by admin UUID
 *   aksi        → satu atau beberapa aksi dipisah koma, mis. "LOGIN,UPDATE_BLOG"
 *   entityType  → mis. "Blog" | "Portofolio" | "Laporan" | "Token"
 *   entityId    → UUID entitas tertentu
 *   from        → ISO date string — batas bawah createdAt (inklusif)
 *   to          → ISO date string — batas atas createdAt (inklusif)
 */
export async function GET(req: NextRequest) {
  try {
    // Auth — HEAD_ADMIN or SUPER_ADMIN
    const user = await verifyToken(req);
    if (!user || (user.role !== "HEAD_ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);

    // ── Pagination ────────────────────────────────────────────
    const page = parseIntParam(url.searchParams.get("page"), 1, 1, 1_000_000);
    const pageSize = parseIntParam(
      url.searchParams.get("pageSize"),
      25,
      1,
      100,
    );
    const skip = (page - 1) * pageSize;

    // ── Filters ───────────────────────────────────────────────
    const adminId = url.searchParams.get("adminId") ?? undefined;
    const entityType = url.searchParams.get("entityType") ?? undefined;
    const entityId = url.searchParams.get("entityId") ?? undefined;

    // ?aksi=LOGIN           → single
    // ?aksi=LOGIN,UPDATE_BLOG → multiple
    const aksiRaw = url.searchParams.get("aksi");
    const aksiList = aksiRaw
      ? aksiRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const fromDate = parseDateParam(url.searchParams.get("from"));
    const toDate = parseDateParam(url.searchParams.get("to"));

    // ── Build typed where clause ──────────────────────────────
    const where: Prisma.LogAktivitasAdminWhereInput = {
      ...(adminId && { adminId }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(aksiList.length === 1 && { aksi: toActivityAction(aksiList[0]) }),
      ...(aksiList.length > 1 && {
        aksi: { in: aksiList.map(toActivityAction) },
      }),
      ...((fromDate || toDate) && {
        createdAt: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      }),
      // HEAD_ADMIN tidak boleh melihat log SUPER_ADMIN
      ...(user.role === "HEAD_ADMIN" && {
        admin: {
          role: { in: ["ADMIN", "HEAD_ADMIN"] },
        },
      }),
    };

    // ── Query (count + paginated items in parallel) ───────────
    const [total, items] = await Promise.all([
      prisma.logAktivitasAdmin.count({ where }),
      prisma.logAktivitasAdmin.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              nama: true,
              role: true,
              isActive: true,
            },
          },
          token: {
            select: {
              id: true,
              tokenRole: true,
              adminId: true,
              generatedBy: true,
              expiredAt: true,
              isPermanent: true,
              isSingleUse: true,
              isRevoked: true,
              revokedAt: true,
              claimedAt: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items,
    });
  } catch (err) {
    console.error("Error GET /api/headadmin/logs:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
