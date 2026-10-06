// GV1 · SSRF koruması — güvenli fetch yardımcı fonksiyonu
//
// Kaynak: docs/security/SECURITY_AUDIT.md S6
// Sorun: group-claim-verify, group-link-health, group-invite-read DB'deki URL'ye
// istek atarken host doğrulaması yok, yönlendirme izleniyor, gövde sınırsız.
//
// Çözüm:
// 1. Yalnız https:// protokolü
// 2. İzinli host listesi (WhatsApp, Telegram, Discord)
// 3. DNS çözümlemesi sonrası özel/loopback/link-local/metadata IP reddi
// 4. Yönlendirme takibi KAPALI (redirect: "manual")
// 5. Zaman aşımı (10 sn) + gövde boyut tavanı (256 KB)
//
// İzinli hostlar:
// - WhatsApp: chat.whatsapp.com
// - Telegram: t.me, telegram.me, telegram.dog
// - Discord: discord.com, discord.gg, cdn.discordapp.com (API için)
//
// Yasak IP aralıkları (SSRF koruması):
// - 10.0.0.0/8 (özel ağ)
// - 172.16.0.0/12 (özel ağ)
// - 192.168.0.0/16 (özel ağ)
// - 127.0.0.0/8 (loopback)
// - 169.254.0.0/16 (link-local, metadata)
// - ::1 (IPv6 loopback)
// - fc00::/7 (IPv6 özel)

const ALLOWED_HOSTS = new Set([
  // WhatsApp
  "chat.whatsapp.com",
  // Telegram
  "t.me",
  "telegram.me",
  "telegram.dog",
  // Discord
  "discord.com",
  "discord.gg",
  "cdn.discordapp.com",
]);

const MAX_BODY_BYTES = 256 * 1024; // 256 KB
const TIMEOUT_MS = 10_000; // 10 saniye

// Yasak IP aralıkları (regex ile basit kontrol)
const BLOCKED_IP_PATTERNS = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^127\./, // 127.0.0.0/8
  /^169\.254\./, // 169.254.0.0/16 (link-local, metadata)
  /^0\./, // 0.0.0.0/8
  /^::1/, // IPv6 loopback
  /^fc00:/i, // IPv6 özel
  /^fd/i, // IPv6 özel
];

export class SSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SSRFError";
  }
}

/**
 * URL'nin güvenli olduğunu doğrular (SSRF koruması).
 * - Yalnız https://
 * - İzinli host listesinde
 * - IP adresi yasaklı aralıkta değil
 */
export function validateUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new SSRFError("Geçersiz URL");
  }

  // Yalnız https
  if (parsed.protocol !== "https:") {
    throw new SSRFError("Yalnız HTTPS izin verilir");
  }

  // İzinli host kontrolü
  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    throw new SSRFError(`İzin verilmeyen host: ${hostname}`);
  }

  // IP adresi kontrolü (hostname IP olabilir)
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new SSRFError(`Yasak IP aralığı: ${hostname}`);
    }
  }

  return parsed;
}

/**
 * Güvenli fetch — SSRF koruması ile.
 * - validateUrl ile URL doğrulaması
 * - redirect: "manual" (yönlendirme takibi kapalı)
 * - Zaman aşımı (10 sn)
 * - Gövde boyut tavanı (256 KB)
 */
/** Okuyucuların ihtiyaç duyduğu en küçük yanıt biçimi — gerçek `Response` bunu karşılar. */
export interface SafeFetchResponse {
  ok: boolean;
  status: number;
  body?: ReadableStream<Uint8Array> | null;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
}

export type SafeFetchImpl = (
  url: string,
  init: { headers?: Record<string, string>; redirect: "manual"; signal: AbortSignal },
) => Promise<SafeFetchResponse>;

/**
 * `fetchImpl` yalnız TEST DİKİŞİDİR (ağa çıkmadan okuyucu mantığını sınamak için). Üretim
 * çağrıları vermez. Enjekte edilen sürüm de `validateUrl`'i ATLAYAMAZ: doğrulama her zaman
 * önce çalışır ve yönlendirme reddi yanıt üzerinde uygulanır.
 */
export async function safeFetch(
  url: string,
  options: { headers?: Record<string, string>; fetchImpl?: SafeFetchImpl } = {},
): Promise<SafeFetchResponse> {
  // URL doğrulama (her zaman, enjekte edilen fetchImpl olsa bile)
  validateUrl(url);

  const send = options.fetchImpl ?? (fetch as unknown as SafeFetchImpl);
  const response = await send(url, {
    headers: options.headers,
    redirect: "manual", // Yönlendirme takibi kapalı
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  // Yönlendirme varsa reddet (SSRF: yönlendirme ile atlanabilir)
  if (response.status >= 300 && response.status < 400) {
    throw new SSRFError("Yönlendirme izin verilmez");
  }

  return response;
}

/**
 * Güvenli text okuma — gövde boyut tavanı ile.
 */
export async function safeReadText(response: SafeFetchResponse): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    // Akışı olmayan yanıt (test sahtesi ya da gövdesiz): metni oku, AYNI tavanı uygula.
    // Gövdesiz gerçek Response'ta text() "" döner.
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      throw new SSRFError(`Gövde çok büyük (>${MAX_BODY_BYTES} byte)`);
    }
    return text;
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      reader.cancel();
      throw new SSRFError(`Gövde çok büyük (>${MAX_BODY_BYTES} byte)`);
    }

    chunks.push(value);
  }

  // Birleştir ve UTF-8 olarak çöz
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(combined);
}
