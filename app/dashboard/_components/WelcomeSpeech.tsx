export default function WelcomeSpeech() {
  return (
    <section id="welcome-speech" className="relative z-10 bg-[#1F2A44] py-24 sm:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* KIRI — FOTO + EMBLEM */}
          <div className="relative min-h-[380px] sm:min-h-[460px]">
          <img
    src="/images/presma/logo-bem.png"
    alt="Logo BEM"
    className="absolute left-1/2 top-1/2 -translate-x-[50%] -translate-y-1/2 w-[420px] opacity-90"
  />

            {/* Foto Presma */}
          <img
    src="/images/presma/presma.png"
    alt="Foto Presma"
    className="absolute left-1/2 top-[52%] -translate-x-[58%] -translate-y-1/2 w-[330px] z-10"
  />

            {/* Nama Card */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-xl bg-white px-6 py-2 text-center shadow-lg z-20">
              <p className="font-semibold text-[#0F1F3A]">
                Rahmat Riansyah
              </p>
              <p className="text-xs text-gray-600">
                PRESIDEN MAHASISWA BEM ITESA
              </p>
            </div>
          </div>

          {/* KANAN: TEXT */}
    <div>
      {/* TITLE PILL */}
      <div className="inline-block mb-8">
        <span className="bg-white text-[#1F2B44] px-6 py-3 rounded-full font-semibold tracking-wide sm:px-10">
          Welcome Speech Presma
        </span>
      </div>

            <p className="text-gray-200 leading-relaxed text-justify">
              Selamat datang di laman resmi BEM ITESA Muhammadiyah Semarang.
              Di sini kami menghadirkan semangat kolaborasi, pengabdian,
              dan inovasi yang berlandaskan nilai-nilai Islam dan semangat
              kemahasiswaan. Kami percaya bahwa mahasiswa bukan hanya agen
              perubahan di ranah akademik, tetapi juga pelopor dalam
              menebarkan kebermanfaatan bagi masyarakat.
              <br /><br />
              Sebagaimana pesan KH. Ahmad Dahlan, “Hidup-hiduplah
              Muhammadiyah, jangan mencari hidup di Muhammadiyah,” kami
              menjadikan BEM ITESA sebagai wadah untuk tumbuh, bergerak,
              dan mengabdi dengan ikhlas.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
