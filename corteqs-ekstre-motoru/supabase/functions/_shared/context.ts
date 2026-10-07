// Edge function ortak yardımcıları: Supabase istemcisi, admin kontrolü, motor bağlamı, satır kaydı.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  DEFAULT_CARDS, DEFAULT_RULES, liveFx, processLines, summarize,
  type Currency, type ExistingExpense, type MerchantRule, type PaymentCard, type ProcessedLine, type RawLine,
} from "./engine/index.ts";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

export const env = (k: string) => Deno.env.get(k);

export function serviceClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
}

/** İsteği yapan kullanıcı admin mi? (Kullanıcının JWT'si ile is_admin() RPC'si çağrılır.) */
export async function requireAdmin(req: Request): Promise<{ userId: string | null; service: boolean }> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token && token === env("SUPABASE_SERVICE_ROLE_KEY")) return { userId: null, service: true }; // cron
  if (env("CRON_SECRET") && req.headers.get("x-cron-secret") === env("CRON_SECRET")) return { userId: null, service: true };
  const userClient = createClient(env("SUPABASE_URL")!, env("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false },
  });
  const { data: u } = await userClient.auth.getUser();
  if (!u?.user) throw new HttpError(401, "Oturum yok");
  const { data: ok, error } = await userClient.rpc("is_admin");
  if (error || !ok) throw new HttpError(403, "Bu işlem yalnızca admin içindir");
  return { userId: u.user.id, service: false };
}

export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }

/** Muhasebe ayarları (accounting_settings tablosu, tek satır). */
export interface AccountingSettings {
  partner_share_enabled: boolean;          // gider ortağı kolonu açık mı
  fx_rate_date: "transaction" | "upload";  // kur: işlem günü mü, yükleme (güncel) günü mü
  mercury_auto_commit: boolean;            // Mercury satırları incelemesiz mi girsin
}
export const DEFAULT_SETTINGS: AccountingSettings = { partner_share_enabled: true, fx_rate_date: "transaction", mercury_auto_commit: false };

export async function loadSettings(db: SupabaseClient): Promise<AccountingSettings> {
  const { data } = await db.from("accounting_settings").select("*").eq("id", 1).maybeSingle();
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}

/** Kurallar, kartlar, kur sağlayıcı ve ilgili tarih aralığındaki mevcut giderler. */
export async function loadContext(db: SupabaseClient, raw: RawLine[]) {
  const [{ data: rules }, { data: cards }] = await Promise.all([
    db.from("merchant_rules").select("*").eq("active", true),
    db.from("payment_cards").select("*").eq("active", true),
  ]);
  const dates = raw.map((r) => r.date).sort();
  const from = shift(dates[0] ?? "2000-01-01", -5), to = shift(dates.at(-1) ?? "2100-01-01", 5);
  const { data: existing } = await db.from("expenses")
    .select("id, expense_date, description, amount, currency, source_fingerprint, external_id, amount_usd")
    .gte("expense_date", from).lte("expense_date", to).limit(5000);

  const fx = liveFx({
    cacheGet: async (date) => {
      const { data } = await db.from("fx_rates").select("currency, usd_rate").eq("rate_date", date);
      if (!data?.length) return null;
      return Object.fromEntries(data.map((r) => [r.currency, Number(r.usd_rate)])) as Partial<Record<Currency, number>>;
    },
    cacheSet: async (date, rates) => {
      const rows = Object.entries(rates).filter(([c]) => c !== "USD").map(([currency, usd_rate]) => ({ rate_date: date, currency, usd_rate, source: "tcmb" }));
      if (rows.length) await db.from("fx_rates").upsert(rows);
    },
  });

  return {
    rules: (rules?.length ? rules : DEFAULT_RULES) as MerchantRule[],
    cards: (cards?.length ? cards : DEFAULT_CARDS) as PaymentCard[],
    existing: (existing ?? []) as ExistingExpense[],
    fx,
  };
}

function shift(d: string, days: number) {
  const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + days); return x.toISOString().slice(0, 10);
}

export function toLineRow(importId: string, l: ProcessedLine, i: number) {
  return {
    import_id: importId,
    line_no: i + 1,
    txn_date: l.date,
    description_raw: l.description,
    merchant: l.merchant,
    merchant_normalized: l.merchant_normalized,
    line_type: l.line_type ?? "purchase",
    amount_original: l.amount_original,
    currency_original: l.currency_original,
    amount_try: l.amount_try_calc,
    amount_usd: l.amount_usd,
    amount_usd_net: l.amount_usd_net,
    partner_share_usd: l.partner_share_usd ?? null,
    partner_name: l.partner_name ?? null,
    fx_rate_usd: l.fx_rate_usd,
    card_last4: l.card_last4 ?? null,
    card_label: l.card_label ?? null,
    category: l.category,
    person: l.person,
    payment_method: l.payment_method,
    is_virtual_card: l.is_virtual_card,
    is_tech: l.is_tech,
    rule_id: l.rule_id && /^[0-9a-f-]{36}$/.test(l.rule_id) ? l.rule_id : null,
    confidence: l.confidence,
    fingerprint: l.fingerprint,
    external_id: l.external_id ?? null,
    duplicate_of: l.duplicate_of && /^[0-9a-f-]{36}$/.test(l.duplicate_of) ? l.duplicate_of : null,
    duplicate_reason: l.duplicate_reason ?? null,
    decision: l.decision,
    include: l.decision === "import",
    flags: l.flags,
    note: l.note ?? null,
    invoice_url: l.invoice_url ?? null,
    status: l.flags.includes("mukerrer") ? "skipped" : "pending",
  };
}

/** Ham satırları işler ve statement_lines'a yazar; import'u "ready" yapar. */
export async function processAndStore(db: SupabaseClient, importId: string, raw: RawLine[], opts: { autoCommitMode?: boolean; fallbackPaymentMethod?: ProcessedLine["payment_method"]; keepDuplicates?: boolean } = {}) {
  const [ctx, settings] = await Promise.all([loadContext(db, raw), loadSettings(db)]);
  const lines = await processLines(raw, {
    ...ctx,
    autoCommitMode: opts.autoCommitMode,
    fallbackPaymentMethod: opts.fallbackPaymentMethod,
    partnerShareEnabled: settings.partner_share_enabled,
    fxRateDate: settings.fx_rate_date,
  });
  // Kullanıcının elle düzenlediği ya da aktarılmış satırlar korunur; yalnızca geri kalanlar yeniden yazılır.
  const { data: kept } = await db.from("statement_lines").select("fingerprint").eq("import_id", importId).or("edited.eq.true,status.eq.committed");
  const keep = new Set((kept ?? []).map((k) => k.fingerprint));
  await db.from("statement_lines").delete().eq("import_id", importId).eq("status", "pending").eq("edited", false);
  await db.from("statement_lines").delete().eq("import_id", importId).eq("status", "skipped");
  const rows = lines.map((l, i) => toLineRow(importId, l, i))
    .filter((r) => !keep.has(r.fingerprint))
    .filter((r) => opts.keepDuplicates !== false || r.status !== "skipped");
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from("statement_lines").insert(rows.slice(i, i + 500));
    if (error) throw new Error("Satırlar kaydedilemedi: " + error.message);
  }
  const summary = summarize(lines);
  return { lines, summary, settings };
}
