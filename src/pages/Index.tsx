import { useEffect } from "react";
import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import HeroSection from "@/components/HeroSection";
import DiasporaSearchBar from "@/components/DiasporaSearchBar";
import SocialProofBar from "@/components/SocialProofBar";
import DiasporaMarqueeSection from "@/components/DiasporaMarqueeSection";
import ChatBot from "@/components/chat/ChatBot";
import FAQSection from "@/components/FAQSection";
import SEOContentSection from "@/components/SEOContentSection";
import GlobalNetworkShowcaseSection from "@/components/GlobalNetworkShowcaseSection";
import CorteqsAnimatedBackground from "@/components/landing/CorteqsAnimatedBackground";
import Reveal from "@/components/motion/Reveal";

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
      <CorteqsAnimatedBackground variant="page" />
      <main id="main" className="relative isolate overflow-hidden pb-8">
        <HeroSection />
        <Reveal>
          <SectionErrorBoundary sectionName="DiasporaSearchBar">
            <DiasporaSearchBar />
          </SectionErrorBoundary>
        </Reveal>
        <Reveal delay={0.05}>
          <SectionErrorBoundary sectionName="SocialProofBar">
            <SocialProofBar />
          </SectionErrorBoundary>
        </Reveal>
        <Reveal delay={0.1}>
          <GlobalNetworkShowcaseSection />
        </Reveal>
        <Reveal delay={0.05}>
          <DiasporaMarqueeSection />
        </Reveal>
        <Reveal delay={0.05}>
          <SEOContentSection />
        </Reveal>
        <Reveal delay={0.05}>
          <FAQSection />
        </Reveal>
        <ChatBot />
      </main>
    </div>
  );
};

export default Index;
