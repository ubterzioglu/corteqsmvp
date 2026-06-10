import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import type { ProfileAccent } from "./public-profile-utils";

const ICON_TEXT_BY_ACCENT: Record<ProfileAccent, string> = {
  orange: "text-orange-600 dark:text-orange-400",
  blue: "text-sky-600 dark:text-sky-400",
  green: "text-emerald-600 dark:text-emerald-400",
  red: "text-rose-600 dark:text-rose-400",
  purple: "text-violet-600 dark:text-violet-400",
};

interface PublicProfileSectionFrameProps {
  title: string;
  description?: string | null;
  Icon: LucideIcon;
  accent: ProfileAccent;
  children: ReactNode;
}

/** Inner card following the IndividualPublicView bottom-card pattern. */
const PublicProfileSectionFrame = ({
  title,
  description,
  Icon,
  accent,
  children,
}: PublicProfileSectionFrameProps) => (
  <section className="h-full rounded-[22px] border border-border bg-background/70 p-4 md:p-5">
    <div className="mb-3 flex items-center gap-2">
      <Icon className={`h-4 w-4 shrink-0 ${ICON_TEXT_BY_ACCENT[accent]}`} aria-hidden="true" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
    {description ? <p className="-mt-1 mb-3 text-xs text-muted-foreground">{description}</p> : null}
    {children}
  </section>
);

export default PublicProfileSectionFrame;
