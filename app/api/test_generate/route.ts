import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const superAdmin = await prisma.admin.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!superAdmin) return NextResponse.json({ error: "No super admin" });

    const targetAdmin = await prisma.admin.findFirst({ where: { username: 'tes2' } });

    const token = await signToken({
      id: superAdmin.id,
      role: superAdmin.role,
    });

    const body = {
      tokenRole: 'HEAD_ADMIN',
      adminId: targetAdmin ? targetAdmin.id : undefined,
      isPermanent: true,
      isSingleUse: false,
    };

    const res = await fetch('http://localhost:3000/api/headadmin/generate-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${token}` // Mock the Auth cookie
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    return NextResponse.json({ status: res.status, body: text });

  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
