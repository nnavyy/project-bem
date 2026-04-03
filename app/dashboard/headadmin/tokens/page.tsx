"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TokenRow = {
  id: string;
  tokenRole: string;
  adminId: string | null;
  generatedBy: string | null;
  expiredAt: string | null;
  isPermanent: boolean;
  isSingleUse: boolean;
  isRevoked: boolean;
  revokedAt: string | null;
  claimedAt: string | null;
  createdAt: string;
  admin: {
    id: string;
    username: string;
    nama: string;
    role: string;
    isActive: boolean;
  } | null;
  headAdmin: {
    id: string;
    username: string;
    nama: string;
    role: string;
    isActive: boolean;
  } | null;
};

type AdminOption = {
  id: string;
  username: string;
  nama: string;
  role: string;
  isActive: boolean;
};

type GenerateTokenResult = {
  token: string;
  tokenId: string;
  tokenRole: string;
  meta: {
    admin: { id: string; username: string; nama: string; role: string } | null;
    generatedBy: {
      id: string;
      username: string;
      nama: string;
      role: string;
    } | null;
    isPermanent: boolean;
    expiredAt: string | null;
    isSingleUse: boolean;
    createdAt: string;
  };
};

type FilterRole = "all" | "ADMIN" | "HEAD_ADMIN";
type FilterStatus = "all" | "active" | "revoked" | "expired";

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
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16);
}

function getTokenStatus(token: TokenRow): "active" | "revoked" | "expired" {
  if (token.isRevoked) return "revoked";
  if (
    !token.isPermanent &&
    token.expiredAt &&
    new Date(token.expiredAt) < new Date()
  )
    return "expired";
  return "active";
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconKey = () => (
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
      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
    />
  </svg>
);

const IconChevronDown = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
    />
  </svg>
);

const IconChevronUp = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 15.75l7.5-7.5 7.5 7.5"
    />
  </svg>
);

const IconCopy = () => (
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
      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
    />
  </svg>
);

const IconCheck = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 12.75l6 6 9-13.5"
    />
  </svg>
);

