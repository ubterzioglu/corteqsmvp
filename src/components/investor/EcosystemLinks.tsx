import { ArrowUpRight } from "lucide-react";

import { ECOSYSTEM_LINKS } from "@/lib/investor/investor-content";

/** Adresi okunur kısa biçimde gösterir: "corteqs.net/cadde". */
const displayUrl = (url: string): string => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

const EcosystemLinks = () => (
  <div className="inv-grid inv-grid--3">
    {ECOSYSTEM_LINKS.map((link) => (
      <a key={link.url} className="inv-card inv-link" href={link.url} target="_blank" rel="noopener noreferrer">
        <div className="inv-card__head">
          <h3 className="inv-card__title">{link.title}</h3>
          <ArrowUpRight className="inv-link__icon" size={18} aria-hidden="true" />
        </div>
        <p className="inv-card__text">{link.text}</p>
        <span className="inv-link__url inv-mono">{displayUrl(link.url)}</span>
      </a>
    ))}
  </div>
);

export default EcosystemLinks;
