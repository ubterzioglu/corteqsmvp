// src/lib/muhasebe-format.ts
// Formatlama yardımcıları — TR locale, para birimi, tarih

import { CURRENCY_CODES, type CurrencyCode, type CurrencyTotals } from '@/types/muhasebe';

/**
 * TR locale ile para birimini formatlar.
 * `showCode` true ise sembol yerine kodu gösterir (ör. "12.345,00 TRY").
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'TRY',
  options: { showCode?: boolean; minimumFractionDigits?: number } = {},
): string {
  const { showCode = false, minimumFractionDigits = 2 } = options;

  if (showCode) {
    const num = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${num} ${currency}`;
  }

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Kompakt formatlama — büyük sayılar için (12.3K, 1.5M) */
export function formatCompact(amount: number, currency: CurrencyCode = 'TRY'): string {
  const formatted = new Intl.NumberFormat('tr-TR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function formatCurrencySummary(
  totals: CurrencyTotals,
  options: { hideZero?: boolean; minimumFractionDigits?: number } = {},
): string {
  const { hideZero = true, minimumFractionDigits = 2 } = options;

  const parts = CURRENCY_CODES
    .filter((currency) => !hideZero || totals[currency] !== 0)
    .map(
      (currency) =>
        `${currency}: ${formatCurrency(totals[currency], currency, {
          showCode: true,
          minimumFractionDigits,
        })}`,
    );

  return parts.length > 0 ? parts.join(' · ') : '—';
}

/** ISO tarih (YYYY-MM-DD) → "22.04.2026" */
export function formatDateTR(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/** Date objesi → "YYYY-MM-DD" (timezone güvenli, local) */
export function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Bugünün ISO tarihi */
export function todayIso(): string {
  return toIsoDate(new Date());
}

export function safeMuhasebeHref(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}
