import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";

import type { PublicProfileTrustSignal } from "@/lib/public-catalog-profile-view-model";

const SIGNAL_ICONS: Record<PublicProfileTrustSignal["key"], typeof ShieldCheck> = {
  verified: ShieldCheck,
  managed: BadgeCheck,
  claimable: Sparkles,
};

const SIGNAL_ICON_TONES: Record<PublicProfileTrustSignal["key"], string> = {
  verified: "text-emerald-600 dark:text-emerald-400",
  managed: "text-sky-600 dark:text-sky-400",
  claimable: "text-amber-600 dark:text-amber-400",
};

interface PublicProfileTrustCardProps {
  signals: PublicProfileTrustSignal[];
}

/** Compact trust summary built only from existing payload state (no new data). */
const PublicProfileTrustCard = ({ signals }: PublicProfileTrustCardProps) => {
  if (signals.length === 0) return null;

  return (
    <section className="rounded-[22px] border border-border bg-background/70 p-4 md:p-5">
      <h2 className="text-sm font-semibold text-foreground">Profil Güvencesi</h2>
      <ul className="mt-3 space-y-3">
        {signals.map((signal) => {
          const Icon = SIGNAL_ICONS[signal.key];
          return (
            <li key={signal.key} className="flex items-start gap-2.5">
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${SIGNAL_ICON_TONES[signal.key]}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{signal.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {signal.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default PublicProfileTrustCard;
