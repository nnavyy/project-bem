const { PrismaClient } = require("@prisma/client");
const { randomBytes, createHash } = require("crypto");
const prisma = new PrismaClient();

function generateAdminToken(role) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const length = role === "ADMIN" ? 8 : 16;
  const bytes = randomBytes(length);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function run() {
  try {
    // Cari SUPER_ADMIN (sama seperti di app)
    const superAdmin = await prisma.admin.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (!superAdmin) throw new Error("Super admin not found");

    // Cari HEAD_ADMIN atau tes2
    const targetAdmin = await prisma.admin.findFirst({ where: { username: "tes2" } });
    
    const adminId = targetAdmin ? targetAdmin.id : null;
    const tokenRole = "HEAD_ADMIN";
    const isPermanent = true;
    const expiredAt = null;
    const isSingleUse = false;

    console.log("Generating with data:", { tokenRole, adminId, requesterId: superAdmin.id });

    const plainToken = generateAdminToken(tokenRole);
    const tokenHash = hashToken(plainToken);

    if (adminId) {
      const now = new Date();
      const activeTokens = await prisma.tokenAdmin.findMany({
        where: { adminId, tokenRole, isRevoked: false, OR: [{ isPermanent: true }, { expiredAt: { gt: now } }] },
        select: { id: true },
      });
      console.log("Active tokens:", activeTokens);
      if (activeTokens.length > 0) {
        await prisma.tokenAdmin.updateMany({
          where: { id: { in: activeTokens.map((t) => t.id) } },
          data: { isRevoked: true, revokedAt: now },
        });
      }
    }

    const created = await prisma.tokenAdmin.create({
      data: {
        tokenHash,
        tokenRole,
        adminId: adminId ?? undefined,
        generatedBy: superAdmin.id,
        isPermanent,
        expiredAt: isPermanent ? null : expiredAt,
        isSingleUse,
      },
      include: {
        admin: { select: { id: true, username: true, nama: true, role: true } },
        headAdmin: { select: { id: true, username: true, nama: true, role: true } },
      },
    });

    console.log("Created:", created);

  } catch (error) {
    console.error("PRISMA ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
