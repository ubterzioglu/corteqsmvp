// Skor göstergesi — 0..100 toplam skor + bucket etiketi. docs/10tool/00 §UX (ScoreMeter).
import { Badge } from "@/components/ui/badge";
import { ScoreBandBar } from "@/components/relocation/tools/ScoreBand";

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
        {/* Sayı METİN tokenında kalır, banda göre renklenmez: rengi ölçü çubuğu
            taşır. Rakamı da boyamak, renk körlüğünde bilgiyi ikiye katlamadan
            okunabilirliği düşürürdü. */}
        <span className="text-3xl font-extrabold tabular-nums text-foreground">{rounded}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
        {bucketLabel && <Badge variant="secondary">{bucketLabel}</Badge>}
      </div>
      {/* ScoreBandBar 0..1 bekler; buradaki skor 0..100. */}
      <ScoreBandBar value01={rounded / 100} ariaLabel="Toplam skor" />
    </div>
  );
}
