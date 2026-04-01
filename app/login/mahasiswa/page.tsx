"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function MahasiswaLoginPage() {
  const router = useRouter();
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login/mahasiswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Login gagal");
        return;
      }
      router.push(data?.redirect ?? "/dashboard/mahasiswa");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1f2c44] to-[#0f172a] text-white px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#020617]/90 p-6 shadow-2xl backdrop-blur sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">BEM ITESA</p>
          <h1 className="mt-2 text-2xl font-bold">Login Mahasiswa</h1>
          <p className="mt-2 text-sm text-white/70">
            Masuk untuk mengakses dashboard Suaraku dan mengirim laporan.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/80" htmlFor="nim">
                NIM
              </label>
              <input
                id="nim"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                required
                className="w-full rounded-lg border border-white/15 bg-[#0b1220] px-3 py-2.5 text-sm outline-none ring-0 placeholder:text-white/35 focus:border-white/35"
                placeholder="Masukkan NIM"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/80" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#0b1220] px-3 py-2.5 text-sm outline-none ring-0 placeholder:text-white/35 focus:border-white/35"
                placeholder="Masukkan Email"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/80" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-white/15 bg-[#0b1220] px-3 py-2.5 text-sm outline-none ring-0 placeholder:text-white/35 focus:border-white/35"
                placeholder="Masukkan Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="mt-2 text-xs text-white/70 hover:text-white"
              >
                {showPassword ? "Sembunyikan password" : "Lihat password"}
              </button>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
