"use client";

import { useRouter } from "next/navigation";

export default function SuarakuCTA() {
  const router = useRouter();

  return (
    <section
      id="suaraku"
      className="py-20 bg-gradient-to-b from-[#0f172a] to-[#020617] text-center"
    >
      <h2 className="text-3xl font-bold text-white">
        Suarakan Aspirasimu
      </h2>
      <p className="mt-4 text-gray-300">
        Sampaikan kritik, saran, dan keluhan mahasiswa secara aman.
      </p>

      <button
        onClick={() => router.push("/dashboard/mahasiswa")}
        className="mt-8 px-6 py-3 rounded-lg bg-white text-black font-semibold hover:opacity-90"
      >
        Kirim Laporan
      </button>
    </section>
  );
}
