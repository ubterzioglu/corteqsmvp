import { describe, expect, it, vi } from "vitest";

import {
  createWhatsAppWebhookHandler,
  extractWhatsAppWebhookEvents,
  verifyMetaSignature,
  type StoredWhatsAppWebhookEvent,
} from "./whatsapp-webhook";

const APP_SECRET = "test-app-secret-with-enough-entropy";
const VERIFY_TOKEN = "test-verify-token";

const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "waba-id-not-persisted",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "+49 111 222", phone_number_id: "business-phone-id" },
            contacts: [{ profile: { name: "Private Name" }, wa_id: "49123456789" }],
            messages: [
              {
                from: "49123456789",
                id: "wamid.inbound-1",
                timestamp: "1788100000",
                type: "text",
                text: { body: "Merhaba, bilgi alabilir miyim?" },
              },
            ],
          },
        },
      ],
    },
  ],
};

async function signatureFor(body: string, secret = APP_SECRET) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
  );
  const hex = Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `sha256=${hex}`;
}

async function signedRequest(body: string, signature?: string) {
  return new Request("https://example.test/functions/v1/whatsapp-webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.8",
      "x-hub-signature-256": signature ?? (await signatureFor(body)),
    },
    body,
  });
}

function makeHandler(overrides?: {
  claimRateLimit?: (requesterHash: string) => Promise<boolean>;
  ingestEvent?: (event: StoredWhatsAppWebhookEvent) => Promise<boolean>;
}) {
  return createWhatsAppWebhookHandler({
    verifyToken: VERIFY_TOKEN,
    appSecret: APP_SECRET,
    claimRateLimit: overrides?.claimRateLimit ?? vi.fn().mockResolvedValue(true),
    ingestEvent: overrides?.ingestEvent ?? vi.fn().mockResolvedValue(true),
  });
}

describe("WhatsApp webhook verification", () => {
  it("returns Meta's challenge only for the exact verification token", async () => {
    const handler = makeHandler();
    const accepted = await handler(
      new Request(
        `https://example.test/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=challenge-123`,
      ),
    );
    const rejected = await handler(
      new Request(
        "https://example.test/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=challenge-123",
      ),
    );

    expect(accepted.status).toBe(200);
    await expect(accepted.text()).resolves.toBe("challenge-123");
    expect(rejected.status).toBe(403);
  });

  it("validates the raw body with Meta HMAC-SHA256", async () => {
    const body = JSON.stringify(payload);
    const valid = await signatureFor(body);
    await expect(
      verifyMetaSignature(new TextEncoder().encode(body), valid, APP_SECRET),
    ).resolves.toBe(true);
    await expect(
      verifyMetaSignature(new TextEncoder().encode(`${body} `), valid, APP_SECRET),
    ).resolves.toBe(false);
  });

  it("rejects an invalid signature before rate-limit or database work", async () => {
    const claimRateLimit = vi.fn().mockResolvedValue(true);
    const ingestEvent = vi.fn().mockResolvedValue(true);
    const response = await makeHandler({ claimRateLimit, ingestEvent })(
      await signedRequest(JSON.stringify(payload), `sha256=${"0".repeat(64)}`),
    );

    expect(response.status).toBe(401);
    expect(claimRateLimit).not.toHaveBeenCalled();
    expect(ingestEvent).not.toHaveBeenCalled();
  });
});

describe("WhatsApp webhook ingestion", () => {
  it("allowlists message data and drops contacts, profile names and display phone", () => {
    const [event] = extractWhatsAppWebhookEvents(payload);
    expect(event).toMatchObject({
      providerEventKey: "message:wamid.inbound-1",
      providerMessageId: "wamid.inbound-1",
      eventType: "inbound_message",
      waId: "49123456789",
      phoneNumberId: "business-phone-id",
      messageType: "text",
      messageText: "Merhaba, bilgi alabilir miyim?",
    });
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain("Private Name");
    expect(serialized).not.toContain("+49 111 222");
    expect(serialized).not.toContain("waba-id-not-persisted");
  });

  it("hashes phone identifiers and accepts a signed event", async () => {
    const ingestEvent = vi.fn().mockResolvedValue(true);
    const response = await makeHandler({ ingestEvent })(
      await signedRequest(JSON.stringify(payload)),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual({ received: 1, inserted: 1 });
    expect(ingestEvent).toHaveBeenCalledOnce();
    const stored = ingestEvent.mock.calls[0][0] as StoredWhatsAppWebhookEvent;
    expect(stored.waIdHash).toMatch(/^[0-9a-f]{64}$/);
    expect(stored.phoneNumberIdHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(stored)).not.toContain("49123456789");
    expect(JSON.stringify(stored)).not.toContain("business-phone-id");
  });

  it("returns 200 for a provider duplicate while reporting zero inserts", async () => {
    const ingestEvent = vi.fn().mockResolvedValue(false);
    const response = await makeHandler({ ingestEvent })(
      await signedRequest(JSON.stringify(payload)),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: 1, inserted: 0 });
    expect(ingestEvent).toHaveBeenCalledOnce();
  });

  it("returns 429 without ingesting when the atomic limiter rejects", async () => {
    const ingestEvent = vi.fn().mockResolvedValue(true);
    const response = await makeHandler({
      claimRateLimit: vi.fn().mockResolvedValue(false),
      ingestEvent,
    })(await signedRequest(JSON.stringify(payload)));

    expect(response.status).toBe(429);
    expect(ingestEvent).not.toHaveBeenCalled();
  });
});
