// Motorun kalbi: ham satırlar -> yorumlanmış, kurlanmış, tekilleştirilmiş, karar verilmiş satırlar.

import type {
  ExistingExpense, FxLookup, MerchantRule, PaymentCard, Person, ProcessedLine, RawLine,
} from "./types.ts";
import { compileRules, findCard, matchRule } from "./rules.ts";
import { convert } from "./fx.ts";
import { findDuplicate, fingerprint, fingerprintKey } from "./dedupe.ts";
import { foldTr, normalizeDescription, round2 } from "./normalize.ts";

export interface PipelineContext {
  rules: MerchantRule[];
  cards: PaymentCard[];
  fx: FxLookup;
  existing: ExistingExpense[];
  /** Kural/kart bir şey söylemiyorsa kimin gideri sayılsın */
  defaultPerson?: Person;
  /** Kaynak Mercury ise kural eşleşen ve güveni yüksek satırlar doğrudan "import" olur */
  autoCommitMode?: boolean;
  /** Mercury gibi kaynaklarda kart listede yoksa kullanılacak ödeme yöntemi */
  fallbackPaymentMethod?: ProcessedLine["payment_method"];
  /** Gider ortağı (iştirak) kolonu açık mı? Kapatılırsa katkı hiç düşülmez. Varsayılan: açık */
  partnerShareEnabled?: boolean;
  /** Kur tarihi: "transaction" = işlem günü TCMB kuru (varsayılan), "upload" = yükleme günü (güncel) kuru */
  fxRateDate?: "transaction" | "upload";
  /** "upload" modunda kullanılacak gün (YYYY-MM-DD); verilmezse bugün */
  today?: string;
}

// Kural yoksa "teknoloji olabilir mi?" sezgisi (yapay zekânın is_tech_guess tahminiyle birlikte kullanılır)
const TECH_HINT = /(\bAI\b|\.AI\b|\bAPI\b|\.IO\b|\.DEV\b|\.APP\b|SOFTWARE|YAZILIM|BILISIM|DIGITAL|CLOUD|HOST|DOMAIN|SERVER|SUNUCU|SAAS|SUBSCR|ABONELIK|LICENSE|LISANS|TECHNOLOG|TEKNOLOJI|LABS?\b|\bINC\b.*(US)?$)/;

const NON_PURCHASE = /(HESAPTAN ODEME|KART ODEMESI|ODEMENIZ ICIN TESEKKUR|OTOMATIK ODEME|EFT ILE ODEME|ONCEKI DONEM|DEVREDEN|BORC TRANSFERI|PAYMENT RECEIVED|AUTOPAY)/;

export async function processLines(raw: RawLine[], ctx: PipelineContext): Promise<ProcessedLine[]> {
  const compiled = compileRules(ctx.rules);
  const seen = new Map<string, number>();
  const out: ProcessedLine[] = [];

  for (const line of raw) {
    const flags: string[] = [];
    const norm = normalizeDescription(line.description);
    const card = findCard(ctx.cards, line.card_last4, line.card_label);
    const { rule, confidence: ruleConf } = matchRule(line.description, compiled);

    // 1) satır tipi
    let type = line.line_type ?? "purchase";
    if (NON_PURCHASE.test(foldTr(line.description))) type = "payment";
    if (line.amount_original < 0 && type === "purchase") type = "refund";
    if (/\bIADE\b|REFUND|REVERSAL/.test(foldTr(line.description))) type = "refund";
    if (type === "refund") flags.push("iade");

    // 2) kur — tüm giderler USD'ye çevrilir (TL: USD/TRY, EUR/GBP: çapraz kur)
    const rateDate = ctx.fxRateDate === "upload" ? (ctx.today ?? new Date().toISOString().slice(0, 10)) : line.date;
    const conv = await convert(line, ctx.fx, rateDate);
    if (conv.usd === null) flags.push("kur_yok");

    // 3) gider ortağı katkısı: CorteQS'e giren gider = brüt $ − katkı $
    const shareOn = ctx.partnerShareEnabled !== false;
    const share = !shareOn ? null
      : line.partner_share_usd ?? (rule?.share_pct && conv.usd !== null ? round2((conv.usd * rule.share_pct) / 100) : null);
    const net = conv.usd !== null ? round2(conv.usd - (share ?? 0)) : null;
    if (share) flags.push("istirak");

    // 3) parmak izi (aynı gün/tutar tekrarları için sayaç)
    const merchant = rule?.merchant ?? prettify(norm);
    const baseKey = fingerprintKey(line, merchant);
    const occ = (seen.get(baseKey) ?? 0) + 1;
    seen.set(baseKey, occ);
    const fp = await fingerprint(line, occ, merchant);
    const person: Person = rule?.person ?? line.person_hint ?? card?.default_person ?? ctx.defaultPerson ?? "ortak";
    const isTech = rule ? rule.is_tech : false;

    // 4) mükerrer
    const dup = findDuplicate({ ...line, fingerprint: fp, amount_usd: conv.usd, merchant }, ctx.existing);
    if (dup) flags.push(dup.exact ? "mukerrer" : "olasi_mukerrer");

    // 5) karar
    let decision: ProcessedLine["decision"];
    let confidence = rule ? ruleConf : 0.3;
    if (!rule) flags.push("kural_yok");
    if (type === "payment") { decision = "skip"; flags.push("kart_odemesi"); confidence = 0.99; }
    else if (dup?.exact) decision = "skip";
    else if (rule && !rule.is_tech && rule.category !== "banka_komisyon") { decision = "skip"; flags.push("teknoloji_disi"); }
    else if (!rule) {
      const guess = line.is_tech_guess ?? TECH_HINT.test(norm);
      if (guess) { decision = "review"; flags.push("teknoloji_olabilir"); }
      else { decision = "skip"; flags.push("teknoloji_disi"); }
    }
    else if (dup || type === "refund" || conv.usd === null || confidence < 0.8) decision = "review";
    else if (/beklemede/.test(line.note ?? "")) { decision = "review"; flags.push("beklemede"); }
    else if (ctx.autoCommitMode && !rule.auto_commit) decision = "review";
    else decision = rule.category === "banka_komisyon" ? "review" : "import";

    out.push({
      ...line,
      line_type: type,
      merchant,
      merchant_normalized: norm,
      category: rule?.category ?? "diger",
      person,
      payment_method: card?.payment_method ?? ctx.fallbackPaymentMethod ?? "diger",
      is_virtual_card: card?.is_virtual ?? false,
      is_tech: isTech,
      rule_id: rule?.id ?? null,
      confidence,
      fx_rate_usd: conv.rate,
      amount_usd: conv.usd,
      amount_usd_net: net,
      amount_try_calc: conv.tl,
      partner_share_usd: share,
      partner_name: shareOn ? (line.partner_name ?? null) : null,
      fingerprint: fp,
      duplicate_of: dup?.id ?? null,
      duplicate_reason: dup?.reason ?? null,
      decision,
      flags,
    });
  }
  return out;
}

