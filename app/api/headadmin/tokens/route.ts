import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user || user.role !== "HEAD_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tokens = await prisma.tokenAdmin.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      admin: { select: { id: true, username: true, nama: true, role: true } },
      headAdmin: { select: { id: true, username: true, nama: true, role: true } },
    },
  });

  return NextResponse.json(tokens);
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user || user.role !== "HEAD_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { tokenRole = "ADMIN", isPermanent = false, expiredAt } = (await req.json()) as {
    tokenRole?: "ADMIN" | "HEAD_ADMIN";
    isPermanent?: boolean;
    expiredAt?: string;
  };

  if (tokenRole !== "ADMIN" && tokenRole !== "HEAD_ADMIN") {
    return NextResponse.json({ message: "tokenRole tidak valid" }, { status: 400 });
  }

  const token = randomBytes(16).toString("hex");
  const created = await prisma.tokenAdmin.create({
    data: {
      token,
      tokenRole,
      isPermanent,
      expiredAt: expiredAt ? new Date(expiredAt) : null,
      generatedBy: user.id,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
