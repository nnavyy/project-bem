"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlogStatus = "DRAFT" | "PUBLISHED";

type Blog = {
  id: string;
  judul: string;
  slug: string;
  isi: string;
  gambar: string | null;
  status: BlogStatus;
  author: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

type BlogForm = {
  judul: string;
  isi: string;
  gambar: string;
  status: BlogStatus;
};

type ModalMode = "create" | "edit" | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FORM: BlogForm = {
  judul: "",
  isi: "",
  gambar: "",
  status: "DRAFT",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, max = 60): string {
  if (!text) return "—";
  return text.length > max ? text.substring(0, max) + "…" : text;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BlogStatusBadge({ status }: { status: BlogStatus }) {
  const cls =
    status === "PUBLISHED"
      ? "bg-green-500/20 text-green-400"
      : "bg-white/10 text-white/50";
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}`}>
      {status}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div
            className="h-3.5 rounded bg-white/10 animate-pulse"
            style={{ width: `${45 + (i * 17) % 50}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

function IconX() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BlogPage() {
  // ── List state ──────────────────────────────────────────────────────────────
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Blog | null>(null);
  const [form, setForm] = useState<BlogForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [previewTab, setPreviewTab] = useState(false);

  // ── Mutation loading state ───────────────────────────────────────────────────
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/blog?includeDraft=1", { cache: "no-store" });
      if (!res.ok) throw new Error(`Gagal memuat blog (${res.status})`);
      const data: Blog[] = await res.json();
      setBlogs(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // ── Modal helpers ────────────────────────────────────────────────────────────

  function openCreate() {
    setForm(DEFAULT_FORM);
    setEditTarget(null);
    setFormError("");
    setPreviewTab(false);
    setModalMode("create");
  }

  function openEdit(b: Blog) {
    setForm({
      judul: b.judul,
      isi: b.isi,
      gambar: b.gambar ?? "",
      status: b.status,
    });
    setEditTarget(b);
    setFormError("");
    setPreviewTab(false);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setFormError("");
    setPreviewTab(false);
  }

  function setField<K extends keyof BlogForm>(key: K, value: BlogForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Submit (create or edit) ───────────────────────────────────────────────────

  async function handleSubmit() {
    if (!form.judul.trim()) {
      setFormError("Judul wajib diisi.");
      return;
    }
    if (!form.isi.trim()) {
      setFormError("Isi blog wajib diisi.");
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        judul: form.judul.trim(),
        isi: form.isi.trim(),
        status: form.status,
      };
      if (form.gambar.trim()) body.gambar = form.gambar.trim();
      else body.gambar = null;

      let res: Response;
      if (modalMode === "edit" && editTarget) {
        body.id = editTarget.id;
        res = await fetch("/api/blog", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody?.message ??
            (modalMode === "edit" ? "Gagal memperbarui blog" : "Gagal membuat blog")
        );
      }

      closeModal();
      fetchBlogs();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  async function handleDelete(b: Blog) {
    if (!window.confirm(`Hapus blog "${b.judul}"?\n\nTindakan ini tidak dapat dibatalkan.`)) return;
    setDeletingId(b.id);
    try {
      const res = await fetch("/api/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message ?? "Gagal menghapus blog");
      }
      fetchBlogs();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Gagal menghapus blog");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Toggle publish ────────────────────────────────────────────────────────────

  async function handleTogglePublish(b: Blog) {
    const newStatus: BlogStatus = b.status === "DRAFT" ? "PUBLISHED" : "DRAFT";
    setTogglingId(b.id);
    try {
      const res = await fetch("/api/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, status: newStatus }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message ?? "Gagal mengubah status blog");
      }
      // Optimistic local update while re-fetch happens
      setBlogs((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, status: newStatus } : item))
      );
      fetchBlogs();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Gagal mengubah status blog");
    } finally {
      setTogglingId(null);
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────────

  const filtered =
    statusFilter === "all" ? blogs : blogs.filter((b) => b.status === statusFilter);

  const draftCount = blogs.filter((b) => b.status === "DRAFT").length;
  const publishedCount = blogs.filter((b) => b.status === "PUBLISHED").length;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="p-6 lg:p-8">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Kelola Blog</h1>
          <p className="text-white/50 text-sm mt-0.5">
            Buat, edit, dan publikasikan konten blog
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Buat Blog
        </button>
      </div>

      {/* ── Status Filter ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`text-sm rounded-lg px-4 py-2 transition-colors ${
            statusFilter === "all"
              ? "bg-white text-[#0f172a] font-semibold"
              : "border border-white/20 text-white hover:bg-white/10"
          }`}
        >
          Semua
          {!loading && (
            <span className="ml-1.5 text-xs opacity-60">({blogs.length})</span>
          )}
        </button>

        <button
          onClick={() => setStatusFilter("DRAFT")}
          className={`text-sm rounded-lg px-4 py-2 transition-colors ${
            statusFilter === "DRAFT"
              ? "bg-white text-[#0f172a] font-semibold"
              : "border border-white/20 text-white hover:bg-white/10"
          }`}
        >
          Draft
          {!loading && (
            <span className="ml-1.5 text-xs opacity-60">({draftCount})</span>
          )}
        </button>

        <button
          onClick={() => setStatusFilter("PUBLISHED")}
          className={`text-sm rounded-lg px-4 py-2 transition-colors ${
            statusFilter === "PUBLISHED"
              ? "bg-white text-[#0f172a] font-semibold"
              : "border border-white/20 text-white hover:bg-white/10"
          }`}
        >
          Published
          {!loading && (
            <span className="ml-1.5 text-xs opacity-60">({publishedCount})</span>
          )}
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-[#020617] border border-white/10 rounded-xl overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchBlogs}
              className="border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4 w-10">
                    No
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Judul
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Status
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Author
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4 whitespace-nowrap">
                    Tanggal Dibuat
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4 whitespace-nowrap">
                    Terakhir Update
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-white/40 text-sm text-center py-12">
                      {statusFilter === "all"
                        ? "Belum ada blog yang dibuat"
                        : `Tidak ada blog dengan status ${statusFilter}`}
                    </td>
                  </tr>
                ) : (
                  filtered.map((b, i) => {
                    const isToggling = togglingId === b.id;
                    const isDeleting = deletingId === b.id;

                    return (
                      <tr
                        key={b.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        {/* No */}
                        <td className="py-3 px-4 text-white/40 text-xs">{i + 1}</td>

                        {/* Judul + preview isi */}
                        <td className="py-3 px-4 max-w-[240px]">
                          <p className="text-white/85 font-medium truncate">{b.judul}</p>
                          <p className="text-white/35 text-xs mt-0.5 truncate">
                            {truncate(b.isi, 60)}
                          </p>
                          {b.slug && (
                            <p className="text-white/25 text-xs font-mono mt-0.5 truncate">
                              /{b.slug}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <BlogStatusBadge status={b.status} />
                        </td>

                        {/* Author */}
                        <td className="py-3 px-4 text-white/60 text-xs whitespace-nowrap">
                          {b.author}
                        </td>

                        {/* Created at */}
                        <td className="py-3 px-4 text-white/40 text-xs whitespace-nowrap">
                          {fmtDate(b.createdAt)}
                        </td>

                        {/* Updated at */}
                        <td className="py-3 px-4 text-white/40 text-xs whitespace-nowrap">
                          {fmtDate(b.updatedAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            {/* Edit */}
                            <button
                              onClick={() => openEdit(b)}
                              disabled={isDeleting}
                              className="border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              Edit
                            </button>

                            {/* Toggle publish */}
                            <button
                              onClick={() => handleTogglePublish(b)}
                              disabled={isToggling || isDeleting}
                              className="border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {isToggling
                                ? "…"
                                : b.status === "DRAFT"
                                ? "Publish"
                                : "Unpublish"}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(b)}
                              disabled={isDeleting || isToggling}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isDeleting ? "…" : "Hapus"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-lg bg-[#020617] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-white">
                  {modalMode === "create" ? "Buat Blog Baru" : "Edit Blog"}
                </h2>
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewTab(false)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors ${!previewTab ? 'bg-blue-600 text-white font-medium' : 'text-white/50 hover:text-white/80'}`}
                  >
                    Form
                  </button>
                  <button
                    onClick={() => setPreviewTab(true)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors ${previewTab ? 'bg-blue-600 text-white font-medium' : 'text-white/50 hover:text-white/80'}`}
                  >
                    Preview
                  </button>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-white/40 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
                aria-label="Tutup"
              >
                <IconX />
              </button>
            </div>

            {/* Body */}
            {previewTab ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-xl min-h-[400px]">
                {form.gambar ? (
                  <div className="w-full h-56 bg-slate-100">
                    <img src={form.gambar} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-sm">
                    <svg className="w-10 h-10 mr-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    Tanpa Gambar Cover
                  </div>
                )}
                <div className="p-6 md:p-8 overflow-hidden">
                  <h1 className="text-2xl font-bold text-slate-900 mb-4 leading-tight break-words overflow-wrap-anywhere">
                    {form.judul || <span className="text-slate-400 italic">Judul Blog (Belum diisi)</span>}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-6 border-b border-slate-100 pb-5">
                    <span className="font-medium text-slate-700">Author</span>
                    <span>&bull;</span>
                    <span>{fmtDate(new Date())}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${form.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{form.status}</span>
                  </div>
                  <article className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>
                    {form.isi || <span className="text-slate-400 italic">Isi blog masih kosong...</span>}
                  </article>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  Judul <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.judul}
                  onChange={(e) => setField("judul", e.target.value)}
                  placeholder="Judul blog…"
                  className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Isi */}
              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  Isi <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.isi}
                  onChange={(e) => setField("isi", e.target.value)}
                  rows={8}
                  placeholder="Tulis konten blog di sini…"
                  className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 resize-none transition-colors"
                />
                <p className="text-white/25 text-xs mt-1 text-right">
                  {form.isi.length} karakter
                </p>
              </div>

              {/* Upload Gambar */}
              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  Gambar{" "}
                  <span className="text-white/35 font-normal">(opsional)</span>
                </label>

                {form.gambar.trim() ? (
                  <div className="relative rounded-lg overflow-hidden border border-white/10 h-36 bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.gambar}
                      alt="Preview gambar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setField("gambar", "")}
                      className="absolute top-2 right-2 bg-black/60 text-white/80 hover:text-white rounded-lg p-1 transition-colors"
                      aria-label="Hapus gambar"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center gap-2 h-36 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
                      uploading
                        ? "border-blue-500/40 bg-blue-500/5"
                        : "border-white/15 bg-[#0b1220] hover:border-white/30"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      setFormError("");
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/upload?subfolder=blog", { method: "POST", body: fd });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.message ?? "Gagal upload");
                        setField("gambar", data.url);
                      } catch (err: unknown) {
                        setFormError(err instanceof Error ? err.message : "Gagal upload gambar");
                      } finally {
                        setUploading(false);
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        setFormError("");
                        try {
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch("/api/upload?subfolder=blog", { method: "POST", body: fd });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.message ?? "Gagal upload");
                          setField("gambar", data.url);
                        } catch (err: unknown) {
                          setFormError(err instanceof Error ? err.message : "Gagal upload gambar");
                        } finally {
                          setUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                    {uploading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-blue-400 text-xs">Mengupload...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <span className="text-white/40 text-xs">Klik atau seret gambar ke sini</span>
                        <span className="text-white/20 text-[10px]">JPG, PNG, WebP, GIF — Maks 5MB</span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-white/70 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value as BlogStatus)}
                  className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                </select>
              </div>
              </div>
            )}

            {/* Form error */}
            {formError && (
              <p className="mt-3 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            {/* Modal actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {submitting
                  ? "Menyimpan…"
                  : modalMode === "create"
                  ? "Buat Blog"
                  : "Simpan Perubahan"}
              </button>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10 disabled:opacity-40 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
