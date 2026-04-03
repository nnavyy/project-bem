const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHttp } = require('@prisma/adapter-neon');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DB URL");
    return;
  }
  const adapter = new PrismaNeonHttp(connectionString, {});
  const prisma = new PrismaClient({ adapter });

  try {
    const admin = await prisma.admin.findUnique({ where: { username: 'md' } });
    if (!admin) {
        console.log("Admin md not found!");
        return;
    }
    console.log("Deleting admin", admin.id);

    const id = admin.id;

    await prisma.tokenAdmin.updateMany({ where: { adminId: id, isRevoked: false }, data: { isRevoked: true, revokedAt: new Date() } });
    await prisma.laporan.updateMany({ where: { ditindakOleh: id }, data: { ditindakOleh: null } });
    await prisma.tindakLanjutLaporan.deleteMany({ where: { adminId: id } });
    await prisma.blog.updateMany({ where: { penulisId: id }, data: { penulisId: null } });
    
    // 5.
    const portofolios = await prisma.portofolio.findMany({ where: { adminId: id }, select: { id: true } });
    if (portofolios.length > 0) {
      const portofolioIds = portofolios.map(p => p.id);
      await prisma.galeri.deleteMany({ where: { portofolioId: { in: portofolioIds } } });
      await prisma.portofolio.deleteMany({ where: { adminId: id } });
    }

    await prisma.logAktivitasAdmin.deleteMany({ where: { adminId: id } });
    await prisma.tokenAdmin.updateMany({ where: { generatedBy: id }, data: { generatedBy: null } });
    await prisma.tokenAdmin.updateMany({ where: { adminId: id }, data: { adminId: null } });
    await prisma.requestApproval.deleteMany({ where: { diajukanOleh: id } });
    await prisma.requestApproval.updateMany({ where: { diprosesByAdmin: id }, data: { diprosesByAdmin: null } });

    console.log("Executing $executeRaw");

    await prisma.$executeRaw`DELETE FROM "Admin" WHERE id = ${id}`;
    console.log("Delete admin successful via executeRaw");

  } catch(e) {
    console.error("FAILLLLL:", e);
  }
}
main();
