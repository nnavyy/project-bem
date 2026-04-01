"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Blog = {
  id: string;
  judul: string;
  slug: string;
  isi: string;
  gambar: string | null;
  status: string;
  createdAt: string;
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&");
}

export default function BlogPreview() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        setBlogs(
          Array.isArray(data) ? data.filter((b: Blog) => b.status === "PUBLISHED").slice(0, 3) : []
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="blog" className="py-20 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-white">Blog Terbaru</h2>
          <Link
            href="/dashboard/blog"
            className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1 group"
          >
            Lihat Semua
            <svg
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#020617] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="aspect-[16/10] bg-white/5 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-20 rounded-full bg-white/10 animate-pulse" />
                    <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse" />
                    <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
                  </div>
                </div>
              ))
            : blogs.map((b) => (
                <Link
                  key={b.id}
                  href={`/dashboard/blog/${b.slug}`}
                  className="group bg-[#020617] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:scale-[0.98] transition-all duration-300"
                >
                  {/* Image */}
                  <div className="aspect-[16/10] bg-white/5 overflow-hidden">
                    {b.gambar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.gambar}
                        alt={b.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-white/35 text-xs mb-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {fmtDate(b.createdAt)}
                    </div>
                    <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-white/90 transition-colors">
                      {b.judul}
                    </h3>
                    <p className="mt-2 text-white/35 text-xs leading-relaxed line-clamp-2">
                      {stripHtml(b.isi).substring(0, 100)}
                    </p>
                  </div>
                </Link>
              ))}

          {!loading && blogs.length === 0 && (
            <div className="sm:col-span-2 md:col-span-3 rounded-2xl border border-white/10 bg-[#020617] p-8 text-center text-white/40 text-sm">
              Belum ada blog untuk ditampilkan.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
