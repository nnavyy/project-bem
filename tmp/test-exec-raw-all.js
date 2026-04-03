const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHttp } = require('@prisma/adapter-neon');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaNeonHttp(connectionString, {});
  const prisma = new PrismaClient({ adapter });

  try {
    const admin = await prisma.admin.findUnique({ where: { username: 'md' } });
    if(!admin) return console.log('not found');
    const id = admin.id;

    console.log("1. Token updateMany raw");
    await prisma.$executeRaw`UPDATE "TokenAdmin" SET "isRevoked" = true, "revokedAt" = NOW() WHERE "adminId" = ${id} AND "isRevoked" = false`;
    
    console.log("2. Laporan updateMany raw");
    await prisma.$executeRaw`UPDATE "Laporan" SET "ditindakOleh" = null WHERE "ditindakOleh" = ${id}`;
    
    console.log("3. TLL deleteMany raw");
    await prisma.$executeRaw`DELETE FROM "TindakLanjutLaporan" WHERE "adminId" = ${id}`;
    
    console.log("4. Blog updateMany raw");
    await prisma.$executeRaw`UPDATE "Blog" SET "penulisId" = null WHERE "penulisId" = ${id}`;
    
    console.log("5. Portofolio");
    const portofolios = await prisma.portofolio.findMany({ where: { adminId: id }, select: { id: true } });
    if (portofolios.length > 0) {
      const portofolioIds = portofolios.map(p => p.id);
      // Construct an IN clause safely by looping or Prisma's executeRaw limitation
      for (const pId of portofolioIds) {
        await prisma.$executeRaw`DELETE FROM "Galeri" WHERE "portofolioId" = ${pId}`;
        await prisma.$executeRaw`DELETE FROM "Portofolio" WHERE id = ${pId}`;
      }
    }

    console.log("6. LogAktivitasAdmin raw");
    await prisma.$executeRaw`DELETE FROM "LogAktivitasAdmin" WHERE "adminId" = ${id}`;
    
    console.log("7. token generatedBy raw");
    await prisma.$executeRaw`UPDATE "TokenAdmin" SET "generatedBy" = null WHERE "generatedBy" = ${id}`;
    
    console.log("8. token adminId null raw");
    await prisma.$executeRaw`UPDATE "TokenAdmin" SET "adminId" = null WHERE "adminId" = ${id}`;
    
    console.log("9. ReqApproval deleteMany raw");
    await prisma.$executeRaw`DELETE FROM "RequestApproval" WHERE "diajukanOleh" = ${id}`;
    
    console.log("10. ReqApproval updateMany raw");
    await prisma.$executeRaw`UPDATE "RequestApproval" SET "diprosesByAdmin" = null WHERE "diprosesByAdmin" = ${id}`;

    console.log("11. ExecuteRaw Delete Admin raw");
    await prisma.$executeRaw`DELETE FROM "Admin" WHERE id = ${id}`;
    
    console.log("DONE DELETE ADMIN!");

  } catch(e) {
    console.error("FAILED AT", e.message);
  }
}
main();
