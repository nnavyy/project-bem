"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../_components/Navbar";
import Footer from "../_components/Footer";

type Blog = {
  id: string;
  judul: string;
  slug: string;
  isi: string;
  gambar: string | null;
  status: string;
  author: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function SkeletonCard() {
  return (
    <div className="group bg-[#020617] border border-white/10 rounded-2xl overflow-hidden">
      <div className="aspect-[16/10] bg-white/5 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-20 rounded-full bg-white/10 animate-pulse" />
        <div className="h-3 w-28 rounded bg-white/5 animate-pulse" />
        <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse" />
        <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

export default function BlogListingPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        setBlogs(Array.isArray(data) ? data.filter((b: Blog) => b.status === "PUBLISHED") : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="bg-[#0f172a] text-white min-h-screen">
      <Navbar />

      {/* ── Hero / Jumbotron ──────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-transparent to-[#0f172a]" />

        <div className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Blog</h1>
          <p className="mt-4 text-white/50 text-sm sm:text-base max-w-xl mx-auto">
            Informasi terbaru seputar kegiatan dan program kerja BEM ITESA
          </p>
        </div>
      </section>

      {/* ── Blog Grid ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-white/40 text-sm">Belum ada blog yang dipublikasikan.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/dashboard/blog/${blog.slug}`}
                className="group bg-[#020617] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:scale-[0.98] transition-all duration-300"
              >
                {/* Image */}
                <div className="aspect-[16/10] bg-white/5 overflow-hidden">
                  {blog.gambar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={blog.gambar}
                      alt={blog.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
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
                  {/* Category badge */}
                  <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full border border-white/15 text-white/50 font-medium mb-2">
                    Blog
                  </span>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-white/35 text-xs mb-2.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    {fmtDate(blog.createdAt)}
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-semibold text-base leading-snug line-clamp-2 group-hover:text-white/90 transition-colors">
                    {blog.judul}
                  </h3>

                  {/* Excerpt */}
                  <p className="mt-2 text-white/40 text-sm leading-relaxed line-clamp-2">
                    {stripHtml(blog.isi).substring(0, 120)}
                  </p>

                  {/* Read More */}
                  <div className="mt-4 flex items-center gap-1 text-white/30 group-hover:text-white/60 text-xs font-medium transition-colors">
                    <span>Baca selengkapnya</span>
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
