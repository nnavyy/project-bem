import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";

// POST /api/superadmin/mahasiswa/bulk
// Expects JSON body: { mahasiswa: Array<{nim, nama, email?, password, jurusan?}> }
export async function POST(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);
  const user = await verifyToken(req);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const rows: Array<{ nim: string; nama: string; email?: string; password: string; jurusan?: string }> = body.mahasiswa ?? [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ message: "Data mahasiswa tidak boleh kosong." }, { status: 400 });
  }

  if (rows.length > 500) {
    return NextResponse.json({ message: "Maksimal 500 data per upload." }, { status: 400 });
  }

  const validJurusan = ["REKAYASA_PERANGKAT_LUNAK", "STATISTIK", "SAINS_AKTUARIA", "MANAJEMEN_RETAIL"];
  const results: { nim: string; status: "success" | "error"; message?: string }[] = [];
  let successCount = 0;

  for (const row of rows) {
    if (!row.nim?.trim() || !row.nama?.trim() || !row.password?.trim()) {
      results.push({ nim: row.nim ?? "?", status: "error", message: "NIM, nama, dan password wajib diisi." });
      continue;
    }
    if (row.jurusan && !validJurusan.includes(row.jurusan)) {
      results.push({ nim: row.nim, status: "error", message: `Jurusan tidak valid: ${row.jurusan}` });
      continue;
    }

    try {
      const existing = await prisma.mahasiswa.findUnique({ where: { nim: row.nim.trim() } });
      if (existing) {
        results.push({ nim: row.nim, status: "error", message: "NIM sudah terdaftar." });
        continue;
      }

      const hashedPw = await hashPassword(row.password.trim());
      await prisma.mahasiswa.create({
        data: {
          nim: row.nim.trim(),
          nama: row.nama.trim(),
          email: row.email?.trim() || null,
          password: hashedPw,
          jurusan:
            (row.jurusan as
              | "REKAYASA_PERANGKAT_LUNAK"
              | "STATISTIK"
              | "SAINS_AKTUARIA"
              | "MANAJEMEN_RETAIL"
              | null) || null,
        },
      });

      results.push({ nim: row.nim, status: "success" });
      successCount++;
    } catch {
      results.push({ nim: row.nim, status: "error", message: "Gagal menyimpan data." });
    }
  }

  await logAktivitas({
    adminId: user.id,
    aksi: "CREATE_ADMIN",
    entityType: "Mahasiswa",
    entityId: undefined,
    dataBefore: null,
    dataAfter: { total: rows.length, successCount, failCount: rows.length - successCount },
    ipAddress: ip,
    userAgent: ua,
    keterangan: `Bulk upload mahasiswa: ${successCount}/${rows.length} berhasil.`,
  });

  return NextResponse.json(
    {
      message: `${successCount} dari ${rows.length} mahasiswa berhasil ditambahkan.`,
      successCount,
      failCount: rows.length - successCount,
      results,
    },
    { status: successCount > 0 ? 201 : 400 },
  );
}
