import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import HeroSection from "@/components/home/HeroSection";
import EvidenceStrip from "@/components/home/EvidenceStrip";
import PlatformFeatures from "@/components/home/PlatformFeatures";
import WorkflowSection from "@/components/home/WorkflowSection";
import PrinciplesSection from "@/components/home/PrinciplesSection";
import FaqSection from "@/components/home/FaqSection";

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="home">
        <HeroSection />
        <EvidenceStrip />
        <PlatformFeatures />
        <WorkflowSection />
        <PrinciplesSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