function prettify(norm: string) {
  return norm.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 60);
}

/** statement_lines satırını `expenses` insert payload'ına çevirir. */
export function toExpenseRow(l: ProcessedLine, opts: { importId?: string | null; source: string; userId?: string | null }) {
  const noteParts = [
    l.note,
    l.partner_share_usd ? `Gider ortağı${l.partner_name ? " " + l.partner_name : ""}: $${l.partner_share_usd} (brüt $${l.amount_usd})` : null,
    l.currency_original !== "USD" ? `Orijinal: ${l.amount_original} ${l.currency_original} · kur ${l.fx_rate_usd?.toFixed(6)}` : null,
    `Ekstre: ${l.description}`,
  ].filter(Boolean);
  return {
    expense_date: l.date,
    person: l.person,
    category: l.category,
    description: l.merchant,
    // CorteQS muhasebesi: her zaman USD, gider ortağı katkısı düşülmüş net tutar
    amount: l.amount_usd_net ?? l.amount_usd,
    currency: "USD",
    status: "odendi",
    payment_method: l.payment_method,
    is_virtual_card: l.is_virtual_card,
    invoice_url: l.invoice_url ?? null,
    note: noteParts.join(" · ").slice(0, 1000),
    // — yeni kolonlar (migration ile eklenir)
    amount_original: l.amount_original,
    currency_original: l.currency_original,
    partner_name: l.partner_name ?? null,
    amount_try: l.amount_try_calc,
    amount_usd: l.amount_usd,
    amount_usd_net: l.amount_usd_net,
    partner_share_usd: l.partner_share_usd ?? null,
    fx_rate_usd: l.fx_rate_usd,
    card_last4: l.card_last4 ?? null,
    merchant_raw: l.description,
    source: opts.source,
    source_import_id: opts.importId ?? null,
    source_fingerprint: l.fingerprint,
    external_id: l.external_id ?? null,
    created_by: opts.userId ?? null,
  };
}

/** Özet: ekranda ve Barış'ın kontrolünde kullanılan toplamlar. */
export function summarize(lines: ProcessedLine[]) {
  const s = { total: lines.length, import: 0, review: 0, skip: 0, usd_import: 0, usd_net_import: 0, by_category: {} as Record<string, number>, by_person: {} as Record<string, number> };
  for (const l of lines) {
    s[l.decision]++;
    if (l.decision !== "skip") {
      const v = l.amount_usd_net ?? 0;
      if (l.decision === "import") { s.usd_import += l.amount_usd ?? 0; s.usd_net_import += v; }
      s.by_category[l.category] = round2((s.by_category[l.category] ?? 0) + v);
      s.by_person[l.person] = round2((s.by_person[l.person] ?? 0) + v);
    }
  }
  s.usd_import = round2(s.usd_import); s.usd_net_import = round2(s.usd_net_import);
  return s;
}
