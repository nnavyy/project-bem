"use client";

export default function HeroSection() {
  function scrollToProfile() {
    const el = document.getElementById("welcome-speech");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="relative min-h-[calc(100vh-68px)] overflow-hidden pb-20 pt-16 sm:pt-20">
      {/* BACKGROUND GEDUNG */}
      <img
        src="/images/hero/fotobembersama.jpg"
        alt="Gedung ITESA"
        className="absolute inset-0 w-full h-full object-cover blur-[-90px] scale-105"
        />
        {/*className="absolute inset-0 w-full h-full scale 90"*/}
      

      {/* OVERLAY GELAP */}
      <div className="absolute inset-0 bg-[#0F1F3A]/20" />

      {/* SELAMAT DATANG (DI BELAKANG KEPALA) */}
      <h1
        className="
          absolute top-[18%] w-full px-4 text-center
          text-2xl font-bold tracking-[0.16em] text-white sm:top-[20%] sm:text-4xl md:text-5xl
          z-20
        "
      >
        SELAMAT DATANG
      </h1>

      {/* FOTO PRESMA (FULL BADAN, OVERLAP) }
      <img
        src="/images/hero/presma.png"
        alt="Presiden Mahasiswa"
        className="
          absolute bottom-0 left-1/2
          -translate-x-1/2
          w-[min(520px,90vw)]
          z-30
          drop-shadow-2xl
          select-none
        "
      /> */}
      <p
        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        className="
          absolute bottom-[72px] left-1/2 z-50 w-full max-w-4xl -translate-x-1/2
          px-4 text-center uppercase leading-tight tracking-[0.1em] text-white
          text-sm sm:bottom-[60px] sm:text-lg md:text-2xl
          pointer-events-none
        "
      >
        OFFICIAL WEBSITE BADAN EKSEKUTIF MAHASISWA <br />
        INSTITUT TEKNOLOGI STATISTIKA DAN BISNIS MUHAMMADIYAH SEMARANG
      </p>






      {/* BUTTON PROFIL di tengah antar-section */}
      <button
        onClick={scrollToProfile}
        className="
          absolute bottom-[10px]
          left-1/2 -translate-x-1/2
          rounded-full bg-white px-8 py-2.5 text-sm font-semibold text-[#0F1F3A] sm:px-12 sm:py-3 sm:text-base
          shadow-lg z-[60]
        "
      >
        Profil
      </button>


    </section>
  );
}
