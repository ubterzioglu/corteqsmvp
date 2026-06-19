// Şehir öneri karşılaştırma tablosu — rank_locations_v1 çıktısını gösterir.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { RelocationLocationRecommendation } from "@/lib/relocation-types";
import type { RelocationScoreKey } from "@/lib/relocation-ranking";

const SCORE_LABELS: Record<RelocationScoreKey, string> = {
  budget_fit: "Bütçe",
  bureaucracy_ease: "Bürokrasi",
  healthcare_access: "Sağlık",
  gsm_coverage: "GSM",
  community_fit: "Topluluk",
  flight_access: "Uçuş",
};

interface CityComparisonTableProps {
  recommendations: RelocationLocationRecommendation[];
  emptyLabel: string;
  whyLabel: string;
}

export function CityComparisonTable({
  recommendations,
  emptyLabel,
  whyLabel,
}: CityComparisonTableProps) {
  if (recommendations.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <Card key={rec.entity_id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{rec.title}</CardTitle>
              <Badge variant="secondary" className="text-sm">
                {Math.round(rec.final_score * 100)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {(Object.keys(SCORE_LABELS) as RelocationScoreKey[]).map((key) => {
                const value = rec.score_breakdown[key] ?? 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{SCORE_LABELS[key]}</span>
                      <span>{Math.round(value * 100)}</span>
                    </div>
                    <Progress value={value * 100} className="h-1.5" />
                  </div>
                );
              })}
            </div>
            {rec.explanations.length > 0 && (
              <div className="pt-1">
                <p className="text-xs font-semibold text-foreground">{whyLabel}</p>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {rec.explanations.map((why, i) => (
                    <li key={i}>• {why}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
