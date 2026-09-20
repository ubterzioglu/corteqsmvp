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
  Landmark,
  MapPin,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import DemoBadge from "@/components/common/DemoBadge";
import { isDemoRoute } from "@/lib/demo-pages";
import { ECOSYSTEM_CARDS } from "./home-trial.data";
import type { EcosystemAccent, EcosystemIconKey } from "./home-trial.types";

const ICONS: Record<EcosystemIconKey, LucideIcon> = {
  people: Users,
  communities: Building2,
  organizations: Landmark,
  experts: Sparkles,
  businesses: Briefcase,
  ambassadors: MapPin,
};

// Accent → tam Tailwind sınıfları (statik — purge güvenli, string concat YOK).
// Her kart logonun bir tonunu alır: ikon zemini, ikon ve CTA aynı renkte.
const ACCENT_CLASSES: Record<
  EcosystemAccent,
  { iconWrap: string; cta: string }
> = {
  teal: { iconWrap: "bg-brand-teal/10 text-brand-teal", cta: "text-brand-teal" },
  blue: { iconWrap: "bg-brand-blue/10 text-brand-blue", cta: "text-brand-blue" },
  indigo: { iconWrap: "bg-brand-indigo/10 text-brand-indigo", cta: "text-brand-indigo" },
  pink: { iconWrap: "bg-brand-pink/10 text-brand-pink", cta: "text-brand-pink" },
  orange: { iconWrap: "bg-brand-orange/10 text-brand-orange", cta: "text-brand-orange" },
  yellow: { iconWrap: "bg-brand-yellow/10 text-brand-yellow", cta: "text-brand-yellow" },
};

const EcosystemRailSection = () => {
  return (
    // Mobilde bölüm dolgusu ve kart yüksekliği bilinçli olarak küçültüldü
    // (kullanıcı kararı, 2026-09-20): altı kart alt alta gelince şerit tek
    // başına iki ekran boyu yer kaplıyordu. `sm`den itibaren ölçüler aynen
    // eskisi gibidir — masaüstü görünümü DEĞİŞMEDİ.
    <section className="relative mx-auto max-w-6xl px-6 py-14 sm:py-28">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl">
          Sistemin 6 Katmanı
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
          İnsanlardan işletmelere, topluluklardan şehir elçilerine — diasporanın her katmanı tek ekosistemde.
          <br />
          Aradığın kişiyi, işletmeyi ya da topluluğu tek yerden bul ve bağlan.
        </p>
      </div>

      <div className="mt-7 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {ECOSYSTEM_CARDS.map((card) => {
          const Icon = ICONS[card.iconKey];
          const accent = ACCENT_CLASSES[card.accent];
          return (
            <Link
              key={card.title}
              to={card.to}
              // `relative`: DemoBadge `absolute` konumlanır, taşıyıcı olmadan
              // kartın dışına kaçar.
              className="glass-tech group relative flex flex-col rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-teal sm:p-6"
            >
              {/* Rozet ROTADAN türetilir (`DEMO_ROUTES`), karta elle yazılmaz.
                  CLAUDE.md'nin kuralı: bant ve rozet tek listeden beslenmeli,
                  yoksa sayfa demo bandı taşırken ona giden kart rozetsiz kalır. */}
              {isDemoRoute(card.to) ? <DemoBadge /> : null}
              {/* Mobilde ikon ve başlık YAN YANA (kullanıcı kararı): ikonun
                  altındaki ~20px boşluk her kartta tekrarlanıyordu. `sm:block`
                  ile geniş ekranda eski üst üste düzene döner — `gap` block
                  düzeninde yok sayılır, başlığın boşluğunu `sm:mt-5` verir. */}
              <div className="flex items-center gap-3 sm:block">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${accent.iconWrap}`}
                >
                  <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-base font-bold text-foreground sm:mt-5 sm:text-xl">
                  {card.title}
                </h3>
              </div>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                {card.description}
              </p>
              <span className={`mt-3 inline-flex items-center gap-1 text-[13px] font-semibold sm:mt-5 sm:text-sm ${accent.cta}`}>
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
