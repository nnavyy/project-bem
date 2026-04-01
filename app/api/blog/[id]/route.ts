import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET detail blog berdasarkan ID
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        penulis: { select: { id: true, nama: true, role: true } },
      },
    });

    if (!blog) {
      return NextResponse.json({ message: "Blog tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (err) {
    console.error("Error GET /blog/[id]:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
