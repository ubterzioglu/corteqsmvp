import { useEffect } from "react";
import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import HeroSection from "@/components/HeroSection";
import DiasporaSearchBar from "@/components/DiasporaSearchBar";
import ConsultantCategories from "@/components/ConsultantCategories";
import FeaturedEvents from "@/components/FeaturedEvents";
import DiasporaMarqueeSection from "@/components/DiasporaMarqueeSection";
import ChatBot from "@/components/chat/ChatBot";
import FAQSection from "@/components/FAQSection";
import SEOContentSection from "@/components/SEOContentSection";
import LandingFoundersSection from "@/components/LandingFoundersSection";
import GlobalNetworkShowcaseSection from "@/components/GlobalNetworkShowcaseSection";

const Index = () => {
  useEffect(() => {
    document.dispatchEvent(new Event("render-complete"));
  }, []);

  return (
    <div className="landing-ambient min-h-screen">
      <div className="landing-ambient-orb landing-ambient-orb-one" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-two" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-three" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-four" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-five" aria-hidden="true" />
      <main id="main" className="relative isolate overflow-hidden pb-8">
        <HeroSection />
        <SectionErrorBoundary sectionName="DiasporaSearchBar">
          <DiasporaSearchBar />
        </SectionErrorBoundary>
        <ConsultantCategories />
        <GlobalNetworkShowcaseSection />
        <FeaturedEvents />
        <LandingFoundersSection />
        <DiasporaMarqueeSection />
        <SEOContentSection />
        <FAQSection />
        <ChatBot />
      </main>
    </div>
  );
};

export default Index;
