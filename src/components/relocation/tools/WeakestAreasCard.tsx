// "Önce Buraya Odaklan" — primary_result.weakest3'ü çizer.
//
// Bu veri 2026-06-26'dan beri SQL tarafında (relocation_score_*_v1) hesaplanıp
// relocation_tool_results.primary_result içine yazılıyordu ama arayüzde HİÇ
// gösterilmiyordu; kullanıcı yalnız çıplak barları görüyordu. Kart o kaybı kapatır.
//
// DB'den gelen `detail` şablon bir cümledir ("Bu alanı bu hafta güçlendir: X").
// Bu yüzden önce copy katmanındaki somut aksiyon metni denenir, yoksa `detail`e düşülür.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOOLS_UI_COPY, dimensionBandLabel } from "@/lib/relocation-tools-copy";
import type { WeakestArea } from "@/lib/relocation-tools-weakest";

interface WeakestAreasCardProps {
  areas: WeakestArea[];
  /** boyut anahtarı → somut ilk adım; yoksa DB'den gelen `detail` kullanılır. */
  dimensionActions?: Record<string, string>;
}

export function WeakestAreasCard({ areas, dimensionActions = {} }: WeakestAreasCardProps) {
  if (areas.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{TOOLS_UI_COPY.weakestTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{TOOLS_UI_COPY.weakestHint}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {areas.map((area, index) => {
          const action = dimensionActions[area.key] ?? area.detail ?? "";
          return (
            <div key={area.key} className="flex gap-3">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{area.title}</span>
                  <Badge variant="secondary">{dimensionBandLabel(area.score)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(area.score * 100)} / 100
                  </span>
                </div>
                {action && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{action}</p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
