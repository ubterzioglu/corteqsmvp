// Skor göstergesi — 0..100 toplam skor + bucket etiketi. docs/10tool/00 §UX (ScoreMeter).
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ScoreMeterProps {
  score: number | null;
  bucketLabel?: string | null;
}

export function ScoreMeter({ score, bucketLabel }: ScoreMeterProps) {
  if (score === null || Number.isNaN(score)) {
    return bucketLabel ? <Badge variant="secondary">{bucketLabel}</Badge> : null;
  }
  const rounded = Math.round(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-extrabold text-foreground">{rounded}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
        {bucketLabel && <Badge variant="secondary">{bucketLabel}</Badge>}
      </div>
      <Progress value={Math.max(0, Math.min(100, rounded))} className="h-2" />
    </div>
  );
}
