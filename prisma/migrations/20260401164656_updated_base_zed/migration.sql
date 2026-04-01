/*
  Warnings:

  - You are about to drop the column `password` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `tindaklanjut` on the `Laporan` table. All the data in the column will be lost.
  - You are about to drop the column `waktuLogin` on the `LogAktivitasAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal` on the `Portofolio` table. All the data in the column will be lost.
  - You are about to drop the column `isUsed` on the `TokenAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `TokenAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `TokenAdmin` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Blog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tokenHash]` on the table `TokenAdmin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Blog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Galeri` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aksi` to the `LogAktivitasAdmin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenHash` to the `TokenAdmin` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusBlog" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AksiAdmin" AS ENUM ('LOGIN', 'LOGIN_GAGAL', 'LOGOUT', 'CREATE_BLOG', 'UPDATE_BLOG', 'DELETE_BLOG', 'CREATE_PORTOFOLIO', 'UPDATE_PORTOFOLIO', 'DELETE_PORTOFOLIO', 'CREATE_GALERI', 'UPDATE_GALERI', 'DELETE_GALERI', 'UPDATE_STATUS_LAPORAN', 'TAMBAH_TINDAKLANJUT', 'GENERATE_TOKEN', 'REVOKE_TOKEN');

-- DropForeignKey
ALTER TABLE "Blog" DROP CONSTRAINT "Blog_penulisId_fkey";

-- DropIndex
DROP INDEX "TokenAdmin_token_key";

-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "password",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" "StatusBlog" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "penulisId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Galeri" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "urutan" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Laporan" DROP COLUMN "tindaklanjut";

-- AlterTable
ALTER TABLE "LogAktivitasAdmin" DROP COLUMN "waktuLogin",
ADD COLUMN     "aksi" "AksiAdmin" NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dataAfter" JSONB,
ADD COLUMN     "dataBefore" JSONB,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "keterangan" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "Portofolio" DROP COLUMN "tanggal",
ADD COLUMN     "tanggalKegiatan" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TokenAdmin" DROP COLUMN "isUsed",
DROP COLUMN "token",
DROP COLUMN "usedAt",
ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "isRevoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSingleUse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "TindakLanjutLaporan" (
    "id" TEXT NOT NULL,
    "laporanId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "catatan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TindakLanjutLaporan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TokenAdmin_tokenHash_key" ON "TokenAdmin"("tokenHash");

-- AddForeignKey
ALTER TABLE "TindakLanjutLaporan" ADD CONSTRAINT "TindakLanjutLaporan_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "Laporan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TindakLanjutLaporan" ADD CONSTRAINT "TindakLanjutLaporan_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_penulisId_fkey" FOREIGN KEY ("penulisId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
