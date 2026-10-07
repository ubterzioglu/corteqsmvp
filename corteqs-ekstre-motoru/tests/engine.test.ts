// node --experimental-strip-types --test tests/   (Node 22+)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CARDS, DEFAULT_RULES, compileRules, matchRule, normalizeDescription, parseAmount, parseDate,
  processLines, sanitize, tableFx, mercuryToRaw, toExpenseRow,
} from "../supabase/functions/_shared/engine/index.ts";

const fx = tableFx({ "2026-09-01": { TRY: 1 / 48.8, EUR: 1.17 } });
const ctx = { rules: DEFAULT_RULES, cards: DEFAULT_CARDS, fx, existing: [] };

test("TR/US sayı biçimleri", () => {
  assert.equal(parseAmount("1.199,99"), 1199.99);
  assert.equal(parseAmount("1,199.99"), 1199.99);
  assert.equal(parseAmount("19,19"), 19.19);
  assert.equal(parseAmount("-$38,15"), -38.15);
  assert.equal(parseAmount("₺54.864,49"), 54864.49);
  assert.equal(parseAmount("25,00-"), -25);
  assert.equal(parseAmount("—"), null);
  assert.equal(parseAmount("9.517,00"), 9517);
  assert.equal(parseAmount("56.61"), 56.61);
});

test("tarih", () => {
  assert.equal(parseDate("07.12.2025"), "2025-12-07");
  assert.equal(parseDate("7/9/26"), "2026-09-07");
  assert.equal(parseDate("2026-09-07T10:00:00Z"), "2026-09-07");
});

test("açıklama normalizasyonu ve kural eşleşmesi", () => {
  assert.equal(normalizeDescription("PADDLE.NET* HIGGSFIELD  LONDON GB"), "HIGGSFIELD");
  assert.equal(normalizeDescription("IYZICO/GODADDY ISTANBUL TR"), "GODADDY");
  const c = compileRules(DEFAULT_RULES);
  assert.equal(matchRule("ANTHROPIC* CLAUDE.AI SUB SAN FRANCISCO US", c).rule?.merchant, "Anthropic Claude");
  assert.equal(matchRule("OPENAI *CHATGPT SUBSCR", c).rule?.merchant, "OpenAI ChatGPT");
  assert.equal(matchRule("Stripe / Z.AI", c).rule?.merchant, "Z.AI");
  assert.equal(matchRule("STRATO AG BERLIN DE", c).rule?.category, "hosting_sunucu");
  assert.equal(matchRule("LAWSON STORE", c).rule, null); // AWS yanlış eşleşmesin
});

test("kart ödemesi atlanır, market atlanır, bilinmeyen dijital incelenir", async () => {
  const out = await processLines([
    { date: "2026-09-01", description: "HESAPTAN ODEME", amount_original: -1000, currency_original: "TRY", amount_try: -1000, card_last4: "6108" },
    { date: "2026-09-01", description: "MIGROS", amount_original: 100, currency_original: "TRY", amount_try: 100, card_last4: "6108" },
    { date: "2026-09-01", description: "ACME CLOUD LTD", amount_original: 10, currency_original: "USD", card_last4: "6108" },
    { date: "2026-09-01", description: "SUPABASE PTE", amount_original: 25, currency_original: "USD", amount_try: 1220, card_last4: "6108" },
  ], ctx);
  assert.deepEqual(out.map((l) => l.decision), ["skip", "skip", "review", "import"]);
  assert.equal(out[3].payment_method, "sanal_kart_burak");
  assert.equal(out[3].is_virtual_card, true);
});

test("EUR işlem EUR/USD çapraz kuruyla, TL işlem USD/TRY ile USD'ye çevrilir", async () => {
  const [eur, tl] = await processLines([
    { date: "2026-09-01", description: "STRATO AG", amount_original: 20, currency_original: "EUR", amount_try: 1183.19, card_last4: "6108" },
    { date: "2026-09-01", description: "SUPABASE", amount_original: 1220, currency_original: "TRY", amount_try: 1220, card_last4: "6108" },
  ], ctx);
  assert.equal(eur.amount_usd, 23.4);      // 20 × 1,17
  assert.equal(eur.amount_try_calc, 1183.19); // bankanın TL'si bilgi olarak korunur
  assert.equal(tl.amount_usd, 25);         // 1220 / 48,8
});

