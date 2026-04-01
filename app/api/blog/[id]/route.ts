import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { getRequestMeta, logAktivitas } from "@/lib/logger";
import { slugify, ensureUniqueSlug, serializeDates } from "@/lib/utils";

function isAdminRole(role: string | undefined) {
  return role === "ADMIN" || role === "HEAD_ADMIN";
}

// GET detail blog berdasarkan ID (public)
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
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
      return NextResponse.json(
        { message: "Blog tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json(blog);
  } catch (err) {
    console.error("Error GET /api/blog/[id]:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PUT update blog by URL param ID (ADMIN / HEAD_ADMIN)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyToken(req);
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { ip, ua } = getRequestMeta(req);
    const { id } = await params;

    const body = (await req.json()) as {
      judul?: string;
      isi?: string;
      gambar?: string | null;
      status?: "DRAFT" | "PUBLISHED";
      slug?: string;
    };

    const existing = await prisma.blog.findUnique({
      where: { id },
      include: { penulis: { select: { id: true, nama: true, role: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Blog tidak ditemukan" },
        { status: 404 },
      );
    }

    // Build update payload — only include fields that were actually sent
    const dataToUpdate: Record<string, unknown> = {};

    if (typeof body.judul === "string") dataToUpdate.judul = body.judul;
    if (typeof body.isi === "string") dataToUpdate.isi = body.isi;
    if (body.gambar === null || typeof body.gambar === "string")
      dataToUpdate.gambar = body.gambar;
    if (body.status === "DRAFT" || body.status === "PUBLISHED")
      dataToUpdate.status = body.status;

    // Slug: explicit slug overrides, otherwise re-generate when judul changes
    const baseSlug =
      typeof body.slug === "string" && body.slug.trim()
        ? slugify(body.slug)
        : typeof body.judul === "string" && body.judul.trim()
          ? slugify(body.judul)
          : null;

    if (baseSlug) {
      dataToUpdate.slug = await ensureUniqueSlug(baseSlug, id);
    }

    const updated = await prisma.blog.update({
      where: { id },
      data: dataToUpdate,
      include: {
        penulis: { select: { id: true, nama: true, role: true } },
      },
    });

    await logAktivitas({
      adminId: user.id,
      aksi: "UPDATE_BLOG",
      entityType: "Blog",
      entityId: id,
      dataBefore: serializeDates(
        existing as unknown as Record<string, unknown>,
      ) as unknown as Prisma.InputJsonValue,
      dataAfter: serializeDates(
        updated as unknown as Record<string, unknown>,
      ) as unknown as Prisma.InputJsonValue,
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error PUT /api/blog/[id]:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// DELETE blog by URL param ID (ADMIN / HEAD_ADMIN)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyToken(req);
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { ip, ua } = getRequestMeta(req);
    const { id } = await params;

    const existing = await prisma.blog.findUnique({
      where: { id },
      include: { penulis: { select: { id: true, nama: true, role: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Blog tidak ditemukan" },
        { status: 404 },
      );
    }

    await prisma.blog.delete({ where: { id } });

    await logAktivitas({
      adminId: user.id,
      aksi: "DELETE_BLOG",
      entityType: "Blog",
      entityId: id,
      dataBefore: serializeDates(
        existing as unknown as Record<string, unknown>,
      ) as unknown as Prisma.InputJsonValue,
      dataAfter: null,
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json({ message: "Blog berhasil dihapus" });
  } catch (err) {
    console.error("Error DELETE /api/blog/[id]:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
