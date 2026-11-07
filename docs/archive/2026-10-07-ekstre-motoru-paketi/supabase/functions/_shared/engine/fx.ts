// Kur hesapları.
// Öncelik sırası:
//   Tüm giderler USD'ye çevrilir.
//   1) fx_rates tablosundaki önbellek
//   2) TCMB (resmi): USD/TRY döviz satış, EUR/USD ve GBP/USD çapraz kur
//      https://www.tcmb.gov.tr/kurlar/YYYYMM/DDMMYYYY.xml   (bugün için: /kurlar/today.xml)
//   3) QAR sabit kur (USD'ye bağlı: 1 USD = 3.64 QAR)

import type { Currency, FxLookup } from "./types.ts";
import { round2 } from "./normalize.ts";

export const QAR_PER_USD = 3.64;

/** 1 birim `from` kaç USD eder — tamamen çevrimdışı hesaplanabilen durumlar. */
export function staticUsdRate(from: Currency): number | null {
  if (from === "USD") return 1;
  if (from === "QAR") return 1 / QAR_PER_USD;
  return null;
}

/** Test ve çevrimdışı kullanım için: sabit tablo ile kur sağlayıcı. */
export function tableFx(table: Record<string, Partial<Record<Currency, number>>>): FxLookup {
  return async (date, from) => {
    const s = staticUsdRate(from);
    if (s !== null) return s;
    // en yakın önceki tarihi bul (hafta sonu/tatil)
    const keys = Object.keys(table).sort();
    let best: string | null = null;
    for (const k of keys) if (k <= date) best = k;
    best = best ?? keys[0];
    return best ? table[best][from] ?? null : null;
  };
}

/** TCMB XML'den USD ve EUR/GBP satış kurlarını (TRY cinsinden) çeker. Hafta sonu için geriye 5 gün dener. */
export async function fetchTcmb(date: string, fetchImpl: typeof fetch = fetch): Promise<Partial<Record<Currency, number>> | null> {
  const d = new Date(date + "T12:00:00Z");
  for (let i = 0; i < 6; i++) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const url = `https://www.tcmb.gov.tr/kurlar/${y}${m}/${day}${m}${y}.xml`;
    try {
      const res = await fetchImpl(url);
      if (res.ok) {
        const xml = await res.text();
        const pick = (code: string) => {
          const block = xml.match(new RegExp(`CurrencyCode="${code}"[\\s\\S]*?</Currency>`));
          const v = block?.[0].match(/<ForexSelling>([\d.]+)<\/ForexSelling>/);
          return v ? Number(v[1]) : undefined;
        };
        const usd = pick("USD");
        if (usd) {
          // TRY bazlı kurları "1 birim = ? USD" biçimine çevir
          const eur = pick("EUR"), gbp = pick("GBP");
          // TCMB XML'de EUR için <CrossRateOther> = EUR/USD paritesi yayımlanır; varsa onu kullan
          const cross = (code: string) => xml.match(new RegExp(`CurrencyCode="${code}"[\\s\\S]*?</Currency>`))?.[0]
            .match(/<CrossRateOther>([\d.]+)<\/CrossRateOther>/)?.[1];
          const eurCross = cross("EUR"), gbpCross = cross("GBP");
          return {
            TRY: 1 / usd,
            ...(eurCross ? { EUR: Number(eurCross) } : eur ? { EUR: eur / usd } : {}),
            ...(gbpCross ? { GBP: Number(gbpCross) } : gbp ? { GBP: gbp / usd } : {}),
            USD: 1,
            QAR: 1 / QAR_PER_USD,
          };
        }
      }
    } catch (_) { /* bir önceki güne dene */ }
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return null;
}

/**
 * Supabase ile birlikte kullanılan canlı kur sağlayıcı.
 * `cacheGet/cacheSet` fx_rates tablosunu okur/yazar (edge function içinde verilir).
 */
export function liveFx(opts: {
  cacheGet: (date: string) => Promise<Partial<Record<Currency, number>> | null>;
  cacheSet: (date: string, rates: Partial<Record<Currency, number>>) => Promise<void>;
  fetchImpl?: typeof fetch;
}): FxLookup {
  const mem = new Map<string, Partial<Record<Currency, number>> | null>();
  return async (date, from) => {
    const s = staticUsdRate(from);
    if (s !== null) return s;
    if (!mem.has(date)) {
      let rates = await opts.cacheGet(date);
      if (!rates || rates[from] === undefined) {
        rates = await fetchTcmb(date, opts.fetchImpl);
        if (rates) await opts.cacheSet(date, rates);
      }
      mem.set(date, rates);
    }
    return mem.get(date)?.[from] ?? null;
  };
}

/**
 * Satırın USD karşılığı.
 *  • USD  -> aynen
 *  • TRY  -> TCMB USD/TRY (döviz satış)
 *  • EUR/GBP -> çapraz kur (TCMB EUR/USD paritesi; yoksa EUR/TRY ÷ USD/TRY)
 *  • QAR  -> sabit 3,64
 * `rateDate` kurun hangi günden alınacağını belirler (işlem günü ya da yükleme günü).
 * TL karşılığı: ekstrede yazıyorsa o, yoksa aynı kurlardan hesaplanır (bilgi amaçlı).
 */
export async function convert(
  line: { date: string; amount_original: number; currency_original: Currency; amount_try?: number | null },
  fx: FxLookup,
  rateDate: string = line.date,
): Promise<{ rate: number | null; usd: number | null; tl: number | null; method: string; rate_date: string }> {
  const { amount_original: amt, currency_original: cur, amount_try } = line;
  const rate = await fx(rateDate, cur);
  const usd = rate !== null ? round2(amt * rate) : null;
  let tl: number | null = amount_try ?? null;
  if (tl === null) {
    const rTry = await fx(rateDate, "TRY");
    tl = cur === "TRY" ? round2(amt) : usd !== null && rTry ? round2(usd / rTry) : null;
  }
  const method = cur === "USD" ? "usd" : cur === "TRY" ? "tcmb_usdtry" : cur === "QAR" ? "qar_sabit" : "capraz_kur";
  return { rate, usd, tl, method: rate === null ? "kur_yok" : method, rate_date: rateDate };
}
