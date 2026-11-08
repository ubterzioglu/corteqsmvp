/**
 * Hero eylemleri (L5, Lovable CORTEQS+ düzeni): bir birincil CTA, dört ikincil
 * düğme ve iki kampanya kartı. Veri `hero-cta-data.ts`'te durur.
 *
 * Demo sayfaya giden her öğe `isDemoRoute()` ile `DemoBadge` alır — rozeti elle
 * yazma (bkz. `src/lib/demo-pages.ts`, "DEMO içerik deseni").
 *
 * Birincil CTA zemini #00838F: beyaz metinle ≈4,5:1 kontrast (#00ACC1→#0097A7
 * gradyanı 2,7–3,2:1 verip WCAG AA'yı geçemiyordu). Yalnız bu düğme ve arama
 * bölümündeki "Ara" için; sitenin kalanı yeniden boyanmadı.
 */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, MessageCircle, PenSquare, Sparkles, Trophy, UserPlus, Video } from "lucide-react";

import { DemoBadge } from "@/components/common/DemoBadge";
import { isDemoRoute } from "@/lib/demo-pages";

import {
  HERO_CAMPAIGN_CARDS,
  HERO_PRIMARY_CTA,
  HERO_SECONDARY_BUTTONS,
  type HeroCampaignCard,
  type HeroSecondaryButton,
  type HeroSecondaryIcon,
} from "./hero-cta-data";

const SECONDARY_ICONS: Record<HeroSecondaryIcon, ReactNode> = {
  whatsapp: <MessageCircle className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />,
  founders: <Sparkles className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />,
  blogger: <PenSquare className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />,
  vlogger: <Video className="h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />,
};

const SECONDARY_CLASS =
  "relative inline-flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl border border-slate-900/15 bg-white/80 px-3 py-3 text-center text-xs font-semibold leading-tight text-slate-800 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-900/30 hover:bg-white sm:text-sm";

function SecondaryButton({ button }: { button: HeroSecondaryButton }) {
  const content = (
    <>
      {SECONDARY_ICONS[button.icon]}
      <span>{button.label}</span>
      {button.to && isDemoRoute(button.to) ? <DemoBadge /> : null}
    </>
  );

  if (button.href) {
    return (
      <a href={button.href} target="_blank" rel="noopener noreferrer" className={SECONDARY_CLASS}>
        {content}
        <span className="sr-only"> (yeni sekmede açılır)</span>
      </a>
    );
  }
  return (
    <Link to={button.to ?? "/"} className={SECONDARY_CLASS}>
      {content}
    </Link>
  );
}

function CampaignCard({ card }: { card: HeroCampaignCard }) {
  const Icon = card.icon === "trophy" ? Trophy : MapPin;
  return (
    <Link
      to={card.to}
      className="group relative flex items-center gap-4 rounded-2xl border border-slate-900/10 bg-white/80 p-4 text-left shadow-sm backdrop-blur transition-colors hover:bg-white"
    >
      <span className="shrink-0 rounded-full bg-glow-teal/15 p-2.5 text-glow-teal">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-900">{card.title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-600">{card.description}</span>
      </span>
      <ArrowRight
        className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      />
      {isDemoRoute(card.to) ? <DemoBadge /> : null}
    </Link>
  );
}

export function HeroActions() {
  return (
    <div className="mt-8 max-w-3xl">
      <Link
        to={HERO_PRIMARY_CTA.to}
        className="inline-flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[#00838F] px-6 py-4 text-center text-sm font-semibold leading-tight text-white shadow-[0_16px_34px_-12px_hsl(var(--glow-teal)/0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#006F7A] sm:text-base"
      >
        <UserPlus className="h-5 w-5 shrink-0" aria-hidden="true" />
        {HERO_PRIMARY_CTA.label}
      </Link>

      <nav aria-label="Hızlı erişim" className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {HERO_SECONDARY_BUTTONS.map((button) => (
          <SecondaryButton key={button.label} button={button} />
        ))}
      </nav>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {HERO_CAMPAIGN_CARDS.map((card) => (
          <CampaignCard key={card.to} card={card} />
        ))}
      </div>
    </div>
  );
}

export default HeroActions;
