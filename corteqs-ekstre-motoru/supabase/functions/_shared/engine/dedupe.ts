// Tekilleştirme: aynı ekstre iki kez yüklense de, Mercury aynı işlemi tekrar getirse de,
// ya da biri admin'e elle girmiş olsa da çift kayıt oluşmaz.

import type { ExistingExpense, RawLine } from "./types.ts";
import { normalizeDescription, similarity } from "./normalize.ts";

export async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Parmak izi. Mercury gibi kaynaklarda external_id varsa o esas alınır.
 * `occurrence` aynı gün aynı tutarlı meşru tekrarlar içindir (örn. 3× MetUnic 178,80 TL).
 */
export async function fingerprint(line: RawLine, occurrence: number, merchantKey?: string): Promise<string> {
  if (line.external_id) return "ext:" + (await sha256(line.external_id));
  const key = fingerprintKey(line, merchantKey) + "|" + occurrence;
  return "fp:" + (await sha256(key));
}

/**
 * Kaynaktan bağımsız anahtar: kart + tarih + (TL tutarı varsa TL, yoksa orijinal tutar/para birimi) + kanonik tüccar.
 * Böylece Drive'dan gelen "StratoDE 1.183,19 TL" ile PDF'ten gelen "STRATO AG BERLIN DE EUR 20 / 1.183,19 TL" aynı satır sayılır.
 */
export function fingerprintKey(line: RawLine, merchantKey?: string): string {
  const card = (line.card_last4 || line.card_label || "").toUpperCase();
  const money = line.amount_try != null ? `TRY:${Math.abs(line.amount_try).toFixed(2)}` : `${line.currency_original}:${Math.abs(line.amount_original).toFixed(2)}`;
  const sign = line.amount_original < 0 ? "-" : "+";
  const m = (merchantKey ?? normalizeDescription(line.description)).toUpperCase().slice(0, 40);
  return [card, line.date, sign + money, m].join("|");
}

/** Tarih farkı (gün). */
function dayDiff(a: string, b: string) {
  return Math.abs((Date.parse(a) - Date.parse(b)) / 86_400_000);
}

export interface DupResult { id: string; reason: string; exact: boolean; }

/**
 * Mevcut giderlerle karşılaştırır.
 *  - exact: parmak izi/external_id aynı -> kesin mükerrer, atlanır
 *  - fuzzy: ±3 gün, tutar ±%2, açıklama benzer -> "olası mükerrer", incelemeye düşer
 */
export function findDuplicate(
  line: RawLine & { fingerprint: string; amount_usd: number | null; merchant: string },
  existing: ExistingExpense[],
): DupResult | null {
  for (const e of existing) {
    if (e.source_fingerprint && e.source_fingerprint === line.fingerprint) return { id: e.id, reason: "Aynı satır daha önce aktarılmış", exact: true };
    if (line.external_id && e.external_id === line.external_id) return { id: e.id, reason: "Aynı Mercury işlemi", exact: true };
  }
  let best: DupResult | null = null;
  let bestScore = 0;
  for (const e of existing) {
    if (dayDiff(e.expense_date, line.date) > 3) continue;
    const sameCur = e.currency === line.currency_original && Math.abs(e.amount - Math.abs(line.amount_original)) <= Math.max(0.02 * Math.abs(e.amount), 0.01);
    const sameUsd = e.currency === "USD" && line.amount_usd !== null && Math.abs(e.amount - Math.abs(line.amount_usd)) <= 0.02 * Math.abs(e.amount) + 0.5;
    if (!sameCur && !sameUsd) continue;
    const sim = Math.max(similarity(e.description, line.merchant), similarity(e.description, line.description));
    if (sim < 0.5) continue;
    const score = sim + (sameCur ? 0.5 : 0.2) - dayDiff(e.expense_date, line.date) * 0.05;
    if (score > bestScore) {
      bestScore = score;
      best = { id: e.id, reason: `Admin'de elle girilmiş olabilir: ${e.expense_date} · ${e.description} · ${e.amount} ${e.currency}`, exact: false };
    }
  }
  return best;
}
