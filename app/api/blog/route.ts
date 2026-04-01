import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { logAktivitas, getRequestMeta } from "@/lib/logger";
import { slugify, ensureUniqueSlug, serializeDates } from "@/lib/utils";
import { StatusBlog } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// GET /api/blog
// Public: hanya PUBLISHED
// Admin (?includeDraft=1): semua status termasuk DRAFT
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    const url = new URL(req.url);
    const includeDraft = url.searchParams.get("includeDraft") === "1";

    const canSeeDraft =
      user &&
      (user.role === "ADMIN" || user.role === "HEAD_ADMIN") &&
      includeDraft;

    const blogs = await prisma.blog.findMany({
      where: canSeeDraft ? {} : { status: "PUBLISHED" },
      include: {
        penulis: {
          select: { id: true, nama: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = blogs.map((b) => ({
      id: b.id,
      judul: b.judul,
      slug: b.slug,
      isi: b.isi,
      gambar: b.gambar,
      status: b.status,
      author: b.penulis?.nama ?? "BEM ITESA",
      role: b.penulis?.role ?? "ADMIN",
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Error GET /api/blog:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/blog
// Buat blog baru. Default status: DRAFT.
// Body: { judul, isi, gambar?, status?, slug? }
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      judul?: string;
      isi?: string;
      gambar?: string | null;
      status?: StatusBlog;
      slug?: string;
    };

    const judul = (body.judul ?? "").trim();
    const isi = (body.isi ?? "").trim();

    if (!judul || !isi) {
      return NextResponse.json(
        { message: "Judul dan isi wajib diisi" },
        { status: 400 },
      );
    }

    const status: StatusBlog = body.status ?? "DRAFT";
    const baseSlug = slugify(body.slug?.trim() || judul);
    const slug = await ensureUniqueSlug(baseSlug);

    const created = await prisma.blog.create({
      data: {
        judul,
        isi,
        gambar: body.gambar ?? null,
        status,
        slug,
        penulisId: user.id,
      },
      include: {
        penulis: { select: { id: true, nama: true, role: true } },
      },
    });

    await logAktivitas({
      adminId: user.id,
      aksi: "CREATE_BLOG",
      entityType: "Blog",
      entityId: created.id,
      dataBefore: null,
      dataAfter: serializeDates({
        id: created.id,
        judul: created.judul,
        slug: created.slug,
        status: created.status,
        gambar: created.gambar,
        createdAt: created.createdAt,
      }),
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Error POST /api/blog:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/blog
// Update blog. Hanya field yang dikirim yang akan diubah.
// Body: { id, judul?, isi?, gambar?, status?, slug? }
// ─────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      id?: string;
      judul?: string;
      isi?: string;
      gambar?: string | null;
      status?: StatusBlog;
      slug?: string;
    };

    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json(
        { message: "ID blog diperlukan" },
        { status: 400 },
      );
    }

    const before = await prisma.blog.findUnique({
      where: { id },
      select: {
        id: true,
        judul: true,
        slug: true,
        isi: true,
        gambar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!before) {
      return NextResponse.json(
        { message: "Blog tidak ditemukan" },
        { status: 404 },
      );
    }

    // Hanya update field yang dikirim (partial update)
    const dataToUpdate: Record<string, unknown> = {};

    if (typeof body.judul === "string") dataToUpdate.judul = body.judul.trim();
    if (typeof body.isi === "string") dataToUpdate.isi = body.isi;
    if (body.gambar !== undefined) dataToUpdate.gambar = body.gambar;
    if (body.status) dataToUpdate.status = body.status;

    // Slug: regenerasi jika ada custom slug atau judul berubah
    const incomingSlug = typeof body.slug === "string" ? body.slug.trim() : "";
    const judulChanged =
      typeof body.judul === "string" &&
      body.judul.trim() !== "" &&
      body.judul.trim() !== before.judul;

    if (incomingSlug || judulChanged) {
      const baseSlug = slugify(
        incomingSlug || (dataToUpdate.judul as string) || before.judul,
      );
      dataToUpdate.slug = await ensureUniqueSlug(baseSlug, id);
    }

    const updated = await prisma.blog.update({
      where: { id },
      data: dataToUpdate,
      include: { penulis: { select: { id: true, nama: true, role: true } } },
    });

    await logAktivitas({
      adminId: user.id,
      aksi: "UPDATE_BLOG",
      entityType: "Blog",
      entityId: id,
      dataBefore: serializeDates(before),
      dataAfter: serializeDates({
        id: updated.id,
        judul: updated.judul,
        slug: updated.slug,
        status: updated.status,
        gambar: updated.gambar,
        updatedAt: updated.updatedAt,
      }),
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error PUT /api/blog:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/blog
// Hapus blog. Body: { id }
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { id?: string };
    const id = body.id?.trim();

    if (!id) {
      return NextResponse.json(
        { message: "ID blog diperlukan" },
        { status: 400 },
      );
    }

    const before = await prisma.blog.findUnique({
      where: { id },
      select: {
        id: true,
        judul: true,
        slug: true,
        status: true,
        gambar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!before) {
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
      dataBefore: serializeDates(before),
      dataAfter: null,
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json({ message: "Blog berhasil dihapus" });
  } catch (err) {
    console.error("Error DELETE /api/blog:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
