import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import type { ProfileAccent } from "./public-profile-utils";

const ICON_SURFACE_BY_ACCENT: Record<ProfileAccent, string> = {
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
  blue: "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  red: "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
  purple: "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
};

interface PublicProfileSectionFrameProps {
  title: string;
  description?: string | null;
  Icon: LucideIcon;
  accent: ProfileAccent;
  children: ReactNode;
}

const PublicProfileSectionFrame = ({
  title,
  description,
  Icon,
  accent,
  children,
}: PublicProfileSectionFrameProps) => (
  <section className="overflow-hidden rounded-[28px] border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
    <header className="flex items-start gap-3 border-b border-border/40 px-5 py-4 md:px-6">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ICON_SURFACE_BY_ACCENT[accent]}`}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 pt-0.5">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </header>
    <div className="px-5 py-4 md:px-6 md:py-5">{children}</div>
  </section>
);

export default PublicProfileSectionFrame;
