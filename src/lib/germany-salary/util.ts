// Almanya Maaş Hesaplama — paylaşımlı sayısal yardımcılar.
// Kaynak: ref101/lib/salary (almanya101). Hesap mantığı birebir korunmuştur.

/** Cent'e yuvarla (2 ondalık), kayan nokta hatasına karşı EPSILON ile. */
export function roundCent(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** Sonlu sayıya çevir; değilse fallback. */
export function safeNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Negatif olmayan sayı (alt sınır 0). */
export function clampNonNegative(v: unknown): number {
  return Math.max(0, safeNumber(v, 0));
}

/** de-DE EUR para formatı. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

/** Yüzde formatı (işaretli, 1 ondalık). */
export function formatPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
