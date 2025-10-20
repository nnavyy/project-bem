"use client";
import { useAuthRedirect } from "@/lib/checkauth";

export default function DashboardMahasiswa() {
  useAuthRedirect("mahasiswa");

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50 text-gray-800">
      <header className="bg-blue-100 p-4 shadow-md">
        <h1 className="text-2xl font-bold text-blue-700">Dashboard Mahasiswa</h1>
        <p className="text-sm text-gray-600">Selamat datang di portal BEM ITEsa</p>
      </header>

      <section className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white shadow rounded-2xl border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-700">Visi & Misi</h2>
            <p className="text-sm mt-2 text-gray-600">
              Mewujudkan mahasiswa yang aktif, kritis, dan berdaya melalui kolaborasi dan inovasi kampus.
            </p>
          </div>

          <div className="p-6 bg-white shadow rounded-2xl border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-700">Kegiatan Terbaru</h2>
            <ul className="mt-2 text-sm text-gray-600 list-disc ml-4">
              <li>Pembukaan Pendaftaran Anggota BEM 2025</li>
              <li>Seminar Leadership Mahasiswa</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
