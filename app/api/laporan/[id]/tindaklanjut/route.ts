import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";

/**
 * POST /api/laporan/[id]/tindaklanjut
 * Admin / Head Admin menambahkan catatan tindak lanjut untuk sebuah laporan.
 *
 * Body JSON:
 *  - catatan: string (wajib)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await verifyToken(req);
  if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: laporanId } = await params;

  let payload: { catatan?: string };
  try {
    payload = (await req.json()) as { catatan?: string };
  } catch {
    return NextResponse.json(
      { message: "Body JSON tidak valid" },
      { status: 400 },
    );
  }

  const catatan = (payload.catatan ?? "").trim();
  if (!catatan) {
    return NextResponse.json(
      { message: "catatan wajib diisi" },
      { status: 400 },
    );
  }

  const { ip, ua } = getRequestMeta(req);

  // Ambil laporan untuk:
  // 1) validasi existence
  // 2) simpan snapshot "before" (daftar tindak lanjut sebelumnya)
  const laporanBefore = await prisma.laporan.findUnique({
    where: { id: laporanId },
    include: {
      tindakLanjut: {
        orderBy: { createdAt: "asc" },
        select: { id: true, adminId: true, catatan: true, createdAt: true },
      },
    },
  });

  if (!laporanBefore) {
    return NextResponse.json(
      { message: "Laporan tidak ditemukan" },
      { status: 404 },
    );
  }

  // Buat tindak lanjut baru
  // NOTE: PrismaNeonHttp adapter tidak mendukung implicit transaction.
  // create() dengan include() memicu implicit transaction → error.
  // Solusi: pisahkan create dan relasi fetch menjadi dua query sequential.
  const created = await prisma.tindakLanjutLaporan.create({
    data: {
      laporanId,
      adminId: user.id,
      catatan,
    },
  });

  // Fetch info admin secara terpisah
  const adminInfo = await prisma.admin.findUnique({
    where: { id: user.id },
    select: { id: true, username: true, nama: true, role: true },
  });

  // Ambil snapshot "after" (daftar tindak lanjut sesudah dibuat)
  const laporanAfter = await prisma.laporan.findUnique({
    where: { id: laporanId },
    include: {
      tindakLanjut: {
        orderBy: { createdAt: "asc" },
        select: { id: true, adminId: true, catatan: true, createdAt: true },
      },
    },
  });

  // Logging audit (before/after)
  await logAktivitas({
    adminId: user.id,
    aksi: "TAMBAH_TINDAKLANJUT",
    entityType: "Laporan",
    entityId: laporanId,
    dataBefore: {
      laporanId,
      tindakLanjutCount: laporanBefore.tindakLanjut.length,
      tindakLanjut: laporanBefore.tindakLanjut.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
      })),
    },
    dataAfter: {
      laporanId,
      tindakLanjutCount:
        laporanAfter?.tindakLanjut.length ??
        laporanBefore.tindakLanjut.length + 1,
      tindakLanjut:
        laporanAfter?.tindakLanjut.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        })) ?? null,
      createdTindakLanjutId: created.id,
    },
    ipAddress: ip,
    userAgent: ua,
    keterangan: "Admin menambahkan catatan tindak lanjut",
  });

  return NextResponse.json(
    {
      message: "Tindak lanjut berhasil ditambahkan",
      data: { ...created, admin: adminInfo },
    },
    { status: 201 },
  );
}

/**
 * GET /api/laporan/[id]/tindaklanjut
 * Ambil semua tindak lanjut untuk laporan tertentu.
 *
 * - Mahasiswa: hanya boleh lihat tindak lanjut laporan miliknya sendiri.
 * - Admin / Head Admin: boleh lihat semua.
 *
 * Setiap item tindak lanjut menyertakan info admin yang menambahkannya.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await verifyToken(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: laporanId } = await params;

  // Validasi laporan exist + ambil mahasiswaId untuk access control
  const laporan = await prisma.laporan.findUnique({
    where: { id: laporanId },
    select: { id: true, mahasiswaId: true },
  });

  if (!laporan) {
    return NextResponse.json(
      { message: "Laporan tidak ditemukan" },
      { status: 404 },
    );
  }

  // Mahasiswa hanya boleh lihat tindak lanjut laporan miliknya
  if (user.role === "MAHASISWA" && laporan.mahasiswaId !== user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const tindakLanjut = await prisma.tindakLanjutLaporan.findMany({
    where: { laporanId },
    orderBy: { createdAt: "asc" },
    include: {
      admin: {
        select: { id: true, username: true, nama: true, role: true },
      },
    },
  });

  return NextResponse.json(tindakLanjut);
}
