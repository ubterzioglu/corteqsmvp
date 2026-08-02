// Araç hub kartı — result_kind'e göre ikon + renk (logonun 6 tonuna eşlenir: teal/mavi/indigo/pembe/turuncu/sarı).
// Rozet, üst şerit ve ring rengi buradan gelir; ToolLandingCard + ToolAccordionCard paylaşır.
import { BarChart3, Gauge, ListChecks, ListOrdered, Sparkles, Users, type LucideIcon } from "lucide-react";
import { RESULT_KIND_BADGE_LABELS } from "@/lib/relocation-tools-copy";

export interface ResultKindStyle {
  label: string;
  Icon: LucideIcon;
  /** Rozet üzerindeki ikon+metin rengi + ince kenarlık. */
  chipClass: string;
  /** Kart çevresindeki ince renkli halka (her kartı görsel olarak ayırt eder). */
  ringClass: string;
  /** Kartın üstündeki ombré şerit (masaüstü kart). */
  barClass: string;
  /** Sol kenar renkli çizgi (mobil accordion satırı). */
  accentBorderClass: string;
}

const STYLE_BY_RESULT_KIND: Record<string, Omit<ResultKindStyle, "label">> = {
  score: {
    Icon: Gauge,
    chipClass: "border-glow-teal/30 bg-white/95 text-glow-teal",
    ringClass: "ring-glow-teal/25",
    barClass: "bg-gradient-to-r from-glow-teal to-glow-teal/20",
    accentBorderClass: "border-l-glow-teal/50",
  },
  ranked_list: {
    Icon: ListOrdered,
    chipClass: "border-brand-blue/30 bg-white/95 text-brand-blue",
    ringClass: "ring-brand-blue/25",
    barClass: "bg-gradient-to-r from-brand-blue to-brand-blue/20",
    accentBorderClass: "border-l-brand-blue/50",
  },
  persona: {
    Icon: Sparkles,
    chipClass: "border-brand-indigo/30 bg-white/95 text-brand-indigo",
    ringClass: "ring-brand-indigo/25",
    barClass: "bg-gradient-to-r from-brand-indigo to-brand-indigo/20",
    accentBorderClass: "border-l-brand-indigo/50",
  },
  checklist: {
    Icon: ListChecks,
    chipClass: "border-brand-pink/30 bg-white/95 text-brand-pink",
    ringClass: "ring-brand-pink/25",
    barClass: "bg-gradient-to-r from-brand-pink to-brand-pink/20",
    accentBorderClass: "border-l-brand-pink/50",
  },
  match_list: {
    Icon: Users,
    chipClass: "border-glow-orange/30 bg-white/95 text-glow-orange",
    ringClass: "ring-glow-orange/25",
    barClass: "bg-gradient-to-r from-glow-orange to-glow-orange/20",
    accentBorderClass: "border-l-glow-orange/50",
  },
  comparison: {
    Icon: BarChart3,
    chipClass: "border-brand-yellow/30 bg-white/95 text-brand-yellow",
    ringClass: "ring-brand-yellow/25",
    barClass: "bg-gradient-to-r from-brand-yellow to-brand-yellow/20",
    accentBorderClass: "border-l-brand-yellow/50",
  },
};

const FALLBACK_STYLE = STYLE_BY_RESULT_KIND.score;

/** result_kind → hub kartı görsel stili. Bilinmeyen kind → score stiline düşer. */
export function resultKindStyle(resultKind: string): ResultKindStyle {
  const style = STYLE_BY_RESULT_KIND[resultKind] ?? FALLBACK_STYLE;
  return { ...style, label: RESULT_KIND_BADGE_LABELS[resultKind] ?? resultKind };
}
