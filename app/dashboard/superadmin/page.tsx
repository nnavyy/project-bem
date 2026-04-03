"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AdminRow = {
  id: string;
  username: string;
  nama: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};
type Laporan = { id: string; status: string };
type Blog = { id: string; status: string };
type LogItem = {
  id: string;
  aksi: string;
  keterangan: string | null;
  createdAt: string;
  admin: { id: string; username: string; nama: string; role: string } | null;
};
type LogsResponse = {
  items: LogItem[];
  total: number;
  page: number;
  totalPages: number;
};
type RequestItem = { id: string; status: string; jenis: string };

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function isToday(d: string | Date) {
  const date = new Date(d);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
function getAksiBadge(aksi: string) {
  if (aksi === "LOGIN")
    return (
      <span className="inline-block bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium">
        LOGIN
      </span>
    );
  if (aksi === "LOGIN_GAGAL")
    return (
      <span className="inline-block bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">
        LOGIN GAGAL
      </span>
    );
  if (aksi.startsWith("CREATE_"))
    return (
      <span className="inline-block bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
        {aksi.replace("_", " ")}
      </span>
    );
  if (aksi.startsWith("UPDATE_"))
    return (
      <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full font-medium">
        {aksi.replace("_", " ")}
      </span>
    );
  if (aksi.startsWith("DELETE_") || aksi === "REVOKE_TOKEN")
    return (
      <span className="inline-block bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">
        {aksi.replace("_", " ")}
      </span>
    );
  if (aksi === "GENERATE_TOKEN")
    return (
      <span className="inline-block bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full font-medium">
        GENERATE TOKEN
      </span>
    );
  if (aksi === "APPROVE_REQUEST")
    return (
      <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium">
        APPROVE
      </span>
    );
  if (aksi === "REJECT_REQUEST")
    return (
      <span className="inline-block bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">
        REJECT
      </span>
    );
  return (
    <span className="inline-block bg-white/10 text-white/50 text-xs px-2 py-0.5 rounded-full font-medium">
      {aksi.replace(/_/g, " ")}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className={`bg-[#020617] border rounded-xl p-5 flex flex-col gap-3 ${accent ?? "border-white/10"}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider">
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="text-white/40 text-xs">{sub}</p>}
    </div>
  );
}

const IconUsers = () => (
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
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    />
  </svg>
);
const IconDoc = () => (
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
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
    />
  </svg>
);
const IconEdit = () => (
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
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
    />
  </svg>
);
const IconShield = () => (
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
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>
);
const IconActivity = () => (
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
      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
    />
  </svg>
);

export default function SuperAdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeAdmins, setActiveAdmins] = useState(0);
  const [pendingLaporan, setPendingLaporan] = useState(0);
  const [publishedBlogs, setPublishedBlogs] = useState(0);
  const [todayLogs, setTodayLogs] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [securityAlerts, setSecurityAlerts] = useState(0);
  const [recentLogs, setRecentLogs] = useState<LogItem[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    Promise.all([
      fetch("/api/headadmin/admin", { cache: "no-store" }).then((r) =>
        r.json(),
      ),
      fetch("/api/laporan", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/blog?includeDraft=1", { cache: "no-store" }).then((r) =>
        r.json(),
      ),
      fetch("/api/headadmin/logs?pageSize=8", { cache: "no-store" }).then((r) =>
        r.json(),
      ),
      fetch("/api/superadmin/requests?status=PENDING", {
        cache: "no-store",
      }).then((r) => r.json()),
      fetch(
        `/api/headadmin/logs?pageSize=1&from=${encodeURIComponent(todayStart.toISOString())}&to=${encodeURIComponent(todayEnd.toISOString())}`,
        { cache: "no-store" },
      ).then((r) => r.json()),
    ])
      .then(([admins, laporan, blogs, logsRes, requests, todayRes]) => {
        const adminList: AdminRow[] = Array.isArray(admins) ? admins : [];
        const laporanList: Laporan[] = Array.isArray(laporan) ? laporan : [];
        const blogList: Blog[] = Array.isArray(blogs) ? blogs : [];
        const logs: LogsResponse =
          logsRes && Array.isArray(logsRes.items)
            ? logsRes
            : { items: [], total: 0, page: 1, totalPages: 0 };
        const requestList: RequestItem[] = Array.isArray(requests)
          ? requests
          : [];

        setActiveAdmins(adminList.filter((a) => a.isActive).length);
        setPendingLaporan(
          laporanList.filter((l) => l.status === "PENDING").length,
        );
        setPublishedBlogs(
          blogList.filter((b) => b.status === "PUBLISHED").length,
        );
        setTodayLogs(todayRes?.total || 0);
        setPendingRequests(requestList.length);
        const alertCount = requestList.filter(
          (r: { jenis: string }) => r.jenis === "REVOKE_TOKEN_SUPERADMIN",
        ).length;
        setSecurityAlerts(alertCount);
        setRecentLogs(logs.items);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Overview</h1>
          <p className="text-white/50 text-sm mt-0.5">
            Ringkasan aktivitas dan statistik sistem
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-white/30 text-xs">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {new Date().toLocaleString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Security Alert Banner — REVOKE_TOKEN_SUPERADMIN */}
      {!loading && securityAlerts > 0 && (
        <Link
          href="/dashboard/superadmin/requests"
          className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3.5 mb-4 hover:bg-red-500/15 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
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
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-red-300 text-sm font-semibold">
              ⚠ {securityAlerts} Percobaan Revoke Token Super Admin
            </p>
            <p className="text-red-400/60 text-xs">
              Seseorang mencoba merevoke token Anda. Klik untuk melihat detail.
            </p>
          </div>
          <svg
            className="w-4 h-4 text-red-400/50 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </Link>
      )}

      {/* Pending Request Banner */}
      {!loading && pendingRequests > 0 && (
        <Link
          href="/dashboard/superadmin/requests"
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3.5 mb-6 hover:bg-amber-500/15 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <IconShield />
          </div>
          <div className="flex-1">
            <p className="text-amber-300 text-sm font-semibold">
              {pendingRequests} Request Menunggu Persetujuan
            </p>
            <p className="text-amber-400/60 text-xs">
              Klik untuk melihat dan memproses approval
            </p>
          </div>
          <svg
            className="w-4 h-4 text-amber-400/50 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </Link>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#020617] border border-white/10 rounded-xl p-5"
            >
              <div className="animate-pulse bg-white/5 rounded h-3 w-24 mb-4" />
              <div className="animate-pulse bg-white/5 rounded h-8 w-16 mb-1" />
              <div className="animate-pulse bg-white/5 rounded h-3 w-32 mt-2" />
            </div>
          ))
        ) : error ? (
          <div className="col-span-2 lg:col-span-5 text-white/40 text-sm text-center py-12">
            Gagal memuat data.
          </div>
        ) : (
          <>
            <StatCard
              label="Admin Aktif"
              value={activeAdmins}
              sub="Admin dengan status aktif"
              icon={<IconUsers />}
            />
            <StatCard
              label="Laporan Pending"
              value={pendingLaporan}
              sub="Menunggu tindak lanjut"
              icon={<IconDoc />}
            />
            <StatCard
              label="Blog Published"
              value={publishedBlogs}
              sub="Artikel yang telah dipublikasi"
              icon={<IconEdit />}
            />
            <StatCard
              label="Log Hari Ini"
              value={todayLogs}
              sub="Aktivitas tercatat hari ini"
              icon={<IconActivity />}
            />
            <StatCard
              label="Approval Pending"
              value={pendingRequests}
              sub="Menunggu persetujuan Anda"
              icon={<IconShield />}
              accent={
                pendingRequests > 0 ? "border-amber-500/30" : "border-white/10"
              }
            />
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-[#020617] border border-white/10 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white text-sm font-semibold">
              Aktivitas Terbaru
            </h2>
            <p className="text-white/40 text-xs mt-0.5">
              8 log aktivitas terakhir
            </p>
          </div>
          <a
            href="/dashboard/superadmin/logs"
            className="border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
          >
            Lihat Semua
          </a>
        </div>
        {loading ? (
          <p className="text-white/30 text-sm text-center py-12">Memuat...</p>
        ) : error || recentLogs.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-12">
            {error ? "Gagal memuat log." : "Belum ada aktivitas."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Waktu", "Admin", "Aksi", "Keterangan"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4 text-white/60 whitespace-nowrap text-xs">
                      {fmtDate(log.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      {log.admin ? (
                        <div>
                          <p className="text-white/80 text-sm font-medium">
                            {log.admin.username}
                          </p>
                          <p className="text-white/40 text-xs">
                            {log.admin.nama}
                          </p>
                        </div>
                      ) : (
                        <span className="text-white/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getAksiBadge(log.aksi)}
                    </td>
                    <td className="py-3 px-4 text-white/50 text-xs max-w-xs">
                      <span className="line-clamp-2">
                        {log.keterangan ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
