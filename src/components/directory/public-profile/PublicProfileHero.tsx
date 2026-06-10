import type { ReactNode } from "react";
import { CheckCircle2, MapPin, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PublicProfileHeroViewModel } from "@/lib/public-catalog-profile-view-model";

import type { ProfileAccent } from "./public-profile-utils";

const COVER_GRADIENT_BY_ACCENT: Record<ProfileAccent, string> = {
  orange: "from-orange-200/80 via-amber-100/60 to-rose-100/40 dark:from-orange-900/40 dark:via-amber-950/30 dark:to-rose-950/20",
  blue: "from-sky-200/80 via-blue-100/60 to-indigo-100/40 dark:from-sky-900/40 dark:via-blue-950/30 dark:to-indigo-950/20",
  green: "from-emerald-200/80 via-teal-100/60 to-lime-100/40 dark:from-emerald-900/40 dark:via-teal-950/30 dark:to-lime-950/20",
  red: "from-rose-200/80 via-pink-100/60 to-orange-100/40 dark:from-rose-900/40 dark:via-pink-950/30 dark:to-orange-950/20",
  purple: "from-violet-200/80 via-purple-100/60 to-sky-100/40 dark:from-violet-900/40 dark:via-purple-950/30 dark:to-sky-950/20",
};

const AVATAR_SURFACE_BY_ACCENT: Record<ProfileAccent, string> = {
  orange: "from-orange-200/70 to-amber-100/40 text-orange-700 dark:from-orange-900/60 dark:to-amber-950/40 dark:text-orange-300",
  blue: "from-sky-200/70 to-blue-100/40 text-sky-700 dark:from-sky-900/60 dark:to-blue-950/40 dark:text-sky-300",
  green: "from-emerald-200/70 to-teal-100/40 text-emerald-700 dark:from-emerald-900/60 dark:to-teal-950/40 dark:text-emerald-300",
  red: "from-rose-200/70 to-pink-100/40 text-rose-700 dark:from-rose-900/60 dark:to-pink-950/40 dark:text-rose-300",
  purple: "from-violet-200/70 to-purple-100/40 text-violet-700 dark:from-violet-900/60 dark:to-purple-950/40 dark:text-violet-300",
};

const badgeToneClasses: Record<string, string> = {
  verified:
    "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800",
  managed:
    "inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-800",
  claimable:
    "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800",
};

interface PublicProfileHeroProps {
  hero: PublicProfileHeroViewModel;
  actions?: ReactNode;
}

const PublicProfileHero = ({ hero, actions }: PublicProfileHeroProps) => {
  const categoryBadges = hero.badges.filter((badge) => badge.tone === "category");
  const statusBadges = hero.badges.filter((badge) => badge.tone !== "category");

  return (
    <section className="overflow-hidden rounded-[32px] border border-border/60 bg-card/80 shadow-md backdrop-blur-sm">
      {/* Cover */}
      <div className={`relative h-28 w-full bg-gradient-to-br md:h-36 ${COVER_GRADIENT_BY_ACCENT[hero.accent]}`}>
        {hero.coverImageUrl ? (
          <img
            src={hero.coverImageUrl}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover opacity-90"
          />
        ) : null}
      </div>

      <div className="relative -mt-12 px-5 pb-6 md:-mt-16 md:px-8 md:pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Avatar / logo */}
          <div
            className={`flex h-[96px] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-[24px] border-4 border-background bg-gradient-to-br text-3xl font-bold shadow-lg md:h-[120px] md:w-[120px] md:rounded-[28px] md:text-4xl ${AVATAR_SURFACE_BY_ACCENT[hero.accent]}`}
          >
            {hero.avatarUrl ? (
              <img src={hero.avatarUrl} alt={hero.avatarAlt} className="h-full w-full object-cover" />
            ) : (
              <span aria-label={hero.avatarAlt}>{hero.initials}</span>
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            {categoryBadges.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {categoryBadges.map((badge) => (
                  <Badge key={badge.key} variant="outline" className="text-xs">
                    {badge.label}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {hero.title}
              </h1>

              {hero.roleLabel ? (
                <span className="rounded-full border border-border bg-muted/60 px-3 py-0.5 text-xs font-medium text-muted-foreground">
                  {hero.roleLabel}
                </span>
              ) : null}

              {statusBadges.map((badge) => (
                <span key={badge.key} className={badgeToneClasses[badge.tone]}>
                  {badge.tone === "verified" || badge.tone === "managed" ? (
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                  )}
                  {badge.label}
                </span>
              ))}
            </div>

            {hero.headline ? (
              <p className="mt-1.5 break-words text-sm font-medium text-muted-foreground">
                {hero.headline}
              </p>
            ) : null}

            {hero.locationLabel ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {hero.locationLabel}
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
