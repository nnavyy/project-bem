import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";
import { serializeDates } from "@/lib/utils";
import { StatusLaporan } from "@prisma/client";

/**
 * GET /api/laporan/[id]
 * - MAHASISWA : hanya boleh lihat laporan milik sendiri
 * - ADMIN / HEAD_ADMIN : boleh lihat semua
 *
 * Response includes:
 *   mahasiswa, adminTindak, tindakLanjut (chronological, with admin info)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const laporan = await prisma.laporan.findUnique({
      where: { id },
      include: {
        mahasiswa: {
          select: {
            id: true,
            nim: true,
            nama: true,
            email: true,
            jurusan: true,
          },
        },
        adminTindak: {
          select: { id: true, username: true, nama: true, role: true },
        },
        tindakLanjut: {
          orderBy: { createdAt: "asc" },
          include: {
            admin: {
              select: { id: true, username: true, nama: true, role: true },
            },
          },
        },
      },
    });

    if (!laporan) {
      return NextResponse.json(
        { message: "Laporan tidak ditemukan" },
        { status: 404 },
      );
    }

    // Mahasiswa hanya boleh lihat laporan miliknya sendiri
    if (user.role === "MAHASISWA" && laporan.mahasiswaId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(laporan);
  } catch (err) {
    console.error("Error GET /api/laporan/[id]:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/laporan/[id]
 * Hanya ADMIN / HEAD_ADMIN.
 *
 * Body JSON:
 *  - status        : StatusLaporan  (wajib)
 *  - ditindakOleh? : string         (opsional — default: id admin yang login)
 *
 * Menulis audit log lengkap (dataBefore / dataAfter) dengan Date yang
 * sudah di-serialize ke ISO string agar bisa disimpan ke kolom Json Prisma.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { ip, ua } = getRequestMeta(req);
    const { id } = await params;

    let body: { status?: StatusLaporan; ditindakOleh?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Body JSON tidak valid" },
        { status: 400 },
      );
    }

    if (!body?.status) {
      return NextResponse.json(
        { message: "Field 'status' wajib diisi" },
        { status: 400 },
      );
    }

    // Validasi enum value secara runtime (client bisa kirim sembarang string)
    const allowedStatuses: StatusLaporan[] = [
      "PENDING",
      "DIBACA",
      "DITINDAKLANJUTI",
      "SELESAI",
    ];
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          message: `Status tidak valid. Pilihan: ${allowedStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const existing = await prisma.laporan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Laporan tidak ditemukan" },
        { status: 404 },
      );
    }

    const updated = await prisma.laporan.update({
      where: { id },
      data: {
        status: body.status,
        ditindakOleh: body.ditindakOleh ?? user.id,
      },
    });

    // Serialize Date fields sebelum disimpan ke kolom Json Prisma
    await logAktivitas({
      adminId: user.id,
      aksi: "UPDATE_STATUS_LAPORAN",
      entityType: "Laporan",
      entityId: id,
      dataBefore: serializeDates({
        id: existing.id,
        status: existing.status,
        ditindakOleh: existing.ditindakOleh,
        updatedAt: existing.updatedAt,
      }),
      dataAfter: serializeDates({
        id: updated.id,
        status: updated.status,
        ditindakOleh: updated.ditindakOleh,
        updatedAt: updated.updatedAt,
      }),
      ipAddress: ip,
      userAgent: ua,
      keterangan: `Status laporan diubah dari ${existing.status} ke ${updated.status}`,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error PATCH /api/laporan/[id]:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
