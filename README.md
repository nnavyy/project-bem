# Project BEM ITESA

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
| AI | Anthropic SDK |
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

---

## 📁 Struktur Folder

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

## 📸 Screenshots

> 🖼️ *(Tambahkan screenshot UI di sini — homepage, dashboard mahasiswa, dashboard admin, halaman suaraku)*

```
public/images/screenshots/
├── homepage.png
├── dashboard-mahasiswa.png
├── dashboard-admin.png
└── suaraku.png
```

---

## 👥 Kontributor

| Nama | Role |
|---|---|
| [Nanda Zhafran Mahendra] | Fullstack Developer |
| [Nama 2] | UI/UX Designer |
| [Nama 3] | Backend Developer |
| [Nama 4] | Project Manager |

> ✏️ *Isi bagian ini dengan nama tim kamu ya!*

---

## 📄 Lisensi

Project ini bersifat **private / internal** — digunakan khusus untuk kebutuhan BEM ITESA. Tidak untuk didistribusikan secara publik.

---

<p align="center">© 2026 BEM ITESA · Institut Teknologi Statistika dan Bisnis Muhammadiyah Semarang</p>
r
