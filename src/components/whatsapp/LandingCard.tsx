import { Link } from "react-router-dom";
import { MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LandingApprovalBadges } from "@/components/whatsapp/LandingApprovalBadges";
import { PlatformLogo } from "@/components/whatsapp/PlatformLogo";
import { languageOptions, originOptions } from "@/lib/whatsapp-landing-options";
import {
  buildLandingCardSummary,
  formatGroupScore,
  getCategoryMeta,
  getLandingHeroImage,
  waPlaceholderImage,
} from "@/lib/whatsapp-landing-presentation";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

interface LandingCardProps {
  landing: WhatsAppLanding;
}

export function LandingCard({ landing }: LandingCardProps) {
  const category = getCategoryMeta(landing.category);
  const Icon = category.icon;
  const cardSummary = buildLandingCardSummary(landing);

  return (
    <Link
      to={`/addcom?group=${encodeURIComponent(landing.id)}`}
      className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_16px_50px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1"
    >
      {landing.mode === "visual" || landing.heroImage ? (
        <div className="relative">
          <img
            src={getLandingHeroImage(landing)}
            alt={landing.groupName}
            className="aspect-video w-full object-cover"
            onError={(event) => {
              if (event.currentTarget.src !== waPlaceholderImage) {
                event.currentTarget.src = waPlaceholderImage;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-col gap-2">
          <LandingApprovalBadges landing={landing} />
          <Badge className={`flex h-8 w-full items-center justify-center border px-3 text-xs font-semibold ${category.chipClass}`}>
            <Icon className="mr-1.5 h-3 w-3" />
            {category.label}
          </Badge>
        </div>
        <h3 className="mt-4 text-xl font-bold text-foreground group-hover:text-emerald-700">
          {landing.groupName}
        </h3>
        <p className="mt-2 flex-1 line-clamp-2 text-sm text-muted-foreground">{cardSummary}</p>
        <hr className="mt-4 border-t border-border/40" />
        <div className="flex flex-wrap items-center gap-2 pt-3 text-muted-foreground">
          <span className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            {landing.city}, {landing.country}
          </span>
          {landing.memberCount ? (
            <span className="flex items-center gap-1 text-sm">
              <Users className="h-3.5 w-3.5" />
              {landing.memberCount.toLocaleString("tr-TR")}
            </span>
          ) : null}
          {landing.language ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {languageOptions.find((o) => o.value === landing.language)?.label ?? landing.language}
            </span>
          ) : null}
          {landing.origin ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {originOptions.find((o) => o.value === landing.origin)?.label ?? landing.origin}
            </span>
          ) : null}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-h-[3rem]">
            {typeof landing.groupScore === "number" ? (
              <div className="inline-flex min-w-[7.5rem] flex-col rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-left shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-500">
                  CorteQS Skoru
                </span>
                <span className="text-base font-black text-violet-700">
                  {formatGroupScore(landing.groupScore)} / 10
                </span>
              </div>
            ) : (
              <div className="inline-flex min-w-[7.5rem] flex-col rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  CorteQS Skoru
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  Skor bekleniyor
                </span>
              </div>
            )}
          </div>
          <div className="shrink-0 self-end">
            <PlatformLogo platform={landing.platform} size="card" />
          </div>
        </div>
      </div>
    </Link>
  );
}
