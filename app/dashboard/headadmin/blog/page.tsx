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

  // ── Mutation loading state ───────────────────────────────────────────────────
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setFormError("");
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
              <h2 className="text-lg font-semibold text-white">
                {modalMode === "create" ? "Buat Blog Baru" : "Edit Blog"}
              </h2>
              <button
                onClick={closeModal}
                className="text-white/40 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
                aria-label="Tutup"
              >
                <IconX />
              </button>
            </div>

            {/* Form */}
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

              {/* Gambar URL */}
              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  Gambar URL{" "}
                  <span className="text-white/35 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={form.gambar}
                  onChange={(e) => setField("gambar", e.target.value)}
                  placeholder="https://example.com/gambar.jpg"
                  className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors"
                />
                {form.gambar.trim() && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-white/10 h-28 bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.gambar}
                      alt="Preview gambar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
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
