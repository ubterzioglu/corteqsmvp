// PDF ekstre -> RawLine[]  (yapay zekâ ile yapılandırılmış çıkarım)
// Varsayılan okuyucu: Claude (ANTHROPIC_API_KEY). EXTRACT_PROVIDER=gemini | lovable ile değiştirilebilir.

import type { Currency, RawLine } from "./types.ts";
import { parseAmount, parseCurrency, parseDate, round2 } from "./normalize.ts";

export interface StatementMeta {
  bank: string | null;
  card_holder: string | null;
  period_start: string | null;
  period_end: string | null;
  statement_date: string | null;
  due_date: string | null;
  statement_total_try: number | null;
  cards: { last4: string; label: string | null; is_virtual: boolean | null }[];
}

export interface ExtractResult { meta: StatementMeta; lines: RawLine[]; warnings: string[]; provider: string; }

export const EXTRACTION_PROMPT = `Sen bir Türk kredi kartı ekstresi okuyucususun. Ekteki PDF bir banka kredi kartı / sanal kart ekstresidir
(QNB Finansbank, İş Bankası Maximiles, Mercury vb.). Görevin ekstredeki TÜM hareket satırlarını eksiksiz çıkarmak.

Kurallar:
- Her hareket için: işlem tarihi (YYYY-MM-DD), açıklama (ekstrede yazdığı gibi, kısaltma yapma), tutar, para birimi.
- Yurt dışı / döviz işlemlerinde ekstre genellikle orijinal tutar + döviz cinsi (örn. "USD 25,00") ve TL karşılığını birlikte gösterir.
  Bu durumda amount_original = döviz tutarı, currency_original = döviz, amount_try = TL karşılığı.
- Yalnızca TL gösterilen işlemlerde currency_original = "TRY", amount_original = TL tutarı, amount_try = aynı tutar.
- İade, iptal, alacak (+) satırlarını NEGATİF tutar olarak ver ve line_type = "refund".
- Kart borcu ödemesi / hesaptan ödeme / önceki dönem devri gibi satırlar: line_type = "payment".
- BSMV, KKDF, faiz, kart ücreti, komisyon: line_type = "fee" (faiz için "interest").
- Ekstrede birden fazla kart varsa (asıl kart + sanal/ek kart), her satırın card_last4 alanına ait olduğu kartın son 4 hanesini yaz.
- Taksitli işlemlerde yalnızca bu döneme yansıyan taksit tutarını yaz ve açıklamaya "(taksit 2/6)" gibi ekle.
- Sayıları JSON sayısı olarak ver (nokta ondalık ayırıcı, binlik ayırıcı yok). Tahmin yapma; okuyamadığın alanı null bırak.
- is_tech_guess: satır bir yazılım/SaaS/yapay zekâ/bulut/hosting/alan adı/dijital abonelik harcamasıysa true;
  market, restoran, akaryakıt, giyim, ulaşım gibi harcamalarda false.
- Toplamları, kampanya metinlerini, puan (MaxiPuan/ParaPuan) bilgilerini satır olarak ekleme; ama dönem borcu toplamını statement_total_try alanına yaz.`;

// Gemini responseSchema (OpenAPI alt kümesi)
export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    bank: { type: "STRING", nullable: true },
    card_holder: { type: "STRING", nullable: true },
    period_start: { type: "STRING", nullable: true },
    period_end: { type: "STRING", nullable: true },
    statement_date: { type: "STRING", nullable: true },
    due_date: { type: "STRING", nullable: true },
    statement_total_try: { type: "NUMBER", nullable: true },
    cards: {
      type: "ARRAY",
      items: { type: "OBJECT", properties: { last4: { type: "STRING" }, label: { type: "STRING", nullable: true }, is_virtual: { type: "BOOLEAN", nullable: true } }, required: ["last4"] },
    },
    lines: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          date: { type: "STRING" },
          description: { type: "STRING" },
          amount_original: { type: "NUMBER" },
          currency_original: { type: "STRING", enum: ["TRY", "USD", "EUR", "GBP", "QAR"] },
          amount_try: { type: "NUMBER", nullable: true },
          card_last4: { type: "STRING", nullable: true },
          line_type: { type: "STRING", enum: ["purchase", "refund", "fee", "payment", "interest", "other"] },
          is_tech_guess: { type: "BOOLEAN", nullable: true },
        },
        required: ["date", "description", "amount_original", "currency_original", "line_type"],
      },
    },
  },
  required: ["lines"],
};

type Env = (k: string) => string | undefined;

export async function extractFromPdf(pdfBase64: string, env: Env, fetchImpl: typeof fetch = fetch): Promise<ExtractResult> {
  const provider = (env("EXTRACT_PROVIDER") || (env("ANTHROPIC_API_KEY") ? "anthropic" : env("GEMINI_API_KEY") ? "gemini" : "lovable")).toLowerCase();
  let json: any;
  if (provider === "gemini") json = await callGemini(pdfBase64, env, fetchImpl);
  else if (provider === "anthropic") json = await callAnthropic(pdfBase64, env, fetchImpl);
  else json = await callLovable(pdfBase64, env, fetchImpl);
  return { ...sanitize(json), provider };
}

async function callGemini(b64: string, env: Env, f: typeof fetch) {
  const key = env("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY tanımlı değil");
  const model = env("GEMINI_MODEL") || "gemini-2.5-flash";
  const res = await f(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ inline_data: { mime_type: "application/pdf", data: b64 } }, { text: EXTRACTION_PROMPT }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini hata ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
  return JSON.parse(text);
}

