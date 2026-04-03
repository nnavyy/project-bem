"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminInfo = {
  id: string;
  username: string;
  nama: string;
  role: string;
};

type LogItem = {
  id: string;
  adminId: string;
  aksi: string;
  entityType: string | null;
  entityId: string | null;
  dataBefore: unknown;
  dataAfter: unknown;
  tokenId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  keterangan: string | null;
  createdAt: string;
  admin: AdminInfo;
};

type LogsResponse = {
  items: LogItem[];
  total: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const AKSI_OPTIONS = [
  "LOGIN",
  "LOGIN_GAGAL",
  "LOGOUT",
  "CREATE_ADMIN",
  "UPDATE_ADMIN",
  "CREATE_BLOG",
  "UPDATE_BLOG",
  "DELETE_BLOG",
  "CREATE_PORTOFOLIO",
  "UPDATE_PORTOFOLIO",
  "DELETE_PORTOFOLIO",
  "UPDATE_STATUS_LAPORAN",
  "TAMBAH_TINDAKLANJUT",
  "GENERATE_TOKEN",
  "REVOKE_TOKEN",
] as const;

const PAGE_SIZE = 20;

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

function formatJsonValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
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
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div
            className="h-3.5 rounded bg-white/10 animate-pulse"
            style={{ width: `${60 + ((i * 17) % 40)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Clear Logs Modal ─────────────────────────────────────────────────────────

function ClearLogsModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"all" | "before">("before");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClear() {
    if (mode === "before" && !date) {
      setError("Pilih tanggal terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ mode });
      if (mode === "before" && date)
        params.set("date", new Date(date).toISOString());
      const res = await fetch(`/api/superadmin/logs?${params.toString()}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Terjadi kesalahan.");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[#020617] border border-white/10 rounded-2xl p-6">
        <div className="mb-5">
          <h2 className="text-white font-semibold text-base">
            Bersihkan Log Aktivitas
          </h2>
          <p className="text-white/40 text-xs mt-1">
            Pilih log yang ingin dihapus
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
            <input
              type="radio"
              name="clearMode"
              value="before"
              checked={mode === "before"}
              onChange={() => setMode("before")}
              className="mt-0.5 accent-blue-400"
            />
            <div>
              <p className="text-white/80 text-sm font-medium">
                Hapus sebelum tanggal
              </p>
              <p className="text-white/40 text-xs mt-0.5">
                Lebih aman — hanya hapus log lama
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
            <input
              type="radio"
              name="clearMode"
              value="all"
              checked={mode === "all"}
              onChange={() => setMode("all")}
              className="mt-0.5 accent-red-400"
            />
            <div>
              <p className="text-white/80 text-sm font-medium">
                Hapus semua log
              </p>
              <p className="text-red-400/70 text-xs mt-0.5">
                ⚠ Tidak dapat dikembalikan
              </p>
            </div>
          </label>
        </div>

        {mode === "before" && (
          <div className="mb-4">
            <label className="block text-sm text-white/70 mb-1.5">
              Hapus log sebelum tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            />
          </div>
        )}

        {mode === "all" && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-red-400 text-xs mb-4">
            <svg
              className="w-4 h-4 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            Semua log akan dihapus permanen termasuk riwayat login dan aktivitas
            admin.
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className={[
              "flex-1 text-sm font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-50",
              mode === "all"
                ? "bg-red-500 text-white hover:bg-red-400"
                : "bg-white text-[#0f172a] hover:opacity-90",
            ].join(" ")}
          >
            {loading ? "Menghapus..." : "Hapus Log"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LogsPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [items, setItems] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [uniqueAdmins, setUniqueAdmins] = useState<AdminInfo[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);

  // ── Filter UI state (unsubmitted inputs) ────────────────────────────────────
  const [adminInput, setAdminInput] = useState("");
  const [aksiInput, setAksiInput] = useState("");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");

  // ── Committed / applied filter state ────────────────────────────────────────
  const [appliedFilters, setAppliedFilters] = useState({
    admin: "",
    aksi: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);

  // Keep a ref to uniqueAdmins so we can merge without stale closures
  const uniqueAdminsRef = useRef<Map<string, AdminInfo>>(new Map());

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (appliedFilters.admin) params.set("adminId", appliedFilters.admin);
      if (appliedFilters.aksi) params.set("aksi", appliedFilters.aksi);
      if (appliedFilters.from) params.set("dateFrom", appliedFilters.from);
      if (appliedFilters.to) params.set("dateTo", appliedFilters.to);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/headadmin/logs?${params.toString()}`);
      if (!res.ok) throw new Error(`Gagal memuat log (${res.status})`);
      const data: LogsResponse = await res.json();

      const safeItems = data.items ?? [];
      setItems(safeItems);
      setTotal(data.total ?? 0);

      // Accumulate unique admins from every page fetch
      safeItems.forEach((item) => {
        if (item.admin && item.adminId) {
          uniqueAdminsRef.current.set(item.adminId, item.admin);
        }
      });
      setUniqueAdmins(Array.from(uniqueAdminsRef.current.values()));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleApplyFilter() {
    setPage(1);
    setAppliedFilters({
      admin: adminInput,
      aksi: aksiInput,
      from: dateFromInput,
      to: dateToInput,
    });
  }

  function handleResetFilter() {
    setAdminInput("");
    setAksiInput("");
    setDateFromInput("");
    setDateToInput("");
    setPage(1);
    setAppliedFilters({ admin: "", aksi: "", from: "", to: "" });
  }

  function toggleRow(id: string) {
    setExpandedRow((prev) => (prev === id ? null : id));
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function getPageNumbers(): number[] {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: number[] = [];
    let l: number | undefined;

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) range.unshift(-1); // left dots
    if (page + delta < totalPages - 1) range.push(-2); // right dots

    rangeWithDots.push(1);
    range.forEach((r) => rangeWithDots.push(r));
    if (totalPages > 1) rangeWithDots.push(totalPages);

    // Deduplicate
    return rangeWithDots.filter((v) => {
      if (v < 0) return true; // keep dots
      if (l === v) return false;
      l = v;
      return true;
    });
  }

  const pageNumbers = totalPages > 1 ? getPageNumbers() : [];

  // ── Render ────────────────────────────────────────────────────────────────
  const hasActiveFilters =
    appliedFilters.admin ||
    appliedFilters.aksi ||
    appliedFilters.from ||
    appliedFilters.to;

  return (
    <main className="p-6 lg:p-8">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Log Aktivitas</h1>
          <p className="text-white/50 text-sm mt-0.5">
            Rekam jejak seluruh aktivitas admin sistem
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
              Filter aktif
            </span>
          )}
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-2 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 hover:bg-red-500/10 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
            Bersihkan Log
          </button>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-[#020617] border border-white/10 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Admin filter */}
          <div className="flex flex-col min-w-[180px] flex-1">
            <label className="block text-sm text-white/70 mb-1.5">Admin</label>
            <select
              value={adminInput}
              onChange={(e) => setAdminInput(e.target.value)}
              className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            >
              <option value="">Semua Admin</option>
              {uniqueAdmins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} (@{a.username})
                </option>
              ))}
            </select>
          </div>

          {/* Aksi filter */}
          <div className="flex flex-col min-w-[200px] flex-1">
            <label className="block text-sm text-white/70 mb-1.5">Aksi</label>
            <select
              value={aksiInput}
              onChange={(e) => setAksiInput(e.target.value)}
              className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            >
              <option value="">Semua Aksi</option>
              {AKSI_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div className="flex flex-col min-w-[160px] flex-1">
            <label className="block text-sm text-white/70 mb-1.5">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFromInput}
              onChange={(e) => setDateFromInput(e.target.value)}
              className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 scheme-dark"
            />
          </div>

          {/* Date to */}
          <div className="flex flex-col min-w-[160px] flex-1">
            <label className="block text-sm text-white/70 mb-1.5">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
              className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 scheme-dark"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleApplyFilter}
              className="bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
            >
              Terapkan
            </button>
            <button
              onClick={handleResetFilter}
              className="border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Total info ──────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <p className="text-white/40 text-xs mb-3">
          {total > 0
            ? `${total.toLocaleString("id-ID")} log ditemukan`
            : "Tidak ada log yang cocok dengan filter"}
        </p>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#020617] border border-white/10 rounded-xl overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchLogs}
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
                    Waktu
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Admin
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Aksi
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Entity
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    IP Address
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-white/40 text-sm text-center py-12"
                    >
                      Tidak ada log aktivitas
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isExpanded = expandedRow === item.id;
                    const hasData =
                      item.dataBefore !== null &&
                      item.dataBefore !== undefined &&
                      item.dataAfter !== null &&
                      item.dataAfter !== undefined;

                    return (
                      <React.Fragment key={item.id}>
                        {/* ── Main row ────────────────────────────────────── */}
                        <tr
                          onClick={() => toggleRow(item.id)}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer select-none ${
                            isExpanded ? "bg-white/[0.03]" : ""
                          }`}
                        >
                          {/* Waktu */}
                          <td className="py-3 px-4 text-white/70 whitespace-nowrap text-xs">
                            {fmtDate(item.createdAt)}
                          </td>

                          {/* Admin */}
                          <td className="py-3 px-4">
                            <p className="text-white/80 font-medium text-xs">
                              {item.admin?.username ?? "—"}
                            </p>
                            {item.admin?.nama && (
                              <p className="text-white/40 text-xs mt-0.5">
                                {item.admin.nama}
                              </p>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4">
                            <AksiBadge aksi={item.aksi} />
                          </td>

                          {/* Entity */}
                          <td className="py-3 px-4 font-mono">
                            {item.entityType ? (
                              <span className="text-white/60 text-xs">
                                <span className="text-white/70">
                                  {item.entityType}
                                </span>
                                {item.entityId && (
                                  <span className="text-white/35 ml-1">
                                    #{item.entityId.substring(0, 8)}
                                    {item.entityId.length > 8 ? "…" : ""}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-white/30 text-xs">—</span>
                            )}
                          </td>

                          {/* IP */}
                          <td className="py-3 px-4 text-white/50 text-xs font-mono whitespace-nowrap">
                            {item.ipAddress ?? "—"}
                          </td>

                          {/* Keterangan */}
                          <td className="py-3 px-4 text-white/55 text-xs max-w-[220px]">
                            <div className="flex items-center gap-2">
                              <span className="truncate">
                                {item.keterangan ?? "—"}
                              </span>
                              {(hasData || item.userAgent) && (
                                <svg
                                  className={`w-3.5 h-3.5 text-white/30 shrink-0 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* ── Expanded row ─────────────────────────────────── */}
                        {isExpanded && (
                          <tr className="border-b border-white/5 bg-black/20">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="space-y-4">
                                {/* dataBefore / dataAfter grid */}
                                {(item.dataBefore !== null &&
                                  item.dataBefore !== undefined) ||
                                (item.dataAfter !== null &&
                                  item.dataAfter !== undefined) ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {item.dataBefore !== null &&
                                      item.dataBefore !== undefined && (
                                        <div>
                                          <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-2">
                                            Data Sebelum
                                          </p>
                                          <pre className="text-xs text-white/70 bg-black/40 rounded p-3 overflow-auto max-h-48 border border-white/5">
                                            {formatJsonValue(item.dataBefore)}
                                          </pre>
                                        </div>
                                      )}
                                    {item.dataAfter !== null &&
                                      item.dataAfter !== undefined && (
                                        <div>
                                          <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-2">
                                            Data Sesudah
                                          </p>
                                          <pre className="text-xs text-white/70 bg-black/40 rounded p-3 overflow-auto max-h-48 border border-white/5">
                                            {formatJsonValue(item.dataAfter)}
                                          </pre>
                                        </div>
                                      )}
                                  </div>
                                ) : (
                                  <p className="text-white/30 text-xs">
                                    Tidak ada data perubahan tersimpan.
                                  </p>
                                )}

                                {/* User-Agent */}
                                {item.userAgent && (
                                  <div>
                                    <p className="text-white/30 text-xs uppercase tracking-wider font-medium mb-1">
                                      User-Agent
                                    </p>
                                    <p className="text-white/30 text-xs font-mono break-all leading-relaxed">
                                      {item.userAgent}
                                    </p>
                                  </div>
                                )}

                                {/* Token ID */}
                                {item.tokenId && (
                                  <p className="text-white/25 text-xs font-mono">
                                    Token: {item.tokenId}
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <p className="text-white/40 text-xs">
            Halaman {page} dari {totalPages} &bull;{" "}
            {Math.min((page - 1) * PAGE_SIZE + 1, total)}–
            {Math.min(page * PAGE_SIZE, total)} dari{" "}
            {total.toLocaleString("id-ID")} log
          </p>

          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm border border-white/20 text-white/70 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              aria-label="Halaman sebelumnya"
            >
              ←
            </button>

            {pageNumbers.map((p, idx) =>
              p < 0 ? (
                <span
                  key={`dots-${idx}`}
                  className="px-1 text-white/30 text-sm select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[36px] px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    page === p
                      ? "bg-white text-[#0f172a] border-white font-semibold"
                      : "border-white/20 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm border border-white/20 text-white/70 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              aria-label="Halaman berikutnya"
            >
              →
            </button>
          </div>
        </div>
      )}
      {showClearModal && (
        <ClearLogsModal
          onClose={() => setShowClearModal(false)}
          onSuccess={() => {
            fetchLogs();
            setShowClearModal(false);
          }}
        />
      )}
    </main>
  );
}
