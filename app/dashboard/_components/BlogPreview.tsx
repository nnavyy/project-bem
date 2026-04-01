type Blog = {
  id: string | number;
  judul?: string;
  isi?: string;
};

export default async function BlogPreview() {
  let blogs: Blog[] = [];

  try {
    const res = await fetch("/api/blog", { cache: "no-store" });
    if (res.ok) {
      blogs = await res.json();
    }
  } catch {
    // ignore: render empty state
  }

  return (
    <section id="blog" className="py-20 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-white mb-8">Blog Terbaru</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {blogs.slice(0, 3).map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-white/10 p-4 text-gray-300"
            >
              <h3 className="text-white font-semibold">{b.judul ?? "(Tanpa judul)"}</h3>
              <p className="text-sm mt-2 line-clamp-3">{b.isi ?? ""}</p>
            </div>
          ))}

          {blogs.length === 0 && (
            <div className="md:col-span-3 rounded-xl border border-white/10 p-6 text-gray-300">
              Belum ada blog untuk ditampilkan.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
