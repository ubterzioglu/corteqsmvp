import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { useSeo } from "@/lib/seo";
import { clearInvestorSession, getInvestorVerifier, hasInvestorSession } from "@/lib/investor/investor-access";
import { INVESTOR_PATH } from "@/lib/investor/investor-route";
import type { InvestorMetric, InvestorSection } from "@/lib/investor/investor-content";
import {
  APP_METRICS,
  APP_NOTE,
  ARCH_HERO,
  ARCH_SECTIONS,
  AUTH_FOOTNOTE,
  AUTH_NOTE,
  AUTH_ROWS,
  AUTH_STEPS,
  CODE_FOOTNOTE,
  CODE_ROWS,
  DB_ROWS,
  MEASURED_LINE,
  PIPELINE_CHECKS,
  PIPELINE_METRICS,
  PIPELINE_NOTE,
  PIPELINE_SOURCE,
  PIPELINE_STEPS,
  RUNTIME_DB,
  RUNTIME_FLOW,
  RUNTIME_FOOTNOTE,
  RUNTIME_NOTE,
  RUNTIME_ROWS,
  VERSION_LINE,
} from "@/lib/investor/architecture-content";
import InvestorGate from "@/components/investor/InvestorGate";
import InvestorNav from "@/components/investor/InvestorNav";
import MetricTile from "@/components/investor/MetricTile";
import ArchAppDiagram from "@/components/investor/ArchAppDiagram";
import ArchFlow from "@/components/investor/ArchFlow";
import ArchRowTable from "@/components/investor/ArchRowTable";
import { useInvestorFonts } from "./use-investor-fonts";
import "./investor-theme.css";
import "./investor-architecture.css";

// Teknik mimari / CTO özeti — /information ile aynı parola kapısı ve tema.
// İçerik: src/lib/investor/architecture-content.ts · kurallar: docs/investor/README.md

const sectionById = (id: string): InvestorSection => {
  const found = ARCH_SECTIONS.find((s) => s.id === id);
  if (!found) throw new Error(`Mimari bölümü tanımsız: ${id}`);
  return found;
};

interface ArchSectionProps {
  id: string;
  page: number;
  children: ReactNode;
}

const ArchSection = ({ id, page, children }: ArchSectionProps) => {
  const section = sectionById(id);
  return (
    <section id={section.id} className="inv-section arch-section" aria-labelledby={`${section.id}-title`}>
      <div className="inv-container">
        <div className="inv-section__eyebrow inv-mono">{section.eyebrow}</div>
        <h2 id={`${section.id}-title`} className="inv-section__title">
          {section.title}
        </h2>
        <p className="inv-section__lead">{section.lead}</p>
        {children}
        <div className="arch-pageno inv-mono" aria-hidden="true">
          {String(page).padStart(2, "0")} / {String(ARCH_SECTIONS.length).padStart(2, "0")}
        </div>
      </div>
    </section>
  );
};

const Metrics = ({ items }: { items: readonly InvestorMetric[] }) => (
  <div className={`arch-metrics arch-metrics--${items.length}`}>
    {items.map((metric) => (
      <MetricTile key={metric.label} metric={metric} />
    ))}
  </div>
);

const Note = ({ title, text }: { title: string; text: string }) => (
  <div className="arch-note">
    <strong>{title}</strong> {text}
  </div>
);

