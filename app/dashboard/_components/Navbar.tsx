"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NavbarProps = {
  showLogin?: boolean;
};

export default function Navbar({ showLogin = true }: NavbarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authRole, setAuthRole] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();
        if (!isMounted) return;
        if (res.ok) {
          setIsAuthenticated(true);
          setAuthRole(String(data?.role ?? "").toLowerCase());
        } else {
          setIsAuthenticated(false);
          setAuthRole("");
          if (res.status === 401 || res.status === 403 || res.status === 404) {
            fetch("/api/logout", { method: "POST" }).catch(() => {});
          }
        }
      } catch {
        if (!isMounted) return;
        setIsAuthenticated(false);
        setAuthRole("");
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // ignore
    }
    window.location.href = "/dashboard";
  }

  return (
    <>
      <header className="sticky top-0 z-[100] w-full border-b border-white/10 bg-[#020617]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-white font-semibold tracking-wide">
            BEM ITESA
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
            <Link href="/dashboard/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/dashboard/portofolio" className="hover:text-white transition-colors">
              Portofolio
            </Link>
            <button onClick={() => scrollToSection("suaraku")} className="hover:text-white">
              Suaraku
            </button>
          </nav>

          {!showLogin ? (
            <div />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href={
                  authRole === "super_admin" || authRole === "superadmin"
                    ? "/dashboard/superadmin"
                    : authRole === "head_admin" || authRole === "headadmin"
                      ? "/dashboard/headadmin"
                      : authRole === "admin"
                        ? "/dashboard/admin"
                        : "/dashboard/mahasiswa"
                }
                className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/90 hover:bg-white/10"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#020617] p-5 text-white">
            <h3 className="text-lg font-semibold">Pilih Jenis Login</h3>
            <p className="mt-1 text-sm text-white/70">
              Pilih role untuk masuk ke dashboard yang sesuai.
            </p>
            <div className="mt-5 grid gap-3">
              <Link
                href="/login/mahasiswa"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg bg-white px-4 py-2 text-center text-sm font-semibold text-black hover:opacity-90"
              >
                Login sebagai Mahasiswa
              </Link>
              <Link
                href="/login/admin"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-white/20 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-white/10"
              >
                Login sebagai Admin
              </Link>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
