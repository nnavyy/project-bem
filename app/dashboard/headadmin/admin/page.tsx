"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveToken = {
  id: string;
  tokenRole: string;
  isPermanent: boolean;
  isSingleUse: boolean;
  expiredAt: string | null;
  claimedAt: string | null;
  createdAt: string;
};

type AdminRow = {
  id: string;
  username: string;
  nama: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  activeToken: ActiveToken | null;
  lastLogin: { at: string; ip: string | null } | null;
};

type GenerateTokenResult = {
  token: string;
  tokenId: string;
  tokenRole: string;
  meta: {
    admin: { id: string; username: string; nama: string; role: string } | null;
    generatedBy: { id: string; username: string; nama: string; role: string } | null;
    isPermanent: boolean;
    expiredAt: string | null;
    isSingleUse: boolean;
    createdAt: string;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayIsoMin() {
  // Returns datetime-local minimum string (now)
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const IconKey = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const IconCopy = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const IconX = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconWarn = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[40, 28, 36, 20, 24, 32, 56].map((w, i) => (
        <td key={i} className="py-3 px-4">
          <div className={`animate-pulse bg-white/5 rounded h-3.5 w-${w}`} style={{ width: `${w * 4}px` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Create Admin Modal ───────────────────────────────────────────────────────

function CreateAdminModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState("");
  const [nama, setNama] = useState("");
  const [role, setRole] = useState<"ADMIN" | "HEAD_ADMIN">("ADMIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !nama.trim()) {
      setError("Username dan nama wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/headadmin/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), nama: nama.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 202) {
        setError(data.message ?? "Terjadi kesalahan.");
        return;
      }
      if (res.status === 202) {
        // Pending approval
        alert(data.message || "Request berhasil diajukan, menunggu approval Super Admin.");
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
      <div className="w-full max-w-md bg-[#020617] border border-white/10 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold text-base">Tambah Admin Baru</h2>
            <p className="text-white/40 text-xs mt-0.5">Buat akun baru dengan role yang dipilih</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cth: admin_budi"
              className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
              autoFocus
            />
            <p className="text-white/30 text-xs mt-1">
              Hanya huruf, angka, underscore (_), dan strip (-)
            </p>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="cth: Budi Santoso"
              className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1.5">Role</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <input
                    type="radio"
                    name="createRole"
                    className="peer appearance-none w-4 h-4 rounded-full border border-white/20 checked:border-blue-400 cursor-pointer transition-colors"
                    checked={role === "ADMIN"}
                    onChange={() => setRole("ADMIN")}
                  />
                  <div className="absolute w-2 h-2 rounded-full bg-blue-400 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">ADMIN</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <input
                    type="radio"
                    name="createRole"
                    className="peer appearance-none w-4 h-4 rounded-full border border-white/20 checked:border-purple-400 cursor-pointer transition-colors"
                    checked={role === "HEAD_ADMIN"}
                    onChange={() => setRole("HEAD_ADMIN")}
                  />
                  <div className="absolute w-2 h-2 rounded-full bg-purple-400 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <span className="text-sm text-white/80 group-hover:text-white transition-colors">HEAD_ADMIN</span>
              </label>
            </div>
          </div>

          {role === "HEAD_ADMIN" && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 text-yellow-400 text-xs">
              <IconWarn />
              <span>
                Pembuatan akun HEAD_ADMIN memerlukan persetujuan Super Admin. Request akan masuk ke antrian approval.
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-red-400 text-sm">
              <IconWarn />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Membuat..." : `Buat ${role === "HEAD_ADMIN" ? "Head Admin" : "Admin"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Generate Token Modal ─────────────────────────────────────────────────────

function GenerateTokenModal({
  admin,
  onClose,
  onResult,
}: {
  admin: AdminRow;
  onClose: () => void;
  onResult: (result: GenerateTokenResult) => void;
}) {
  const [isPermanent, setIsPermanent] = useState(false);
  const [isSingleUse, setIsSingleUse] = useState(false);
  const [expiredAt, setExpiredAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        tokenRole: "ADMIN",
        adminId: admin.id,
        isPermanent,
        isSingleUse,
      };
      if (!isPermanent && expiredAt) {
        body.expiredAt = new Date(expiredAt).toISOString();
      }

      const res = await fetch("/api/headadmin/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? data.message ?? "Terjadi kesalahan.");
        return;
      }
      onResult(data as GenerateTokenResult);
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#020617] border border-white/10 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold text-base">Generate Token</h2>
            <p className="text-white/40 text-xs mt-0.5">
              Token untuk{" "}
              <span className="text-white/70 font-medium">@{admin.username}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Permanent */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5 relative">
              <input
                type="checkbox"
                checked={isPermanent}
                onChange={(e) => {
                  setIsPermanent(e.target.checked);
                  if (e.target.checked) {
                    setExpiredAt("");
                    setIsSingleUse(false);
                  }
                }}
                className="sr-only"
              />
              <div
                className={[
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  isPermanent
                    ? "bg-white border-white"
                    : "border-white/20 group-hover:border-white/40",
                ].join(" ")}
              >
                {isPermanent && (
                  <svg className="w-2.5 h-2.5 text-[#0f172a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Token Permanen</p>
              <p className="text-white/40 text-xs mt-0.5">
                Token tidak memiliki tanggal kadaluarsa
              </p>
            </div>
          </label>

          {/* Single Use */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5 relative">
              <input
                type="checkbox"
                checked={isSingleUse}
                onChange={(e) => {
                  setIsSingleUse(e.target.checked);
                  if (e.target.checked) {
                    setIsPermanent(false);
                  }
                }}
                className="sr-only"
              />
              <div
                className={[
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  isSingleUse
                    ? "bg-white border-white"
                    : "border-white/20 group-hover:border-white/40",
                ].join(" ")}
              >
                {isSingleUse && (
                  <svg className="w-2.5 h-2.5 text-[#0f172a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Single Use</p>
              <p className="text-white/40 text-xs mt-0.5">
                Token hangus setelah 1x login berhasil
              </p>
            </div>
          </label>

          {/* Expired At */}
          <div>
            <label className="block text-sm text-white/70 mb-1.5">
              Kadaluarsa
              {isPermanent && (
                <span className="ml-2 text-white/30 text-xs font-normal">(dinonaktifkan — token permanen)</span>
              )}
            </label>
            <input
              type="datetime-local"
              value={expiredAt}
              min={todayIsoMin()}
              onChange={(e) => setExpiredAt(e.target.value)}
              disabled={isPermanent}
              className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
            />
            {!isPermanent && (
              <p className="text-white/30 text-xs mt-1">
                Kosongkan untuk default 1 hari dari sekarang
              </p>
            )}
          </div>

          {/* Note about active token */}
          <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 text-yellow-400 text-xs">
            <IconWarn />
            <span>
              Token aktif admin ini akan otomatis direvoke dan digantikan oleh token baru.
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-red-400 text-sm">
              <IconWarn />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Token"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Token Result Modal ───────────────────────────────────────────────────────

function TokenResultModal({
  result,
  onClose,
}: {
  result: GenerateTokenResult;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(result.token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#020617] border border-white/10 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold text-base">Token Berhasil Dibuat</h2>
            <p className="text-white/40 text-xs mt-0.5">
              Role:{" "}
              <span className="text-white/70">{result.tokenRole}</span>
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
            <IconCheck />
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2.5 bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-4 py-3 mb-4">
          <IconWarn />
          <p className="text-yellow-400 text-xs leading-relaxed">
            <strong className="font-semibold">Simpan token ini sekarang!</strong> Token tidak akan
            ditampilkan lagi setelah modal ini ditutup.
          </p>
        </div>

        {/* Token Display */}
        <div className="bg-[#0b1220] border border-white/10 rounded-xl p-4 mb-4">
          <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-medium">Token</p>
          <div className="flex items-start gap-3">
            <code className="flex-1 text-green-400 text-xs font-mono break-all leading-relaxed select-all">
              {result.token}
            </code>
            <button
              onClick={handleCopy}
              title="Salin token"
              className={[
                "shrink-0 p-1.5 rounded-lg border transition-colors",
                copied
                  ? "border-green-500/40 bg-green-500/10 text-green-400"
                  : "border-white/10 text-white/40 hover:text-white hover:bg-white/10",
              ].join(" ")}
            >
              {copied ? <IconCheck /> : <IconCopy />}
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-white/40 mb-0.5">Admin</p>
            <p className="text-white/80 font-medium truncate">
              {result.meta.admin?.username ?? "—"}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-white/40 mb-0.5">Permanen</p>
            <p className="text-white/80 font-medium">
              {result.meta.isPermanent ? "Ya" : "Tidak"}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-white/40 mb-0.5">Single Use</p>
            <p className="text-white/80 font-medium">
              {result.meta.isSingleUse ? "Ya" : "Tidak"}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-white/40 mb-0.5">Kadaluarsa</p>
            <p className="text-white/80 font-medium truncate">
              {result.meta.isPermanent
                ? "Permanen"
                : result.meta.expiredAt
                ? fmtDate(result.meta.expiredAt)
                : "1 hari"}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity"
        >
          Tutup & Selesai
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [generateTarget, setGenerateTarget] = useState<AdminRow | null>(null);
  const [tokenResult, setTokenResult] = useState<GenerateTokenResult | null>(null);

  // Per-row toggle loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchAdmins = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch("/api/headadmin/admin")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Urutkan admin: yang aktif ditaruh di atas, nonaktif di bawah
          const sorted = data.sort((a, b) => {
            if (a.isActive === b.isActive) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return a.isActive ? -1 : 1;
          });
          setAdmins(sorted);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  async function handleToggleActive(admin: AdminRow) {
    setTogglingId(admin.id);
    try {
      const res = await fetch("/api/headadmin/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id, isActive: !admin.isActive }),
      });
      if (res.ok) fetchAdmins();
    } catch {
      // silently ignore, user can retry
    } finally {
      setTogglingId(null);
    }
  }

  function handleTokenResult(result: GenerateTokenResult) {
    setGenerateTarget(null);
    setTokenResult(result);
    fetchAdmins();
  }

  return (
    <main className="p-6 lg:p-8 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Manajemen Admin</h1>
          <p className="text-white/50 text-sm mt-0.5">
            Kelola akun admin dan akses token login
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
        >
          <IconPlus />
          Tambah Admin
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-[#020617] border border-white/10 rounded-xl">
        {/* Summary bar */}
        {!loading && !error && (
          <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-4 text-xs text-white/40">
            <span>
              Total:{" "}
              <span className="text-white/70 font-medium">{admins.length}</span>
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span>
              Aktif:{" "}
              <span className="text-green-400 font-medium">
                {admins.filter((a) => a.isActive).length}
              </span>
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span>
              Nonaktif:{" "}
              <span className="text-white/50 font-medium">
                {admins.filter((a) => !a.isActive).length}
              </span>
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4 w-12">
                  No
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Username
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Nama
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Role
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Status
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Token Aktif
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Last Login
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-white/40 text-sm text-center py-12">
                    Gagal memuat data admin. Silakan muat ulang halaman.
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-white/40 text-sm text-center py-12">
                    Belum ada admin terdaftar.
                  </td>
                </tr>
              ) : (
                admins.map((admin, idx) => (
                  <tr
                    key={admin.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    {/* No */}
                    <td className="py-3 px-4 text-white/40 text-xs">{idx + 1}</td>

                    {/* Username */}
                    <td className="py-3 px-4">
                      <span className="text-white/80 font-medium">@{admin.username}</span>
                    </td>

                    {/* Nama */}
                    <td className="py-3 px-4 text-white/70">{admin.nama}</td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className={[
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        admin.role === "HEAD_ADMIN"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-blue-500/20 text-blue-400",
                      ].join(" ")}>
                        {admin.role === "HEAD_ADMIN" ? "Head Admin" : "Admin"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {admin.isActive ? (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                          Aktif
                        </span>
                      ) : (
                        <span className="bg-white/10 text-white/50 text-xs px-2 py-0.5 rounded-full font-medium">
                          Nonaktif
                        </span>
                      )}
                    </td>

                    {/* Token Aktif */}
                    <td className="py-3 px-4">
                      {admin.activeToken ? (
                        <div>
                          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                            Ada
                          </span>
                          <p className="text-white/30 text-xs mt-1">
                            {admin.activeToken.isPermanent
                              ? "Permanen"
                              : admin.activeToken.expiredAt
                              ? `Exp: ${fmtDate(admin.activeToken.expiredAt)}`
                              : "—"}
                          </p>
                        </div>
                      ) : (
                        <span className="bg-white/10 text-white/50 text-xs px-2 py-0.5 rounded-full font-medium">
                          Tidak Ada
                        </span>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-4 text-white/50 text-xs whitespace-nowrap">
                      {admin.lastLogin ? (
                        <div>
                          <p>{fmtDate(admin.lastLogin.at)}</p>
                          {admin.lastLogin.ip && (
                            <p className="text-white/30 mt-0.5">{admin.lastLogin.ip}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/30">Belum pernah</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {/* Generate Token */}
                        <button
                          onClick={() => setGenerateTarget(admin)}
                          disabled={!admin.isActive || admin.role === "HEAD_ADMIN"}
                          title={admin.role === "HEAD_ADMIN" ? "Tidak ada akses mengedit role setara" : !admin.isActive ? "Admin nonaktif" : "Generate Token"}
                          className="flex items-center gap-1.5 border border-white/20 text-white text-xs rounded-lg px-2.5 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <IconKey />
                          Token
                        </button>

                        {/* Toggle Active */}
                        <button
                          onClick={() => handleToggleActive(admin)}
                          disabled={togglingId === admin.id || admin.role === "HEAD_ADMIN"}
                          title={admin.role === "HEAD_ADMIN" ? "Tidak ada akses mengedit role setara" : ""}
                          className={[
                            "text-xs rounded-lg px-2.5 py-1.5 transition-colors",
                            admin.isActive
                              ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              : "text-green-400 hover:text-green-300 hover:bg-green-500/10",
                            togglingId === admin.id || admin.role === "HEAD_ADMIN" ? "opacity-50 cursor-not-allowed" : "",
                          ].join(" ")}
                        >
                          {togglingId === admin.id
                            ? "..."
                            : admin.isActive
                            ? "Nonaktifkan"
                            : "Aktifkan"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateAdminModal
          onClose={() => setShowCreate(false)}
          onSuccess={fetchAdmins}
        />
      )}

      {generateTarget && (
        <GenerateTokenModal
          admin={generateTarget}
          onClose={() => setGenerateTarget(null)}
          onResult={handleTokenResult}
        />
      )}

      {tokenResult && (
        <TokenResultModal
          result={tokenResult}
          onClose={() => setTokenResult(null)}
        />
      )}
    </main>
  );
}
