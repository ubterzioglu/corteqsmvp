/**
 * /landingtrial — DENEME landing sayfası (Vodafone tarzı anlatı ön kapısı).
 *
 * Ana sayfadan (`/`) tamamen izole bir deneme. Beğenilirse içerik sonradan
 * Index.tsx'e taşınabilir. PublicLayout otomatik olarak SiteHeader + Footer sarar.
 * Bölümler Index.tsx desenindeki gibi <Reveal> ile staggered gelir.
 */

import { useEffect } from "react";
import Reveal from "@/components/motion/Reveal";
import HeroNetworkSection from "@/components/home-trial/HeroNetworkSection";
import ManifestoSection from "@/components/home-trial/ManifestoSection";
import GlobalAtlasSection from "@/components/home-trial/GlobalAtlasSection";
import EcosystemRailSection from "@/components/home-trial/EcosystemRailSection";
import ProofBandSection from "@/components/home-trial/ProofBandSection";
import DiasporaStoriesSection from "@/components/home-trial/DiasporaStoriesSection";
import FinalCtaSection from "@/components/home-trial/FinalCtaSection";

const LandingTrialPage = () => {
  useEffect(() => {
    // Prerender katmanı için "içerik hazır" sinyali (Index.tsx ile aynı desen).
    document.dispatchEvent(new Event("render-complete"));
  }, []);

  return (
    <div className="landing-ambient min-h-screen">
      <div className="landing-ambient-orb landing-ambient-orb-one" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-two" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-three" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-four" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-five" aria-hidden="true" />

      <main id="main" className="relative isolate overflow-hidden">
        <HeroNetworkSection />
        <Reveal>
          <ManifestoSection />
        </Reveal>
        <Reveal delay={0.05}>
          <GlobalAtlasSection />
        </Reveal>
        <Reveal delay={0.05}>
          <EcosystemRailSection />
        </Reveal>
        <Reveal delay={0.05}>
          <ProofBandSection />
        </Reveal>
        <Reveal delay={0.05}>
          <DiasporaStoriesSection />
        </Reveal>
        <Reveal delay={0.05}>
          <FinalCtaSection />
        </Reveal>
      </main>
    </div>
  );
};

export default LandingTrialPage;
