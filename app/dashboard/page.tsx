import Navbar from "./_components/Navbar";
import HeroSection from "./_components/HeroSection";
import WelcomeSpeech from "./_components/WelcomeSpeech";
import LayananKami from "./_components/LayananKami";
import BlogPreview from "./_components/BlogPreview";
import PortofolioPreview from "./_components/PortofolioPreview";
import SuarakuCTA from "./_components/SuarakuCTA";
import Footer from "./_components/Footer";

export default function DashboardPage() {
  return (
    <main className="bg-[#1f2c44] text-white">
      <Navbar />
      <HeroSection />
      <WelcomeSpeech />
      <LayananKami />

      {/* Preview konten untuk guest */}
      <BlogPreview />
      <PortofolioPreview />
      <SuarakuCTA />

      <Footer />
    </main>
  );
}
