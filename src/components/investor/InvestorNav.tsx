import type { InvestorSection } from "@/lib/investor/investor-content";

interface InvestorNavProps {
  sections: readonly InvestorSection[];
  onExit: () => void;
}

/** Bölüm adı, eyebrow'daki "01 · " önekinden sonraki kısımdır. */
const navLabel = (section: InvestorSection): string => section.eyebrow.split("·").pop()?.trim() ?? section.title;

const InvestorNav = ({ sections, onExit }: InvestorNavProps) => (
  <header className="inv-nav">
    <div className="inv-container inv-nav__row">
      <a href="#kapak" className="inv-brand" style={{ textDecoration: "none" }}>
        <span>CorteQS</span>
        <span className="inv-brand__tag">Investor</span>
      </a>
      <nav className="inv-nav__links" aria-label="Bölümler">
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="inv-nav__link">
            {navLabel(section)}
          </a>
        ))}
      </nav>
      <button type="button" className="inv-nav__exit" onClick={onExit}>
        Çıkış
      </button>
    </div>
  </header>
);

export default InvestorNav;
