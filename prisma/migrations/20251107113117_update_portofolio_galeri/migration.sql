/*
  Warnings:

  - You are about to drop the column `gambar` on the `Portofolio` table. All the data in the column will be lost.
  - You are about to drop the column `judul` on the `Portofolio` table. All the data in the column will be lost.
  - Added the required column `namaDivisi` to the `Portofolio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Portofolio" DROP COLUMN "gambar",
DROP COLUMN "judul",
ADD COLUMN     "fotoUtama" TEXT,
ADD COLUMN     "namaDivisi" TEXT NOT NULL,
ALTER COLUMN "tanggal" DROP NOT NULL,
ALTER COLUMN "tanggal" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Galeri" (
    "id" TEXT NOT NULL,
    "portofolioId" TEXT NOT NULL,
    "namaAnggota" TEXT NOT NULL,
    "jabatan" TEXT,
    "foto" TEXT,

    CONSTRAINT "Galeri_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Galeri" ADD CONSTRAINT "Galeri_portofolioId_fkey" FOREIGN KEY ("portofolioId") REFERENCES "Portofolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
