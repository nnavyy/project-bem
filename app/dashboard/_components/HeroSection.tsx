"use client";

export default function HeroSection() {
  return (
    <section className="relative h-screen pb-24 overflow-visible">
      {/* BACKGROUND GEDUNG */}
      <img
        src="/images/hero/bg-gedung.jpg"
        alt="Gedung ITESA"
        className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
        />
        {/*className="absolute inset-0 w-full h-full scale 90"*/}
      

      {/* OVERLAY GELAP */}
      <div className="absolute inset-0 bg-[#0F1F3A]/20" />

      {/* SELAMAT DATANG (DI BELAKANG KEPALA) */}
      <h1
        className="
          absolute top-[25%] w-full text-center
          text-white text-6xl font-bold
          tracking-[0.3em]
          z-20
        "
      >
        SELAMAT DATANG
      </h1>

      {/* FOTO PRESMA (FULL BADAN, OVERLAP) */}
      <img
        src="/images/hero/presma.png"
        alt="Presiden Mahasiswa"
        className="
          absolute bottom-0 left-1/2
          -translate-x-1/2
          w-[520px]
          z-30
          drop-shadow-2xl
          select-none
        "
      />
<p
  style={{
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "28px",
    letterSpacing: "0.15em",
    lineHeight: "1.00",
    maxWidth: "120000px",
  }}
  className="
    absolute bottom-[40px]
    left-1/2 -translate-x-1/2
    text-center
    text-white uppercase
    z-50
    pointer-events-none
  "
>
  OFFICIAL WEBSITE BADAN EKSEKUTIF MAHASISWA <br />
  INSTITUT TEKNOLOGI STATISTIKA DAN BISNIS MUHAMMADIYAH SEMARANG
</p>






      {/* BUTTON PROFIL (DI TENGAH ANTAR SECTION) */}
      <button
      
        className="
          absolute bottom-[-25px]  
          left-1/2 -translate-x-1/2
          bg-white text-[#0F1F3A]
          px-12 py-3 rounded-full
          font-semibold
          z-50
        "
      >
        Profil
      </button>


    </section>
  );
}
