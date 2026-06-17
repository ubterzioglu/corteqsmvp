/**
 * 4. Ekosistem rayı — ürün taksonomisini "küratörlü anlatı seti" olarak sunar.
 * Tipik özellik gridi değil; her kartta bir cümle + bir ikon + sessiz CTA.
 * Tüm linkler yalnızca var olan public route'lara gider (home-trial.data.ts).
 */

import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  MapPin,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ECOSYSTEM_CARDS } from "./home-trial.data";
import type { EcosystemIconKey } from "./home-trial.types";

const ICONS: Record<EcosystemIconKey, LucideIcon> = {
  people: Users,
  communities: Building2,
  experts: Sparkles,
  businesses: Briefcase,
  ambassadors: MapPin,
};

const EcosystemRailSection = () => {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl">
          Ağın beş katmanı
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          İnsanlardan işletmelere, topluluklardan şehir elçilerine — diasporanın her
          katmanı tek bir ekosistemde buluşuyor.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ECOSYSTEM_CARDS.map((card) => {
          const Icon = ICONS[card.iconKey];
          return (
            <Link
              key={card.title}
              to={card.to}
              className="glass-tech group flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-teal"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-glow-teal/10 text-glow-teal">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-foreground">
                {card.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {card.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-glow-teal">
                {card.cta}
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default EcosystemRailSection;
