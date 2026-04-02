"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconHome = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
  </svg>
);

const IconShield = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const IconUsers = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const IconKey = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const IconList = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const IconDoc = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);

const IconEdit = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const IconGrid = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const IconMenu = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const IconX = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

// ─── Menu definition ──────────────────────────────────────────────────────────

// Menu utama (same as headadmin, pointing to superadmin routes)
const MENU_MAIN = [
  { href: "/dashboard/superadmin",            label: "Overview",      icon: <IconHome /> },
  { href: "/dashboard/superadmin/admin",      label: "Admin",         icon: <IconUsers /> },
  { href: "/dashboard/superadmin/tokens",     label: "Token",         icon: <IconKey /> },
  { href: "/dashboard/superadmin/logs",       label: "Log Aktivitas", icon: <IconList /> },
  { href: "/dashboard/superadmin/laporan",    label: "Laporan",       icon: <IconDoc /> },
  { href: "/dashboard/superadmin/blog",       label: "Blog",          icon: <IconEdit /> },
  { href: "/dashboard/superadmin/portofolio", label: "Portofolio",    icon: <IconGrid /> },
];

// Menu eksklusif superadmin
const MENU_SUPER = [
  { href: "/dashboard/superadmin/requests",   label: "Approval Request", icon: <IconShield /> },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type UserProfile = {
  nama: string;
  username: string;
};

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({
  user,
  pathname,
  pendingCount,
  onClose,
  onLogout,
}: {
  user: UserProfile | null;
  pathname: string;
  pendingCount: number;
  onClose?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* ── Brand ───────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">
          BEM ITESA
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-white font-semibold text-sm">Panel Super Admin</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 tracking-wide">DEV</span>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {/* Main menu */}
        {MENU_MAIN.map((item) => {
          const isActive =
            item.href === "/dashboard/superadmin"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-white/10 text-white" : "text-white/55 hover:text-white hover:bg-white/5",
              ].join(" ")}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="pt-3 pb-1 px-3">
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-amber-500/60">
            Super Admin Only
          </p>
        </div>

        {/* Exclusive super admin menu */}
        {MENU_SUPER.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                  : "text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10",
              ].join(" ")}
            >
              {item.icon}
              {item.label}
              {pendingCount > 0 && (
                <span className="ml-auto bg-amber-500 text-[#0f172a] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User info + logout ──────────────────────── */}
      <div className="px-4 py-4 border-t border-white/10">
        {user ? (
          <div className="mb-3 px-1">
            <div className="flex items-center gap-2">
              <p className="text-white text-sm font-medium truncate">{user.nama}</p>
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-400">SA</span>
            </div>
            <p className="text-white/40 text-xs truncate">@{user.username}</p>
          </div>
        ) : (
          <div className="mb-3 px-1 space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
          </div>
        )}

        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <IconLogout />
          Keluar
        </button>
      </div>
    </div>
  );
}

// ─── Main Sidebar component ───────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d?.profile) setUser(d.profile as UserProfile); })
      .catch(() => {});
  }, []);

  // Poll pending request count
  useEffect(() => {
    function fetchPending() {
      fetch("/api/superadmin/requests?status=PENDING")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setPendingCount(data.length); })
        .catch(() => {});
    }
    fetchPending();
    const interval = setInterval(fetchPending, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try { await fetch("/api/logout", { method: "POST" }); } catch { /* ignore */ }
    router.push("/login/admin");
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#020617] border-r border-white/10 min-h-screen sticky top-0 self-start max-h-screen overflow-hidden">
        <SidebarContent user={user} pathname={pathname} pendingCount={pendingCount} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile: hamburger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Buka menu"
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-lg bg-[#020617] border border-white/10 text-white shadow-xl"
      >
        <IconMenu />
      </button>

      {/* ── Mobile: backdrop ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: slide-in sidebar ── */}
      <aside
        className={[
          "lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#020617] border-r border-white/10 flex flex-col",
          "transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <IconX />
        </button>
        <SidebarContent user={user} pathname={pathname} pendingCount={pendingCount} onClose={() => setMobileOpen(false)} onLogout={handleLogout} />
      </aside>
    </>
  );
}
