// Puan dağılımı kartı — boyut → 0..1 sub_scores. docs/10tool/00 §UX (ScoreBreakdownCard).
//
// 2026-08-07: bar başına ÜÇ bağlam eklendi — boyutun ne ölçtüğü (açıklama), toplam
// skordaki ağırlığı (%) ve puanın bandı (Güçlü/İyi/Orta/Zayıf). Üçü de opsiyoneldir:
// araç için copy tanımlı değilse ilgili parça hiç çizilmez, kart eski haline döner.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TOOLS_UI_COPY, dimensionBandLabel } from "@/lib/relocation-tools-copy";

interface ScoreBreakdownCardProps {
  subScores: Record<string, number>;
  /** boyut anahtarı → görünen etiket (araç copy'sinden; yoksa anahtar). */
  dimensionLabels?: Record<string, string>;
  /** boyut anahtarı → "bu puan neyi ölçüyor" cümlesi. Yoksa satır çizilmez. */
  dimensionDescriptions?: Record<string, string>;
  /** boyut anahtarı → toplam skordaki ağırlık (0..1). Yoksa yüzde rozeti çizilmez. */
  dimensionWeights?: Record<string, number>;
}

export function ScoreBreakdownCard({
  subScores,
  dimensionLabels = {},
  dimensionDescriptions = {},
  dimensionWeights = {},
}: ScoreBreakdownCardProps) {
  const entries = Object.entries(subScores);
  if (entries.length === 0) return null;

  const hasWeights = Object.keys(dimensionWeights).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{TOOLS_UI_COPY.breakdownTitle}</CardTitle>
        {hasWeights && (
          <p className="text-sm text-muted-foreground">{TOOLS_UI_COPY.breakdownHint}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map(([dim, value]) => {
          const pct = Math.round((value ?? 0) * 100);
          const description = dimensionDescriptions[dim];
          const weight = dimensionWeights[dim];
          return (
            <div key={dim} className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-sm">
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium text-foreground">
                    {dimensionLabels[dim] ?? dim}
                  </span>
                  {weight !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      skorun %{Math.round(weight * 100)}'i
                    </span>
                  )}
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">
                    {dimensionBandLabel(value ?? 0)}
                  </span>
                  <span className="text-muted-foreground">{pct}</span>
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
              {description && (
                <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
