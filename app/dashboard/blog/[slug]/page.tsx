"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../_components/Navbar";
import Footer from "../../_components/Footer";

type Blog = {
  id: string;
  judul: string;
  slug: string;
  isi: string;
  gambar: string | null;
  status: string;
  penulis?: { nama: string; role: string } | null;
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

function SkeletonDetail() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-6 w-48 rounded bg-white/10 mb-4" />
      <div className="h-10 w-3/4 rounded bg-white/10 mb-3" />
      <div className="h-4 w-40 rounded bg-white/5 mb-8" />
      <div className="h-64 w-full rounded-2xl bg-white/5 mb-8" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-5/6 rounded bg-white/5" />
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-2/3 rounded bg-white/5" />
      </div>
    </div>
  );
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function fetchBlog() {
      setLoading(true);
      setError(false);
      try {
        // First try to find the blog by fetching from the list and matching slug
        const listRes = await fetch("/api/blog");
        if (!listRes.ok) throw new Error();
        const blogs = await listRes.json();
        const matched = Array.isArray(blogs)
          ? blogs.find((b: Blog) => b.slug === slug)
          : null;

        if (!matched) {
          setError(true);
          return;
        }

        // Now fetch detailed data using the matched ID
        const detailRes = await fetch(`/api/blog/${matched.id}`);
        if (!detailRes.ok) throw new Error();
        const detail = await detailRes.json();
        setBlog(detail);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchBlog();
  }, [slug]);

  return (
    <main className="bg-[#0f172a] text-white min-h-screen">
      <Navbar />

      {loading ? (
        <SkeletonDetail />
      ) : error || !blog ? (
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Blog Tidak Ditemukan</h2>
          <p className="text-white/40 text-sm mb-6">
            Konten yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <Link
            href="/dashboard/blog"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Kembali ke Blog
          </Link>
        </div>
      ) : (
        <>
          {/* ── Hero Header ──────────────────────────────────── */}
          <section className="relative overflow-hidden border-b border-white/10">
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-transparent to-[#0f172a]" />

            <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-10">
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
                {blog.judul}
              </h1>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/45">
                {blog.penulis?.nama && (
                  <span className="font-medium text-white/60">{blog.penulis.nama}</span>
                )}
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{fmtDate(blog.createdAt)}</span>
              </div>
            </div>
          </section>

          {/* ── Breadcrumb ────────────────────────────────────── */}
          <div className="max-w-3xl mx-auto px-6 pt-6">
            <nav className="flex items-center gap-2 text-xs text-white/40">
              <Link href="/dashboard" className="hover:text-white/70 transition-colors">
                Home
              </Link>
              <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <Link href="/dashboard/blog" className="hover:text-white/70 transition-colors">
                Blog
              </Link>
              <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-white/60 truncate max-w-[200px]">{blog.judul}</span>
            </nav>
          </div>

          {/* ── Blog Image ────────────────────────────────────── */}
          {blog.gambar && (
            <div className="max-w-3xl mx-auto px-6 mt-6">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blog.gambar}
                  alt={blog.judul}
                  className="w-full max-h-[400px] object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none"; }}
                />
              </div>
            </div>
          )}

          {/* ── Content area ──────────────────────────────────── */}
          <article className="max-w-3xl mx-auto px-6 py-10">
            <div
              className="prose prose-invert prose-sm sm:prose-base max-w-none
                         prose-headings:font-semibold prose-headings:text-white
                         prose-p:text-white/70 prose-p:leading-relaxed
                         prose-a:text-blue-400 prose-a:underline prose-a:underline-offset-2
                         prose-strong:text-white prose-strong:font-semibold
                         prose-li:text-white/65
                         [&_br]:block [&_br]:h-2"
              dangerouslySetInnerHTML={{ __html: blog.isi }}
            />

            {/* If blog.isi is not HTML, render as pre-wrapped text */}
            {!blog.isi.includes("<") && (
              <p className="text-white/65 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {blog.isi}
              </p>
            )}
          </article>

          {/* ── Back link ─────────────────────────────────────── */}
          <div className="max-w-3xl mx-auto px-6 pb-16">
            <Link
              href="/dashboard/blog"
              className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Kembali ke Blog
            </Link>
          </div>
        </>
      )}

      <Footer />
    </main>
  );
}
