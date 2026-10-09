import { CalendarClock } from "lucide-react";

import { CONTACT, LIVE_DB, REPO_MEASURED_AT, ROADMAP } from "@/lib/investor/investor-content";

const mailtoHref = `mailto:${CONTACT.email}?subject=${encodeURIComponent(CONTACT.ctaSubject)}`;

const InvestorClosing = () => (
  <footer className="inv-closing">
    <div className="inv-container">
      <div className="inv-closing__grid">
        <div>
          <h2>Ürün yol haritası</h2>
          <ul className="inv-list">
            {ROADMAP.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="inv-contact">
          <div className="inv-contact__label inv-mono">{CONTACT.label}</div>
          <h3 className="inv-contact__title">{CONTACT.ctaTitle}</h3>
          <p className="inv-contact__text">{CONTACT.ctaText}</p>
          <a className="inv-cta-btn" href={mailtoHref}>
            <CalendarClock size={18} aria-hidden="true" />
            {CONTACT.ctaButton}
          </a>
          <a className="inv-contact__mail inv-mono" href={`mailto:${CONTACT.email}`}>
            {CONTACT.email}
          </a>
        </div>
      </div>
      <p className="inv-footnote inv-mono">
        Rakamlar ölçümdür: kod tabanı {REPO_MEASURED_AT} · canlı veritabanı {LIVE_DB.measuredAt}. Bu sayfa gizlidir;
        lütfen bağlantıyı ve parolayı paylaşmayın.
      </p>
    </div>
  </footer>
);

export default InvestorClosing;