const IconX = () => (
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

const IconWarn = () => (
  <svg
    className="w-4 h-4 shrink-0"
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
);

const IconFilter = () => (
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
      d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
    />
  </svg>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "active" | "revoked" | "expired" }) {
  if (status === "active")
    return (
      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
        Aktif
      </span>
    );
  if (status === "revoked")
    return (
      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
        Direvoke
      </span>
    );
  return (
    <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
      Kadaluarsa
    </span>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div
            className="animate-pulse bg-white/5 rounded h-3.5"
            style={{
              width: `${[24, 56, 64, 72, 48, 32, 32, 64, 56, 48, 48][i] ?? 40}px`,
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Custom Checkbox ──────────────────────────────────────────────────────────

function Checkbox({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="mt-0.5 shrink-0">
        <div
          onClick={() => onChange(!checked)}
          className={[
            "w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer",
            checked
              ? "bg-white border-white"
              : "border-white/20 group-hover:border-white/40",
          ].join(" ")}
        >
          {checked && (
            <svg
              className="w-2.5 h-2.5 text-[#0f172a]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          )}
        </div>
      </div>
      <div>
        <p className="text-white/80 text-sm font-medium leading-tight">
          {label}
        </p>
        {sub && <p className="text-white/40 text-xs mt-0.5">{sub}</p>}
      </div>
    </label>
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
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#020617] border border-white/10 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold text-base">
              Token Berhasil Dibuat
            </h2>
            <p className="text-white/40 text-xs mt-0.5">
              Role:{" "}
              <span className="text-white/70 font-medium">
                {result.tokenRole}
              </span>
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
            <strong className="font-semibold">
              Simpan token ini sekarang!
            </strong>{" "}
            Token tidak akan ditampilkan lagi setelah modal ini ditutup.
          </p>
        </div>

        {/* Token Display */}
        <div className="bg-[#0b1220] border border-white/10 rounded-xl p-4 mb-4">
          <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-medium">
            Token
          </p>
          <div className="flex items-start gap-3">
            <code className="flex-1 text-green-400 text-xs font-mono break-all leading-relaxed select-all">
              {result.token}
            </code>
            <button
              onClick={handleCopy}
              title={copied ? "Tersalin!" : "Salin token"}
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

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-white/40 mb-0.5">Admin Pemilik</p>
            <p className="text-white/80 font-medium truncate">
              {result.meta.admin?.username ?? "Belum diklaim"}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-white/40 mb-0.5">Dibuat Oleh</p>
            <p className="text-white/80 font-medium truncate">
              {result.meta.generatedBy?.username ?? "Developer"}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-white/40 mb-0.5">Permanen</p>
            <p className="text-white/80 font-medium">
              {result.meta.isPermanent ? "Ya" : "Tidak"}
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

// ─── Generate Token Panel ─────────────────────────────────────────────────────

function GenerateTokenPanel({
  admins,
  onResult,
  onPendingApproval,
}: {
  admins: AdminOption[];
  onResult: (result: GenerateTokenResult) => void;
  onPendingApproval: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tokenRole, setTokenRole] = useState<"ADMIN" | "HEAD_ADMIN">("ADMIN");
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [isPermanent, setIsPermanent] = useState(false);
  const [isSingleUse, setIsSingleUse] = useState(false);
  const [expiredAt, setExpiredAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeAdmins = admins.filter((a) => a.isActive && a.role === tokenRole);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const body: Record<string, unknown> = {
      tokenRole: tokenRole,
      isPermanent,
      isSingleUse,
    };
    if (selectedAdminId) body.adminId = selectedAdminId;
    if (!isPermanent && expiredAt)
      body.expiredAt = new Date(expiredAt).toISOString();

    setLoading(true);
    try {
      const res = await fetch("/api/headadmin/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      // Handle pending approval (202) — HEAD_ADMIN generating HEAD_ADMIN token
      if (res.status === 202) {
        setTokenRole("ADMIN");
        setSelectedAdminId("");
        setIsPermanent(false);
        setIsSingleUse(false);
        setExpiredAt("");
        setOpen(false);
        onPendingApproval();
        return;
      }

      if (!res.ok) {
        setError(data.error ?? data.message ?? "Terjadi kesalahan.");
        return;
      }
      // Reset form
      setTokenRole("ADMIN");
      setSelectedAdminId("");
      setIsPermanent(false);
      setIsSingleUse(false);
      setExpiredAt("");
      setOpen(false);
      onResult(data as GenerateTokenResult);
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#020617] border border-white/10 rounded-xl mb-6 overflow-hidden">
      {/* Panel Toggle Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
            <IconKey />
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-semibold">
              Generate Token Baru
            </p>
            <p className="text-white/40 text-xs mt-0.5">
              Buat token login untuk admin
            </p>
          </div>
        </div>
        <span className="text-white/30">
          {open ? <IconChevronUp /> : <IconChevronDown />}
        </span>
      </button>

      {/* Collapsible Form */}
      {open && (
        <div className="border-t border-white/10 px-5 py-5">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Token Role selector */}
              <div className="sm:col-span-2">
                <label className="block text-sm text-white/70 mb-1.5">
                  Role Token{" "}
                  {tokenRole === "HEAD_ADMIN" && (
                    <span className="ml-2 text-xs text-yellow-400 font-normal bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                      Butuh Approval Super Admin
                    </span>
                  )}{" "}
                  <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <input
                        type="radio"
                        name="tokenRole"
                        className="peer appearance-none w-4 h-4 rounded-full border border-white/20 checked:border-blue-400 cursor-pointer transition-colors"
                        checked={tokenRole === "ADMIN"}
                        onChange={() => {
                          setTokenRole("ADMIN");
                          setSelectedAdminId(""); // reset selected admin
                        }}
                      />
                      <div className="absolute w-2 h-2 rounded-full bg-blue-400 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                      ADMIN
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <input
                        type="radio"
                        name="tokenRole"
                        className="peer appearance-none w-4 h-4 rounded-full border border-white/20 checked:border-purple-400 cursor-pointer transition-colors"
                        checked={tokenRole === "HEAD_ADMIN"}
                        onChange={() => {
                          setTokenRole("HEAD_ADMIN");
                          setSelectedAdminId(""); // reset selected admin
                        }}
                      />
                      <div className="absolute w-2 h-2 rounded-full bg-purple-400 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                      HEAD_ADMIN
                    </span>
                  </label>
                </div>
              </div>

              {/* Admin selector */}
              <div className="sm:col-span-2 mt-2">
                <label className="block text-sm text-white/70 mb-1.5">
                  Admin Penerima{" "}
                  <span className="text-white/30 font-normal">(opsional)</span>
                </label>
                <select
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 appearance-none"
                  style={{ backgroundImage: "none" }}
                >
                  <option value="">— Tanpa admin (token unclaimed) —</option>
                  {activeAdmins.map((a) => (
                    <option key={a.id} value={a.id}>
                      @{a.username} — {a.nama}
                    </option>
                  ))}
                </select>
                {activeAdmins.length === 0 && (
                  <p className="text-white/30 text-xs mt-1">
                    Tidak ada admin aktif tersedia.
                  </p>
                )}
                {selectedAdminId && (
                  <p className="text-yellow-400/70 text-xs mt-1">
                    Token aktif admin ini akan otomatis direvoke.
                  </p>
                )}
              </div>

              {/* isPermanent */}
              <div className="flex items-start">
                <Checkbox
                  checked={isPermanent}
                  onChange={(v) => {
                    setIsPermanent(v);
                    if (v) {
                      setExpiredAt("");
                      setIsSingleUse(false);
                    }
                  }}
                  label="Token Permanen"
                  sub="Tidak ada tanggal kadaluarsa"
                />
              </div>

              {/* isSingleUse */}
              <div className="flex items-start">
                <Checkbox
                  checked={isSingleUse}
                  onChange={(v) => {
                    setIsSingleUse(v);
                    if (v) {
                      setIsPermanent(false);
                    }
                  }}
                  label="Single Use"
                  sub="Hangus setelah 1x login"
                />
              </div>

              {/* expiredAt */}
              <div className="sm:col-span-2">
                <label className="block text-sm text-white/70 mb-1.5">
                  Tanggal Kadaluarsa
                  {isPermanent && (
                    <span className="ml-2 text-white/30 text-xs font-normal">
                      (dinonaktifkan — token permanen)
                    </span>
                  )}
                </label>
                <input
                  type="datetime-local"
                  value={expiredAt}
                  min={todayIsoMin()}
                  onChange={(e) => setExpiredAt(e.target.value)}
                  disabled={isPermanent}
                  className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
                />
                {!isPermanent && (
                  <p className="text-white/30 text-xs mt-1">
                    Kosongkan untuk default 1 hari dari sekarang
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-red-400 text-sm mb-4">
                <IconWarn />
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setError("");
                }}
                className="border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <IconKey />
                {loading ? "Generating..." : "Generate Token"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TokenManagementPage() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // Token result modal
  const [tokenResult, setTokenResult] = useState<GenerateTokenResult | null>(
    null,
  );

  // Pending approval notice (shown when a 202 is returned for HEAD_ADMIN token generation)
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      fetch("/api/headadmin/tokens").then((r) => r.json()),
      fetch("/api/headadmin/admin").then((r) => r.json()),
    ])
      .then(([tokensData, adminsData]) => {
        if (Array.isArray(tokensData)) setTokens(tokensData);
        else setError(true);
        if (Array.isArray(adminsData)) setAdmins(adminsData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtered and sorted tokens
  const filteredTokens = tokens
    .filter((t) => {
      const matchRole = filterRole === "all" || t.tokenRole === filterRole;
      const status = getTokenStatus(t);
      const matchStatus = filterStatus === "all" || status === filterStatus;
      return matchRole && matchStatus;
    })
    .sort((a, b) => {
      // Aktif ditaruh paling atas, kemudian expired, lalu direvoke.
      const statusOrder = { active: 1, expired: 2, revoked: 3 };
      const statusA = statusOrder[getTokenStatus(a)];
      const statusB = statusOrder[getTokenStatus(b)];

      if (statusA !== statusB) return statusA - statusB;

      // Jika status sama, urutkan berdasarkan yang paling baru dibuat
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  async function handleRevoke(token: TokenRow) {
    setRevokingId(token.id);
    setRevokeError(null);
    try {
      const res = await fetch(`/api/headadmin/tokens/${token.id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        setRevokeError(data.message ?? "Gagal merevoke token.");
      }
    } catch {
      setRevokeError("Gagal menghubungi server.");
    } finally {
      setRevokingId(null);
    }
  }

  function handleTokenResult(result: GenerateTokenResult) {
    setTokenResult(result);
    fetchData();
  }

  // Summary counts
  const countAll = tokens.length;
  const countActive = tokens.filter(
    (t) => getTokenStatus(t) === "active",
  ).length;
  const countRevoked = tokens.filter(
    (t) => getTokenStatus(t) === "revoked",
  ).length;
  const countExpired = tokens.filter(
    (t) => getTokenStatus(t) === "expired",
  ).length;

  return (
    <main className="p-6 lg:p-8 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Manajemen Token</h1>
          <p className="text-white/50 text-sm mt-0.5">
            Pantau dan kelola semua token akses admin
          </p>
        </div>
        {!loading && !error && (
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium">
              {countActive} Aktif
            </span>
            <span className="bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full font-medium">
              {countExpired} Kadaluarsa
            </span>
            <span className="bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full font-medium">
              {countRevoked} Direvoke
            </span>
          </div>
        )}
      </div>

      {/* Generate Token Panel */}
      <GenerateTokenPanel
        admins={admins}
        onResult={handleTokenResult}
        onPendingApproval={() => {
          setPendingNotice(
            "Request generate token HEAD_ADMIN berhasil diajukan. Menunggu persetujuan Super Admin.",
          );
          fetchData();
        }}
      />

      {/* Pending approval notice */}
      {pendingNotice && (
        <div className="flex items-center justify-between gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4 text-green-400 text-sm">
          <div className="flex items-center gap-2">
            <IconCheck />
            {pendingNotice}
          </div>
          <button
            onClick={() => setPendingNotice(null)}
            className="shrink-0 p-1 rounded hover:bg-green-500/10 transition-colors"
          >
            <IconX />
          </button>
        </div>
      )}

      {/* Revoke error banner */}
      {revokeError && (
        <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">
          <div className="flex items-center gap-2">
            <IconWarn />
            {revokeError}
          </div>
          <button
            onClick={() => setRevokeError(null)}
            className="shrink-0 p-1 rounded hover:bg-red-500/10 transition-colors"
          >
            <IconX />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#020617] border border-white/10 rounded-xl px-5 py-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-white/40 text-xs shrink-0">
            <IconFilter />
            <span className="font-medium uppercase tracking-wider">Filter</span>
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-xs mr-1">Role:</span>
            {(["all", "ADMIN", "HEAD_ADMIN"] as FilterRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={[
                  "text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                  filterRole === r
                    ? "bg-white text-[#0f172a]"
                    : "border border-white/15 text-white/50 hover:text-white hover:bg-white/5",
                ].join(" ")}
              >
                {r === "all" ? "Semua" : r}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-white/10 hidden sm:block" />

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-xs mr-1">Status:</span>
            {(
              [
                { key: "all", label: "Semua" },
                { key: "active", label: "Aktif" },
                { key: "expired", label: "Kadaluarsa" },
                { key: "revoked", label: "Direvoke" },
              ] as { key: FilterStatus; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={[
                  "text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                  filterStatus === key
                    ? "bg-white text-[#0f172a]"
                    : "border border-white/15 text-white/50 hover:text-white hover:bg-white/5",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Result count */}
          {!loading && (
            <span className="ml-auto text-white/30 text-xs">
              {filteredTokens.length} dari {countAll} token
            </span>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#020617] border border-white/10 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4 w-10">
                  No
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Role
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Admin Pemilik
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Dibuat Oleh
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Status
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Perm
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  1x
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Kadaluarsa
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Diklaim
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Dibuat
                </th>
                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={11} />
                ))
              ) : error ? (
                <tr>
                  <td
                    colSpan={11}
                    className="text-white/40 text-sm text-center py-12"
                  >
                    Gagal memuat data token. Silakan muat ulang halaman.
                  </td>
                </tr>
              ) : filteredTokens.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="text-white/40 text-sm text-center py-12"
                  >
                    {tokens.length === 0
                      ? "Belum ada token yang dibuat."
                      : "Tidak ada token yang sesuai filter."}
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token, idx) => {
                  const status = getTokenStatus(token);
                  const isRevoking = revokingId === token.id;

                  return (
                    <tr
                      key={token.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-white/40 text-xs">
                        {idx + 1}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={[
                            "text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
                            token.tokenRole === "HEAD_ADMIN"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-blue-500/20 text-blue-400",
                          ].join(" ")}
                        >
                          {token.tokenRole}
                        </span>
                      </td>

                      {/* Admin Pemilik */}
                      <td className="py-3 px-4">
                        {token.admin ? (
                          <div>
                            <p className="text-white/80 font-medium text-sm">
                              @{token.admin.username}
                            </p>
                            <p className="text-white/40 text-xs">
                              {token.admin.nama}
                            </p>
                          </div>
                        ) : (
                          <span className="text-white/30 text-xs italic">
                            Belum diklaim
                          </span>
                        )}
                      </td>

                      {/* Dibuat Oleh */}
                      <td className="py-3 px-4">
                        {token.headAdmin ? (
                          <div>
                            <p className="text-white/70 text-sm">
                              @{token.headAdmin.username}
                            </p>
                            <p className="text-white/30 text-xs">
                              {token.headAdmin.nama}
                            </p>
                          </div>
                        ) : (
                          <span className="text-white/30 text-xs italic">
                            Developer
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={status} />
                        {status === "revoked" && token.revokedAt && (
                          <p className="text-white/30 text-xs mt-1">
                            {fmtDate(token.revokedAt)}
                          </p>
                        )}
                      </td>

                      {/* Permanent */}
                      <td className="py-3 px-4">
                        {token.isPermanent ? (
                          <span className="text-green-400 text-xs font-medium">
                            Ya
                          </span>
                        ) : (
                          <span className="text-white/30 text-xs">Tidak</span>
                        )}
                      </td>

                      {/* Single Use */}
                      <td className="py-3 px-4">
                        {token.isSingleUse ? (
                          <span className="text-yellow-400 text-xs font-medium">
                            Ya
                          </span>
                        ) : (
                          <span className="text-white/30 text-xs">Tidak</span>
                        )}
                      </td>

                      {/* Expired At */}
                      <td className="py-3 px-4 text-white/50 text-xs whitespace-nowrap">
                        {token.isPermanent ? (
                          <span className="text-white/30 italic">Permanen</span>
                        ) : token.expiredAt ? (
                          <span
                            className={
                              status === "expired" ? "text-yellow-400" : ""
                            }
                          >
                            {fmtDate(token.expiredAt)}
                          </span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>

                      {/* Diklaim */}
                      <td className="py-3 px-4 text-white/50 text-xs whitespace-nowrap">
                        {token.claimedAt ? (
                          fmtDate(token.claimedAt)
                        ) : (
                          <span className="text-white/30 italic">Belum</span>
                        )}
                      </td>

                      {/* Dibuat */}
                      <td className="py-3 px-4 text-white/40 text-xs whitespace-nowrap">
                        {fmtDate(token.createdAt)}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4">
                        {status === "active" ? (
                          <button
                            onClick={() => handleRevoke(token)}
                            disabled={isRevoking}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {isRevoking ? "Revoking..." : "Revoke"}
                          </button>
                        ) : (
                          <span className="text-white/20 text-xs px-3 py-1.5">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {!loading && !error && tokens.length > 0 && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center gap-4 text-xs text-white/30">
            <span>
              Total:{" "}
              <span className="text-white/50 font-medium">{countAll}</span>
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span>
              Aktif:{" "}
              <span className="text-green-400/70 font-medium">
                {countActive}
              </span>
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span>
              Kadaluarsa:{" "}
              <span className="text-yellow-400/70 font-medium">
                {countExpired}
              </span>
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span>
              Direvoke:{" "}
              <span className="text-red-400/70 font-medium">
                {countRevoked}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Token Result Modal */}
      {tokenResult && (
        <TokenResultModal
          result={tokenResult}
          onClose={() => setTokenResult(null)}
        />
      )}
    </main>
  );
}
