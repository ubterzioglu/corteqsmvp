// Diğer kaynaklar: Drive tablosu (Gemini'nin ürettiği CSV) ve Mercury API işlemleri.

import type { Currency, Person, RawLine } from "./types.ts";
import { foldTr, parseAmount, parseCurrency, parseDate } from "./normalize.ts";

/** RFC4180 CSV ayrıştırıcı (tırnak içindeki virgül/satır sonu destekli). */
export function parseCsv(s: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], f = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

/**
 * Drive'daki "TEKNOLOJİ HARCAMALARI" sayfasının CSV dışa aktarımını okur.
 * Beklenen başlıklar: Tarih, Açıklama, Ödeme Yöntemi, Para Birimi, Tutar, TL Karşılığı,
 * Dolar Karşılığı (Brüt), İştirak, Dolar Karşılığı (Net), Harcama Sahibi, Not, Link
 * (Sütun sırası/boş sütunlar önemli değil, başlığa göre bulunur.)
 */
export function parseDriveSheetCsv(csv: string, opts: { corteqsPerson?: Person | null } = {}): RawLine[] {
  const rows = parseCsv(csv);
  const hi = rows.findIndex((r) => r.some((c) => foldTr(c).trim() === "TARIH"));
  if (hi < 0) throw new Error("CSV'de 'Tarih' başlığı bulunamadı");
  const head = rows[hi].map((c) => foldTr(c).trim());
  const col = (name: string) => head.findIndex((h) => h.startsWith(name));
  const C = {
    date: col("TARIH"), desc: col("ACIKLAMA"), method: col("ODEME YONTEMI"), cur: col("PARA BIRIMI"),
    amt: col("TUTAR"), tl: col("TL KARSILIGI"), share: col("ISTIRAK"), owner: col("HARCAMA SAHIBI"),
    note: col("NOT"), link: col("LINK"),
  };
  const out: RawLine[] = [];
  for (const r of rows.slice(hi + 1)) {
    const date = parseDate(r[C.date] ?? "");
    const desc = (r[C.desc] ?? "").trim();
    if (!date || !desc) continue; // toplam satırları, boş satırlar
    const cur = (parseCurrency(r[C.cur]) ?? "TRY") as Currency;
    const tl = parseAmount(r[C.tl]);
    let amt = parseAmount(r[C.amt]);
    if (amt === null && cur === "TRY") amt = tl;
    if (amt === null) continue;
    const method = (r[C.method] ?? "").trim();
    const last4 = method.match(/(\d{4})\)?\s*$/)?.[1] ?? null;
    const owner = foldTr(r[C.owner] ?? "").trim();
    const refund = /IADE/.test(foldTr(desc)) || amt < 0;
    out.push({
      date,
      description: desc,
      amount_original: amt,
      currency_original: cur,
      amount_try: tl ?? (cur === "TRY" ? amt : null),
      card_last4: last4,
      card_label: method || null,
      line_type: refund ? "refund" : "purchase",
      partner_share_usd: parseAmount(r[C.share]),
      partner_name: parseAmount(r[C.share]) ? (/baran/i.test(r[C.note] ?? "") ? "Baran" : null) : null,
      person_hint: owner === "BURAK" ? "burak" : owner === "BARIS" ? "baris" : owner === "CORTEQS" ? (opts.corteqsPerson ?? null) : null,
      note: (r[C.note] ?? "").trim() || null,
      invoice_url: C.link >= 0 && /^https?:/.test(r[C.link] ?? "") ? r[C.link] : null,
    });
  }
  return out;
}

/** Mercury API transaction nesnesi (kullandığımız alanlar). */
export interface MercuryTx {
  id: string;
  amount: number;                 // borç işlemlerde negatif
  status: string;                 // pending | sent | cancelled | failed | reversed | blocked
  kind: string;                   // debitCardTransaction, creditCardTransaction, outgoingPayment, ...
  counterpartyName?: string | null;
  bankDescription?: string | null;
  note?: string | null;
  externalMemo?: string | null;
  postedAt?: string | null;
  createdAt: string;
  mercuryCategory?: string | null;
  attachments?: { url?: string; fileName?: string }[];
  currencyExchangeInfo?: { convertedFromCurrency?: string; convertedFromAmount?: number } | null;
  details?: any;
}

const CARD_KINDS = /card|debit|credit/i;

/** Mercury işlemlerini RawLine'a çevirir; gelen para, iç transfer, iptal/başarısız işlemler elenir. */
export function mercuryToRaw(txs: MercuryTx[], opts: { cardLast4?: string; includeTransfers?: boolean } = {}): RawLine[] {
  const out: RawLine[] = [];
  for (const t of txs) {
    if (["cancelled", "failed", "blocked"].includes(t.status)) continue;
    const isCard = CARD_KINDS.test(t.kind);
    if (!isCard && !opts.includeTransfers) continue;
    if (/internalTransfer|incoming/i.test(t.kind)) continue;
    // Mercury: harcama negatif, iade pozitif. Bizde harcama pozitif.
    const amtUsd = -t.amount;
    // Mercury hesabı USD'dir: kayıt USD tutarla tutulur, döviz işlemin aslı nota yazılır.
    const fx = t.currencyExchangeInfo;
    const fxNote = fx?.convertedFromCurrency && fx.convertedFromCurrency !== "USD" ? `Orijinal: ${fx.convertedFromAmount} ${fx.convertedFromCurrency}` : null;
    const date = (t.postedAt || t.createdAt).slice(0, 10);
    const last4 = t.details?.debitCardInfo?.lastFourDigits ?? t.details?.creditCardInfo?.lastFourDigits ?? opts.cardLast4 ?? null;
    out.push({
      date,
      description: [t.counterpartyName, t.bankDescription].filter(Boolean).join(" · ") || t.kind,
      amount_original: amtUsd,
      currency_original: "USD",
      amount_try: null,
      card_last4: last4,
      card_label: "Mercury",
      external_id: t.id,
      line_type: amtUsd < 0 ? "refund" : "purchase",
      note: [t.note, t.externalMemo, fxNote, t.status === "pending" ? "Mercury: beklemede" : null].filter(Boolean).join(" · ") || null,
      invoice_url: t.attachments?.[0]?.url ?? null,
    });
  }
  return out;
}
