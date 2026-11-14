// Araç sonuçlarında puan bandı → renk/etiket (revizyon a275f131).
//
// Sonuç ekranındaki yatay barlar tek renkti (`Progress` → `bg-primary`): 0,35 ile 0,92
// aynı griydi ve kullanıcı hangi boyutun zayıf olduğunu ancak sayıyı okuyarak anlıyordu.
// Bant artık RENK taşıyor.
//
// RENK SEÇİMİ ÖLÇÜLDÜ, göz kararı DEĞİL. Rampa `dataviz` doğrulayıcısından geçirildi
// (lightness bandı, chroma tabanı, komşu-çift renk körlüğü ayrımı, normal görü tabanı,
// yüzeye karşı kontrast). Kabul edilen rampa Tailwind 600 seviyesidir:
//   emerald-600 #059669 · sky-600 #0284c7 · amber-600 #d97706 · rose-600 #e11d48
// Bu dörtlü hem AÇIK hem KOYU yüzeyde tüm denetimleri geçer — bu yüzden koyu tema için
// ayrı bir rampa YOK ve olması da gerekmiyor.
// ⚠️ Elenen aday: emerald→lime→amber→rose. İki yeşil komşu olunca normal görüde
// ΔE 10,8'e düşüyordu (taban 15) ve protanopide amber↔lime ΔE 4,9 idi. Yeşilin yanına
// ikinci bir yeşil koyma.
//
// RENK TEK BAŞINA ANLAM TAŞIMAZ: her bant daima metin etiketi (+ çağıran tarafta ikon)
// ile birlikte çizilir. Renk körlüğü, tek renkli baskı ve forced-colors durumlarında
// bilgi etiketten okunur.

export type ScoreBand = "strong" | "good" | "fair" | "weak";

/** İyiden kötüye — kartlarda ve testlerde sıralı gezinti için. */
export const SCORE_BAND_ORDER: readonly ScoreBand[] = ["strong", "good", "fair", "weak"];

export const SCORE_BAND_LABELS: Record<ScoreBand, string> = {
  strong: "Güçlü",
  good: "İyi",
  fair: "Orta",
  weak: "Zayıf",
};

/**
 * 0..1 puanı banda çevirir. Eşikler BURADA tek kaynaktır; `dimensionBandLabel`
 * (relocation-tools-copy) buraya delege eder, böylece kart ile rozet asla farklı
 * bant gösteremez.
 *
 * Sayı olmayan/NaN değer en kötü banda düşer: eksik veriyi "Güçlü" göstermek,
 * kullanıcıyı yanlış yönde rahatlatır.
 */
export function scoreBand(value01: number): ScoreBand {
  const pct = Number.isFinite(value01) ? value01 * 100 : 0;
  if (pct >= 80) return "strong";
  if (pct >= 60) return "good";
  if (pct >= 40) return "fair";
  return "weak";
}

export interface ScoreBandStyle {
  /** Bar dolgusu. Aynı ton iki temada da doğrulandı. */
  bar: string;
  /** Etiket/sayı metni. */
  text: string;
  /** Bant rozeti (kenarlık + zemin + metin), açık ve koyu tema. */
  chip: string;
}

export const SCORE_BAND_STYLES: Record<ScoreBand, ScoreBandStyle> = {
  strong: {
    bar: "bg-emerald-600",
    text: "text-emerald-700 dark:text-emerald-400",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  good: {
    bar: "bg-sky-600",
    text: "text-sky-700 dark:text-sky-400",
    chip: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
  },
  fair: {
    bar: "bg-amber-600",
    text: "text-amber-700 dark:text-amber-400",
    chip: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  },
  weak: {
    bar: "bg-rose-600",
    text: "text-rose-700 dark:text-rose-400",
    chip: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  },
};
