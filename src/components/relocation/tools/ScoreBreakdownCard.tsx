// Puan dağılımı kartı — boyut → 0..1 sub_scores. docs/10tool/00 §UX (ScoreBreakdownCard).
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";

interface ScoreBreakdownCardProps {
  subScores: Record<string, number>;
  /** boyut anahtarı → görünen etiket (araç copy'sinden; yoksa anahtar). */
  dimensionLabels?: Record<string, string>;
}

export function ScoreBreakdownCard({ subScores, dimensionLabels = {} }: ScoreBreakdownCardProps) {
  const entries = Object.entries(subScores);
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{TOOLS_UI_COPY.breakdownTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map(([dim, value]) => {
          const pct = Math.round((value ?? 0) * 100);
          return (
            <div key={dim} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{dimensionLabels[dim] ?? dim}</span>
                <span className="text-muted-foreground">{pct}</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
