/**
 * Ana sayfa (`/`) — Vodafone tarzı anlatı ön kapısı.
 *
 * 2026-06-18'de eski /landingtrial denemesi ana sayfa yapıldı; eski ana sayfa
 * (Index.tsx) /landingtrial adresine taşındı. Dosya adı uyumluluk için korundu.
 * PublicLayout otomatik olarak SiteHeader + Footer sarar.
 * Bölümler <Reveal> ile staggered gelir.
 */

import Reveal from "@/components/motion/Reveal";
import HeroNetworkSection from "@/components/home-trial/HeroNetworkSection";
import ManifestoSection from "@/components/home-trial/ManifestoSection";
import DiasporaSearchSection from "@/components/home-trial/DiasporaSearchSection";
import EcosystemRailSection from "@/components/home-trial/EcosystemRailSection";
import ProofBandSection from "@/components/home-trial/ProofBandSection";
import DiasporaStoriesSection from "@/components/home-trial/DiasporaStoriesSection";
import FinalCtaSection from "@/components/home-trial/FinalCtaSection";
import { PAGE_SEO } from "@/lib/page-seo";
import { useSeo } from "@/lib/seo";

const LandingTrialPage = () => {
  useSeo(PAGE_SEO.home, []);

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
          <DiasporaSearchSection />
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
