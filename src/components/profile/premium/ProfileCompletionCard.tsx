import { CheckCircle2, Circle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CompletionHighlight = {
  key: string;
  label: string;
  complete: boolean;
};

type ProfileCompletionCardProps = {
  requiredTotal: number;
  requiredCompleted: number;
  percentage: number;
  highlights: CompletionHighlight[];
};

/**
 * Premium completion card: accessible progress bar + checklist derived from
 * existing attribute state only. Meaning is conveyed by icon + text, not
 * color alone.
 */
const ProfileCompletionCard = ({
  requiredTotal,
  requiredCompleted,
  percentage,
  highlights,
}: ProfileCompletionCardProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const missing = highlights.filter((item) => !item.complete);

  return (
    <Card className="rounded-[22px] border-border bg-background/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Profil Tamamlanma</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">%{clamped}</span>
            {requiredTotal > 0 ? (
              <span className="text-xs text-muted-foreground">
                {requiredCompleted}/{requiredTotal} zorunlu alan
              </span>
            ) : null}
          </div>
          <div
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profil tamamlanma yüzdesi"
            className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-gradient-primary transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${clamped}%` }}
            />
          </div>
        </div>

        {missing.length > 0 ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Profilini güçlendirmek için eksik alanları tamamla.
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Harika! Öne çıkan profil alanlarının tamamı dolu.
          </p>
        )}

        <ul className="space-y-2">
          {highlights.map((item) => (
            <li key={item.key} className="flex items-center gap-2 text-sm">
              {item.complete ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className={item.complete ? "text-foreground" : "text-muted-foreground"}>
                {item.label}
                {item.complete ? "" : " (eksik)"}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionCard;
