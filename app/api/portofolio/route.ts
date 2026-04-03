import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getRequestMeta, logAktivitas } from "@/lib/logger";
import { Prisma } from "@prisma/client";

/**
 * GET semua portofolio (public)
 * - Include galeri
 */
export async function GET() {
  try {
    const data = await prisma.portofolio.findMany({
      include: {
        galeri: {
          orderBy: { urutan: "asc" },
        },
        admin: {
          select: { id: true, username: true, nama: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error GET /portofolio:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST buat portofolio baru (ADMIN / HEAD_ADMIN)
 * Body:
 *  - namaDivisi: string
 *  - deskripsi: string
 *  - fotoUtama?: string
 *  - tanggalKegiatan?: string (ISO date)
 *  - galeri?: Array<{ namaAnggota: string; jabatan?: string; foto?: string; urutan?: number }>
 */
export async function POST(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      namaDivisi?: string;
      deskripsi?: string;
      fotoUtama?: string | null;
      tanggalKegiatan?: string | null;
      galeri?: Array<{
        namaAnggota: string;
        jabatan?: string | null;
        foto?: string | null;
        urutan?: number | null;
      }>;
    };

    const namaDivisi = body.namaDivisi?.trim();
    const deskripsi = body.deskripsi?.trim();

    if (!namaDivisi || !deskripsi) {
      return NextResponse.json(
        { message: "namaDivisi dan deskripsi wajib diisi" },
        { status: 400 },
      );
    }

    const tanggalKegiatan = body.tanggalKegiatan
      ? new Date(body.tanggalKegiatan)
      : undefined;

    const created = await prisma.portofolio.create({
      data: {
        namaDivisi,
        deskripsi,
        fotoUtama: body.fotoUtama ?? undefined,
        tanggalKegiatan: tanggalKegiatan ?? undefined,
        adminId: user.id,
      },
    });

    if (body.galeri && body.galeri.length > 0) {
      for (const g of body.galeri) {
        await prisma.galeri.create({
          data: {
            portofolioId: created.id,
            namaAnggota: g.namaAnggota,
            jabatan: g.jabatan ?? undefined,
            foto: g.foto ?? undefined,
            urutan: g.urutan ?? 0,
          }
        });
      }
    }

    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { id: true, username: true, nama: true, role: true }
    });

    const mockGaleri = (body.galeri && body.galeri.length > 0)
      ? body.galeri.map(g => ({
          id: "temp-" + Math.random(),
          portofolioId: created.id,
          namaAnggota: g.namaAnggota,
          jabatan: g.jabatan ?? null,
          foto: g.foto ?? null,
          urutan: g.urutan ?? 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      : [];

    const createdWithGaleri = {
      ...created,
      admin,
      galeri: mockGaleri
    };

    await logAktivitas({
      adminId: user.id,
      aksi: "CREATE_PORTOFOLIO",
      entityType: "Portofolio",
      entityId: created.id,
      dataBefore: null,
      dataAfter: createdWithGaleri as unknown as Prisma.InputJsonValue,
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json(createdWithGaleri, { status: 201 });
  } catch (err) {
    console.error("Error POST /portofolio:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PUT update portofolio (ADMIN / HEAD_ADMIN)
 * Body:
 *  - id: string
 *  - namaDivisi?: string
 *  - deskripsi?: string
 *  - fotoUtama?: string | null
 *  - tanggalKegiatan?: string | null
 */
export async function PUT(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      id?: string;
      namaDivisi?: string;
      deskripsi?: string;
      fotoUtama?: string | null;
      tanggalKegiatan?: string | null;
      galeri?: Array<{
        namaAnggota: string;
        jabatan?: string | null;
        foto?: string | null;
        urutan?: number | null;
      }>;
    };

    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json(
        { message: "ID portofolio diperlukan" },
        { status: 400 },
      );
    }

    const before = await prisma.portofolio.findUnique({
      where: { id },
      include: { galeri: { orderBy: { urutan: "asc" } } },
    });

    if (!before) {
      return NextResponse.json(
        { message: "Portofolio tidak ditemukan" },
        { status: 404 },
      );
    }

    const updated = await prisma.portofolio.update({
      where: { id },
      data: {
        namaDivisi: body.namaDivisi?.trim() ?? undefined,
        deskripsi: body.deskripsi?.trim() ?? undefined,
        fotoUtama:
          body.fotoUtama === null ? null : (body.fotoUtama ?? undefined),
        tanggalKegiatan:
          body.tanggalKegiatan === null
            ? null
            : body.tanggalKegiatan
              ? new Date(body.tanggalKegiatan)
              : undefined,
      },
    });

    if (body.galeri !== undefined) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "Galeri" WHERE "portofolioId" = $1`,
        id
      );

      if (body.galeri.length > 0) {
        for (const g of body.galeri) {
          await prisma.galeri.create({
            data: {
              portofolioId: id,
              namaAnggota: g.namaAnggota,
              jabatan: g.jabatan ?? undefined,
              foto: g.foto ?? undefined,
              urutan: g.urutan ?? 0,
            }
          });
        }
      }
    }

    const updatedWithGaleri = {
      ...updated,
      galeri: await prisma.galeri.findMany({
        where: { portofolioId: id },
        orderBy: { urutan: "asc" }
      })
    };

    await logAktivitas({
      adminId: user.id,
      aksi: "UPDATE_PORTOFOLIO",
      entityType: "Portofolio",
      entityId: id,
      dataBefore: before as unknown as Prisma.InputJsonValue,
      dataAfter: updatedWithGaleri as unknown as Prisma.InputJsonValue,
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json(updatedWithGaleri);
  } catch (err) {
    console.error("Error PUT /portofolio:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE portofolio (ADMIN / HEAD_ADMIN)
 * Body:
 *  - id: string
 *
 * Note: galeri akan ikut terhapus via onDelete: Cascade pada Galeri.portofolio
 */
export async function DELETE(req: NextRequest) {
  const { ip, ua } = getRequestMeta(req);

  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "HEAD_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { id?: string };
    const id = body.id?.trim();

    if (!id) {
      return NextResponse.json(
        { message: "ID portofolio diperlukan" },
        { status: 400 },
      );
    }

    const before = await prisma.portofolio.findUnique({
      where: { id },
      include: { galeri: { orderBy: { urutan: "asc" } } },
    });

    if (!before) {
      return NextResponse.json(
        { message: "Portofolio tidak ditemukan" },
        { status: 404 },
      );
    }

    await prisma.portofolio.delete({ where: { id } });

    await logAktivitas({
      adminId: user.id,
      aksi: "DELETE_PORTOFOLIO",
      entityType: "Portofolio",
      entityId: id,
      dataBefore: before as unknown as Prisma.InputJsonValue,
      dataAfter: null,
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json({ message: "Portofolio dihapus" });
  } catch (err) {
    console.error("Error DELETE /portofolio:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
