import { useEffect, useState } from "react";

import { useSeo } from "@/lib/seo";
import {
  clearInvestorSession,
  getInvestorVerifier,
  hasInvestorSession,
} from "@/lib/investor/investor-access";
import {
  CODE_METRICS,
  DB_METRICS,
  INFRA_POINTS,
  INVESTOR_SECTIONS,
  type InvestorSection,
} from "@/lib/investor/investor-content";
import InvestorGate from "@/components/investor/InvestorGate";
import InvestorNav from "@/components/investor/InvestorNav";
import InvestorHero from "@/components/investor/InvestorHero";
import InvestorSectionShell from "@/components/investor/InvestorSectionShell";
import FeatureGrid from "@/components/investor/FeatureGrid";
import TechStack from "@/components/investor/TechStack";
import InfraDiagram from "@/components/investor/InfraDiagram";
import MetricTile from "@/components/investor/MetricTile";
import QualityGates from "@/components/investor/QualityGates";
import HandoverGrid from "@/components/investor/HandoverGrid";
import EcosystemLinks from "@/components/investor/EcosystemLinks";
import InvestorClosing from "@/components/investor/InvestorClosing";
import "./investor-theme.css";

// Yatırımcı sayfası — sitenin PublicLayout'u DIŞINDA, kendi tasarımıyla çizilir.
// Kurallar: docs/investor/README.md · CLAUDE.md "Yatırımcı sayfası" bölümü.

const FONT_LINK_ID = "inv-plex-fonts";
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap";

/** Plex yazı ailesini yalnız bu sayfa açıkken yükler (CSP: fonts.googleapis.com izinli). */
function useInvestorFonts(): void {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
    // Sayfadan çıkınca kaldır: site geneline üçüncü taraf isteği taşımasın.
    return () => link.remove();
  }, []);
}

/** Yazdırırken (PDF) tüm "Teknik ayrıntı" eklerini açar, sonra eski hâline döndürür. */
function useOpenDetailsOnPrint(): void {
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = Array.from(document.querySelectorAll<HTMLDetailsElement>(".inv-details:not([open])"));
      opened.forEach((el) => (el.open = true));
    };
    const after = () => {
      opened.forEach((el) => (el.open = false));
      opened = [];
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
}

const sectionById = (id: string): InvestorSection => {
  const found = INVESTOR_SECTIONS.find((s) => s.id === id);
  if (!found) throw new Error(`Yatırımcı bölümü tanımsız: ${id}`);
  return found;
};

const InvestorContent = ({ onExit }: { onExit: () => void }) => {
  useOpenDetailsOnPrint();

  return (
    <>
      <InvestorNav sections={INVESTOR_SECTIONS} onExit={onExit} />
      <main>
        <InvestorHero />
        <InvestorSectionShell section={sectionById("ozellikler")}>
          <FeatureGrid />
        </InvestorSectionShell>
        <InvestorSectionShell section={sectionById("teknolojiler")}>
          <TechStack />
        </InvestorSectionShell>
        <InvestorSectionShell section={sectionById("altyapi")}>
          <InfraDiagram />
          <div className="inv-grid inv-grid--metrics inv-grid--4">
            {INFRA_POINTS.map((metric) => (
              <MetricTile key={metric.label} metric={metric} />
            ))}
          </div>
        </InvestorSectionShell>
        <InvestorSectionShell section={sectionById("veritabani")}>
          <div className="inv-grid inv-grid--metrics inv-grid--3">
            {DB_METRICS.map((metric) => (
              <MetricTile key={metric.label} metric={metric} />
            ))}
          </div>
        </InvestorSectionShell>
        <InvestorSectionShell section={sectionById("kod")}>
          <div className="inv-grid inv-grid--metrics inv-grid--4">
            {CODE_METRICS.map((metric) => (
              <MetricTile key={metric.label} metric={metric} />
            ))}
          </div>
          <QualityGates />
        </InvestorSectionShell>
        <InvestorSectionShell section={sectionById("danismanlik")}>
          <HandoverGrid />
        </InvestorSectionShell>
        <InvestorSectionShell section={sectionById("baglantilar")}>
          <EcosystemLinks />
        </InvestorSectionShell>
      </main>
      <InvestorClosing />
    </>
  );
};

const InvestorPage = () => {
  useSeo({ title: "Yatırımcı | CorteQS", robots: "noindex, nofollow" }, []);
  useInvestorFonts();

  const verifier = getInvestorVerifier();
  const [unlocked, setUnlocked] = useState(() => hasInvestorSession(verifier));

  const handleExit = () => {
    clearInvestorSession();
    setUnlocked(false);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="inv-root" lang="tr">
      {unlocked ? (
        <InvestorContent onExit={handleExit} />
      ) : (
        <InvestorGate verifier={verifier} onUnlock={() => setUnlocked(true)} />
      )}
    </div>
  );
};

export default InvestorPage;
