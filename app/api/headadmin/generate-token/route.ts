import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== "HEAD_ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { tokenRole = "ADMIN", expiredAt, isPermanent = false } = (await req.json()) as {
      tokenRole?: "ADMIN" | "HEAD_ADMIN";
      expiredAt?: string;
      isPermanent?: boolean;
    };

    if (tokenRole !== "ADMIN" && tokenRole !== "HEAD_ADMIN") {
      return NextResponse.json({ error: "Role token tidak valid" }, { status: 400 });
    }

    const headAdmin = await prisma.admin.findUnique({ where: { id: user.id } });
    if (!headAdmin || headAdmin.role !== "HEAD_ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const token = randomBytes(16).toString("hex");

    const newToken = await prisma.tokenAdmin.create({
      data: {
        token,
        tokenRole,
        isPermanent,
        expiredAt: expiredAt ? new Date(expiredAt) : null,
        generatedBy: headAdmin.id,
      },
    });

    return NextResponse.json({
      message: "Token baru dibuat",
      data: newToken,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
