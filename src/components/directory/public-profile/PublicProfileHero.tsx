import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Linkedin,
  MapPin,
  Plane,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  PublicProfileBadgeViewModel,
  PublicProfileHeroViewModel,
} from "@/lib/public-catalog-profile-view-model";

import type { ProfileAccent } from "./public-profile-utils";

/**
 * Header surface follows the IndividualPublicView pattern: a soft radial
 * glow in the top-left corner over a faint diagonal wash. Only the glow color
 * follows the deterministic profile accent.
 */
const HEADER_SURFACE_BY_ACCENT: Record<ProfileAccent, string> = {
  orange:
    "bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0))]",
  blue: "bg-[radial-gradient(circle_at_top_left,rgba(18,164,196,0.18),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0))]",
  green:
    "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0))]",
  red: "bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.14),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0))]",
  purple:
    "bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0))]",
};

type StatusTone = Exclude<PublicProfileBadgeViewModel["tone"], "category">;

const STATUS_BADGE_STYLES: Record<StatusTone, { className: string; Icon: typeof Briefcase }> = {
  job: {
    className: "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-400",
    Icon: Briefcase,
  },
  mentor: {
    className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    Icon: UserCheck,
  },
  moving: {
    className: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400",
    Icon: Plane,
  },
  verified: {
    className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    Icon: ShieldCheck,
  },
  managed: {
    className: "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-400",
    Icon: CheckCircle2,
  },
  claimable: {
    className: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400",
    Icon: Sparkles,
  },
};

interface PublicProfileHeroProps {
  hero: PublicProfileHeroViewModel;
  actions?: ReactNode;
}

const PublicProfileHero = ({ hero, actions }: PublicProfileHeroProps) => {
  const categoryBadges = hero.badges.filter((badge) => badge.tone === "category");
  const statusBadges = hero.badges.filter(
    (badge): badge is PublicProfileBadgeViewModel & { tone: StatusTone } =>
      badge.tone !== "category",
  );

  return (
    <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
      <div
        className={`relative border-b border-border px-5 py-5 md:px-7 md:py-6 ${HEADER_SURFACE_BY_ACCENT[hero.accent]}`}
      >
        {hero.coverImageUrl ? (
          <img
            src={hero.coverImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.14]"
          />
        ) : null}

        <div className="relative flex items-start gap-4">
          {/* Avatar / logo */}
          {hero.avatarUrl ? (
            <img
              src={hero.avatarUrl}
              alt={hero.avatarAlt}
              className="h-20 w-20 shrink-0 rounded-[24px] object-cover shadow-lg md:h-24 md:w-24"
            />
          ) : (
            <div
              aria-label={hero.avatarAlt}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-lg md:h-24 md:w-24 md:text-3xl"
            >
              {hero.initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {/* Status + category badge row */}
            {statusBadges.length > 0 || categoryBadges.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {statusBadges.map((badge) => {
                  const style = STATUS_BADGE_STYLES[badge.tone];
                  const Icon = style.Icon;
                  return (
                    <Badge key={badge.key} className={`gap-1 text-[11px] ${style.className}`}>
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {badge.label}
                    </Badge>
                  );
                })}
                {categoryBadges.map((badge) => (
                  <Badge key={badge.key} variant="outline" className="gap-1 text-[11px]">
                    {badge.label}
                  </Badge>
                ))}
              </div>
            ) : null}

            {/* Name + tagline pill + role pill */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {hero.title}
              </h1>
              {hero.tagline ? (
                <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {hero.tagline}
                </span>
              ) : null}
              {hero.roleLabel ? (
                <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {hero.roleLabel}
                </span>
              ) : null}
            </div>

            {/* Location row */}
            {hero.locationLabel ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {hero.locationLabel}
                </span>
              </div>
            ) : null}

            {/* Social / external link pills */}
            {hero.linkPills.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {hero.linkPills.map((pill) => (
                  <a
                    key={pill.key}
                    href={pill.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {pill.label === "LinkedIn" ? (
                      <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {pill.label}
                  </a>
                ))}
              </div>
            ) : null}

            {/* Short description (only when no rich_text section covers it) */}
            {hero.headline ? (
              <p className="mt-4 break-words text-sm font-medium text-foreground/80">
                {hero.headline}
              </p>
            ) : null}

            {actions ? <div className="mt-4">{actions}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublicProfileHero;
