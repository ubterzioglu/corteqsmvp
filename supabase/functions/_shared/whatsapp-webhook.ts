export type WhatsAppWebhookEvent = {
  providerEventKey: string;
  providerMessageId: string;
  eventType: "inbound_message" | "message_status";
  waId: string | null;
  phoneNumberId: string | null;
  messageType: string | null;
  messageText: string | null;
  messageStatus: string | null;
  providerTimestamp: string | null;
};

export type StoredWhatsAppWebhookEvent = Omit<
  WhatsAppWebhookEvent,
  "waId" | "phoneNumberId"
> & {
  waIdHash: string | null;
  waIdCiphertext: string | null;
  phoneNumberIdHash: string | null;
};

export type WhatsAppWebhookDependencies = {
  verifyToken: string;
  appSecret: string;
  claimRateLimit: (requesterHash: string) => Promise<boolean>;
  ingestEvent: (event: StoredWhatsAppWebhookEvent) => Promise<boolean>;
};

const MAX_BODY_BYTES = 1_000_000;
const MAX_MESSAGE_TEXT_LENGTH = 4_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function asString(value: unknown, maxLength = 512): string | null {
  return typeof value === "string" && value.length > 0
    ? value.slice(0, maxLength)
    : null;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string): Uint8Array | null {
  if (!/^[0-9a-f]{64}$/i.test(value)) return null;
  return new Uint8Array(value.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);
}

function timingSafeBytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export function timingSafeTextEqual(left: string | null, right: string): boolean {
  if (left === null) return false;
  return timingSafeBytesEqual(new TextEncoder().encode(left), new TextEncoder().encode(right));
}

async function hmacSha256(input: Uint8Array, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, input));
}

export async function verifyMetaSignature(
  body: Uint8Array,
  signatureHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signatureHeader?.startsWith("sha256=") || !appSecret) return false;
  const provided = hexToBytes(signatureHeader.slice("sha256=".length));
  if (!provided) return false;
  const expected = await hmacSha256(body, appSecret);
  return timingSafeBytesEqual(provided, expected);
}

export async function opaqueHash(value: string, secret: string): Promise<string> {
  return bytesToHex(await hmacSha256(new TextEncoder().encode(value), secret));
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function deriveEncryptionKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`corteqs-whatsapp-pii:v1:${secret}`));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptWhatsAppIdentifier(value: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await deriveEncryptionKey(secret),
    new TextEncoder().encode(value),
  ));
  return `v1.${base64UrlEncode(iv)}.${base64UrlEncode(ciphertext)}`;
}

export async function decryptWhatsAppIdentifier(value: string, secret: string): Promise<string> {
  const [version, encodedIv, encodedCiphertext] = value.split(".");
  if (version !== "v1" || !encodedIv || !encodedCiphertext) throw new Error("invalid_ciphertext");
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlDecode(encodedIv) },
    await deriveEncryptionKey(secret),
    base64UrlDecode(encodedCiphertext),
  );
  return new TextDecoder().decode(plaintext);
}

function extractMessageText(message: Record<string, unknown>): string | null {
  const text = isRecord(message.text) ? asString(message.text.body, MAX_MESSAGE_TEXT_LENGTH) : null;
  if (text) return text;

  const button = isRecord(message.button) ? asString(message.button.text, MAX_MESSAGE_TEXT_LENGTH) : null;
  if (button) return button;

  const interactive = isRecord(message.interactive) ? message.interactive : null;
  if (!interactive) return null;
  const buttonReply = isRecord(interactive.button_reply) ? interactive.button_reply : null;
  const listReply = isRecord(interactive.list_reply) ? interactive.list_reply : null;
  return (
    asString(buttonReply?.title, MAX_MESSAGE_TEXT_LENGTH) ??
    asString(listReply?.title, MAX_MESSAGE_TEXT_LENGTH)
  );
}

/**
 * Meta payload'ını kesin bir allowlist'e indirger. Contacts/profile ve ham payload
 * hiçbir zaman döndürülmez; telefon kimliği yalnız handler içinde hash'lenmek üzere
 * kısa süreli taşınır.
 */
