import type { ReactNode } from "react";
import { MapPin } from "lucide-react";

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

  return (
    <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
      <div className="border-b border-border bg-[radial-gradient(circle_at_top_left,rgba(18,164,196,0.18),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0))] px-5 py-5 md:px-7 md:py-6">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary shadow-lg md:h-24 md:w-24 md:text-3xl">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            {badges.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <Badge key={`${badge.label}-${badge.variant ?? "secondary"}`} variant={badge.variant ?? "secondary"}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {title}
              </h1>
              {roleLabel ? (
                <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {roleLabel}
                </span>
              ) : null}
            </div>

            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
            {locationLabel ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {locationLabel}
              </p>
            ) : null}
            {actions ? <div className="mt-4">{actions}</div> : null}
          </div>
        </div>
      </div>

      {children ? <div className="space-y-6 p-5 md:p-6">{children}</div> : null}
    </section>
  );
};

export default ProfileHeroCard;
