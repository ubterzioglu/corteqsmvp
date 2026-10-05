// Telefon OTP'sini WhatsApp üzerinden taşıyan Supabase "Send SMS" Auth Hook çekirdeği.
//
// Auth kodu üretir ve SMS göndermek yerine bu hook'u çağırır; biz kodu Meta Cloud API
// (AUTHENTICATION kategorili, "Copy code" butonlu şablon) ile iletiriz. Doğrulama tarafı
// değişmez: istemci verifyOtp çağırır, G04 trigger'ı user_verifications'a aynalar.
//
// Sözleşme kaynağı: https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook
//   gövde  { user: { id, phone, ... }, sms: { otp } }
//   imza   Standard Webhooks (webhook-id / webhook-timestamp / webhook-signature),
//          secret biçimi `v1,whsec_<base64>`
//   başarı boş gövdeli 200 · hata { error: { http_code, message } }
//
// Gizlilik: OTP, telefon numarası ve secret log'a ve yanıta ASLA yazılmaz; yalnız
// durum kodları. Kapı imzadır — fonksiyon verify_jwt KAPALI deploy edilir, çünkü
// Auth hook çağrısında kullanıcı JWT'si taşımaz.

import type { OtpTemplatePayload } from "./whatsapp-graph.ts";

export const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;
/** Auth hook gövdesi ~1 KB; imza doğrulanmadan okunan gövdeye üst sınır. */
export const MAX_BODY_BYTES = 8 * 1024;
const MIN_SECRET_BYTES = 16;

const ERROR_CODES = {
  rateLimited: "phone_otp_rate_limited",
  sendFailed: "phone_otp_send_failed",
  unavailable: "phone_otp_unavailable",
  invalidPayload: "phone_otp_invalid_payload",
  payloadTooLarge: "phone_otp_payload_too_large",
  unauthorized: "phone_otp_unauthorized",
} as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OTP_PATTERN = /^\d{4,10}$/;
const RECIPIENT_PATTERN = /^[1-9]\d{6,14}$/;

export type ClaimResult =
  | { allowed: true; attemptId: number }
  | { allowed: false; reason: string; retryAfterSeconds: number };

export type SendOutcome = "sent" | "failed";

export interface PhoneOtpHookDependencies {
  /** `v1,whsec_<base64>` — Supabase panelinin Send SMS hook için verdiği değer. */
  secret: string;
  /** Numara özetinin HMAC anahtarı (düz numara defterde saklanmaz). */
  pepper: string;
  now: () => number;
  claimSend: (userId: string, phoneHash: string) => Promise<ClaimResult>;
  sendOtpMessage: (to: string, otp: string) => Promise<string>;
  finishSend: (attemptId: number, outcome: SendOutcome, detail: string | null) => Promise<void>;
}

function base64ToBytes(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function decodeSecret(secret: string): Uint8Array | null {
  const encoded = secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  if (encoded.length === 0) return null;
  const bytes = base64ToBytes(encoded);
  // Boş/çok kısa anahtar fail-closed: importKey'in fırlatmasına (500) bırakılmaz.
  return bytes && bytes.length >= MIN_SECRET_BYTES ? bytes : null;
}

/** Standard Webhooks imzası: HMAC-SHA256(`${id}.${timestamp}.${body}`), süre toleranslı. */
export async function verifyWebhookSignature(
  secret: string,
  headers: Headers,
  body: string,
  nowMs: number,
): Promise<boolean> {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(nowMs / 1000 - timestampSeconds) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const keyBytes = decodeSecret(secret);
  if (!keyBytes) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
  const expected = new Uint8Array(mac);

  for (const candidate of signatureHeader.split(" ")) {
    const [version, value] = candidate.split(",");
    if (version !== "v1" || !value) continue;
    const provided = base64ToBytes(value);
    if (provided && bytesEqual(provided, expected)) return true;
  }
  return false;
}

/** Alıcı numaranın HMAC-SHA256 özeti (hex) — numara başına kota için; düz numara saklanmaz. */
export async function hashRecipient(pepper: string, recipient: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(recipient)));
  return Array.from(mac, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Auth `phone` değerini Graph'ın beklediği yalnız-rakam biçime çevirir (+ ile veya + olmadan). */
export function normalizeRecipient(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  const digits = phone.startsWith("+") ? phone.slice(1) : phone;
  return RECIPIENT_PATTERN.test(digits) ? digits : null;
}

export function buildOtpTemplatePayload(input: {
  to: string;
  otp: string;
  templateName: string;
  languageCode: string;
}): OtpTemplatePayload {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: input.to,
    type: "template",
    template: {
      name: input.templateName,
      language: { code: input.languageCode },
      components: [
        { type: "body", parameters: [{ type: "text", text: input.otp }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: input.otp }] },
      ],
    },
  };
}

