"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../_components/Navbar";
import Footer from "../../_components/Footer";

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

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
      <span className="text-white/50 text-sm font-semibold">{initials || "?"}</span>
    </div>
  );
}

export default function PortofolioDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [portofolio, setPortofolio] = useState<Portofolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchPortofolio() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/portofolio");
        if (!res.ok) throw new Error();
        const data: Portofolio[] = await res.json();
        const found = data.find((p) => p.id === id);
        if (!found) {
          setError(true);
          return;
        }
        setPortofolio(found);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchPortofolio();
  }, [id]);

  return (
    <main className="bg-[#0f172a] text-white min-h-screen">
      <Navbar />

      {loading ? (
        <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse">
          <div className="h-6 w-48 rounded bg-white/10 mb-4" />
          <div className="h-10 w-3/4 rounded bg-white/10 mb-3" />
          <div className="h-4 w-40 rounded bg-white/5 mb-8" />
          <div className="h-64 w-full rounded-2xl bg-white/5 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      ) : error || !portofolio ? (
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Portofolio Tidak Ditemukan</h2>
          <p className="text-white/40 text-sm mb-6">
            Konten yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <Link
            href="/dashboard/portofolio"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Kembali ke Portofolio
          </Link>
        </div>
      ) : (
        <>
          {/* ── Hero Header ──────────────────────────────────── */}
          <section className="relative overflow-hidden border-b border-white/10">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-transparent to-[#0f172a]" />

            <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
                {portofolio.namaDivisi}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/45">
                <span className="font-medium text-white/60">{portofolio.admin?.nama}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{fmtDate(portofolio.tanggalKegiatan || portofolio.createdAt)}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-xs font-medium">
                  {portofolio.galeri.length} anggota
                </span>
              </div>
            </div>
          </section>

          {/* ── Breadcrumb ────────────────────────────────────── */}
          <div className="max-w-4xl mx-auto px-6 pt-6">
            <nav className="flex items-center gap-2 text-xs text-white/40">
              <Link href="/dashboard" className="hover:text-white/70 transition-colors">
                Home
              </Link>
              <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <Link href="/dashboard/portofolio" className="hover:text-white/70 transition-colors">
                Portofolio
              </Link>
              <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-white/60 truncate max-w-[200px]">{portofolio.namaDivisi}</span>
            </nav>
          </div>

          {/* ── Main Image ────────────────────────────────────── */}
          {portofolio.fotoUtama && (
            <div className="max-w-4xl mx-auto px-6 mt-6">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={portofolio.fotoUtama}
                  alt={portofolio.namaDivisi}
                  className="w-full max-h-[400px] object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none"; }}
                />
              </div>
            </div>
          )}

          {/* ── Description ───────────────────────────────────── */}
          <div className="max-w-4xl mx-auto px-6 py-8">
            <h2 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">
              Deskripsi
            </h2>
            <p className="text-white/65 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {portofolio.deskripsi}
            </p>
          </div>

          {/* ── Galeri Anggota ─────────────────────────────────── */}
          <div className="max-w-4xl mx-auto px-6 pb-16">
            <div className="border-t border-white/10 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white/50 text-xs font-medium uppercase tracking-wider">
                  Galeri Anggota
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-white/40 font-medium">
                  {portofolio.galeri.length} anggota
                </span>
              </div>

              {portofolio.galeri.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/30 text-sm">Belum ada anggota di galeri ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portofolio.galeri
                    .slice()
                    .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999))
                    .map((g) => (
                      <div
                        key={g.id}
                        className="bg-[#020617] border border-white/10 rounded-xl p-4 flex flex-col items-center text-center hover:border-white/20 transition-colors"
                      >
                        {g.foto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={g.foto}
                            alt={g.namaAnggota}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white/10 mb-3"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                              const next = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement | null;
                              if (next) next.style.display = "flex";
                            }}
                          />
                        ) : null}
                        {!g.foto && <AvatarPlaceholder name={g.namaAnggota} />}
                        <div className="mt-1">
                          <p className="text-white/85 text-sm font-medium leading-tight">
                            {g.namaAnggota}
                          </p>
                          {g.jabatan && (
                            <p className="text-white/40 text-xs mt-0.5">{g.jabatan}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Back link */}
            <div className="mt-10">
              <Link
                href="/dashboard/portofolio"
                className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors group"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Kembali ke Portofolio
              </Link>
            </div>
          </div>
        </>
      )}

      <Footer />
    </main>
  );
}
