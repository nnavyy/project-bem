type Portofolio = {
  id: string | number;
  namaDivisi?: string;
  deskripsi?: string;
};

export default async function PortofolioPreview() {
  let data: Portofolio[] = [];

  try {
    const res = await fetch("/api/portofolio", { cache: "no-store" });
    if (res.ok) {
      data = await res.json();
    }
  } catch {
    // ignore: render empty state
  }

  return (
    <section id="portofolio" className="py-20 bg-[#020617]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-white mb-8">Portofolio</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {data.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 p-4 text-gray-300"
            >
              <h3 className="text-white font-semibold">
                {item.namaDivisi ?? "(Tanpa nama divisi)"}
              </h3>
              <p className="text-sm mt-2">{item.deskripsi ?? ""}</p>
            </div>
          ))}

          {data.length === 0 && (
            <div className="md:col-span-3 rounded-xl border border-white/10 p-6 text-gray-300">
              Belum ada portofolio untuk ditampilkan.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
