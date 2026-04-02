-- CreateEnum
CREATE TYPE "StatusApproval" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JenisRequest" AS ENUM ('GENERATE_TOKEN_HEADADMIN', 'REVOKE_TOKEN_HEADADMIN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AksiAdmin" ADD VALUE 'APPROVE_REQUEST';
ALTER TYPE "AksiAdmin" ADD VALUE 'REJECT_REQUEST';

-- AlterEnum
ALTER TYPE "RoleAdmin" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "isDeveloper" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RequestApproval" (
    "id" TEXT NOT NULL,
    "jenis" "JenisRequest" NOT NULL,
    "status" "StatusApproval" NOT NULL DEFAULT 'PENDING',
    "tokenId" TEXT,
    "diajukanOleh" TEXT NOT NULL,
    "diprosesByAdmin" TEXT,
    "catatanAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestApproval_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RequestApproval" ADD CONSTRAINT "RequestApproval_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "TokenAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestApproval" ADD CONSTRAINT "RequestApproval_diajukanOleh_fkey" FOREIGN KEY ("diajukanOleh") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestApproval" ADD CONSTRAINT "RequestApproval_diprosesByAdmin_fkey" FOREIGN KEY ("diprosesByAdmin") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
