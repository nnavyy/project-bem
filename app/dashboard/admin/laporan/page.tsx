"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminInfo = {
  id: string;
  username: string;
  nama: string;
  role: string;
};

type MahasiswaInfo = {
  id: string;
  nim: string;
  nama: string;
  email: string;
  jurusan: string;
};

type TindakLanjut = {
  id: string;
  laporanId: string;
  adminId: string;
  catatan: string;
  createdAt: string;
  admin: AdminInfo;
};

type LaporanStatus = "PENDING" | "DIBACA" | "DITINDAKLANJUTI" | "SELESAI";

type Laporan = {
  id: string;
  judul: string;
  isi: string;
  jenisKeluhan: string;
  tanggalKejadian: string | null;
  lokasi: string | null;
  lampiranUrl: string | null;
  status: LaporanStatus;
  mahasiswaId: string;
  ditindakOleh: string | null;
  createdAt: string;
  updatedAt: string;
  mahasiswa: MahasiswaInfo;
  adminTindak: AdminInfo | null;
  tindakLanjut: TindakLanjut[];
};

type LogItem = {
  id: string;
  adminId: string;
  aksi: string;
  entityType: string | null;
  entityId: string | null;
  dataBefore: unknown;
  dataAfter: unknown;
  keterangan: string | null;
  createdAt: string;
  admin: AdminInfo;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LIST: LaporanStatus[] = [
  "PENDING",
  "DIBACA",
  "DITINDAKLANJUTI",
  "SELESAI",
];

const STATUS_BADGE: Record<LaporanStatus, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  DIBACA: "bg-blue-500/20 text-blue-400",
  DITINDAKLANJUTI: "bg-purple-500/20 text-purple-400",
  SELESAI: "bg-green-500/20 text-green-400",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAksiBadgeClass(aksi: string): string {
  if (aksi === "LOGIN") return "bg-blue-500/20 text-blue-400";
  if (aksi === "LOGIN_GAGAL") return "bg-red-500/20 text-red-400";
  if (aksi === "LOGOUT") return "bg-white/10 text-white/50";
  if (aksi.startsWith("CREATE_")) return "bg-green-500/20 text-green-400";
  if (aksi.startsWith("UPDATE_")) return "bg-yellow-500/20 text-yellow-400";
  if (aksi.startsWith("DELETE_")) return "bg-orange-500/20 text-orange-400";
  if (aksi === "GENERATE_TOKEN") return "bg-purple-500/20 text-purple-400";
  if (aksi === "REVOKE_TOKEN") return "bg-red-500/20 text-red-400";
  if (aksi === "TAMBAH_TINDAKLANJUT") return "bg-blue-500/20 text-blue-400";
  return "bg-white/10 text-white/50";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LaporanStatus }) {
  return (
    <span
      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[status]}`}
    >
      {status}
    </span>
  );
}

function AksiBadge({ aksi }: { aksi: string }) {
  return (
    <span
      className={`text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${getAksiBadgeClass(aksi)}`}
    >
      {aksi}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div
            className="h-3.5 rounded bg-white/10 animate-pulse"
            style={{ width: `${50 + ((i * 13) % 45)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

function IconX() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LaporanPage() {
  // ── List state ──────────────────────────────────────────────────────────────
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ── Modal / detail state ─────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Laporan | null>(null);

  // Status update
  const [updateStatus, setUpdateStatus] = useState<LaporanStatus>("PENDING");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Tindak lanjut
  const [newCatatan, setNewCatatan] = useState("");
  const [submittingTindak, setSubmittingTindak] = useState(false);
  const [tindakMsg, setTindakMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Logs
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchLaporan = useCallback(async (): Promise<Laporan[]> => {
    const res = await fetch("/api/laporan", { cache: "no-store" });
    if (!res.ok) throw new Error(`Gagal memuat laporan (${res.status})`);
    return res.json();
  }, []);

  const loadLaporan = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchLaporan();
      setLaporan(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [fetchLaporan]);

  useEffect(() => {
    loadLaporan();
  }, [loadLaporan]);

  async function fetchLogsForLaporan(laporanId: string) {
    setLogsLoading(true);
    setLogs([]);
    try {
      const res = await fetch(
        `/api/headadmin/logs?entityId=${encodeURIComponent(laporanId)}&pageSize=20`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.items ?? []);
    } catch {
      // silently fail — logs are supplementary
    } finally {
      setLogsLoading(false);
    }
  }

  // ── Modal helpers ────────────────────────────────────────────────────────────

  function openModal(l: Laporan) {
    setSelected(l);
    setUpdateStatus(l.status);
    setNewCatatan("");
    setStatusMsg(null);
    setTindakMsg(null);
    setLogs([]);
    fetchLogsForLaporan(l.id);
  }

  function closeModal() {
    setSelected(null);
    setLogs([]);
    setStatusMsg(null);
    setTindakMsg(null);
  }

  /** Re-fetch list and sync the open modal with fresh data */
  async function refreshAndSync(laporanId: string) {
    try {
      const data = await fetchLaporan();
      setLaporan(data);
      const fresh = data.find((l) => l.id === laporanId);
      if (fresh) {
        setSelected(fresh);
        setUpdateStatus(fresh.status);
      }
    } catch {
      // ignore secondary failure
    }
  }

  // ── Status update ────────────────────────────────────────────────────────────

  async function handleUpdateStatus() {
    if (!selected) return;
    if (updateStatus === selected.status) return;
    setUpdatingStatus(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/laporan/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: updateStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Gagal update status (${res.status})`);
      }
      setStatusMsg({ type: "ok", text: "Status berhasil diperbarui." });
      await refreshAndSync(selected.id);
      fetchLogsForLaporan(selected.id);
    } catch (e: unknown) {
      setStatusMsg({
        type: "err",
        text: e instanceof Error ? e.message : "Gagal update status",
      });
    } finally {
      setUpdatingStatus(false);
    }
  }

  // ── Add tindak lanjut ─────────────────────────────────────────────────────────

  async function handleAddTindakLanjut() {
    if (!selected || !newCatatan.trim()) return;
    setSubmittingTindak(true);
    setTindakMsg(null);
    try {
      const res = await fetch(`/api/laporan/${selected.id}/tindaklanjut`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatan: newCatatan.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message ?? `Gagal menambah tindak lanjut (${res.status})`,
        );
      }
      setTindakMsg({ type: "ok", text: "Catatan berhasil ditambahkan." });
      setNewCatatan("");
      await refreshAndSync(selected.id);
      fetchLogsForLaporan(selected.id);
    } catch (e: unknown) {
      setTindakMsg({
        type: "err",
        text: e instanceof Error ? e.message : "Gagal menambah catatan",
      });
    } finally {
      setSubmittingTindak(false);
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const filtered =
    statusFilter === "all"
      ? laporan
      : laporan.filter((l) => l.status === statusFilter);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="p-6 lg:p-8">
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Laporan Mahasiswa
          </h1>
          <p className="text-white/50 text-sm mt-0.5">
            Kelola dan tindaklanjuti laporan yang masuk
          </p>
        </div>
        <span className="text-white/40 text-xs">
          {!loading && `${filtered.length} laporan`}
        </span>
      </div>

      {/* ── Status Filter ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", ...STATUS_LIST] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-sm rounded-lg px-4 py-2 transition-colors ${statusFilter === s
                ? "bg-white text-[#0f172a] font-semibold"
                : "border border-white/20 text-white hover:bg-white/10"
              }`}
          >
            {s === "all" ? "Semua" : s}
            {s !== "all" && !loading && (
              <span className="ml-1.5 text-xs opacity-60">
                ({laporan.filter((l) => l.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className="bg-[#020617] border border-white/10 rounded-xl overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={loadLaporan}
              className="border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    No
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Mahasiswa
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Judul
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Jenis Keluhan
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Status
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Ditindak
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Tanggal
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-white/40 text-sm text-center py-12"
                    >
                      {statusFilter === "all"
                        ? "Belum ada laporan masuk"
                        : `Tidak ada laporan dengan status ${statusFilter}`}
                    </td>
                  </tr>
                ) : (
                  filtered.map((l, i) => (
                    <tr
                      key={l.id}
                      onClick={() => openModal(l)}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-white/40 text-xs">
                        {i + 1}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-white/80 text-xs font-mono font-medium">
                          {l.mahasiswa.nim}
                        </p>
                        <p className="text-white/50 text-xs mt-0.5">
                          {l.mahasiswa.nama}
                        </p>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="text-white/80 truncate">{l.judul}</p>
                      </td>
                      <td className="py-3 px-4 text-white/60 whitespace-nowrap">
                        {l.jenisKeluhan}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="py-3 px-4 text-white/55 text-xs">
                        {l.adminTindak?.username ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-white/40 text-xs whitespace-nowrap">
                        {fmtDate(l.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(l);
                          }}
                          className="border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="flex min-h-full items-start justify-center px-4 py-8">
            <div className="w-full max-w-3xl bg-[#020617] border border-white/10 rounded-2xl p-6 my-auto">
              {/* ── Modal Header ──────────────────────────────────────────────── */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex flex-col gap-2 min-w-0">
                  <h2 className="text-lg font-semibold text-white leading-snug wrap-break-word">
                    {selected.judul}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={selected.status} />
                    <span className="text-white/30 text-xs">
                      #{selected.id.substring(0, 8)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="shrink-0 text-white/40 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
                  aria-label="Tutup"
                >
                  <IconX />
                </button>
              </div>

              {/* ── Info Grid ─────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                {/* Left column */}
                <div className="space-y-4">
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Mahasiswa</p>
                    <p className="text-white/80 text-sm font-medium">
                      {selected.mahasiswa.nama}
                    </p>
                    <p className="text-white/45 text-xs font-mono">
                      {selected.mahasiswa.nim}
                    </p>
                    <p className="text-white/35 text-xs">
                      {selected.mahasiswa.jurusan}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">
                      Jenis Keluhan
                    </p>
                    <p className="text-white/80 text-sm">
                      {selected.jenisKeluhan}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">
                      Tanggal Kejadian
                    </p>
                    <p className="text-white/80 text-sm">
                      {fmtDate(selected.tanggalKejadian)}
                    </p>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Lokasi</p>
                    <p className="text-white/80 text-sm">
                      {selected.lokasi || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">
                      Ditindak Oleh
                    </p>
                    <p className="text-white/80 text-sm">
                      {selected.adminTindak
                        ? `${selected.adminTindak.nama} (@${selected.adminTindak.username})`
                        : "—"}
                    </p>
                  </div>
                  {selected.lampiranUrl && (
                    <div>
                      <p className="text-white/40 text-xs mb-0.5">Lampiran</p>
                      <a
                        href={selected.lampiranUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2 break-all"
                      >
                        Lihat Lampiran →
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Diterima</p>
                    <p className="text-white/60 text-xs">
                      {fmtDate(selected.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Isi Laporan ───────────────────────────────────────────────── */}
              <div className="mb-6">
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">
                  Isi Laporan
                </p>
                <div className="bg-black/20 border border-white/5 rounded-lg p-4 max-h-44 overflow-y-auto">
                  <p className="text-white/65 text-sm whitespace-pre-wrap leading-relaxed">
                    {selected.isi}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 mb-6" />

              {/* ── Update Status ─────────────────────────────────────────────── */}
              <div className="mb-6">
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">
                  Update Status
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={updateStatus}
                    onChange={(e) =>
                      setUpdateStatus(e.target.value as LaporanStatus)
                    }
                    className="bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                  >
                    {STATUS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={
                      updatingStatus || updateStatus === selected.status
                    }
                    className="bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {updatingStatus ? "Menyimpan…" : "Simpan Status"}
                  </button>
                  {updateStatus === selected.status && !updatingStatus && (
                    <span className="text-white/30 text-xs">
                      Status saat ini sudah dipilih
                    </span>
                  )}
                </div>
                {statusMsg && (
                  <p
                    className={`mt-2 text-xs ${statusMsg.type === "ok"
                        ? "text-green-400"
                        : "text-red-400"
                      }`}
                  >
                    {statusMsg.text}
                  </p>
                )}
              </div>

              <div className="border-t border-white/10 mb-6" />

              {/* ── Tindak Lanjut ─────────────────────────────────────────────── */}
              <div className="mb-6">
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">
                  Tindak Lanjut ({selected.tindakLanjut.length})
                </p>

                {/* Existing entries */}
                {selected.tindakLanjut.length > 0 && (
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                    {selected.tindakLanjut.map((tl) => (
                      <div
                        key={tl.id}
                        className="bg-white/[0.04] border border-white/8 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-white/75 text-xs font-semibold">
                            {tl.admin?.nama || tl.admin?.username || "Admin"}
                          </span>
                          <span className="text-white/30 text-xs font-mono">
                            @{tl.admin?.username}
                          </span>
                          <span className="text-white/25 text-xs ml-auto">
                            {fmtDate(tl.createdAt)}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed">
                          {tl.catatan}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {selected.tindakLanjut.length === 0 && (
                  <p className="text-white/30 text-sm mb-4">
                    Belum ada catatan tindak lanjut.
                  </p>
                )}

                {/* Add new */}
                <div className="space-y-2">
                  <label className="block text-sm text-white/70 mb-1.5">
                    Tambah Catatan
                  </label>
                  <textarea
                    value={newCatatan}
                    onChange={(e) => setNewCatatan(e.target.value)}
                    rows={3}
                    placeholder="Tulis catatan tindak lanjut…"
                    className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 resize-none"
                  />
                  <button
                    onClick={handleAddTindakLanjut}
                    disabled={submittingTindak || !newCatatan.trim()}
                    className="bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {submittingTindak ? "Mengirim…" : "Tambah Catatan"}
                  </button>
                  {tindakMsg && (
                    <p
                      className={`text-xs ${tindakMsg.type === "ok"
                          ? "text-green-400"
                          : "text-red-400"
                        }`}
                    >
                      {tindakMsg.text}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 mb-6" />

              {/* ── Log Perubahan ─────────────────────────────────────────────── */}
              <div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">
                  Log Perubahan
                </p>

                {logsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10 mt-2 shrink-0 animate-pulse" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-40 rounded bg-white/10 animate-pulse" />
                          <div className="h-3 w-56 rounded bg-white/5 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-white/30 text-sm">
                    Tidak ada log aktivitas untuk laporan ini.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {logs.map((log) => {
                      const before = log.dataBefore as Record<
                        string,
                        unknown
                      > | null;
                      const after = log.dataAfter as Record<
                        string,
                        unknown
                      > | null;
                      const hasStatusChange =
                        before?.status !== undefined &&
                        after?.status !== undefined;

                      return (
                        <div key={log.id} className="flex gap-3">
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30 mt-1.5 shrink-0" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="text-white/40 text-xs">
                                {fmtDate(log.createdAt)}
                              </span>
                              <span className="text-white/65 text-xs font-medium">
                                {log.admin?.username ?? "—"}
                              </span>
                              <AksiBadge aksi={log.aksi} />
                            </div>

                            {log.keterangan && (
                              <p className="text-white/45 text-xs mt-0.5">
                                {log.keterangan}
                              </p>
                            )}

                            {hasStatusChange && (
                              <p className="text-white/35 text-xs mt-0.5 font-mono">
                                <span className="text-yellow-400/70">
                                  {String(before!.status)}
                                </span>
                                <span className="text-white/20 mx-1.5">→</span>
                                <span className="text-green-400/70">
                                  {String(after!.status)}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Modal Footer ──────────────────────────────────────────────── */}
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={closeModal}
                  className="border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
