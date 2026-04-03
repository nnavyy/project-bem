"use client";

import { useEffect, useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Jurusan =
  | "REKAYASA_PERANGKAT_LUNAK"
  | "STATISTIK"
  | "SAINS_AKTUARIA"
  | "MANAJEMEN_RETAIL";

type MahasiswaRow = {
  id: string;
  nim: string;
  nama: string;
  email: string | null;
  jurusan: Jurusan | null;
  createdAt: string;
};

type BulkResult = {
  nim: string;
  status: "success" | "error";
  message?: string;
};

type BulkResponse = {
  message: string;
  successCount: number;
  failCount: number;
  results: BulkResult[];
};

type CsvRow = {
  nim: string;
  nama: string;
  email: string;
  password: string;
  jurusan: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const JURUSAN_LABELS: Record<string, string> = {
  REKAYASA_PERANGKAT_LUNAK: "Rekayasa Perangkat Lunak",
  STATISTIK: "Statistik",
  SAINS_AKTUARIA: "Sains Aktuaria",
  MANAJEMEN_RETAIL: "Manajemen Retail",
};

const JURUSAN_OPTIONS = [
  { value: "REKAYASA_PERANGKAT_LUNAK", label: "Rekayasa Perangkat Lunak" },
  { value: "STATISTIK", label: "Statistik" },
  { value: "SAINS_AKTUARIA", label: "Sains Aktuaria" },
  { value: "MANAJEMEN_RETAIL", label: "Manajemen Retail" },
];

const JURUSAN_COLORS: Record<string, string> = {
  REKAYASA_PERANGKAT_LUNAK: "bg-blue-500/15 text-blue-400",
  STATISTIK: "bg-purple-500/15 text-purple-400",
  SAINS_AKTUARIA: "bg-emerald-500/15 text-emerald-400",
  MANAJEMEN_RETAIL: "bg-orange-500/15 text-orange-400",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseCsv(raw: string): CsvRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const nimIdx = headers.indexOf("nim");
  const namaIdx = headers.indexOf("nama");
  const emailIdx = headers.indexOf("email");
  const passwordIdx = headers.indexOf("password");
  const jurusanIdx = headers.indexOf("jurusan");

  if (nimIdx === -1 || namaIdx === -1 || passwordIdx === -1) return [];

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    rows.push({
      nim: cols[nimIdx] ?? "",
      nama: cols[namaIdx] ?? "",
      email: emailIdx !== -1 ? (cols[emailIdx] ?? "") : "",
      password: cols[passwordIdx] ?? "",
      jurusan: jurusanIdx !== -1 ? (cols[jurusanIdx] ?? "") : "",
    });
  }
  return rows;
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

const IconStudents = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
  </svg>
);

const IconSearch = () => (
  <svg className="w-4 h-4 shrink-0 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const IconTrash = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const IconX = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconUpload = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const IconRefresh = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const IconEdit = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
  </svg>
);

const IconEye = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconEyeOff = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const IconWarn = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  const widths = ["w-6", "w-24", "w-32", "w-36", "w-24", "w-28", "w-16"];
  return (
    <tr className="border-t border-white/5 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-3 ${widths[i] ?? "w-20"} rounded bg-white/[0.06]`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  mhs,
  onClose,
  onSaved,
}: {
  mhs: MahasiswaRow;
  onClose: () => void;
  onSaved: (updated: MahasiswaRow) => void;
}) {
  const [nama, setNama] = useState(mhs.nama);
  const [email, setEmail] = useState(mhs.email ?? "");
  const [jurusan, setJurusan] = useState(mhs.jurusan ?? "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = { nama, email };
      if (jurusan) body.jurusan = jurusan;
      else body.jurusan = "";
      if (password.trim()) body.password = password.trim();

      const res = await fetch(`/api/superadmin/mahasiswa/${mhs.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Terjadi kesalahan."); return; }
      onSaved({ ...mhs, nama: data.data.nama, email: data.data.email, jurusan: data.data.jurusan });
      onClose();
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#020617] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold text-base">Edit Mahasiswa</h2>
            <p className="text-white/40 text-xs mt-0.5">NIM: {mhs.nim}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <IconX />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            <IconWarn />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Email <span className="text-white/25">(opsional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-colors"
              placeholder="contoh@email.com"
            />
          </div>

          {/* Jurusan */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Jurusan</label>
            <select
              value={jurusan}
              onChange={(e) => setJurusan(e.target.value)}
              className="w-full bg-[#0b1220] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
            >
              <option value="">— Tidak diisi —</option>
              {JURUSAN_OPTIONS.map((j) => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Password Baru <span className="text-white/25">(kosongkan jika tidak diubah)</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-colors"
                placeholder="Password baru..."
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPw ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 border border-white/10 hover:bg-white/5 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-[#0f172a] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tab 1: Daftar Mahasiswa ───────────────────────────────────────────────────

function DaftarTab() {
  const [mahasiswa, setMahasiswa] = useState<MahasiswaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [jurusanFilter, setJurusanFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<MahasiswaRow | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (jurusanFilter) params.set("jurusan", jurusanFilter);
    const url = `/api/superadmin/mahasiswa${params.toString() ? `?${params}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setMahasiswa(d);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [search, jurusanFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/superadmin/mahasiswa/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { alert(data.message ?? "Gagal menghapus."); return; }
      setMahasiswa((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Gagal menghubungi server.");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }

  function handleSaved(updated: MahasiswaRow) {
    setMahasiswa((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIM, atau email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-colors"
          />
        </div>
        <select
          value={jurusanFilter}
          onChange={(e) => setJurusanFilter(e.target.value)}
          className="bg-[#0b1220] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-white/30 transition-colors min-w-[200px]"
        >
          <option value="">Semua Jurusan</option>
          {JURUSAN_OPTIONS.map((j) => (
            <option key={j.value} value={j.value}>{j.label}</option>
          ))}
        </select>
        <button
          onClick={fetchData}
          title="Refresh"
          className="p-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <IconRefresh />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider w-10">No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">NIM</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Jurusan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Terdaftar</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-white/40 text-sm">
                    Gagal memuat data. Silakan coba lagi.
                  </td>
                </tr>
              ) : mahasiswa.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-white/30">
                      <IconStudents />
                      <p className="text-sm">
                        {search || jurusanFilter
                          ? "Tidak ada mahasiswa yang cocok dengan filter."
                          : "Belum ada mahasiswa terdaftar."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                mahasiswa.map((mhs, idx) => {
                  const isConfirming = confirmDelete === mhs.id;
                  const isDeleting = deleting === mhs.id;
                  return (
                    <tr
                      key={mhs.id}
                      className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3.5 text-white/30 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-amber-400/90 text-xs font-medium tracking-wide">{mhs.nim}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-white font-medium">{mhs.nama}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {mhs.email ? (
                          <span className="text-white/60 text-xs">{mhs.email}</span>
                        ) : (
                          <span className="text-white/20 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {mhs.jurusan ? (
                          <span className={`text-xs px-2 py-1 rounded-md font-medium ${JURUSAN_COLORS[mhs.jurusan] ?? "bg-white/10 text-white/60"}`}>
                            {JURUSAN_LABELS[mhs.jurusan] ?? mhs.jurusan}
                          </span>
                        ) : (
                          <span className="text-white/20 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-white/40 text-xs whitespace-nowrap">{fmtDate(mhs.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isConfirming ? (
                            <>
                              {/* Edit */}
                              <button
                                onClick={() => setEditTarget(mhs)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors"
                                title="Edit"
                              >
                                <IconEdit />
                                Edit
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => setConfirmDelete(mhs.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                                title="Hapus"
                              >
                                <IconTrash />
                                Hapus
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/20 rounded-lg px-2 py-1">
                              <span className="text-xs text-red-400 font-medium mr-1">Hapus?</span>
                              <button
                                onClick={() => handleDelete(mhs.id)}
                                disabled={isDeleting}
                                className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-red-500 hover:bg-red-400 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                              >
                                <IconCheck />
                                {isDeleting ? "..." : "Ya"}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                disabled={isDeleting}
                                className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/70 text-xs font-medium disabled:opacity-50 transition-colors"
                              >
                                <IconX />
                                Tidak
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {!loading && !error && mahasiswa.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
            <p className="text-white/30 text-xs">
              Menampilkan <span className="text-white/50 font-medium">{mahasiswa.length}</span> mahasiswa
              {(search || jurusanFilter) && " (difilter)"}
            </p>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <EditModal mhs={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}

// ─── Sub-tab: Tambah Satu ──────────────────────────────────────────────────────

function TambahSatuForm({ onSuccess }: { onSuccess: () => void }) {
  const [nim, setNim] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nim.trim() || !nama.trim() || !password.trim()) {
      setError("NIM, Nama, dan Password wajib diisi.");
      return;
    }
    if (!jurusan) {
      setError("Jurusan wajib dipilih.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/mahasiswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim: nim.trim(), nama: nama.trim(), email: email.trim() || null, password: password.trim(), jurusan }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Terjadi kesalahan."); return; }
      setSuccess(`Mahasiswa "${nama.trim()}" (NIM: ${nim.trim()}) berhasil ditambahkan.`);
      setNim(""); setNama(""); setEmail(""); setPassword(""); setJurusan("");
      onSuccess();
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
          <span className="text-red-400 shrink-0"><IconWarn /></span>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">
          <span className="text-emerald-400 shrink-0"><IconCheck /></span>
          <p className="text-emerald-400 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* NIM */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
            NIM <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            required
            placeholder="Contoh: 2024010001"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-colors font-mono"
          />
        </div>

        {/* Nama */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
            Nama Lengkap <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
            placeholder="Nama lengkap mahasiswa"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
            Email <span className="text-white/25 normal-case font-normal">(opsional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contoh@itesa.ac.id"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-colors"
          />
        </div>

        {/* Jurusan */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
            Jurusan <span className="text-red-400">*</span>
          </label>
          <select
            value={jurusan}
            onChange={(e) => setJurusan(e.target.value)}
            required
            className="w-full bg-[#0b1220] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
          >
            <option value="" disabled>— Pilih jurusan —</option>
            {JURUSAN_OPTIONS.map((j) => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
            Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password login mahasiswa"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPw ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-[#0f172a] text-sm font-semibold rounded-xl px-4 py-3 hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
        >
          {loading ? "Menyimpan..." : "Tambah Mahasiswa"}
        </button>
      </form>
    </div>
  );
}

// ─── Sub-tab: Upload CSV ───────────────────────────────────────────────────────

function UploadCsvForm({ onSuccess }: { onSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<CsvRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResponse | null>(null);

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setParseError("File harus berformat .csv");
      setPreview(null);
      return;
    }
    setParseError("");
    setBulkResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      const rows = parseCsv(raw);
      if (rows.length === 0) {
        setParseError("File kosong atau format header tidak sesuai. Pastikan ada kolom: nim, nama, password.");
        setPreview(null);
      } else {
        setPreview(rows);
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleReset() {
    setPreview(null);
    setFileName("");
    setParseError("");
    setBulkResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!preview || preview.length === 0) return;
    setUploading(true);
    setBulkResult(null);
    try {
      const res = await fetch("/api/superadmin/mahasiswa/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mahasiswa: preview }),
      });
      const data: BulkResponse = await res.json();
      setBulkResult(data);
      if (data.successCount > 0) onSuccess();
    } catch {
      setBulkResult({
        message: "Gagal menghubungi server.",
        successCount: 0,
        failCount: preview.length,
        results: [],
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Template info */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Format CSV</p>
        <p className="text-white/40 text-xs mb-3">Kolom wajib: <code className="text-amber-400/80 bg-amber-500/10 px-1 py-0.5 rounded">nim</code>, <code className="text-amber-400/80 bg-amber-500/10 px-1 py-0.5 rounded">nama</code>, <code className="text-amber-400/80 bg-amber-500/10 px-1 py-0.5 rounded">password</code>. Kolom opsional: <code className="text-white/40 bg-white/5 px-1 py-0.5 rounded">email</code>, <code className="text-white/40 bg-white/5 px-1 py-0.5 rounded">jurusan</code>.</p>
        <div className="bg-[#050d1a] rounded-lg p-3 overflow-x-auto">
          <code className="text-emerald-400/80 text-xs font-mono whitespace-pre">
{`nim,nama,email,password,jurusan
2024010001,Budi Santoso,budi@itesa.ac.id,password123,REKAYASA_PERANGKAT_LUNAK
2024010002,Ani Rahayu,,password456,STATISTIK
2024010003,Citra Dewi,citra@itesa.ac.id,password789,SAINS_AKTUARIA`}
          </code>
        </div>
        <p className="text-white/25 text-xs mt-2">Nilai jurusan yang valid: REKAYASA_PERANGKAT_LUNAK · STATISTIK · SAINS_AKTUARIA · MANAJEMEN_RETAIL</p>
      </div>

      {/* Drop zone */}
      {!preview && !bulkResult && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={[
            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
            dragging
              ? "border-amber-500/60 bg-amber-500/5"
              : "border-white/10 hover:border-white/25 hover:bg-white/[0.02]",
          ].join(" ")}
        >
          <div className={["transition-colors", dragging ? "text-amber-400" : "text-white/20"].join(" ")}>
            <IconUpload />
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm font-medium">
              {dragging ? "Lepaskan file di sini" : "Drag & drop file CSV"}
            </p>
            <p className="text-white/30 text-xs mt-1">atau klik untuk memilih file</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {parseError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <span className="text-red-400 shrink-0"><IconWarn /></span>
          <p className="text-red-400 text-sm">{parseError}</p>
        </div>
      )}

      {/* Preview */}
      {preview && !bulkResult && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white text-sm font-semibold">Preview — {fileName}</p>
              <p className="text-white/40 text-xs mt-0.5">{preview.length} baris ditemukan</p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-white/40 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
            >
              Ganti File
            </button>
          </div>

          {preview.length > 500 && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-3">
              <span className="text-amber-400 shrink-0"><IconWarn /></span>
              <p className="text-amber-400 text-sm">Maksimal 500 baris per upload. File ini memiliki {preview.length} baris — hanya 500 pertama yang akan diproses.</p>
            </div>
          )}

          <div className="rounded-xl border border-white/10 overflow-hidden mb-4">
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#0a1628]">
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2.5 text-left font-semibold text-white/40 uppercase tracking-wider">NIM</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-white/40 uppercase tracking-wider">Nama</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-white/40 uppercase tracking-wider">Email</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-white/40 uppercase tracking-wider">Password</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-white/40 uppercase tracking-wider">Jurusan</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 500).map((row, i) => {
                    const hasError = !row.nim || !row.nama || !row.password;
                    return (
                      <tr key={i} className={["border-t border-white/5", hasError ? "bg-red-950/20" : "hover:bg-white/[0.015]"].join(" ")}>
                        <td className={["px-3 py-2 font-mono", hasError && !row.nim ? "text-red-400" : "text-amber-400/80"].join(" ")}>{row.nim || <span className="italic text-red-400">kosong</span>}</td>
                        <td className={["px-3 py-2", hasError && !row.nama ? "text-red-400 italic" : "text-white/80"].join(" ")}>{row.nama || "kosong"}</td>
                        <td className="px-3 py-2 text-white/40">{row.email || "—"}</td>
                        <td className="px-3 py-2 text-white/30">{"•".repeat(Math.min(row.password.length, 8)) || <span className="text-red-400 italic">kosong</span>}</td>
                        <td className="px-3 py-2">
                          {row.jurusan ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs ${JURUSAN_COLORS[row.jurusan] ?? "bg-red-500/15 text-red-400"}`}>
                              {JURUSAN_LABELS[row.jurusan] ?? <span className="italic">{row.jurusan} (tidak valid)</span>}
                            </span>
                          ) : (
                            <span className="text-white/25 italic">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-white text-[#0f172a] text-sm font-semibold rounded-xl px-4 py-3 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {uploading ? `Mengupload ${preview.length} data...` : `Upload ${preview.length} Mahasiswa`}
          </button>
        </div>
      )}

      {/* Results */}
      {bulkResult && (
        <div>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{bulkResult.successCount + bulkResult.failCount}</p>
              <p className="text-white/40 text-xs mt-1">Total Data</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{bulkResult.successCount}</p>
              <p className="text-emerald-400/60 text-xs mt-1">Berhasil</p>
            </div>
            <div className={["rounded-xl p-4 text-center", bulkResult.failCount > 0 ? "bg-red-500/10 border border-red-500/20" : "bg-white/[0.03] border border-white/8"].join(" ")}>
              <p className={["text-2xl font-bold", bulkResult.failCount > 0 ? "text-red-400" : "text-white/30"].join(" ")}>{bulkResult.failCount}</p>
              <p className={["text-xs mt-1", bulkResult.failCount > 0 ? "text-red-400/60" : "text-white/25"].join(" ")}>Gagal</p>
            </div>
          </div>

          {/* Per-row results */}
          {bulkResult.results.length > 0 && (
            <div className="rounded-xl border border-white/10 overflow-hidden mb-4">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#0a1628]">
                    <tr className="border-b border-white/10">
                      <th className="px-3 py-2.5 text-left font-semibold text-white/40 uppercase tracking-wider">NIM</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-white/40 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-white/40 uppercase tracking-wider">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResult.results.map((r, i) => (
                      <tr key={i} className="border-t border-white/5 hover:bg-white/[0.015]">
                        <td className="px-3 py-2 font-mono text-amber-400/80">{r.nim}</td>
                        <td className="px-3 py-2">
                          <span className={["text-xs px-2 py-0.5 rounded-full font-semibold", r.status === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"].join(" ")}>
                            {r.status === "success" ? "Berhasil" : "Gagal"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-white/40">{r.message ?? (r.status === "success" ? "Data tersimpan" : "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full text-sm font-medium text-white/60 border border-white/10 rounded-xl px-4 py-2.5 hover:bg-white/5 hover:text-white transition-colors"
          >
            Upload File Baru
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Tambah Mahasiswa ───────────────────────────────────────────────────

function TambahTab({ onSuccess }: { onSuccess: () => void }) {
  const [subTab, setSubTab] = useState<"satu" | "csv">("satu");

  return (
    <div>
      {/* Sub-tab switcher */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl w-fit mb-6 border border-white/[0.06]">
        {(["satu", "csv"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={[
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              subTab === t
                ? "bg-white text-[#0f172a] shadow-sm"
                : "text-white/50 hover:text-white",
            ].join(" ")}
          >
            {t === "satu" ? "Tambah Satu" : "Upload CSV"}
          </button>
        ))}
      </div>

      {subTab === "satu" ? (
        <TambahSatuForm onSuccess={onSuccess} />
      ) : (
        <UploadCsvForm onSuccess={onSuccess} />
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MahasiswaPage() {
  const [activeTab, setActiveTab] = useState<"daftar" | "tambah">("daftar");
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch total count for header chip
  useEffect(() => {
    fetch("/api/superadmin/mahasiswa")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setTotalCount(d.length); })
      .catch(() => {});
  }, [refreshKey]);

  function handleSuccess() {
    setRefreshKey((k) => k + 1);
    // Switch to daftar tab to show newly added data
    setTimeout(() => setActiveTab("daftar"), 400);
  }

  return (
    <main className="p-6 lg:p-8 min-h-screen">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <IconStudents />
            </span>
            Manajemen Mahasiswa
          </h1>
          <p className="text-white/45 text-sm mt-1.5 ml-0.5">
            Kelola data mahasiswa terdaftar di sistem BEM ITESA.
          </p>
        </div>
        {totalCount !== null && (
          <div className="shrink-0 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-center min-w-[80px]">
            <p className="text-2xl font-bold text-white leading-none">{totalCount}</p>
            <p className="text-white/40 text-xs mt-1">Total</p>
          </div>
        )}
      </div>

      {/* ── Main Tabs ── */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl w-fit mb-6 border border-white/[0.06]">
        {(["daftar", "tambah"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={[
              "px-5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t
                ? "bg-white text-[#0f172a] shadow-sm"
                : "text-white/50 hover:text-white",
            ].join(" ")}
          >
            {t === "daftar" ? "Daftar Mahasiswa" : "Tambah Mahasiswa"}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="bg-[#0a1628] border border-white/[0.07] rounded-2xl p-6">
        {activeTab === "daftar" ? (
          <DaftarTab key={refreshKey} />
        ) : (
          <TambahTab onSuccess={handleSuccess} />
        )}
      </div>
    </main>
  );
}
