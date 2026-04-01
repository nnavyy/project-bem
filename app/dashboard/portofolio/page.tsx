"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../_components/Navbar";
import Footer from "../_components/Footer";

type GaleriItem = {
  id: string;
  namaAnggota: string;
  jabatan: string | null;
  foto: string | null;
  urutan: number | null;
};

type AdminInfo = {
  id: string;
  username: string;
  nama: string;
  role: string;
};

type Portofolio = {
  id: string;
  namaDivisi: string;
  deskripsi: string;
  fotoUtama: string | null;
  tanggalKegiatan: string | null;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  galeri: GaleriItem[];
  admin: AdminInfo;
};

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div className="bg-[#020617] border border-white/10 rounded-2xl overflow-hidden">
      <div className="aspect-[16/10] bg-white/5 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-2/3 rounded bg-white/10 animate-pulse" />
        <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

export default function PortofolioListingPage() {
  const [portofolios, setPortofolios] = useState<Portofolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portofolio")
      .then((r) => r.json())
      .then((data) => {
        setPortofolios(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="bg-[#0f172a] text-white min-h-screen">
      <Navbar />

      {/* ── Hero / Jumbotron ──────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-transparent to-[#0f172a]" />

        <div className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Portofolio</h1>
          <p className="mt-4 text-white/50 text-sm sm:text-base max-w-xl mx-auto">
            Kegiatan dan program kerja divisi-divisi BEM ITESA
          </p>
        </div>
      </section>

      {/* ── Portofolio Grid ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : portofolios.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
              </svg>
            </div>
            <p className="text-white/40 text-sm">Belum ada portofolio untuk ditampilkan.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {portofolios.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/portofolio/${p.id}`}
                className="group bg-[#020617] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:scale-[0.98] transition-all duration-300"
              >
                {/* Image */}
                <div className="aspect-[16/10] bg-white/5 overflow-hidden">
                  {p.fotoUtama ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.fotoUtama}
                      alt={p.namaDivisi}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full border border-white/15 text-white/50 font-medium mb-2">
                    Portofolio
                  </span>

                  <div className="flex items-center gap-1.5 text-white/35 text-xs mb-2.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    {fmtDate(p.tanggalKegiatan || p.createdAt)}
                  </div>

                  <h3 className="text-white font-semibold text-base leading-snug line-clamp-2 group-hover:text-white/90 transition-colors">
                    {p.namaDivisi}
                  </h3>

                  <p className="mt-2 text-white/40 text-sm leading-relaxed line-clamp-2">
                    {p.deskripsi}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-white/30 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 font-medium">
                      {p.galeri.length} anggota
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-white/30 group-hover:text-white/60 text-xs font-medium transition-colors">
                    <span>Lihat detail</span>
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
