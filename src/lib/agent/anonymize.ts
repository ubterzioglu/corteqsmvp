// Anonimleştirme yardımcıları (Faz 3) — telemetri yazmadan ÖNCE çalışır.
// Kaynak tasarım: newtools.md §"Skorlama, gizlilik ve yönetici deneyimi".
//
// İki sorumluluk:
//  1) pseudonymize: doğrudan tanımlayıcıyı (email/telefon/ip) HMAC-SHA256 ile
//     geri-döndürülemez pseudonyme çevirir. Pepper uygulama verisinde tutulmaz.
//  2) redactPii: serbest metinden e-posta/telefon/URL/TC kimlik kalıplarını siler
//     (LLM'e veya log'a gitmeden önce).

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const URL_RE = /\bhttps?:\/\/[^\s]+/g;
// Telefon: (a) +/00 uluslararası prefix + en az 9 hane/ayraç, veya
// (b) 0 ile başlayan yerel numara (0532...). Saf 1-9 başlangıçlı bitişik
// 11 hane buraya UYMAZ → TCKN'ye bırakılır.
const PHONE_RE = /(?:\+|00)[\d\s().-]{9,}\d|\b0[\d\s().-]{8,}\d/g;
// TC kimlik: 1-9 ile başlayan tam 11 bitişik hane (telefondan sonra kalan).
const TCKN_RE = /\b[1-9]\d{10}\b/g;

/**
 * SHA-256 tabanlı HMAC pseudonym. Web Crypto (browser + Deno + Node 20+).
 * Pepper boşsa hata fırlatır — sessizce ham değer dönülmez.
 * @returns kısa hex pseudonym (16 karakter).
 */
export async function pseudonymize(value: string, pepper: string): Promise<string> {
  if (!pepper) {
    throw new Error("pseudonymize: pepper boş olamaz (gizli yönetim katmanından sağlanmalı).");
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value.trim().toLowerCase()));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 16);
}

/**
 * Serbest metinden PII kalıplarını siler. Sıra önemli: önce email/url (içinde
 * telefon-benzeri rakam olabilir), sonra TCKN, sonra telefon.
 */
export function redactPii(text: string): string {
  if (!text) return text;
  // Sıra önemli: email/url önce (içlerinde rakam olabilir), sonra telefon
  // (yerel 0-prefix 11 haneyi yutar), en son 1-9 başlangıçlı saf TCKN.
  return text
    .replace(EMAIL_RE, "[email]")
    .replace(URL_RE, "[url]")
    .replace(PHONE_RE, "[phone]")
    .replace(TCKN_RE, "[id]");
}

/**
 * Bir payload nesnesinin tüm string değerlerini redakte eder (derinlemesine).
 * Telemetri için payload_redacted üretir.
 */
export function redactPayload(payload: unknown): unknown {
  if (typeof payload === "string") return redactPii(payload);
  if (Array.isArray(payload)) return payload.map(redactPayload);
  if (payload && typeof payload === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
      out[k] = redactPayload(v);
    }
    return out;
  }
  return payload;
}

/**
 * k-anonimlik baskılaması: bir kümenin sayımı eşiğin altındaysa gizlenmeli mi?
 * Anonim rapor üretiminde küçük grupları yutmak için kullanılır.
 */
export function shouldSuppress(count: number, kThreshold = 20): boolean {
  return count < kThreshold;
}
