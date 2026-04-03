import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * GET /api/superadmin/requests
 * List semua request approval — hanya SUPER_ADMIN
 *
 * NOTE: Menggunakan sequential queries untuk menghindari implicit transaction
 * yang tidak didukung oleh PrismaNeonHttp adapter.
 */
export async function GET(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // PENDING | APPROVED | REJECTED | null (all)

  try {
    // Ambil requests tanpa nested include (hindari implicit transaction)
    const requests = await prisma.requestApproval.findMany({
      where: status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : undefined,
      orderBy: { createdAt: "desc" },
    });

    // Kumpulkan semua unique admin IDs dan token IDs
    const adminIds = new Set<string>();
    const tokenIds = new Set<string>();

    for (const r of requests) {
      adminIds.add(r.diajukanOleh);
      if (r.diprosesByAdmin) adminIds.add(r.diprosesByAdmin);
      if (r.tokenId) tokenIds.add(r.tokenId);
    }

    // Batch fetch admins
    const admins = adminIds.size > 0
      ? await prisma.admin.findMany({
          where: { id: { in: Array.from(adminIds) } },
          select: { id: true, username: true, nama: true, role: true },
        })
      : [];
    const adminMap = new Map(admins.map((a) => [a.id, a]));

    // Batch fetch tokens
    const tokens = tokenIds.size > 0
      ? await prisma.tokenAdmin.findMany({
          where: { id: { in: Array.from(tokenIds) } },
          select: {
            id: true,
            tokenRole: true,
            adminId: true,
            isRevoked: true,
            isPermanent: true,
            expiredAt: true,
            createdAt: true,
          },
        })
      : [];

    // Fetch token owners in batch
    const tokenAdminIds = new Set<string>();
    for (const t of tokens) {
      if (t.adminId) tokenAdminIds.add(t.adminId);
    }
    const tokenAdmins = tokenAdminIds.size > 0
      ? await prisma.admin.findMany({
          where: { id: { in: Array.from(tokenAdminIds) } },
          select: { id: true, username: true, nama: true, role: true },
        })
      : [];
    const tokenAdminMap = new Map(tokenAdmins.map((a) => [a.id, a]));

    const tokenMap = new Map(
      tokens.map((t) => [
        t.id,
        {
          ...t,
          admin: t.adminId ? tokenAdminMap.get(t.adminId) ?? null : null,
        },
      ]),
    );

    // Compose the response
    const sanitized = requests.map((r) => ({
      id: r.id,
      jenis: r.jenis,
      status: r.status,
      tokenId: r.tokenId,
      catatanAdmin: r.status === "APPROVED" ? r.catatanAdmin : null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      pengaju: adminMap.get(r.diajukanOleh) ?? null,
      pemroses: r.diprosesByAdmin ? adminMap.get(r.diprosesByAdmin) ?? null : null,
      token: r.tokenId ? tokenMap.get(r.tokenId) ?? null : null,
    }));

    return NextResponse.json(sanitized);
  } catch (err) {
    console.error("[Requests GET Error]", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