function errorResponse(httpCode: number, message: string): Response {
  return new Response(JSON.stringify({ error: { http_code: httpCode, message } }), {
    status: httpCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function successResponse(): Response {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

interface ParsedHookPayload {
  userId: string;
  recipient: string;
  otp: string;
}

function parsePayload(rawBody: string): ParsedHookPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const { user, sms } = parsed as { user?: { id?: unknown; phone?: unknown }; sms?: { otp?: unknown } };
  const userId = user?.id;
  const otp = sms?.otp;
  const recipient = normalizeRecipient(user?.phone);
  if (typeof userId !== "string" || !UUID_PATTERN.test(userId)) return null;
  if (typeof otp !== "string" || !OTP_PATTERN.test(otp)) return null;
  if (!recipient) return null;
  return { userId, recipient, otp };
}

function describeFailure(error: unknown): string {
  // Yalnız `meta_http_400` gibi kod benzeri mesajlar taşınır; serbest metin (telefon/OTP
  // içerebilecek) asla kayda geçmez.
  const message = error instanceof Error ? error.message : "";
  return /^[a-z0-9_]{1,40}$/i.test(message) ? message : "unknown_error";
}

export function createPhoneOtpHookHandler(deps: PhoneOtpHookDependencies) {
  return async function handle(request: Request): Promise<Response> {
    if (request.method !== "POST") return errorResponse(405, "method_not_allowed");

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return errorResponse(413, ERROR_CODES.payloadTooLarge);
    }
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) return errorResponse(413, ERROR_CODES.payloadTooLarge);
    const signatureOk = await verifyWebhookSignature(deps.secret, request.headers, rawBody, deps.now());
    if (!signatureOk) return errorResponse(401, ERROR_CODES.unauthorized);

    const payload = parsePayload(rawBody);
    if (!payload) return errorResponse(400, ERROR_CODES.invalidPayload);

    let claim: ClaimResult;
    try {
      claim = await deps.claimSend(payload.userId, await hashRecipient(deps.pepper, payload.recipient));
    } catch (error) {
      console.error("send-phone-otp-hook: claim_failed", describeFailure(error));
      return errorResponse(503, ERROR_CODES.unavailable);
    }
    if (!claim.allowed) {
      return errorResponse(429, `${ERROR_CODES.rateLimited}: retry_after=${claim.retryAfterSeconds}`);
    }

    try {
      const providerMessageId = await deps.sendOtpMessage(payload.recipient, payload.otp);
      await finishQuietly(deps, claim.attemptId, "sent", providerMessageId);
      return successResponse();
    } catch (error) {
      const detail = describeFailure(error);
      console.error("send-phone-otp-hook: send_failed", detail);
      // Yalnız Meta'nın KESİN reddi (4xx) 'failed' sayılır → kotadan düşer. Zaman aşımı,
      // ağ hatası, 5xx ya da çözümlenemeyen yanıtta mesaj yine de gitmiş olabilir; satır
      // 'claimed' kalır ve kotaya sayılmaya devam eder (güvenli yön).
      if (/^meta_http_4\d\d$/.test(detail)) {
        await finishQuietly(deps, claim.attemptId, "failed", detail);
      }
      return errorResponse(502, ERROR_CODES.sendFailed);
    }
  };
}

async function finishQuietly(
  deps: PhoneOtpHookDependencies,
  attemptId: number,
  outcome: SendOutcome,
  detail: string | null,
): Promise<void> {
  try {
    await deps.finishSend(attemptId, outcome, detail);
  } catch (error) {
    // Kayıt güncellenemese de kullanıcının akışı bozulmaz; deneme 'claimed' kalır ve
    // kotaya sayılmaya devam eder (güvenli yön).
    console.error("send-phone-otp-hook: finish_failed", describeFailure(error));
  }
}
