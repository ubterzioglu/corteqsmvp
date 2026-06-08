import type { ReactNode } from "react";
import { MapPin, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type BadgeSpec = {
  label: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
};

interface ProfileHeroCardProps {
  title: string;
  subtitle: string | null;
  roleLabel: string | null;
  locationLabel: string | null;
  imageUrl: string | null;
  badges: BadgeSpec[];
  actions?: ReactNode;
  children?: ReactNode;
}

const ProfileHeroCard = ({
  title,
  subtitle,
  roleLabel,
  locationLabel,
  imageUrl,
  badges,
  actions,
  children,
}: ProfileHeroCardProps) => {
  const initials = title.slice(0, 2).toUpperCase();

  const claimedBadge = badges.find((b) => b.variant === "default");
  const categoryBadges = badges.filter((b) => b.variant !== "default");

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
      {/* Cover strip */}
      <div className="h-24 w-full bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.35),transparent_60%),linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--primary)/0.04)_50%,transparent)] md:h-32" />

      {/* Hero content — overlapping the cover */}
      <div className="relative -mt-12 px-5 pb-5 md:-mt-16 md:px-8 md:pb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
          {/* Avatar */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-gradient-to-br from-primary/25 to-primary/8 text-3xl font-bold text-primary shadow-lg md:h-28 md:w-28 md:text-4xl">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          {/* Name + meta row */}
          <div className="min-w-0 flex-1 pb-1">
            {/* Category badges */}
            {categoryBadges.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {categoryBadges.map((badge) => (
                  <Badge
                    key={`${badge.label}-${badge.variant ?? "secondary"}`}
                    variant={badge.variant ?? "secondary"}
                    className="text-xs"
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {title}
              </h1>

              {claimedBadge ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800">
                  <CheckCircle2 className="h-3 w-3" />
                  {claimedBadge.label}
                </span>
              ) : null}

              {roleLabel ? (
                <span className="rounded-full border border-border bg-muted/60 px-3 py-0.5 text-xs font-medium text-muted-foreground">
                  {roleLabel}
                </span>
              ) : null}
            </div>

            {subtitle ? (
              <p className="mt-1 text-sm font-medium text-muted-foreground">{subtitle}</p>
            ) : null}

            {locationLabel ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {locationLabel}
              </p>
            ) : null}

            {actions ? <div className="mt-4">{actions}</div> : null}
          </div>
        </div>
      </div>

      {children ? (
        <div className="border-t border-border/50 px-5 py-5 md:px-8 md:py-6">
          {children}
        </div>
      ) : null}
    </section>
  );
};

export default ProfileHeroCard;
