"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminInfo = {
  id: string;
  username: string;
  nama: string;
  role: string;
};

type GaleriItem = {
  id: string;
  namaAnggota: string;
  jabatan: string | null;
  foto: string | null;
  urutan: number | null;
};

type Portofolio = {
  id: string;
  namaDivisi: string;
  deskripsi: string;
  fotoUtama: string | null;
  tanggalKegiatan: string | null;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  galeri: GaleriItem[];
  admin: AdminInfo;
};

type PortofolioForm = {
  namaDivisi: string;
  deskripsi: string;
  fotoUtama: string;
  tanggalKegiatan: string;
  galeri: Array<{
    _tempId: string;
    namaAnggota: string;
    jabatan: string;
    foto: string;
    urutan: number;
    uploading?: boolean;
  }>;
};

type ModalMode = "create" | "edit" | "detail" | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FORM: PortofolioForm = {
  namaDivisi: "",
  deskripsi: "",
  fotoUtama: "",
  tanggalKegiatan: "",
  galeri: [],
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

function fmtDateOnly(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(d: string | null | undefined): string {
  if (!d) return "";
  try {
    return new Date(d).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div
            className="h-3.5 rounded bg-white/10 animate-pulse"
            style={{ width: `${45 + ((i * 19) % 50)}%` }}
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
      <span className="text-white/50 text-xs font-semibold">
        {initials || "?"}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortofolioPage() {
  // ── List state ──────────────────────────────────────────────────────────────
  const [portofolios, setPortofolios] = useState<Portofolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [target, setTarget] = useState<Portofolio | null>(null);
  const [form, setForm] = useState<PortofolioForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // ── Per-row action state ──────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────────

  const fetchPortofolios = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portofolio", { cache: "no-store" });
      if (!res.ok) throw new Error(`Gagal memuat portofolio (${res.status})`);
      const data: Portofolio[] = await res.json();
      setPortofolios(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortofolios();
  }, [fetchPortofolios]);

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  function openCreate() {
    setForm(DEFAULT_FORM);
    setTarget(null);
    setFormError("");
    setModalMode("create");
  }

  function openEdit(p: Portofolio) {
    setForm({
      namaDivisi: p.namaDivisi,
      deskripsi: p.deskripsi,
      fotoUtama: p.fotoUtama ?? "",
      tanggalKegiatan: toDateInputValue(p.tanggalKegiatan),
      galeri: p.galeri.map((g) => ({
        _tempId: Math.random().toString(36).substring(2),
        namaAnggota: g.namaAnggota,
        jabatan: g.jabatan ?? "",
        foto: g.foto ?? "",
        urutan: g.urutan ?? 0,
      })),
    });
    setTarget(p);
    setFormError("");
    setModalMode("edit");
  }

  function addAnggota() {
    setForm((prev) => ({
      ...prev,
      galeri: [
        ...prev.galeri,
        {
          _tempId: Math.random().toString(36).substring(2),
          namaAnggota: "",
          jabatan: "",
          foto: "",
          urutan: prev.galeri.length,
        },
      ],
    }));
  }

  function updateAnggota(tempId: string, field: string, value: string | number | boolean) {
    setForm((prev) => ({
      ...prev,
      galeri: prev.galeri.map((g) => (g._tempId === tempId ? { ...g, [field]: value } : g)),
    }));
  }

  function removeAnggota(tempId: string) {
    setForm((prev) => ({
      ...prev,
      galeri: prev.galeri.filter((g) => g._tempId !== tempId),
    }));
  }

  function openDetail(p: Portofolio) {
    setTarget(p);
    setModalMode("detail");
  }

  function closeModal() {
    setModalMode(null);
    setTarget(null);
    setForm(DEFAULT_FORM);
    setFormError("");
    setShowPreview(false);
  }

  function setField<K extends keyof PortofolioForm>(
    key: K,
    value: PortofolioForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!form.namaDivisi.trim()) {
      setFormError("Nama divisi wajib diisi.");
      return;
    }
    if (!form.deskripsi.trim()) {
      setFormError("Deskripsi wajib diisi.");
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        namaDivisi: form.namaDivisi.trim(),
        deskripsi: form.deskripsi.trim(),
        galeri: form.galeri
          .filter((g) => g.namaAnggota.trim() !== "")
          .map((g) => ({
            namaAnggota: g.namaAnggota.trim(),
            jabatan: g.jabatan.trim() || null,
            foto: g.foto.trim() || null,
            urutan: Number(g.urutan) || 0,
          })),
      };
      if (form.fotoUtama.trim()) body.fotoUtama = form.fotoUtama.trim();
      if (form.tanggalKegiatan) body.tanggalKegiatan = form.tanggalKegiatan;

      let res: Response;
      if (modalMode === "edit" && target) {
        body.id = target.id;
        res = await fetch("/api/portofolio", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/portofolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody?.message ??
            (modalMode === "edit"
              ? "Gagal memperbarui portofolio"
              : "Gagal membuat portofolio"),
        );
      }

      closeModal();
      fetchPortofolios();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────────

  async function handleDelete(p: Portofolio) {
    if (
      !window.confirm(
        `Hapus portofolio "${p.namaDivisi}"?\n\nSemua data galeri di dalamnya juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;

    setDeletingId(p.id);
    try {
      const res = await fetch("/api/portofolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message ?? "Gagal menghapus portofolio");
      }
      fetchPortofolios();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Gagal menghapus portofolio");
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="p-6 lg:p-8">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Portofolio</h1>
          <p className="text-white/50 text-sm mt-0.5">
            Kelola portofolio kegiatan divisi BEM
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Buat Portofolio
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-[#020617] border border-white/10 rounded-xl overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchPortofolios}
              className="border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
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
                    Nama Divisi
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Admin
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4 whitespace-nowrap">
                    Jml. Anggota
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4 whitespace-nowrap">
                    Tgl. Kegiatan
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4 whitespace-nowrap">
                    Tanggal Dibuat
                  </th>
                  <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} cols={7} />
                  ))
                ) : portofolios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-white/40 text-sm text-center py-12"
                    >
                      Belum ada portofolio yang dibuat
                    </td>
                  </tr>
                ) : (
                  portofolios.map((p, i) => {
                    const isDeleting = deletingId === p.id;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        {/* No */}
                        <td className="py-3 px-4 text-white/40 text-xs">
                          {i + 1}
                        </td>

                        {/* Nama Divisi */}
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="flex items-center gap-3">
                            {p.fotoUtama ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={p.fotoUtama}
                                alt={p.namaDivisi}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10"
                                onError={(e) => {
                                  (
                                    e.currentTarget as HTMLImageElement
                                  ).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-white/20"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                                  />
                                </svg>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-white/85 font-medium truncate">
                                {p.namaDivisi}
                              </p>
                              <p className="text-white/35 text-xs truncate mt-0.5">
                                {p.deskripsi}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Admin */}
                        <td className="py-3 px-4">
                          <p className="text-white/65 text-xs">
                            {p.admin?.nama ?? "—"}
                          </p>
                          <p className="text-white/35 text-xs font-mono mt-0.5">
                            @{p.admin?.username ?? "—"}
                          </p>
                        </td>

                        {/* Jumlah Anggota */}
                        <td className="py-3 px-4">
                          <span className="text-white/70 text-sm font-medium">
                            {p.galeri.length}
                          </span>
                          <span className="text-white/35 text-xs ml-1">
                            anggota
                          </span>
                        </td>

                        {/* Tanggal Kegiatan */}
                        <td className="py-3 px-4 text-white/50 text-xs whitespace-nowrap">
                          {fmtDateOnly(p.tanggalKegiatan)}
                        </td>

                        {/* Tanggal Dibuat */}
                        <td className="py-3 px-4 text-white/40 text-xs whitespace-nowrap">
                          {fmtDate(p.createdAt)}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              onClick={() => openDetail(p)}
                              disabled={isDeleting}
                              className="border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              Detail
                            </button>
                            <button
                              onClick={() => openEdit(p)}
                              disabled={isDeleting}
                              className="border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              disabled={isDeleting}
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
      {(modalMode === "create" || modalMode === "edit") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-lg bg-[#020617] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {modalMode === "create" ? "Buat Portofolio" : "Edit Portofolio"}
              </h2>
              <button
                onClick={closeModal}
                className="text-white/40 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
                aria-label="Tutup"
              >
                <IconX />
              </button>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              {/* Nama Divisi */}
              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  Nama Divisi <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.namaDivisi}
                  onChange={(e) => setField("namaDivisi", e.target.value)}
                  placeholder="Contoh: Divisi PSDM"
                  className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  Deskripsi <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setField("deskripsi", e.target.value)}
                  rows={4}
                  placeholder="Tulis deskripsi kegiatan divisi…"
                  className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 resize-none transition-colors"
                />
              </div>

              {/* Foto Utama */}
              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  Foto Utama{" "}
                  <span className="text-white/35 font-normal">(opsional)</span>
                </label>

                {form.fotoUtama.trim() ? (
                  <div className="relative rounded-lg overflow-hidden border border-white/10 h-36 bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.fotoUtama}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setField("fotoUtama", "")}
                      className="absolute top-2 right-2 bg-black/60 text-white/80 hover:text-white rounded-lg p-1 transition-colors"
                      aria-label="Hapus foto"
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
                        const res = await fetch("/api/upload?subfolder=portofolio", { method: "POST", body: fd });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.message ?? "Gagal upload");
                        setField("fotoUtama", data.url);
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
                          const res = await fetch("/api/upload?subfolder=portofolio", { method: "POST", body: fd });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.message ?? "Gagal upload");
                          setField("fotoUtama", data.url);
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

              {/* Tanggal Kegiatan */}
              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  Tanggal Kegiatan{" "}
                  <span className="text-white/35 font-normal">(opsional)</span>
                </label>
                <input
                  type="date"
                  value={form.tanggalKegiatan}
                  onChange={(e) => setField("tanggalKegiatan", e.target.value)}
                  className="w-full bg-[#0b1220] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors scheme-dark"
                />
              </div>

              {/* Galeri Anggota */}
              <div className="pt-4 border-t border-white/10 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-white/70 font-medium">
                    Galeri Anggota <span className="text-white/35 font-normal">(opsional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addAnggota}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    + Tambah Anggota
                  </button>
                </div>
                
                {form.galeri.length === 0 ? (
                  <div className="text-center py-6 border border-white/10 border-dashed rounded-lg bg-[#0b1220]">
                    <p className="text-white/40 text-xs text-center">Belum ada anggota yang ditambahkan.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.galeri.map((g, index) => (
                      <div key={g._tempId} className="flex flex-col sm:flex-row gap-3 p-3 border border-white/10 rounded-lg bg-[#0b1220] relative max-h-48">
                        {/* Foto Uploader */}
                        <div className="shrink-0">
                          {g.foto ? (
                            <div className="relative w-16 h-16 rounded overflow-hidden group">
                              <img src={g.foto} alt="Foto" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => updateAnggota(g._tempId, "foto", "")}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                              >
                                <IconX />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-16 h-16 rounded border border-dashed border-white/20 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                              {g.uploading ? (
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="text-white/40 text-[10px] text-center px-1">Upload Foto</span>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if(!file) return;
                                  updateAnggota(g._tempId, "uploading", true);
                                  try {
                                    const fd = new FormData();
                                    fd.append("file", file);
                                    const res = await fetch("/api/upload?subfolder=portofolio", { method: "POST", body: fd });
                                    const data = await res.json();
                                    if(res.ok) updateAnggota(g._tempId, "foto", data.url);
                                    else throw new Error("Gagal upload");
                                  } catch (err) {
                                    alert("Gagal mengupload foto anggota");
                                  } finally {
                                    updateAnggota(g._tempId, "uploading", false);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                        {/* Fields */}
                        <div className="flex-1 space-y-2 min-w-0">
                          <input
                            type="text"
                            placeholder="Nama Lengkap *"
                            value={g.namaAnggota}
                            onChange={(e) => updateAnggota(g._tempId, "namaAnggota", e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/30"
                          />
                          <input
                            type="text"
                            placeholder="Jabatan"
                            value={g.jabatan}
                            onChange={(e) => updateAnggota(g._tempId, "jabatan", e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/30"
                          />
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                           <input
                             type="number"
                             placeholder="Urutan"
                             value={g.urutan === 0 && g.namaAnggota === "" ? index : g.urutan}
                             onChange={(e) => updateAnggota(g._tempId, "urutan", parseInt(e.target.value) || 0)}
                             className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-center text-white placeholder:text-white/30 outline-none focus:border-white/30"
                           />
                           <button
                             type="button"
                             onClick={() => removeAnggota(g._tempId)}
                             className="text-red-400 hover:text-red-300 text-[10px] px-2 py-1 rounded bg-red-500/10 transition-colors uppercase font-medium"
                           >
                             Hapus
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form error */}
            {formError && (
              <p className="mt-3 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-white text-[#0f172a] text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {submitting
                  ? "Menyimpan…"
                  : modalMode === "create"
                    ? "Buat Portofolio"
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

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      {modalMode === "detail" && target && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="flex min-h-full items-start justify-center px-4 py-8">
            <div className="w-full max-w-2xl bg-[#020617] border border-white/10 rounded-2xl p-6 my-auto">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-white leading-snug">
                    {target.namaDivisi}
                  </h2>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button
                      onClick={() => setShowPreview(false)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${!showPreview ? "bg-white text-black font-semibold" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                    >
                      Data Internal
                    </button>
                    <button
                      onClick={() => setShowPreview(true)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors flex items-center gap-1.5 ${showPreview ? "bg-blue-500 text-white font-semibold" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview Publik
                    </button>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="shrink-0 text-white/40 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
                  aria-label="Tutup"
                >
                  <IconX />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {showPreview ? (
                  <div className="bg-white text-slate-800 rounded-xl overflow-hidden shadow-xl border border-white/10">
                    <div className="relative h-64 bg-slate-200">
                      {target.fotoUtama ? (
                        <img src={target.fotoUtama} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          Tanpa Foto Utama
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                        <span className="bg-blue-600 px-3 py-1 text-xs font-semibold rounded-full mb-3 inline-block">Portofolio BEM</span>
                        <h1 className="text-2xl font-bold break-words">{target.namaDivisi}</h1>
                        {target.tanggalKegiatan && (
                          <p className="text-white/80 text-sm mt-1">{fmtDateOnly(target.tanggalKegiatan)}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-6 md:p-8 overflow-hidden">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 break-words">Deskripsi Kegiatan</h3>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-8 text-sm break-words" style={{ overflowWrap: 'anywhere' }}>{target.deskripsi}</p>
                      
                      {target.galeri.length > 0 && (
                        <>
                          <h3 className="text-lg font-semibold text-slate-900 mb-4 border-t border-slate-100 pt-6">Anggota Terlibat</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {target.galeri.slice().sort((a,b)=>(a.urutan??999)-(b.urutan??999)).map(g => (
                              <div key={g.id} className="group relative overflow-hidden rounded-xl aspect-[3/4] bg-slate-100 shadow-sm border border-slate-200/50">
                                {g.foto ? (
                                  <img src={g.foto} alt={g.namaAnggota} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-3xl font-bold uppercase">{g.namaAnggota.substring(0,2)}</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 opacity-80" />
                                <div className="absolute bottom-0 left-0 w-full p-4 text-white translate-y-2 group-hover:translate-y-0 transition-transform">
                                  <p className="font-semibold text-sm leading-tight text-white">{g.namaAnggota}</p>
                                  <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{g.jabatan}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Foto utama */}
                    {target.fotoUtama && (
                      <div className="mb-5 rounded-xl overflow-hidden border border-white/10 h-48 bg-black/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={target.fotoUtama}
                          alt={target.namaDivisi}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).parentElement!.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-5">
                      <div>
                        <p className="text-white/40 text-xs mb-1">Deskripsi</p>
                        <p className="text-white/75 text-sm leading-relaxed">
                          {target.deskripsi}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-white/40 text-xs mb-0.5">
                            Admin Pembuat
                          </p>
                          <p className="text-white/75 text-sm">
                            {target.admin?.nama ?? "—"}
                          </p>
                          <p className="text-white/35 text-xs font-mono">
                            @{target.admin?.username ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs mb-0.5">
                            Tanggal Kegiatan
                          </p>
                          <p className="text-white/75 text-sm">
                            {fmtDateOnly(target.tanggalKegiatan)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs mb-0.5">Dibuat Pada</p>
                          <p className="text-white/55 text-xs">
                            {fmtDate(target.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs mb-0.5">
                            Terakhir Diperbarui
                          </p>
                          <p className="text-white/55 text-xs">
                            {fmtDate(target.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 mb-5" />

                    {/* Galeri / anggota */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-white/50 text-xs font-medium uppercase tracking-wider">
                          Galeri Anggota
                        </p>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/50 font-medium">
                          {target.galeri.length} anggota
                        </span>
                      </div>

                      {target.galeri.length === 0 ? (
                        <p className="text-white/40 text-sm text-center py-8">
                          Belum ada anggota di galeri ini
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                                  Foto
                                </th>
                                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                                  Nama Anggota
                                </th>
                                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                                  Jabatan
                                </th>
                                <th className="text-left text-white/50 text-xs font-medium uppercase tracking-wider py-3 px-4">
                                  Urutan
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {target.galeri
                                .slice()
                                .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999))
                                .map((g) => (
                                  <tr
                                    key={g.id}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                  >
                                    {/* Foto */}
                                    <td className="py-3 px-4">
                                      {g.foto ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                          src={g.foto}
                                          alt={g.namaAnggota}
                                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                                          onError={(e) => {
                                            (
                                              e.currentTarget as HTMLImageElement
                                            ).style.display = "none";
                                            (
                                              e.currentTarget
                                                .nextSibling as HTMLElement | null
                                            )?.style.removeProperty("display");
                                          }}
                                        />
                                      ) : null}
                                      {!g.foto && (
                                        <AvatarPlaceholder name={g.namaAnggota} />
                                      )}
                                    </td>

                                    {/* Nama */}
                                    <td className="py-3 px-4 text-white/80 font-medium">
                                      {g.namaAnggota}
                                    </td>

                                    {/* Jabatan */}
                                    <td className="py-3 px-4 text-white/55">
                                      {g.jabatan ?? (
                                        <span className="text-white/25">—</span>
                                      )}
                                    </td>

                                    {/* Urutan */}
                                    <td className="py-3 px-4">
                                      {g.urutan !== null && g.urutan !== undefined ? (
                                        <span className="text-white/50 text-xs font-mono bg-white/5 px-2 py-0.5 rounded">
                                          {g.urutan}
                                        </span>
                                      ) : (
                                        <span className="text-white/25">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center gap-3">
                <button
                  onClick={() => {
                    closeModal();
                    openEdit(target);
                  }}
                  className="border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
                >
                  Edit Portofolio
                </button>
                <button
                  onClick={closeModal}
                  className="border border-white/20 text-white text-sm rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
