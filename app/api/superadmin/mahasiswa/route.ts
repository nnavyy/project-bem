import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";

// GET /api/superadmin/mahasiswa
export async function GET(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const jurusan = searchParams.get("jurusan") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" } },
      { nim: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (jurusan) where.jurusan = jurusan;

  const mahasiswa = await prisma.mahasiswa.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nim: true,
      nama: true,
      email: true,
      jurusan: true,
      createdAt: true,
    },
  });

  return NextResponse.json(mahasiswa);
}

// POST /api/superadmin/mahasiswa
export async function POST(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);
  const user = await verifyToken(req);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { nim, nama, email, password, jurusan } = body;

  if (!nim?.trim() || !nama?.trim() || !password?.trim()) {
    return NextResponse.json(
      { message: "NIM, nama, dan password wajib diisi." },
      { status: 400 },
    );
  }

  const existing = await prisma.mahasiswa.findUnique({
    where: { nim: nim.trim() },
  });
  if (existing) {
    return NextResponse.json(
      { message: `NIM "${nim.trim()}" sudah terdaftar.` },
      { status: 409 },
    );
  }

  const validJurusan = [
    "REKAYASA_PERANGKAT_LUNAK",
    "STATISTIK",
    "SAINS_AKTUARIA",
    "MANAJEMEN_RETAIL",
  ];
  if (jurusan && !validJurusan.includes(jurusan)) {
    return NextResponse.json(
      { message: "Jurusan tidak valid." },
      { status: 400 },
    );
  }

  const hashedPw = await hashPassword(password.trim());

  const created = await prisma.mahasiswa.create({
    data: {
      nim: nim.trim(),
      nama: nama.trim(),
      email: email?.trim() || null,
      password: hashedPw,
      jurusan: jurusan || null,
    },
    select: {
      id: true,
      nim: true,
      nama: true,
      email: true,
      jurusan: true,
      createdAt: true,
    },
  });

  await logAktivitas({
    adminId: user.id,
    aksi: "CREATE_ADMIN",
    entityType: "Mahasiswa",
    entityId: created.id,
    dataBefore: null,
    dataAfter: {
      nim: created.nim,
      nama: created.nama,
      email: created.email,
      jurusan: created.jurusan,
    },
    ipAddress: ip,
    userAgent: ua,
    keterangan: `Mahasiswa baru ditambahkan: ${created.nama} (${created.nim})`,
  });

  return NextResponse.json(
    { message: "Mahasiswa berhasil ditambahkan.", data: created },
    { status: 201 },
  );
}
