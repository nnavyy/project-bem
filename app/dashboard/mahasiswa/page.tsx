import Header from "../_components/Header";
import HeroSection from "../_components/HeroSection";
import WelcomeSpeech from "../_components/WelcomeSpeech";
import LayananKami from "../_components/LayananKami";
import BlogPreview from "../_components/BlogPreview";
import PortofolioPreview from "../_components/PortofolioPreview";
import SuarakuCTA from "../_components/SuarakuCTA";
import Footer from "../_components/Footer";

export default function DashboardMahasiswaPage() {
  return (
    <main className="bg-[#1f2c44] text-white">
      <Header />
      <HeroSection />
      <WelcomeSpeech />
      <LayananKami />

      <section className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <BlogPreview />
        <PortofolioPreview />
        {/* CTA Suaraku: hanya mahasiswa yang bisa pakai fitur laporan */}
        <SuarakuCTA />
      </section>

      <Footer />
    </main>
  );
}
