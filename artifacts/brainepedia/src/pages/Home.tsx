import { Nav } from "@/components/landing/Nav";
import { PublicHome } from "@/components/landing/PublicHome";
import { Professions } from "@/components/landing/Professions";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { PlatformScreenshots } from "@/components/landing/AudienceShowcase";
import { SkipToContent } from "@/components/ux/SkipToContent";

export default function Home() {
  return (
    <div className="min-h-screen scroll-smooth bg-white font-sans text-[#182137] selection:bg-[#f5f0fc]">
      <SkipToContent />
      <Nav />
      <main id="main-content" tabIndex={-1}>
        <PublicHome />
        <PlatformScreenshots />
        <Professions />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
