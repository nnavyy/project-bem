"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Login admin gagal");
        return;
      }
      router.push(data?.redirect ?? "/dashboard/admin");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1f2c44] to-[#0f172a] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#020617]/90 p-6 shadow-2xl backdrop-blur sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">BEM ITESA</p>
          <h1 className="mt-2 text-2xl font-bold">Login Admin</h1>
          <p className="mt-2 text-sm text-white/70">
            Gunakan akun admin/head admin dan token yang valid sesuai role.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/80" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-white/15 bg-[#0b1220] px-3 py-2.5 text-sm outline-none ring-0 placeholder:text-white/35 focus:border-white/35"
                placeholder="Masukkan Username"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/80" htmlFor="token">
                Token Admin
              </label>
              <input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="w-full rounded-lg border border-white/15 bg-[#0b1220] px-3 py-2.5 text-sm outline-none ring-0 placeholder:text-white/35 focus:border-white/35"
                placeholder="Masukkan Token"
              />
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
