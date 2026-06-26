import type { ComponentType } from "react";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/**
 * Placeholder panel for the premium dashboard tabs that are not wired to real
 * data yet (Experimental_2 pilot). Pure presentation: a titled card with a
 * "Yakında" badge and a faint proref-like skeleton so the layout reads as a
 * real panel while the feature is being shaped step by step.
 */
type PremiumPanelPlaceholderProps = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  /** Number of skeleton rows to render (visual filler only). */
  skeletonRows?: number;
};

const PremiumPanelPlaceholder = ({
  title,
  description,
  icon: Icon,
  skeletonRows = 3,
}: PremiumPanelPlaceholderProps) => (
  <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <Badge className="gap-1 rounded-full border-violet-500/30 bg-violet-500/15 text-xs font-medium text-violet-700 dark:text-violet-400">
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        Yakında
      </Badge>
    </div>

    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>

    <div className="mt-5 space-y-3" aria-hidden="true">
      {Array.from({ length: skeletonRows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 p-3"
        >
          <div className="h-9 w-9 shrink-0 rounded-lg bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default PremiumPanelPlaceholder;
