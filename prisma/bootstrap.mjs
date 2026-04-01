/**
 * Bootstrap script — buat HEAD_ADMIN + token pertama kali.
 *
 * Jalankan dengan:
 *   node prisma/bootstrap.mjs <username> [nama]
 *
 * Contoh:
 *   node prisma/bootstrap.mjs nandaha "Nanda Head Admin"
 *
 * Apa yang dilakukan script ini:
 *  1. Cari admin berdasarkan username (atau buat baru jika belum ada)
 *  2. Pastikan role-nya HEAD_ADMIN + isActive = true
 *  3. Hapus token HEAD_ADMIN milik admin ini + semua orphan token
 *     (adminId = null ATAU adminId tidak cocok dengan Admin manapun di DB)
 *  4. Generate token acak 16 karakter alphanumeric
 *  5. Simpan SHA-256(token) ke kolom tokenHash di DB
 *  6. Print plain token sekali ke console — catat baik-baik!
 *
 * ⚠️  Script ini AMAN dijalankan berkali-kali dan untuk banyak HEAD_ADMIN.
 *     Setiap run hanya menyentuh token milik username yang diberikan.
 */

import { createHash, randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: [] });

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

function generateToken(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

function hashToken(plain) {
  return createHash("sha256").update(plain).digest("hex");
}

function line(char = "─", len = 52) {
  return char.repeat(len);
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  const username = process.argv[2];
  const nama = process.argv[3] ?? "Head Admin";

  if (!username) {
    console.error("\n❌  Usage: node prisma/bootstrap.mjs <username> [nama]");
    console.error(
      '   Contoh : node prisma/bootstrap.mjs nandaha "Nanda Head Admin"\n',
    );
    process.exit(1);
  }

  console.log("\n" + line("═"));
  console.log("  Bootstrap HEAD_ADMIN — BEM ITESA");
  console.log(line("═"));

  // ── 1. Temukan atau buat admin ──────────────────────────────
  let admin = await prisma.admin.findUnique({ where: { username } });

  if (admin) {
    console.log(`\nℹ️  Admin "${username}" sudah ada.`);
    console.log(`   ID saat ini : ${admin.id}`);
    console.log(`   Role        : ${admin.role}`);

    if (admin.role !== "HEAD_ADMIN" || !admin.isActive) {
      admin = await prisma.admin.update({
        where: { id: admin.id },
        data: { role: "HEAD_ADMIN", isActive: true },
      });
      console.log(`✅  Role di-upgrade → HEAD_ADMIN, isActive → true`);
    } else {
      console.log(`   (tidak ada perubahan pada data admin)`);
    }
  } else {
    admin = await prisma.admin.create({
      data: {
        username,
        nama,
        role: "HEAD_ADMIN",
        isActive: true,
      },
    });
    console.log(`\n✅  HEAD_ADMIN baru dibuat.`);
    console.log(`   ID       : ${admin.id}`);
    console.log(`   Username : ${admin.username}`);
    console.log(`   Nama     : ${admin.nama}`);
  }

  // ── 2. Hapus token HEAD_ADMIN milik admin ini ───────────────
  //    Hanya token milik admin.id ini yang dihapus,
  //    bukan token HEAD_ADMIN lain yang mungkin sudah ada.
  const deletedOwned = await prisma.tokenAdmin.deleteMany({
    where: {
      tokenRole: "HEAD_ADMIN",
      adminId: admin.id,
    },
  });

  if (deletedOwned.count > 0) {
    console.log(`\n🗑️   ${deletedOwned.count} token lama admin ini dihapus.`);
  }

  // ── 3. Hapus orphan token HEAD_ADMIN ───────────────────────
  //    "Orphan" = adminId-nya null ATAU adminId tidak cocok
  //    dengan Admin manapun di DB (mis. dibuat manual di Prisma
  //    Studio dengan nilai fake seperti "001").
  //
  //    Prisma: { admin: null } artinya relasi admin tidak resolve
  //    ke record manapun — persis seperti LEFT JOIN IS NULL.
  const deletedOrphan = await prisma.tokenAdmin.deleteMany({
    where: {
      tokenRole: "HEAD_ADMIN",
      admin: null, // adminId = null ATAU adminId tidak ada di tabel Admin
    },
  });

  if (deletedOrphan.count > 0) {
    console.log(
      `🗑️   ${deletedOrphan.count} orphan token HEAD_ADMIN dihapus (adminId tidak valid).`,
    );
  }

  // ── 4. Generate + simpan token baru ─────────────────────────
  const plainToken = generateToken(16); // 16 karakter untuk HEAD_ADMIN
  const tokenHash = hashToken(plainToken);

  const token = await prisma.tokenAdmin.create({
    data: {
      tokenHash, // SHA-256(plainToken) — yang tersimpan di DB
      tokenRole: "HEAD_ADMIN",
      adminId: admin.id,
      generatedBy: null, // null = dibuat developer langsung (bootstrap)
      isPermanent: true,
      isSingleUse: false,
      isRevoked: false,
      expiredAt: null,
      claimedAt: null,
    },
  });

  // ── 5. Print hasil ───────────────────────────────────────────
  console.log("\n" + line("═"));
  console.log("  ✅  BOOTSTRAP SELESAI");
  console.log(line("─"));
  console.log(`  Admin ID   : ${admin.id}`);
  console.log(`  Username   : ${admin.username}`);
  console.log(`  Nama       : ${admin.nama}`);
  console.log(`  Role       : HEAD_ADMIN`);
  console.log(`  Token ID   : ${token.id}`);
  console.log(line("─"));
  console.log("  ⚠️   SIMPAN TOKEN INI SEKARANG!");
  console.log("       Tidak akan ditampilkan lagi.");
  console.log("");
  console.log(`  TOKEN      : ${plainToken}`);
  console.log(line("═"));
  console.log("\n  Gunakan username + TOKEN di atas untuk login.\n");
}

main()
  .catch((err) => {
    console.error("\n❌  Error:", err?.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
