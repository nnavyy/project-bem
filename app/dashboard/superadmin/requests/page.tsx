"use client";

import { useEffect, useState, useCallback } from "react";

type AdminInfo = { id: string; username: string; nama: string; role: string };
type TokenInfo = {
  id: string;
  tokenRole: string;
  isRevoked: boolean;
  isPermanent: boolean;
  expiredAt: string | null;
  createdAt: string;
  admin: AdminInfo | null;
};
type RequestItem = {
  id: string;
  jenis:
    | "GENERATE_TOKEN_HEADADMIN"
    | "REVOKE_TOKEN_HEADADMIN"
    | "CREATE_HEADADMIN"
    | "REVOKE_TOKEN_SUPERADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED";
  tokenId: string | null;
  catatanAdmin: string | null; // plain token (only after APPROVED generate)
  createdAt: string;
  updatedAt: string;
  pengaju: AdminInfo;
  pemroses: AdminInfo | null;
  token: TokenInfo | null;
};

type ApprovedTokenResult = {
  requestId: string;
  plainToken: string | null;
  jenis: string;
};

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const IconShield = () => (
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
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
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
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
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

// Token Result Modal after approve
function TokenRevealModal({
  result,
  onClose,
}: {
  result: ApprovedTokenResult;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!result.plainToken) return;
    navigator.clipboard.writeText(result.plainToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#020617] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold text-base">
              Request Disetujui ✓
            </h2>
            <p className="text-white/40 text-xs mt-0.5">
              {result.jenis === "GENERATE_TOKEN_HEADADMIN"
                ? "Token HEAD_ADMIN baru siap didistribusikan"
                : "Token berhasil direvoke"}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
            <IconCheck />
          </div>
        </div>

        {result.plainToken && (
          <>
            <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 mb-4">
              <IconWarn />
              <p className="text-amber-400 text-xs leading-relaxed">
                <strong className="font-semibold">Salin token sekarang!</strong>{" "}
                Token hanya bisa ditampilkan sekali ini saja setelah di-approve.
              </p>
            </div>
            <div className="bg-[#0b1220] border border-white/10 rounded-xl p-4 mb-4">
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider font-medium">
                Plain Token (HEAD_ADMIN)
              </p>
              <div className="flex items-start gap-3">
                <code className="flex-1 text-green-400 text-xs font-mono break-all leading-relaxed select-all">
                  {result.plainToken}
                </code>
                <button
                  onClick={handleCopy}
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
          </>
        )}

        <button
          onClick={onClose}
          className="w-full bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

// Request Card
function RequestCard({
  req,
  onProcess,
  processing,
}: {
  req: RequestItem;
  onProcess: (id: string, action: "APPROVE" | "REJECT") => void;
  processing: string | null;
}) {
  const isGenerateReq = req.jenis === "GENERATE_TOKEN_HEADADMIN";
  const isRevokeSuper = req.jenis === "REVOKE_TOKEN_SUPERADMIN";
  const isCreateHead = req.jenis === "CREATE_HEADADMIN";
  const isPending = req.status === "PENDING";
  const isProcessing = processing === req.id;

  return (
    <div
      className={[
        "bg-[#020617] border rounded-xl p-5 transition-all",
        isPending
          ? "border-amber-500/20"
          : req.status === "APPROVED"
            ? "border-green-500/15"
            : "border-white/8",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={[
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              isGenerateReq
                ? "bg-purple-500/15 text-purple-400"
                : isRevokeSuper
                  ? "bg-red-500/15 text-red-400"
                  : isCreateHead
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-red-500/15 text-red-400",
            ].join(" ")}
          >
            <IconShield />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">
              {isGenerateReq
                ? "Generate Token HEAD_ADMIN"
                : isRevokeSuper
                  ? "⚠ Percobaan Revoke Token Super Admin"
                  : isCreateHead
                    ? "Buat Akun HEAD_ADMIN"
                    : "Revoke Token HEAD_ADMIN"}
            </p>
            <p className="text-white/40 text-xs mt-0.5">
              Diajukan oleh{" "}
              <span className="text-white/60 font-medium">
                @{req.pengaju.username}
              </span>{" "}
              · {fmtDate(req.createdAt)}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={[
            "text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap",
            isPending
              ? "bg-amber-500/20 text-amber-400"
              : req.status === "APPROVED"
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400",
          ].join(" ")}
        >
          {req.status === "PENDING"
            ? "Menunggu"
            : req.status === "APPROVED"
              ? "Disetujui"
              : "Ditolak"}
        </span>
      </div>

      {/* REVOKE_TOKEN_SUPERADMIN warning banner */}
      {isRevokeSuper && isPending && (
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
          <span>
            Seseorang mencoba merevoke token Super Admin. Ini adalah notifikasi
            keamanan — klik &quot;Tutup Notifikasi&quot; setelah ditinjau.
          </span>
        </div>
      )}

      {/* Token info */}
      {req.token && (
        <div className="bg-white/[0.03] rounded-lg px-4 py-3 mb-4 text-xs">
          <p className="text-white/40 mb-2 font-medium uppercase tracking-wider">
            Info Token
          </p>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
            <div>
              <span className="text-white/35">Role:</span>{" "}
              <span className="text-white/70 font-medium">
                {req.token.tokenRole}
              </span>
            </div>
            <div>
              <span className="text-white/35">Status:</span>{" "}
              <span
                className={
                  req.token.isRevoked ? "text-red-400" : "text-green-400"
                }
              >
                {req.token.isRevoked ? "Direvoke" : "Aktif"}
              </span>
            </div>
            <div>
              <span className="text-white/35">Permanen:</span>{" "}
              <span className="text-white/70">
                {req.token.isPermanent ? "Ya" : "Tidak"}
              </span>
            </div>
            <div>
              <span className="text-white/35">Untuk:</span>{" "}
              <span className="text-white/70">
                {req.token.admin ? `@${req.token.admin.username}` : "Unclaimed"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Diproses info */}
      {req.pemroses && (
        <p className="text-white/30 text-xs mb-4">
          Diproses oleh{" "}
          <span className="text-white/50">@{req.pemroses.username}</span> ·{" "}
          {fmtDate(req.updatedAt)}
        </p>
      )}

      {/* APPROVED generate: show plain token was here */}
      {req.status === "APPROVED" &&
        req.jenis === "GENERATE_TOKEN_HEADADMIN" &&
        req.catatanAdmin && (
          <div className="bg-[#0b1220] border border-white/10 rounded-lg px-4 py-3 mb-4">
            <p className="text-white/40 text-xs mb-1 uppercase tracking-wider font-medium">
              Plain Token
            </p>
            <code className="text-green-400 text-xs font-mono break-all select-all">
              {req.catatanAdmin}
            </code>
          </div>
        )}

      {/* Action buttons (only for PENDING) */}
      {isPending && (
        <div className="flex items-center gap-2 justify-end pt-2 border-t border-white/5">
          {!isRevokeSuper && (
            <button
              onClick={() => onProcess(req.id, "APPROVE")}
              disabled={isProcessing}
              className="flex items-center gap-1.5 text-sm text-[#0f172a] bg-emerald-400 hover:bg-emerald-300 px-4 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <IconCheck />
              {isProcessing ? "Memproses..." : "Setujui"}
            </button>
          )}
          <button
            onClick={() => onProcess(req.id, "REJECT")}
            disabled={isProcessing}
            className={[
              "flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50",
              isRevokeSuper
                ? "text-white bg-red-500/20 border-red-500/30 hover:bg-red-500/30"
                : "text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20",
            ].join(" ")}
          >
            <IconX />
            {isRevokeSuper ? "Tutup Notifikasi" : "Tolak"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const [approvedResult, setApprovedResult] =
    useState<ApprovedTokenResult | null>(null);

  const fetchRequests = useCallback(() => {
    setLoading(true);
    const url =
      filter === "ALL"
        ? "/api/superadmin/requests"
        : `/api/superadmin/requests?status=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRequests(data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleProcess(id: string, action: "APPROVE" | "REJECT") {
    setProcessing(id);
    try {
      const res = await fetch(`/api/superadmin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message ?? "Terjadi kesalahan.");
        return;
      }
      fetchRequests();
      // Jika approve generate token, tampilkan plain token
      if (action === "APPROVE" && data.data?.plaintToken !== undefined) {
        setApprovedResult({
          requestId: id,
          plainToken: data.data.plainToken,
          jenis: data.data.jenis ?? "",
        });
      } else if (action === "APPROVE") {
        const req = requests.find((r) => r.id === id);
        if (req?.jenis === "GENERATE_TOKEN_HEADADMIN") {
          setApprovedResult({
            requestId: id,
            plainToken: data.data?.plainToken ?? null,
            jenis: req.jenis,
          });
        }
      }
    } catch {
      alert("Gagal menghubungi server.");
    } finally {
      setProcessing(null);
    }
  }

  const pending = requests.filter((r) => r.status === "PENDING").length;
  const approved = requests.filter((r) => r.status === "APPROVED").length;
  const rejected = requests.filter((r) => r.status === "REJECTED").length;

  return (
    <main className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <IconShield />
            Approval Request
          </h1>
          <p className="text-white/50 text-sm mt-0.5">
            Kelola permintaan penambahan & pencabutan token Head Admin
          </p>
        </div>
        {pending > 0 && (
          <span className="bg-amber-500/20 text-amber-400 text-sm font-semibold px-3 py-1 rounded-full">
            {pending} Menunggu
          </span>
        )}
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => {
          const count =
            s === "ALL"
              ? requests.length
              : s === "PENDING"
                ? pending
                : s === "APPROVED"
                  ? approved
                  : rejected;
          const active = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={[
                "text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                active
                  ? "bg-white text-[#0f172a]"
                  : "border border-white/15 text-white/50 hover:text-white hover:bg-white/5",
              ].join(" ")}
            >
              {s === "ALL"
                ? "Semua"
                : s === "PENDING"
                  ? "Menunggu"
                  : s === "APPROVED"
                    ? "Disetujui"
                    : "Ditolak"}
              <span className="ml-1.5 opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#020617] border border-white/10 rounded-xl p-5 animate-pulse"
            >
              <div className="flex gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-white/5" />
                  <div className="h-3 w-64 rounded bg-white/5" />
                </div>
              </div>
              <div className="h-16 rounded-lg bg-white/5" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-white/40 text-sm text-center py-16">
          Gagal memuat data. Silakan muat ulang.
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
            <IconShield />
          </div>
          <p className="text-white/40 text-sm">
            {filter === "PENDING"
              ? "Tidak ada request yang menunggu persetujuan."
              : "Belum ada request terdaftar."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              onProcess={handleProcess}
              processing={processing}
            />
          ))}
        </div>
      )}

      {/* Token reveal modal */}
      {approvedResult && (
        <TokenRevealModal
          result={approvedResult}
          onClose={() => setApprovedResult(null)}
        />
      )}
    </main>
  );
}
