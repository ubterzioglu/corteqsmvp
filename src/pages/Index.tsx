// NOT: Bu sayfa 2026-06-18'den itibaren /landingtrial adresinde servis ediliyor
// (eski ana sayfa). Ana sayfa (/) artık LandingTrialPage.tsx anlatı tasarımıdır.
// Dosya/bileşen adı (Index) import zinciri riski nedeniyle bilinçli korundu.
// SEO: bu sayfa ana sayfanın (/) eski/yinelenen içeriği olduğu için index.html'in
// genel index,follow varsayılanını miras almak yerine noindex + canonical->/ ile
// arama motorlarına yönlendirme yapıyor.
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
import { useSeo } from "@/lib/seo";

const Index = () => {
  // `/landingtrial` eski ana sayfa taslağıdır; canlı ana sayfa `LandingTrialPage`.
  //
  // ÇELİŞKİ DÜZELTİLDİ (2026-09-20): burada aynı anda hem `canonicalPath: "/"` hem
  // `noindex` vardı. Bu iki sinyal birbirini iptal eder — Google noindex verilen bir
  // sayfada canonical'ı DEĞERLENDİRMEZ (sayfa indekslenmeyeceği için birleştirilecek
  // bir şey de yoktur). Yani cross-canonical hiçbir iş yapmıyor, yalnız "bu sayfa
  // ana sayfanın kopyası" diye yanlış bir iz bırakıyordu.
  //
  // Karar: `noindex` KALIR (sayfa gerçekten indekslenmemeli, içeriği ana sayfayla
  // birebir örtüşüyor), cross-canonical DÜŞER. Başlık da artık ana sayfanınkiyle
  // birebir aynı değil — iki farklı şeyin aynı adı taşıması tanıyı zorlaştırıyordu.
  useSeo(
    {
      title: "Ana Sayfa Taslağı | CorteQS",
      description:
        "CorteQS ana sayfasının eski taslak sürümü. Yayındaki sayfa için corteqs.net adresine gidin.",
      robots: "noindex, follow",
    },
    [],
  );

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
