import { BookOpen, CircleHelp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

type PanelHelpCardProps = {
  title: string;
  description: string;
  guideHref?: string;
  assistantPrompt?: string;
};

export function PanelHelpCard({
  title,
  description,
  guideHref,
  assistantPrompt,
}: PanelHelpCardProps) {
  const assistantHref = assistantPrompt
    ? `/landingtrial?assistant=${encodeURIComponent(assistantPrompt)}#kaydol`
    : null;

  return (
    <aside className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4" aria-label="Panel yardımı">
      <div className="flex gap-3">
        <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          {(guideHref || assistantHref) && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {guideHref && (
                <Link to={guideHref} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                  <BookOpen className="h-4 w-4" /> Kılavuzu aç
                </Link>
              )}
              {assistantHref && (
                <Link to={assistantHref} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                  <Sparkles className="h-4 w-4" /> Asistana sor
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
