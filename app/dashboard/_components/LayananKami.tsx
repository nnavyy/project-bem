export default function LayananKami() {
  const layanan = [
    {
      title: "Suaraku ITESA",
      desc: "Wadah resmi bagi mahasiswa untuk menyampaikan aspirasi, kritik, dan keluhan secara aman dan terstruktur.",
      cta: "Sampaikan Aspirasi",
    },
    {
      title: "Blog & Berita",
      desc: "Informasi terbaru mengenai kegiatan, pengumuman resmi, serta dokumentasi program kerja BEM ITESA.",
      cta: "Baca Berita",
    },
    {
      title: "Portofolio BEM",
      desc: "Dokumentasi program kerja, divisi, dan kontribusi BEM ITESA sebagai bentuk transparansi organisasi.",
      cta: "Lihat Portofolio",
    },
  ];

  return (
    <section className="py-24 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-white text-center">
          Layanan Kami
        </h2>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {layanan.map((item) => (
            <div
              key={item.title}
              className="
                group
                h-full
                rounded-2xl
                border border-white/10
                bg-white/[0.02]
                p-8
                transition
                hover:border-white/30
                hover:bg-white/[0.04]
              "
            >
              <h3 className="text-lg font-semibold text-white">
                {item.title}
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-gray-300">
                {item.desc}
              </p>

              <button
                className="
                  mt-6
                  text-sm font-semibold
                  text-white
                  inline-flex items-center gap-2
                  opacity-80
                  group-hover:opacity-100
                  transition
                "
              >
                {item.cta}
                <span className="transition group-hover:translate-x-1">→</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
