CREATE TYPE "JenisKeluhan" AS ENUM ('RUANGAN', 'DOSEN', 'RUANG_LINGKUP');

ALTER TABLE "Laporan"
ADD COLUMN "jenisKeluhan" "JenisKeluhan" NOT NULL DEFAULT 'RUANGAN',
ADD COLUMN "tanggalKejadian" TIMESTAMP(3),
ADD COLUMN "lokasi" TEXT,
ADD COLUMN "lampiranUrl" TEXT;