test("muhasebe kaydı her zaman USD ve gider ortağı katkısı düşülmüş", async () => {
  const [l] = await processLines([{ date: "2026-09-01", description: "OPENAI CHATGPT", amount_original: 9760, currency_original: "TRY", amount_try: 9760, partner_share_usd: 100, partner_name: "Baran", card_last4: "6108" }], ctx);
  const row = toExpenseRow(l, { source: "pdf_statement" });
  assert.equal(row.currency, "USD");
  assert.equal(row.amount, 100);            // 200 brüt − 100 katkı
  assert.equal(row.amount_usd, 200);
  assert.equal(row.amount_original, 9760);
  assert.equal(row.currency_original, "TRY");
  assert.equal(row.partner_name, "Baran");
});

test("gider ortağı kolonu kapatılınca katkı düşülmez", async () => {
  const [l] = await processLines([{ date: "2026-09-01", description: "ANTHROPIC", amount_original: 200, currency_original: "USD", partner_share_usd: 100, card_last4: "6108" }], { ...ctx, partnerShareEnabled: false });
  assert.equal(l.partner_share_usd, null);
  assert.equal(l.amount_usd_net, 200);
});

test("güncel kur modu: işlem tarihi yerine bugünün kuru kullanılır", async () => {
  const fx2 = tableFx({ "2026-08-01": { TRY: 1 / 40 }, "2026-09-27": { TRY: 1 / 50 } });
  const raw = [{ date: "2026-08-01", description: "SUPABASE", amount_original: 1000, currency_original: "TRY" as const, card_last4: "6108" }];
  const [a] = await processLines(raw, { ...ctx, fx: fx2 });
  const [b] = await processLines(raw, { ...ctx, fx: fx2, fxRateDate: "upload", today: "2026-09-27" });
  assert.equal(a.amount_usd, 25);
  assert.equal(b.amount_usd, 20);
});

test("aynı gün 3 aynı işlem 3 ayrı parmak izi alır, tekrar yüklemede hepsi mükerrer", async () => {
  const raw = [1, 2, 3].map(() => ({ date: "2026-09-01", description: "METUNIC", amount_original: 178.8, currency_original: "TRY" as const, amount_try: 178.8, card_last4: "6108" }));
  const first = await processLines(raw, ctx);
  assert.equal(new Set(first.map((l) => l.fingerprint)).size, 3);
  const again = await processLines(raw, { ...ctx, existing: first.map((l, i) => ({ id: String(i), expense_date: l.date, description: l.merchant, amount: l.amount_original, currency: l.currency_original, source_fingerprint: l.fingerprint })) });
  assert.ok(again.every((l) => l.decision === "skip" && l.flags.includes("mukerrer")));
});

test("admin'e elle girilmiş kayıt olası mükerrer olarak incelemeye düşer", async () => {
  const [l] = await processLines(
    [{ date: "2026-09-07", description: "ANTHROPIC* CLAUDE", amount_original: 20, currency_original: "USD", amount_try: 981.4, card_last4: "6108" }],
    { ...ctx, existing: [{ id: "x", expense_date: "2026-09-07", description: "Claude", amount: 20, currency: "USD" }] },
  );
  assert.equal(l.decision, "review");
  assert.equal(l.duplicate_of, "x");
});

test("iştirak düşülür", async () => {
  const [l] = await processLines([{ date: "2026-09-01", description: "ANTHROPIC", amount_original: 200, currency_original: "USD", partner_share_usd: 100, card_last4: "6108" }], ctx);
  assert.equal(l.amount_usd_net, 100);
});

test("Gemini çıktısı doğrulama: iade negatife çevrilir, tek kartlı ekstrede kart atanır", () => {
  const r = sanitize({ cards: [{ last4: "6108" }], lines: [{ date: "15.09.2026", description: "NEO4J", amount_original: 16.46, currency_original: "USD", line_type: "refund" }] });
  assert.equal(r.lines[0].amount_original, -16.46);
  assert.equal(r.lines[0].card_last4, "6108");
});

test("Mercury: gelen havale ve iptaller elenir", () => {
  const raw = mercuryToRaw([
    { id: "a", amount: -10, status: "sent", kind: "debitCardTransaction", counterpartyName: "GitHub", createdAt: "2026-10-01T00:00:00Z" },
    { id: "b", amount: 500, status: "sent", kind: "incomingDomesticWire", createdAt: "2026-10-01T00:00:00Z" },
    { id: "c", amount: -5, status: "cancelled", kind: "debitCardTransaction", createdAt: "2026-10-01T00:00:00Z" },
  ]);
  assert.equal(raw.length, 1);
  assert.equal(raw[0].amount_original, 10);
  assert.equal(raw[0].external_id, "a");
});
