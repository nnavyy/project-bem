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

    console.log("1. Token updateMany");
    await prisma.tokenAdmin.updateMany({ where: { adminId: id, isRevoked: false }, data: { isRevoked: true, revokedAt: new Date() } });
    console.log("2. Laporan updateMany");
    await prisma.laporan.updateMany({ where: { ditindakOleh: id }, data: { ditindakOleh: null } });
    console.log("3. TLL deleteMany");
    await prisma.tindakLanjutLaporan.deleteMany({ where: { adminId: id } });
    console.log("4. Blog updateMany");
    await prisma.blog.updateMany({ where: { penulisId: id }, data: { penulisId: null } });
    
    console.log("5. Portofolio delete");
    const portofolios = await prisma.portofolio.findMany({ where: { adminId: id }, select: { id: true } });
    if (portofolios.length > 0) {
      const portofolioIds = portofolios.map(p => p.id);
      await prisma.galeri.deleteMany({ where: { portofolioId: { in: portofolioIds } } });
      await prisma.portofolio.deleteMany({ where: { adminId: id } });
    }

    console.log("6. LogAktivitas deleteMany");
    await prisma.logAktivitasAdmin.deleteMany({ where: { adminId: id } });
    console.log("7. token generatedBy");
    await prisma.tokenAdmin.updateMany({ where: { generatedBy: id }, data: { generatedBy: null } });
    console.log("8. token adminId null");
    await prisma.tokenAdmin.updateMany({ where: { adminId: id }, data: { adminId: null } });
    
    console.log("9. ReqApproval deleteMany");
    await prisma.requestApproval.deleteMany({ where: { diajukanOleh: id } });
    console.log("10. ReqApproval updateMany");
    await prisma.requestApproval.updateMany({ where: { diprosesByAdmin: id }, data: { diprosesByAdmin: null } });

    console.log("11. ExecuteRaw Delete Admin");
    await prisma.$executeRaw`DELETE FROM "Admin" WHERE id = ${id}`;
    
    console.log("DONE");

  } catch(e) {
    console.error("FAILED AT", e.message);
  }
}
main();
