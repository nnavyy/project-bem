import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const portofolio = await prisma.portofolio.findUnique({
      where: { id },
      include: { galeri: true },
    });

    if (!portofolio) {
      return NextResponse.json({ message: "Portofolio tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(portofolio);
  } catch (err) {
    console.error("Error GET /portofolio/[id]:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
