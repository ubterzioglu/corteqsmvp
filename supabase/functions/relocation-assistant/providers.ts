// Relocation asistanı — model sağlayıcı soyutlaması.
//
// NEDEN: sağlayıcı değiştirmek yeniden yazım değil, AYAR değişikliği olmalı.
// Çağrı yüzeyi tek: `callModel({ system, messages })`. Hangi sağlayıcının
// kullanılacağı `AI_PROVIDER` ortam değişkeninden gelir.
//
// VARSAYILAN GEMINI'DİR ve bilinçlidir: bu asistan Türkçe konuşuyor ve vize/denklik
// gibi yanlış bilginin zarar verdiği konularda çalışıyor. Ücretsiz katmandaki
// alternatifler (Groq/Llama) Türkçe'de belirgin biçimde daha zayıf. Sağlayıcı
// değiştirilecekse önce Türkçe çıktı kalitesi ölçülmelidir.
//
// MALİYET NOTU: Google AI Studio anahtarları, projeye faturalandırma BAĞLANMADIKÇA
// ücretsiz katmanda çalışır. "Gemini = ücretli" varsayımı yanlıştır; sınır para
// değil kotadır.

export type ModelRole = "user" | "assistant";

export interface ModelMessage {
  role: ModelRole;
  content: string;
}

export interface CallModelInput {
  system: string;
  messages: ModelMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}

export interface CallModelResult {
  answer: string;
  /** Sağlayıcının döndürdüğü kullanım verisi — log'a yazılır, kullanıcıya gitmez. */
  usage: unknown;
  provider: string;
}

/** Sağlayıcı çağrısı başarısız olduğunda fırlatılır; HTTP durumu çağırana taşınır. */
export class ModelProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ModelProviderError";
  }
}

const DEFAULT_TEMPERATURE = 0.6;
const DEFAULT_MAX_TOKENS = 1_200;

// ---------------------------------------------------------------------------
// Gemini (varsayılan)
// ---------------------------------------------------------------------------

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "models/gemini-2.5-flash";

async function callGemini(input: CallModelInput): Promise<CallModelResult> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new ModelProviderError("GEMINI_API_KEY tanımlı değil", 500, false);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: input.messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          temperature: input.temperature ?? DEFAULT_TEMPERATURE,
          maxOutputTokens: input.maxOutputTokens ?? DEFAULT_MAX_TOKENS,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("gemini error", response.status, detail);
    throw new ModelProviderError(
      "Asistan şu an kullanılamıyor.",
      response.status === 429 ? 429 : 502,
      response.status === 429 || response.status === 503,
    );
  }

  const data = await response.json();
  const answer: string = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();

  return { answer, usage: data.usageMetadata ?? null, provider: "gemini" };
}

// ---------------------------------------------------------------------------
// Groq (OpenAI uyumlu sohbet API'si)
// ---------------------------------------------------------------------------

const GROQ_MODEL = Deno.env.get("GROQ_MODEL") ?? "llama-3.3-70b-versatile";

async function callGroq(input: CallModelInput): Promise<CallModelResult> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) throw new ModelProviderError("GROQ_API_KEY tanımlı değil", 500, false);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: input.system },
        ...input.messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        })),
      ],
      temperature: input.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: input.maxOutputTokens ?? DEFAULT_MAX_TOKENS,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("groq error", response.status, detail);
    throw new ModelProviderError(
      "Asistan şu an kullanılamıyor.",
      response.status === 429 ? 429 : 502,
      response.status === 429 || response.status === 503,
    );
  }

  const data = await response.json();
  const answer: string = (data.choices?.[0]?.message?.content ?? "").trim();

  return { answer, usage: data.usage ?? null, provider: "groq" };
}

// ---------------------------------------------------------------------------
// Sevk
// ---------------------------------------------------------------------------

const PROVIDERS: Record<string, (input: CallModelInput) => Promise<CallModelResult>> = {
  gemini: callGemini,
  groq: callGroq,
};

/** `AI_PROVIDER` tanımsızsa Gemini. Bilinmeyen değer SESSİZCE Gemini'ye düşmez — hata verir. */
export function resolveProviderName(): string {
  const raw = (Deno.env.get("AI_PROVIDER") ?? "gemini").trim().toLowerCase();
  if (!(raw in PROVIDERS)) {
    throw new ModelProviderError(
      `Bilinmeyen AI_PROVIDER: ${raw}. Geçerli değerler: ${Object.keys(PROVIDERS).join(", ")}`,
      500,
      false,
    );
  }
  return raw;
}

export async function callModel(input: CallModelInput): Promise<CallModelResult> {
  const name = resolveProviderName();
  const result = await PROVIDERS[name](input);

  if (!result.answer) {
    throw new ModelProviderError("Asistan boş yanıt döndürdü.", 502, true);
  }

  return result;
}
