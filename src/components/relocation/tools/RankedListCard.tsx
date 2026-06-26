// Sıralı liste kartı — ranked_list result_kind (ör. #4 şehir eşleştirme).
// recommendations öğelerini sıralı kart listesi olarak gösterir (başlık + skor + opsiyonel kırılım).
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RankedItem {
  key?: string;
  title?: string;
  score?: number;
  detail?: string;
  sub_scores?: Record<string, number>;
  [extra: string]: unknown;
}

interface RankedListCardProps {
  title: string;
  items: RankedItem[];
  /** sub_scores boyut anahtarı → görünen etiket. */
  dimensionLabels?: Record<string, string>;
}

export function RankedListCard({ title, items, dimensionLabels = {} }: RankedListCardProps) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.key ?? idx} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">
                {idx + 1}. {item.title ?? item.key}
              </span>
              {typeof item.score === "number" && (
                <Badge variant="secondary">{Math.round(item.score)}/100</Badge>
              )}
            </div>
            {item.sub_scores && Object.keys(item.sub_scores).length > 0 && (
              <div className="mt-2 space-y-1">
                {Object.entries(item.sub_scores).map(([dim, value]) => {
                  const pct = Math.round((value ?? 0) * 100);
                  return (
                    <div key={dim} className="flex items-center gap-2">
                      <span className="w-32 shrink-0 text-xs text-muted-foreground">
                        {dimensionLabels[dim] ?? dim}
                      </span>
                      <Progress value={pct} className="h-1" />
                      <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
                        {pct}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