export function extractWhatsAppWebhookEvents(payload: unknown): WhatsAppWebhookEvent[] {
  if (!isRecord(payload) || payload.object !== "whatsapp_business_account") return [];
  const events: WhatsAppWebhookEvent[] = [];

  for (const entry of asRecordArray(payload.entry)) {
    for (const change of asRecordArray(entry.changes)) {
      if (change.field !== "messages" || !isRecord(change.value)) continue;
      const value = change.value;
      const metadata = isRecord(value.metadata) ? value.metadata : {};
      const phoneNumberId = asString(metadata.phone_number_id);

      for (const message of asRecordArray(value.messages)) {
        const providerMessageId = asString(message.id);
        if (!providerMessageId) continue;
        events.push({
          providerEventKey: `message:${providerMessageId}`,
          providerMessageId,
          eventType: "inbound_message",
          waId: asString(message.from),
          phoneNumberId,
          messageType: asString(message.type, 80),
          messageText: extractMessageText(message),
          messageStatus: null,
          providerTimestamp: asString(message.timestamp, 40),
        });
      }

      for (const status of asRecordArray(value.statuses)) {
        const providerMessageId = asString(status.id);
        const messageStatus = asString(status.status, 80);
        const timestamp = asString(status.timestamp, 40);
        if (!providerMessageId || !messageStatus) continue;
        events.push({
          providerEventKey: `status:${providerMessageId}:${messageStatus}:${timestamp ?? "unknown"}`,
          providerMessageId,
          eventType: "message_status",
          waId: asString(status.recipient_id),
          phoneNumberId,
          messageType: null,
          messageText: null,
          messageStatus,
          providerTimestamp: timestamp,
        });
      }
    }
  }

  return events;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function getRequesterAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
}

export function createWhatsAppWebhookHandler(dependencies: WhatsAppWebhookDependencies) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const challenge = url.searchParams.get("hub.challenge");
      const providedToken = url.searchParams.get("hub.verify_token");
      if (mode === "subscribe" && challenge && timingSafeTextEqual(providedToken, dependencies.verifyToken)) {
        return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
      }
      return json({ error: "verification_failed" }, 403);
    }

    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return json({ error: "payload_too_large" }, 413);
    }

    const body = new Uint8Array(await request.arrayBuffer());
    if (body.byteLength > MAX_BODY_BYTES) return json({ error: "payload_too_large" }, 413);

    const signatureValid = await verifyMetaSignature(
      body,
      request.headers.get("x-hub-signature-256"),
      dependencies.appSecret,
    );
    if (!signatureValid) return json({ error: "invalid_signature" }, 401);

    const requesterHash = await opaqueHash(getRequesterAddress(request), dependencies.appSecret);
    if (!(await dependencies.claimRateLimit(requesterHash))) {
      return json({ error: "rate_limited" }, 429);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(new TextDecoder().decode(body));
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const events = extractWhatsAppWebhookEvents(payload);
    let inserted = 0;
    for (const event of events) {
      const storedEvent: StoredWhatsAppWebhookEvent = {
        providerEventKey: event.providerEventKey,
        providerMessageId: event.providerMessageId,
        eventType: event.eventType,
        waIdHash: event.waId ? await opaqueHash(event.waId, dependencies.appSecret) : null,
        waIdCiphertext: event.waId
          ? await encryptWhatsAppIdentifier(event.waId, dependencies.appSecret)
          : null,
        phoneNumberIdHash: event.phoneNumberId
          ? await opaqueHash(event.phoneNumberId, dependencies.appSecret)
          : null,
        messageType: event.messageType,
        messageText: event.messageText,
        messageStatus: event.messageStatus,
        providerTimestamp: event.providerTimestamp,
      };
      if (await dependencies.ingestEvent(storedEvent)) inserted += 1;
    }

    return json({ received: events.length, inserted }, 200);
  };
}
