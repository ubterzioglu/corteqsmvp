import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { TECH_DETAILS, type InvestorSection } from "@/lib/investor/investor-content";

interface InvestorSectionShellProps {
  section: InvestorSection;
  children: ReactNode;
}

/**
 * Her bölümün ortak iskeleti: yönetici özeti (başlık + giriş + içerik) üstte,
 * "Teknik ayrıntı" açılır eki altta. Ek içeriği TECH_DETAILS[section.id]'den gelir.
 */
const InvestorSectionShell = ({ section, children }: InvestorSectionShellProps) => {
  const details = TECH_DETAILS[section.id] ?? [];

  return (
    <section id={section.id} className="inv-section" aria-labelledby={`${section.id}-title`}>
      <div className="inv-container">
        <div className="inv-section__eyebrow inv-mono">{section.eyebrow}</div>
        <h2 id={`${section.id}-title`} className="inv-section__title">
          {section.title}
        </h2>
        <p className="inv-section__lead">{section.lead}</p>
        {children}
        {details.length > 0 ? (
          <details className="inv-details">
            <summary>
              <span>Teknik ayrıntı</span>
              <ChevronDown className="inv-details__chev" size={18} aria-hidden="true" />
            </summary>
            <div className="inv-details__body">
              {details.map((block) => (
                <div key={block.title}>
                  <h3 className="inv-details__title inv-mono">{block.title}</h3>
                  <ul className="inv-list">
                    {block.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </section>
  );
};

export default InvestorSectionShell;
