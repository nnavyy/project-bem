"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Laporan = {
  id: string;
  judul: string;
  isi: string;
  status?: "PENDING" | "DIBACA" | "DITINDAKLANJUTI" | "SELESAI";
  createdAt?: string;
};

type MeResponse = {
  role: string;
  profile?: {
    nama?: string;
    nim?: string;
  };
};

export default function DashboardMahasiswaPage() {
  const router = useRouter();
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [jenisKeluhan, setJenisKeluhan] = useState<"RUANGAN" | "DOSEN" | "RUANG_LINGKUP">(
    "RUANGAN"
  );
  const [tanggalKejadian, setTanggalKejadian] = useState("");
  const [lokasiRuangan, setLokasiRuangan] = useState("");
  const [hariMengajar, setHariMengajar] = useState("");
  const [mataKuliah, setMataKuliah] = useState("");
  const [pihakTerlibat, setPihakTerlibat] = useState("");
  const [keluhanSpesifik, setKeluhanSpesifik] = useState("");
  const [namaMahasiswa, setNamaMahasiswa] = useState("Mahasiswa");
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadLaporan() {
    setError("");
    setLoadingList(true);
    try {
      const res = await fetch("/api/laporan", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? "Gagal memuat laporan");
        return;
      }
      setLaporan(Array.isArray(data) ? data : []);
    } catch {
      setError("Terjadi kesalahan saat memuat laporan.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadLaporan();
    loadMe();
  }, []);

  async function loadMe() {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          await fetch("/api/logout", { method: "POST" });
          window.location.href = "/login/mahasiswa";
          return;
        }
      }
      const data = (await res.json()) as MeResponse;
      if (res.ok && data?.profile?.nama) {
        setNamaMahasiswa(data.profile.nama);
      }
    } catch {
      // ignore, keep default fallback
    }
  }

  async function submitLaporan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingSubmit(true);
    setError("");
    setSuccess("");

    const detailTambahan: string[] = [
      `Jenis Keluhan: ${jenisKeluhan.replaceAll("_", " ")}`,
      tanggalKejadian ? `Tanggal Kejadian: ${tanggalKejadian}` : "",
      jenisKeluhan === "RUANGAN" && lokasiRuangan ? `Lokasi/Ruangan: ${lokasiRuangan}` : "",
      jenisKeluhan === "DOSEN" && hariMengajar ? `Hari Mengajar: ${hariMengajar}` : "",
      jenisKeluhan === "DOSEN" && mataKuliah ? `Mata Kuliah: ${mataKuliah}` : "",
      jenisKeluhan === "RUANG_LINGKUP" && pihakTerlibat ? `Pihak Terlibat: ${pihakTerlibat}` : "",
      jenisKeluhan === "RUANG_LINGKUP" && keluhanSpesifik
        ? `Keluhan Spesifik: ${keluhanSpesifik}`
        : "",
    ].filter(Boolean);

    const isiFinal = `${isi}\n\n---\n${detailTambahan.join("\n")}`.trim();

    try {
      const res = await fetch("/api/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul, isi: isiFinal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? "Gagal mengirim laporan.");
        return;
      }
      setSuccess("Laporan berhasil dikirim.");
      setJudul("");
      setIsi("");
      setTanggalKejadian("");
      setLokasiRuangan("");
      setHariMengajar("");
      setMataKuliah("");
      setPihakTerlibat("");
      setKeluhanSpesifik("");
      setLaporan((prev) => [data, ...prev]);
    } catch {
      setError("Terjadi kesalahan saat mengirim laporan.");
    } finally {
      setLoadingSubmit(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // abaikan error
    }
    window.location.href = "/login/mahasiswa";
  }

  function renderStatusBadge(status?: Laporan["status"]) {
    if (status === "SELESAI") {
      return (
        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
          Selesai
        </span>
      );
    }
    if (status === "DITINDAKLANJUTI" || status === "DIBACA") {
      return (
        <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-xs text-amber-200">
          Sedang Diselesaikan
        </span>
      );
    }
    return (
      <span className="rounded-full border border-sky-400/40 bg-sky-500/20 px-3 py-1 text-xs text-sky-200">
        Pending
      </span>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1f2c44] to-[#0f172a] text-white">
      <header className="border-b border-white/10 bg-[#020617]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Suaraku ITESA</p>
            <h1 className="text-lg font-semibold sm:text-xl">Dashboard Mahasiswa</h1>
            <p className="mt-1 text-xs text-white/70">Selamat datang, {namaMahasiswa}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
            >
              Dashboard Umum
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-[#020617]/85 p-5 text-white sm:p-7">
          <h2 className="text-center text-2xl font-semibold">Jenis Keluhan</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setJenisKeluhan("RUANGAN")}
              className={`rounded-full border px-8 py-2.5 text-sm font-semibold transition ${
                jenisKeluhan === "RUANGAN"
                  ? "border-[#2f64d8] bg-[#2f64d8] text-white"
                  : "border-white/20 bg-transparent text-white/80"
              }`}
            >
              Ruangan
            </button>
            <button
              type="button"
              onClick={() => setJenisKeluhan("DOSEN")}
              className={`rounded-full border px-8 py-2.5 text-sm font-semibold transition ${
                jenisKeluhan === "DOSEN"
                  ? "border-[#2f64d8] bg-[#2f64d8] text-white"
                  : "border-white/20 bg-transparent text-white/80"
              }`}
            >
              Dosen
            </button>
            <button
              type="button"
              onClick={() => setJenisKeluhan("RUANG_LINGKUP")}
              className={`rounded-full border px-8 py-2.5 text-sm font-semibold transition ${
                jenisKeluhan === "RUANG_LINGKUP"
                  ? "border-[#2f64d8] bg-[#2f64d8] text-white"
                  : "border-white/20 bg-transparent text-white/80"
              }`}
            >
              Ruang Lingkup
            </button>
          </div>

          <form
            onSubmit={submitLaporan}
            className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#0b1220] p-4 sm:p-6"
          >
            <h3 className="text-center text-2xl font-semibold text-white">Buat Laporan Baru</h3>
            <div>
              <input
                id="judul"
                required
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-[#020617] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#2f64d8]"
                placeholder="Judul Laporan"
              />
            </div>

            <div>
              <textarea
                id="isi"
                required
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                rows={6}
                className="w-full resize-none rounded-xl border border-white/20 bg-[#020617] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#2f64d8]"
                placeholder="Isi Laporan"
              />
            </div>
            <div>
              <input
                type="date"
                value={tanggalKejadian}
                onChange={(e) => setTanggalKejadian(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-[#020617] px-4 py-3 text-sm text-white outline-none focus:border-[#2f64d8]"
              />
            </div>
            {jenisKeluhan === "RUANGAN" ? (
              <div>
                <input
                  value={lokasiRuangan}
                  onChange={(e) => setLokasiRuangan(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-[#020617] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#2f64d8]"
                  placeholder="Lokasi atau Nomor Ruangan"
                />
              </div>
            ) : null}
            {jenisKeluhan === "DOSEN" ? (
              <>
                <div>
                  <input
                    value={hariMengajar}
                    onChange={(e) => setHariMengajar(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-[#020617] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#2f64d8]"
                    placeholder="Hari Mengajar"
                  />
                </div>
                <div>
                  <input
                    value={mataKuliah}
                    onChange={(e) => setMataKuliah(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-[#020617] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#2f64d8]"
                    placeholder="Mata Kuliah yang Diajarkan"
                  />
                </div>
              </>
            ) : null}
            {jenisKeluhan === "RUANG_LINGKUP" ? (
              <>
                <div>
                  <input
                    value={pihakTerlibat}
                    onChange={(e) => setPihakTerlibat(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-[#020617] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#2f64d8]"
                    placeholder="Pihak yang Terlibat"
                  />
                </div>
                <div>
                  <input
                    value={keluhanSpesifik}
                    onChange={(e) => setKeluhanSpesifik(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-[#020617] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#2f64d8]"
                    placeholder="Keluhan Spesifik"
                  />
                </div>
              </>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loadingSubmit}
              className="w-full rounded-xl bg-[#2f64d8] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingSubmit ? "Mengirim..." : "Kirim Laporan"}
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#020617]/80 p-5">
          <h2 className="text-xl font-semibold text-white">Riwayat Laporan</h2>
          <p className="mt-2 text-sm text-white/70">Daftar laporan yang sudah kamu kirim.</p>

          <div className="mt-5 space-y-3">
            {loadingList ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Memuat laporan...
              </div>
            ) : laporan.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Belum ada laporan.
              </div>
            ) : (
              laporan.map((item) => (
                <article key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{item.judul}</h3>
                    {renderStatusBadge(item.status)}
                  </div>
                  <p className="mt-2 text-sm text-white/80">{item.isi}</p>
                  {item.createdAt ? (
                    <p className="mt-3 text-xs text-white/50">
                      {new Date(item.createdAt).toLocaleString("id-ID")}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
