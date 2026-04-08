# Project BEM ITESA

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Neon-00E599?logo=neon&logoColor=white" alt="NeonDB" />
</p>

> Website resmi Badan Eksekutif Mahasiswa Institut Teknologi Statistika dan Bisnis Muhammadiyah Semarang — dibangun dengan Next.js, Prisma, dan NeonDB.

🔗 **Live:** [project-bem.vercel.app](https://project-bem.vercel.app/dashboard)

---

## Fitur Utama

### Suaraku ITESA
Wadah resmi mahasiswa untuk menyampaikan aspirasi, kritik, dan keluhan secara aman dan terstruktur. Mahasiswa bisa login dan submit laporan yang langsung masuk ke dashboard admin.

### Blog & Berita
Halaman informasi terbaru seputar kegiatan BEM — pengumuman, dokumentasi program kerja, dan berita kampus.

### Portofolio BEM
Dokumentasi program kerja dan divisi BEM ITESA sebagai bentuk transparansi organisasi kepada seluruh mahasiswa.

### Admin Mode (Multi-Role)
Sistem dashboard bertingkat dengan 4 level akses:
- **Mahasiswa** → Bisa submit & cek status laporan
- **Admin** → Kelola laporan & konten
- **Head Admin** → Supervisi admin
- **Super Admin** → Akses penuh ke seluruh sistem

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| ORM | Prisma v6 |
| Database | NeonDB (Serverless PostgreSQL) |
| Auth | NextAuth v4 + JWT (jose) |
| Storage | Cloudinary |
| Deploy | Vercel |

---

## Setup Lokal

### Prerequisites
- Node.js 18+
- npm / pnpm
- Akun NeonDB (buat database baru)
- Akun Cloudinary (untuk upload gambar)

### 1. Clone & Install

```bash
git clone https://github.com/nnavyy/project-bem.git
cd project-bem
npm install
```

### 2. Setup Environment Variables

Buat file `.env` di root project:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Anthropic AI (opsional)
ANTHROPIC_API_KEY="..."
```

### 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push

# (Opsional) Seed data awal
npm run bootstrap
```

### 4. Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### 5. (Opsional) Jalankan Security Tests

Untuk memverifikasi keamanan sistem:

```bash
# Di terminal baru (pastikan dev server running)
node test-security.js
```

### 6. Build Production (Opsional)

Untuk menjalankan versi production di lokal:
```bash
npm run build
npm run start
```

---

## Struktur Folder

```
project-bem/
├── app/                  # Next.js App Router (pages & API routes)
│   ├── dashboard/        # Halaman publik (blog, portofolio, dll)
│   ├── login/            # Halaman login per role
│   └── api/              # API endpoints
├── lib/                  # Utility & helper functions
├── prisma/               # Schema database & seed script
│   └── schema.prisma
├── public/               # Aset statis (gambar, dll)
├── middleware.ts          # Auth & role-based routing
├── next.config.ts        # Konfigurasi Next.js
└── package.json
```

---

##  Keamanan

Project ini mengimplementasikan multiple layers of security untuk melindungi data mahasiswa dan operasional BEM:

### Fitur Keamanan Utama

- **JWT Authentication** dengan signature verification (HS256)
- **Role-Based Access Control (RBAC)** dengan 4 tingkat akses
- **HttpOnly Cookies** untuk mencegah XSS attacks
- **Rate Limiting** pada login endpoints (max 10 requests/15 menit)
- **Token-Based Admin Auth** dengan SHA-256 hashing
- **Comprehensive Security Headers** (CSP, X-Frame-Options, HSTS, dll)
- **API Route Protection** dengan middleware authentication
- **Audit Logging** untuk semua aktivitas sensitif

### Menjalankan Security Tests

Untuk memverifikasi keamanan sistem setelah deployment atau modifikasi:

```bash
# Pastikan dev server sudah running
npm run dev

# Di terminal baru, jalankan security test suite
node test-security.js

# Untuk custom BASE_URL (misalnya testing production)
BASE_URL=https://your-domain.com node test-security.js
```

Test suite akan mengecek:
- ✓ Role cookie bypass prevention (CRITICAL)
- ✓ API route protection
- ✓ Rate limiting functionality
- ✓ Security headers presence
- ✓ JWT expiry handling
- ✓ Cookie security attributes

### Dokumentasi Keamanan Lengkap

Lihat **[SECURITY.md](./SECURITY.md)** untuk:
- Analisis kerentanan yang ditemukan & diperbaikan
- Best practices keamanan yang diterapkan
- Compliance dengan OWASP Top 10
- Kontribusi untuk penelitian Tugas Akhir

---

## Tangkapan Layar (Screenshots)

Berikut adalah beberapa tampilan dari Project BEM ITESA:

<details>
<summary><b>Klik untuk melihat tangkapan layar</b></summary>
<br>

**Homepage**
![Homepage](/public/images/screenshots/homepage.png)

**Dashboard Mahasiswa**
![Dashboard Mahasiswa](/public/images/screenshots/dashboard-mahasiswa.png)

**Dashboard Admin**
![Dashboard Admin](/public/images/screenshots/dashboard-admin.png)

**Dashboard HeadAdmin**
![Dashboard HeadAdmin](/public/images/screenshots/dashboard-headadmin.png)

**Dashboard SuperAdmin**
![Dashboard SuperAdmin](/public/images/screenshots/dashboard-superadmin.png)

</details>

---

## Kontributor

| Nama | Role |
|---|---|
| [Nanda Zhafran Mahendra] | Fullstack Developer |
| [Nama 2] | UI/UX Designer |
| [Nama 3] | Backend Developer |
| [Nama 4] | Project Manager |

---

## Lisensi

Project ini bersifat **private / internal** — digunakan khusus untuk kebutuhan BEM ITESA. Tidak untuk didistribusikan secara publik.

---

<p align="center">© 2026 BEM ITESA · Institut Teknologi Statistika dan Bisnis Muhammadiyah Semarang</p>
