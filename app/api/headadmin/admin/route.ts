import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";

// ─────────────────────────────────────────────────────────────
// GET /api/headadmin/admin
// List semua admin beserta status token aktif dan last login.
// Hanya HEAD_ADMIN.
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user || user.role !== "HEAD_ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.admin.findMany({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Token aktif milik admin ini
        tokenAdmin: {
          where: { isRevoked: false },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            tokenRole: true,
            isPermanent: true,
            isSingleUse: true,
            expiredAt: true,
            claimedAt: true,
            createdAt: true,
          },
        },
        // Last login (aksi LOGIN terakhir)
        logAktivitas: {
          where: { aksi: "LOGIN" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            createdAt: true,
            ipAddress: true,
          },
        },
      },
    });

    // Format response: flatten token & last login
    const formatted = admins.map((a) => ({
      id: a.id,
      username: a.username,
      nama: a.nama,
      role: a.role,
      isActive: a.isActive,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      activeToken: a.tokenAdmin[0] ?? null,
      lastLogin: a.logAktivitas[0]
        ? {
            at: a.logAktivitas[0].createdAt,
            ip: a.logAktivitas[0].ipAddress,
          }
        : null,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Error GET /api/headadmin/admin:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/headadmin/admin
// Buat akun ADMIN baru.
// Hanya HEAD_ADMIN.
//
// Body JSON:
//   username : string  (wajib, unik)
//   nama     : string  (wajib)
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  try {
    const user = await verifyToken(req);
    if (!user || user.role !== "HEAD_ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body: { username?: string; nama?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Body JSON tidak valid" },
        { status: 400 },
      );
    }

    const username = body.username?.trim();
    const nama = body.nama?.trim();

    if (!username || !nama) {
      return NextResponse.json(
        { message: "username dan nama wajib diisi" },
        { status: 400 },
      );
    }

    // username hanya boleh huruf, angka, underscore, dan strip
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        {
          message:
            "username hanya boleh berisi huruf, angka, underscore (_), dan strip (-)",
        },
        { status: 400 },
      );
    }

    // Cek username sudah dipakai
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { message: `Username "${username}" sudah digunakan` },
        { status: 409 },
      );
    }

    const created = await prisma.admin.create({
      data: {
        username,
        nama,
        role: "ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Audit log
    await logAktivitas({
      adminId: user.id,
      aksi: "CREATE_ADMIN",
      entityType: "Admin",
      entityId: created.id,
      dataBefore: null,
      dataAfter: {
        id: created.id,
        username: created.username,
        nama: created.nama,
        role: created.role,
        isActive: created.isActive,
        createdAt: created.createdAt.toISOString(),
      },
      ipAddress: ip,
      userAgent: ua,
      keterangan: `HEAD_ADMIN membuat akun admin baru: ${username}`,
    });

    return NextResponse.json(
      {
        message: `Akun admin "${username}" berhasil dibuat`,
        data: created,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error POST /api/headadmin/admin:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/headadmin/admin
// Update akun admin: nama dan/atau isActive.
// Tidak bisa mengubah role atau username.
// Hanya HEAD_ADMIN.
//
// Body JSON:
//   id       : string   (wajib — UUID admin yang mau diubah)
//   nama?    : string
//   isActive?: boolean
// ─────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  try {
    const user = await verifyToken(req);
    if (!user || user.role !== "HEAD_ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body: { id?: string; nama?: string; isActive?: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Body JSON tidak valid" },
        { status: 400 },
      );
    }

    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json(
        { message: "id admin wajib diisi" },
        { status: 400 },
      );
    }

    const target = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        isActive: true,
      },
    });

    if (!target) {
      return NextResponse.json(
        { message: "Admin tidak ditemukan" },
        { status: 404 },
      );
    }

    // HEAD_ADMIN tidak bisa edit sesama HEAD_ADMIN via endpoint ini
    if (target.role === "HEAD_ADMIN") {
      return NextResponse.json(
        {
          message:
            "Tidak bisa mengubah akun HEAD_ADMIN melalui endpoint ini. Gunakan bootstrap script.",
        },
        { status: 403 },
      );
    }

    // Validasi: minimal satu field harus dikirim
    const hasNama = typeof body.nama === "string" && body.nama.trim() !== "";
    const hasIsActive = typeof body.isActive === "boolean";

    if (!hasNama && !hasIsActive) {
      return NextResponse.json(
        { message: "Tidak ada field yang diubah (nama atau isActive)" },
        { status: 400 },
      );
    }

    // Build update payload
    const dataToUpdate: Record<string, unknown> = {};
    if (hasNama) dataToUpdate.nama = (body.nama as string).trim();
    if (hasIsActive) dataToUpdate.isActive = body.isActive;

    const updated = await prisma.admin.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Kalau di-nonaktifkan → revoke semua token aktifnya
    let revokedCount = 0;
    if (hasIsActive && body.isActive === false) {
      const result = await prisma.tokenAdmin.updateMany({
        where: { adminId: id, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
      revokedCount = result.count;
    }

    // Audit log
    await logAktivitas({
      adminId: user.id,
      aksi: "UPDATE_ADMIN",
      entityType: "Admin",
      entityId: id,
      dataBefore: {
        id: target.id,
        username: target.username,
        nama: target.nama,
        isActive: target.isActive,
      },
      dataAfter: {
        id: updated.id,
        username: updated.username,
        nama: updated.nama,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt.toISOString(),
      },
      ipAddress: ip,
      userAgent: ua,
      keterangan: [
        hasNama ? `nama diubah → "${updated.nama}"` : null,
        hasIsActive
          ? `isActive diubah → ${updated.isActive}${revokedCount > 0 ? ` (${revokedCount} token direvoke)` : ""}`
          : null,
      ]
        .filter(Boolean)
        .join("; "),
    });

    return NextResponse.json({
      message: "Admin berhasil diperbarui",
      data: updated,
      ...(revokedCount > 0 && {
        info: `${revokedCount} token aktif admin ini otomatis direvoke karena akun dinonaktifkan`,
      }),
    });
  } catch (err) {
    console.error("Error PATCH /api/headadmin/admin:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
