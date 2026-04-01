"use client";

import Link from "next/link";

type NavbarProps = {
  showLogin?: boolean;
};

export default function Navbar({ showLogin = true }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#020617]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-white font-semibold tracking-wide">
          BEM ITESA
        </Link>

        <nav className="hidden items-center gap-6 md:flex text-sm text-white/80">
          <a href="#blog" className="hover:text-white">
            Blog
          </a>
          <a href="#portofolio" className="hover:text-white">
            Portofolio
          </a>
          <a href="#suaraku" className="hover:text-white">
            Suaraku
          </a>
        </nav>

        {showLogin ? (
          <Link
            href="/login/mahasiswa"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            Login
          </Link>
        ) : (
          <div />
        )}
      </div>
    </header>
  );
}
