/**
 * Tekrarlanan para biçimleyicilerinin ortak yeri (W3 tekilleştirme).
 *
 * Buraya yalnız ÇIKTISI BİREBİR AYNI olan biçimler taşınır. Adı aynı ama seçeneği
 * farklı biçimleyiciler ayrı sınıflardır ve yerlerinde durur: `germany-salary/util.ts`
 * (de-DE, EUR), StepStone aracı (de-DE, kuruşsuz), `formatCostAmount` (kuruşsuz,
 * boşta "—"), `formatUsd` (2–4 ondalık, boşta 0), `formatCarsiPrice` (Cadde).
 *
 * Biçimleyiciler modül ölçeğinde ÖNBELLEĞE ALINIR. `format-date.ts`'teki yasak burada
 * geçerli değildir: `Intl.NumberFormat` saat dilimine bağlı değildir ve yerel ayar
 * açıkça "tr-TR" verilir; önbellekli sürüm, her çağrıda yeniden kurulan eski sürümle
 * aynı metni üretir.
 *
 * Boş/NaN yedek metni burada DEĞİL, çağrı yerinde durur: girdi `Intl.NumberFormat`'a
 * olduğu gibi verilir (NaN → "₺NaN"); geçersiz para kodu RangeError fırlatır.
 */

const LOCALE = "tr-TR";

const compactAmountFormatter = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string, minimumFractionDigits: number): Intl.NumberFormat {
  const key = `${currency}|${minimumFractionDigits}`;
  const cached = currencyFormatters.get(key);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits: 2,
  });
  currencyFormatters.set(key, formatter);
  return formatter;
}

/**
 * "₺1.234,50" biçimi: tr-TR para birimi, en çok 2 ondalık.
 *
 * `minimumFractionDigits` 0–2 arasıdır (en çok 2 sabit olduğundan 2'den büyüğü
 * RangeError fırlatır). 0 verilirse kuruş yalnız gerekince yazılır ("₺5.000").
 */
export function formatCurrencyTR(amount: number, currency: string, minimumFractionDigits = 2): string {
  return getCurrencyFormatter(currency, minimumFractionDigits).format(amount);
}

/** "12,3 B" biçimi: tr-TR kısa gösterim, en çok 1 ondalık (grafik ekseni tutarları). */
export function formatCompactAmountTR(value: number): string {
  return compactAmountFormatter.format(value);
}
