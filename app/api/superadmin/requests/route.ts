import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * GET /api/superadmin/requests
 * List semua request approval — hanya SUPER_ADMIN
 */
export async function GET(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // PENDING | APPROVED | REJECTED | null (all)

  const requests = await prisma.requestApproval.findMany({
    where: status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      pengaju: {
        select: { id: true, username: true, nama: true, role: true },
      },
      pemroses: {
        select: { id: true, username: true, nama: true, role: true },
      },
      token: {
        select: {
          id: true,
          tokenRole: true,
          adminId: true,
          isRevoked: true,
          isPermanent: true,
          expiredAt: true,
          createdAt: true,
          admin: { select: { id: true, username: true, nama: true, role: true } },
        },
      },
    },
  });

  // Jangan expose plain token (catatanAdmin) ke client kecuali APPROVED
  const sanitized = requests.map((r) => ({
    ...r,
    // catatanAdmin hanya tampil saat APPROVED utk keperluan distribusi, null lainnya
    catatanAdmin: r.status === "APPROVED" ? r.catatanAdmin : null,
  }));

  return NextResponse.json(sanitized);
}
