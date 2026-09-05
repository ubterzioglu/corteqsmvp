// Puan barı ve bant rozeti (revizyon a275f131).
//
// NEDEN `ui/progress.tsx` KULLANILMIYOR: o bileşenin Indicator'ı `bg-primary`'ye
// SABİTLENMİŞ ve dışarıdan sınıf almıyor; bandı renklendirmenin tek yolu shadcn
// primitifini elle düzenlemek olurdu — CLAUDE.md `src/components/ui/*` için bunu
// açıkça yasaklıyor (otomatik üretilen dosyalar). Bu yüzden ölçü burada sade bir
// div ile çizilir ve ARIA elle verilir.
//
// Renkler `relocation-score-bands` içinde; oradaki yorum rampanın nasıl ölçülüp
// doğrulandığını anlatıyor.
import { AlertTriangle, CheckCircle2, Minus, TrendingUp } from "lucide-react";

import {
  SCORE_BAND_LABELS,
  SCORE_BAND_STYLES,
  scoreBand,
  type ScoreBand as ScoreBandKey,
} from "@/lib/relocation-score-bands";
import { cn } from "@/lib/utils";

/** Bant → ikon. Sıra anlam taşır: ✓ güçlü, ↗ iyi, – orta, ⚠ zayıf. */
const BAND_ICONS: Record<ScoreBandKey, typeof CheckCircle2> = {
  strong: CheckCircle2,
  good: TrendingUp,
  fair: Minus,
  weak: AlertTriangle,
};

/** 0..1 → 0..100, bozuk/taşan değerler kırpılır. */
function toPercent(value01: number): number {
  if (!Number.isFinite(value01)) return 0;
  return Math.round(Math.max(0, Math.min(1, value01)) * 100);
}

interface ScoreBandBarProps {
  value01: number;
  /** Ölçünün neyi ölçtüğü — ekran okuyucu barı bununla adlandırır. */
  ariaLabel: string;
  className?: string;
}

export function ScoreBandBar({ value01, ariaLabel, className }: ScoreBandBarProps) {
  const pct = toPercent(value01);
  const band = scoreBand(value01);
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        data-band-fill=""
        className={cn("h-full rounded-full transition-all", SCORE_BAND_STYLES[band].bar)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface ScoreBandChipProps {
  value01: number;
  className?: string;
}

/**
 * Bant rozeti: ikon + Türkçe etiket + bandın rengi.
 *
 * Renk TEK BAŞINA bilgi taşımaz — etiket her zaman yazılıdır, ikon dekoratiftir
 * (`aria-hidden`), yani renk körlüğünde ve tek renkli baskıda bant yine okunur.
 */
export function ScoreBandChip({ value01, className }: ScoreBandChipProps) {
  const band = scoreBand(value01);
  const Icon = BAND_ICONS[band];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        SCORE_BAND_STYLES[band].chip,
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {SCORE_BAND_LABELS[band]}
    </span>
  );
}