async function callAnthropic(b64: string, env: Env, f: typeof fetch) {
  const key = env("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY tanımlı değil");
  const model = env("ANTHROPIC_MODEL") || "claude-sonnet-5"; // daha zor ekstrelerde: claude-opus-5-5
  const res = await f("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model,
      max_tokens: 16000,
      tools: [{ name: "kaydet", description: "Ekstre verisini kaydet", input_schema: lowerSchema(RESPONSE_SCHEMA) }],
      tool_choice: { type: "tool", name: "kaydet" },
      messages: [{ role: "user", content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
        { type: "text", text: EXTRACTION_PROMPT },
      ] }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic hata ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  return data.content.find((c: any) => c.type === "tool_use")?.input;
}

async function callLovable(b64: string, env: Env, f: typeof fetch) {
  // Lovable AI Gateway (OpenAI uyumlu). Proje Lovable Cloud'daysa LOVABLE_API_KEY otomatik tanımlıdır.
  const key = env("LOVABLE_API_KEY");
  if (!key) throw new Error("Hiçbir yapay zekâ anahtarı yok: GEMINI_API_KEY, ANTHROPIC_API_KEY veya LOVABLE_API_KEY tanımlayın");
  const res = await f("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: env("LOVABLE_MODEL") || "google/gemini-2.5-flash",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: [
        { type: "text", text: EXTRACTION_PROMPT + "\n\nÇıktıyı şu JSON şemasına uygun ver:\n" + JSON.stringify(lowerSchema(RESPONSE_SCHEMA)) },
        { type: "file", file: { filename: "ekstre.pdf", file_data: `data:application/pdf;base64,${b64}` } },
      ] }],
    }),
  });
  if (!res.ok) throw new Error(`Lovable AI hata ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

/** Gemini şemasını JSON-Schema (küçük harf, nullable -> type dizisi) biçimine çevirir. */
function lowerSchema(s: any): any {
  if (Array.isArray(s)) return s.map(lowerSchema);
  if (!s || typeof s !== "object") return s;
  const o: any = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === "nullable") continue;
    if (k === "type") o.type = s.nullable ? [String(v).toLowerCase(), "null"] : String(v).toLowerCase();
    else o[k] = lowerSchema(v);
  }
  return o;
}

/** Model çıktısını doğrular ve RawLine'a çevirir; eksik/bozuk satırları uyarıya yazar. */
export function sanitize(j: any): { meta: StatementMeta; lines: RawLine[]; warnings: string[] } {
  const warnings: string[] = [];
  const cards = Array.isArray(j?.cards) ? j.cards : [];
  const meta: StatementMeta = {
    bank: j?.bank ?? null,
    card_holder: j?.card_holder ?? null,
    period_start: j?.period_start ? parseDate(j.period_start) : null,
    period_end: j?.period_end ? parseDate(j.period_end) : null,
    statement_date: j?.statement_date ? parseDate(j.statement_date) : null,
    due_date: j?.due_date ? parseDate(j.due_date) : null,
    statement_total_try: parseAmount(j?.statement_total_try),
    cards: cards.map((c: any) => ({ last4: String(c.last4 ?? "").replace(/\D/g, "").slice(-4), label: c.label ?? null, is_virtual: c.is_virtual ?? null })),
  };
  const lines: RawLine[] = [];
  (j?.lines ?? []).forEach((l: any, i: number) => {
    const date = parseDate(String(l.date ?? ""));
    const amt = parseAmount(l.amount_original);
    const cur = (parseCurrency(l.currency_original) ?? "TRY") as Currency;
    if (!date || amt === null || !l.description) { warnings.push(`Satır ${i + 1} okunamadı: ${JSON.stringify(l).slice(0, 120)}`); return; }
    const type = ["purchase", "refund", "fee", "payment", "interest", "other"].includes(l.line_type) ? l.line_type : "purchase";
    lines.push({
      date,
      description: String(l.description).trim(),
      amount_original: type === "refund" ? -Math.abs(amt) : amt,
      currency_original: cur,
      amount_try: parseAmount(l.amount_try) ?? (cur === "TRY" ? amt : null),
      card_last4: l.card_last4 ? String(l.card_last4).replace(/\D/g, "").slice(-4) : (meta.cards.length === 1 ? meta.cards[0].last4 : null),
      line_type: type,
      is_tech_guess: typeof l.is_tech_guess === "boolean" ? l.is_tech_guess : null,
    });
  });
  // Mutabakat: TL toplamı ekstre toplamıyla tutuyor mu? (ödemeler hariç)
  if (meta.statement_total_try) {
    const sum = round2(lines.filter((l) => l.line_type !== "payment").reduce((a, l) => a + (l.amount_try ?? 0), 0));
    const diff = Math.abs(sum - meta.statement_total_try);
    if (diff > Math.max(1, meta.statement_total_try * 0.01)) {
      warnings.push(`Satır toplamı (${sum} TL) ekstre toplamından (${meta.statement_total_try} TL) ${round2(diff)} TL farklı. Devreden bakiye olabilir; eksik satır olup olmadığını kontrol edin.`);
    }
  }
  if (!lines.length) warnings.push("Ekstrede hiç hareket bulunamadı.");
  return { meta, lines, warnings };
}