const ArchitectureContent = ({ onExit }: { onExit: () => void }) => (
  <>
    <InvestorNav
      sections={ARCH_SECTIONS}
      onExit={onExit}
      brandTag="Teknik Mimari"
      crossLink={{ to: INVESTOR_PATH, label: "Bilgi dosyası" }}
    />
    <main>
      <section id="kapak" className="inv-hero arch-hero">
        <div className="inv-container">
          <span className="inv-kicker inv-mono">{ARCH_HERO.kicker}</span>
          <h1 className="inv-hero__title">{ARCH_HERO.title}</h1>
          <p className="inv-hero__lead">{ARCH_HERO.lead}</p>
          <p className="arch-hero__meta inv-mono">
            {MEASURED_LINE} ·{" "}
            <Link to={INVESTOR_PATH} className="arch-hero__back">
              ← Yatırımcı bilgi dosyasına dön
            </Link>
          </p>
        </div>
      </section>

      <ArchSection id="mimari-butun" page={1}>
        <ArchAppDiagram />
        <p className="arch-muted">{APP_NOTE}</p>
        <Metrics items={APP_METRICS} />
      </ArchSection>

      <ArchSection id="mimari-isletim" page={2}>
        <ArchFlow steps={RUNTIME_FLOW} label="Çalışma düzeni" />
        <div className="arch-flow__join inv-mono" aria-hidden="true">
          ↓ aynı veri platformu ↓
        </div>
        <div className="arch-box arch-box--soft">
          <div className="arch-box__title">{RUNTIME_DB.title}</div>
          <div className="arch-box__text">{RUNTIME_DB.text}</div>
        </div>
        <ArchRowTable rows={RUNTIME_ROWS} caption="İşletim ayarları" />
        <Note title={RUNTIME_NOTE.title} text={RUNTIME_NOTE.text} />
        <p className="arch-muted arch-muted--small">{RUNTIME_FOOTNOTE}</p>
      </ArchSection>

      <ArchSection id="mimari-kimlik" page={3}>
        <ArchFlow steps={AUTH_STEPS} label="Oturum açma adımları" />
        <ArchRowTable rows={AUTH_ROWS} caption="Bağlı sistemler / veri kapsamı" variant="stacked" />
        <Note title={AUTH_NOTE.title} text={AUTH_NOTE.text} />
        <p className="arch-muted arch-muted--small">{AUTH_FOOTNOTE}</p>
      </ArchSection>

      <ArchSection id="mimari-kalite" page={4}>
        <div className="arch-pipeline">
          <div className="arch-box arch-box--navy">
            <div className="arch-box__title">{PIPELINE_SOURCE.title}</div>
            <div className="arch-box__text">{PIPELINE_SOURCE.text}</div>
          </div>
          <div className="arch-pipeline__arrow" aria-hidden="true">
            ↓
          </div>
          <div className="arch-box arch-checks">
            <div className="arch-caption inv-mono">Zorunlu kontroller</div>
            <ul>
              {PIPELINE_CHECKS.map((check) => (
                <li key={check.title}>
                  <div className="arch-box__title">{check.title}</div>
                  <div className="arch-box__text">{check.text}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="arch-pipeline__arrow" aria-hidden="true">
            ↓
          </div>
          <ArchFlow steps={PIPELINE_STEPS} label="Yayın adımları" direction="column" />
        </div>
        <p className="arch-muted">{PIPELINE_NOTE}</p>
        <Metrics items={PIPELINE_METRICS} />
      </ArchSection>

      <ArchSection id="mimari-olcum" page={5}>
        <ArchRowTable rows={DB_ROWS} caption="Canlı veritabanı" />
        <ArchRowTable rows={CODE_ROWS} caption="Kod envanteri" />
        <p className="arch-muted arch-muted--small">{CODE_FOOTNOTE}</p>
        <p className="arch-versions">
          <strong>Sürüm tanımları:</strong> {VERSION_LINE}. Docker + GitHub Actions + yönetilen PostgreSQL.
        </p>
      </ArchSection>
    </main>
    <footer className="inv-closing arch-closing">
      <div className="inv-container">
        <p className="inv-footnote inv-mono">
          Rakamlar ölçümdür: {MEASURED_LINE}. Bu sayfa gizlidir; lütfen bağlantıyı ve parolayı paylaşmayın.
        </p>
      </div>
    </footer>
  </>
);

const ArchitecturePage = () => {
  useSeo({ title: "Teknik Mimari | CorteQS", robots: "noindex, nofollow" }, []);
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
        <ArchitectureContent onExit={handleExit} />
      ) : (
        <InvestorGate verifier={verifier} onUnlock={() => setUnlocked(true)} />
      )}
    </div>
  );
};

export default ArchitecturePage;
