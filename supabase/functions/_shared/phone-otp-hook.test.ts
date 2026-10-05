import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import {
  buildOtpTemplatePayload,
  createPhoneOtpHookHandler,
  hashRecipient,
  MAX_BODY_BYTES,
  normalizeRecipient,
  verifyWebhookSignature,
  type PhoneOtpHookDependencies,
} from "./phone-otp-hook";

const KEY_BYTES = Buffer.from("test-signing-key-32-bytes-long!!");
const SECRET = `v1,whsec_${KEY_BYTES.toString("base64")}`;
const NOW_MS = 1_800_000_000_000;
const USER_ID = "6481a5c1-3d37-4a56-9f6a-bee08c554965";

function sign(id: string, timestampSeconds: number, body: string): string {
  const mac = createHmac("sha256", KEY_BYTES).update(`${id}.${timestampSeconds}.${body}`).digest("base64");
  return `v1,${mac}`;
}

function signedRequest(payload: unknown, overrides: { timestamp?: number; signature?: string; method?: string } = {}) {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  const timestamp = overrides.timestamp ?? Math.floor(NOW_MS / 1000);
  const headers = new Headers({
    "webhook-id": "msg_123",
    "webhook-timestamp": String(timestamp),
    "webhook-signature": overrides.signature ?? sign("msg_123", timestamp, body),
  });
  return new Request("https://example.test/hook", { method: overrides.method ?? "POST", headers, body });
}

const VALID_PAYLOAD = { user: { id: USER_ID, phone: "491701234567" }, sms: { otp: "561166" } };

function makeDeps(overrides: Partial<PhoneOtpHookDependencies> = {}): PhoneOtpHookDependencies {
  return {
    secret: SECRET,
    pepper: "test-pepper",
    now: () => NOW_MS,
    claimSend: vi.fn().mockResolvedValue({ allowed: true, attemptId: 7 }),
    sendOtpMessage: vi.fn().mockResolvedValue("wamid.ABC"),
    finishSend: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

async function errorOf(response: Response): Promise<{ http_code: number; message: string }> {
  const json = (await response.json()) as { error: { http_code: number; message: string } };
  return json.error;
}

describe("verifyWebhookSignature", () => {
  it("accepts a correctly signed body", async () => {
    const body = JSON.stringify(VALID_PAYLOAD);
    const request = signedRequest(VALID_PAYLOAD);
    await expect(verifyWebhookSignature(SECRET, request.headers, body, NOW_MS)).resolves.toBe(true);
  });

  it("accepts when one of several space-separated signatures matches", async () => {
    const body = JSON.stringify(VALID_PAYLOAD);
    const timestamp = Math.floor(NOW_MS / 1000);
    const good = sign("msg_123", timestamp, body);
    const request = signedRequest(VALID_PAYLOAD, { signature: `v1,AAAA ${good}` });
    await expect(verifyWebhookSignature(SECRET, request.headers, body, NOW_MS)).resolves.toBe(true);
  });

  it("rejects a tampered body", async () => {
    const request = signedRequest(VALID_PAYLOAD);
    await expect(
      verifyWebhookSignature(SECRET, request.headers, JSON.stringify({ ...VALID_PAYLOAD, sms: { otp: "000000" } }), NOW_MS),
    ).resolves.toBe(false);
  });

  it("rejects a signature made with another key", async () => {
    const body = JSON.stringify(VALID_PAYLOAD);
    const otherKey = `v1,whsec_${Buffer.from("another-key-another-key-another!").toString("base64")}`;
    const request = signedRequest(VALID_PAYLOAD);
    await expect(verifyWebhookSignature(otherKey, request.headers, body, NOW_MS)).resolves.toBe(false);
  });

  it("rejects stale and future timestamps beyond the tolerance", async () => {
    const body = JSON.stringify(VALID_PAYLOAD);
    const stale = signedRequest(VALID_PAYLOAD, { timestamp: Math.floor(NOW_MS / 1000) - 10 * 60 });
    const future = signedRequest(VALID_PAYLOAD, { timestamp: Math.floor(NOW_MS / 1000) + 10 * 60 });
    await expect(verifyWebhookSignature(SECRET, stale.headers, body, NOW_MS)).resolves.toBe(false);
    await expect(verifyWebhookSignature(SECRET, future.headers, body, NOW_MS)).resolves.toBe(false);
  });

  it("rejects an empty-key or too-short secret instead of throwing", async () => {
    const body = JSON.stringify(VALID_PAYLOAD);
    const request = signedRequest(VALID_PAYLOAD);
    await expect(verifyWebhookSignature("v1,whsec_   ", request.headers, body, NOW_MS)).resolves.toBe(false);
    await expect(
      verifyWebhookSignature(`v1,whsec_${Buffer.from("short").toString("base64")}`, request.headers, body, NOW_MS),
    ).resolves.toBe(false);
  });

  it("rejects missing headers and a malformed secret without throwing", async () => {
    const body = JSON.stringify(VALID_PAYLOAD);
    await expect(verifyWebhookSignature(SECRET, new Headers(), body, NOW_MS)).resolves.toBe(false);
    const request = signedRequest(VALID_PAYLOAD);
    await expect(verifyWebhookSignature("", request.headers, body, NOW_MS)).resolves.toBe(false);
    await expect(verifyWebhookSignature("not-a-secret", request.headers, body, NOW_MS)).resolves.toBe(false);
  });
});

describe("normalizeRecipient", () => {
  it("returns digits only, with or without a leading plus", () => {
    expect(normalizeRecipient("+491701234567")).toBe("491701234567");
    expect(normalizeRecipient("491701234567")).toBe("491701234567");
  });

  it("rejects values that are not a plausible E.164 number", () => {
    for (const bad of ["", "abc", "+0123456789", "12345", "+1234567890123456", "49 170 123", "+49-170-123456"]) {
      expect(normalizeRecipient(bad)).toBeNull();
    }
    expect(normalizeRecipient(undefined)).toBeNull();
    expect(normalizeRecipient(null)).toBeNull();
  });
});

describe("hashRecipient", () => {
  it("is deterministic, hex, never contains the number, and depends on the pepper", async () => {
    const a = await hashRecipient("pepper-a", "491701234567");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(await hashRecipient("pepper-a", "491701234567"));
    expect(a).not.toContain("491701234567");
    expect(a).not.toBe(await hashRecipient("pepper-b", "491701234567"));
    expect(a).not.toBe(await hashRecipient("pepper-a", "491701234568"));
  });
});

describe("buildOtpTemplatePayload", () => {
  it("builds an authentication template with body and copy-code button parameters", () => {
    expect(buildOtpTemplatePayload({ to: "491701234567", otp: "561166", templateName: "corteqs_otp", languageCode: "tr" })).toEqual({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "491701234567",
      type: "template",
      template: {
        name: "corteqs_otp",
        language: { code: "tr" },
        components: [
          { type: "body", parameters: [{ type: "text", text: "561166" }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: "561166" }] },
        ],
      },
    });
  });
});

describe("createPhoneOtpHookHandler", () => {
  it("sends the OTP and answers an empty 200 on success", async () => {
    const deps = makeDeps();
    const response = await createPhoneOtpHookHandler(deps)(signedRequest(VALID_PAYLOAD));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({});
    expect(deps.claimSend).toHaveBeenCalledWith(USER_ID, await hashRecipient("test-pepper", "491701234567"));
    expect(deps.sendOtpMessage).toHaveBeenCalledWith("491701234567", "561166");
    expect(deps.finishSend).toHaveBeenCalledWith(7, "sent", "wamid.ABC");
  });

  it("answers 405 to anything but POST", async () => {
    const response = await createPhoneOtpHookHandler(makeDeps())(signedRequest(VALID_PAYLOAD, { method: "PUT" }));
    expect(response.status).toBe(405);
  });

  it("rejects an invalid signature with 401 and never claims or sends", async () => {
    const deps = makeDeps();
    const response = await createPhoneOtpHookHandler(deps)(signedRequest(VALID_PAYLOAD, { signature: "v1,AAAA" }));

    expect(response.status).toBe(401);
    expect(deps.claimSend).not.toHaveBeenCalled();
    expect(deps.sendOtpMessage).not.toHaveBeenCalled();
  });

  it("rejects a malformed payload with 400 even when correctly signed", async () => {
    for (const bad of [
      "not json",
      {},
      { user: { id: "not-a-uuid", phone: "491701234567" }, sms: { otp: "561166" } },
      { user: { id: USER_ID, phone: "491701234567" }, sms: { otp: "12ab" } },
      { user: { id: USER_ID, phone: "abc" }, sms: { otp: "561166" } },
    ]) {
      const deps = makeDeps();
      const response = await createPhoneOtpHookHandler(deps)(signedRequest(bad));
      expect(response.status).toBe(400);
      expect(deps.sendOtpMessage).not.toHaveBeenCalled();
    }
  });

  it("answers 429 with a stable code and retry hint when the limit is hit", async () => {
    const deps = makeDeps({
      claimSend: vi.fn().mockResolvedValue({ allowed: false, reason: "hourly", retryAfterSeconds: 1200 }),
    });
    const response = await createPhoneOtpHookHandler(deps)(signedRequest(VALID_PAYLOAD));

    expect(response.status).toBe(429);
    const error = await errorOf(response);
    expect(error.http_code).toBe(429);
    expect(error.message).toContain("phone_otp_rate_limited");
    expect(deps.sendOtpMessage).not.toHaveBeenCalled();
    expect(deps.finishSend).not.toHaveBeenCalled();
  });

  it("marks the attempt failed and answers 502 when WhatsApp definitively rejects the send (4xx)", async () => {
    const deps = makeDeps({ sendOtpMessage: vi.fn().mockRejectedValue(new Error("meta_http_400")) });
    const response = await createPhoneOtpHookHandler(deps)(signedRequest(VALID_PAYLOAD));

    expect(response.status).toBe(502);
    expect((await errorOf(response)).message).toContain("phone_otp_send_failed");
    expect(deps.finishSend).toHaveBeenCalledWith(7, "failed", "meta_http_400");
  });

  it("leaves the attempt claimed (still counted) when delivery is uncertain: timeout, network, 5xx, bad body", async () => {
    for (const message of ["The operation was aborted due to timeout", "fetch failed", "meta_http_500", "meta_http_200", "meta_response_invalid"]) {
      const deps = makeDeps({ sendOtpMessage: vi.fn().mockRejectedValue(new Error(message)) });
      const response = await createPhoneOtpHookHandler(deps)(signedRequest(VALID_PAYLOAD));

      expect(response.status).toBe(502);
      expect(deps.finishSend).not.toHaveBeenCalled();
    }
  });

  it("still answers 200 when the ledger update fails after a successful send", async () => {
    const deps = makeDeps({ finishSend: vi.fn().mockRejectedValue(new Error("finish_rpc_failed")) });
    const response = await createPhoneOtpHookHandler(deps)(signedRequest(VALID_PAYLOAD));

    expect(response.status).toBe(200);
    expect(deps.finishSend).toHaveBeenCalledWith(7, "sent", "wamid.ABC");
  });

  it("accepts a '+'-prefixed number and sends it to Graph as digits only", async () => {
    const deps = makeDeps();
    const response = await createPhoneOtpHookHandler(deps)(
      signedRequest({ user: { id: USER_ID, phone: "+491701234567" }, sms: { otp: "561166" } }),
    );

    expect(response.status).toBe(200);
    expect(deps.sendOtpMessage).toHaveBeenCalledWith("491701234567", "561166");
  });

  it("rejects an oversized body with 413 before verifying or claiming anything", async () => {
    const deps = makeDeps();
    const response = await createPhoneOtpHookHandler(deps)(signedRequest("x".repeat(MAX_BODY_BYTES + 1)));

    expect(response.status).toBe(413);
    expect(deps.claimSend).not.toHaveBeenCalled();
  });

  it("answers 503 and does not send when the rate-limit store fails", async () => {
    const deps = makeDeps({ claimSend: vi.fn().mockRejectedValue(new Error("db down")) });
    const response = await createPhoneOtpHookHandler(deps)(signedRequest(VALID_PAYLOAD));

    expect(response.status).toBe(503);
    expect(deps.sendOtpMessage).not.toHaveBeenCalled();
  });

  it("never leaks the OTP, the phone number or the secret into responses or logs", async () => {
    const logged: string[] = [];
    const spies = (["error", "warn", "log", "info"] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
        logged.push(args.map(String).join(" "));
      }),
    );
    try {
      const failing = makeDeps({ sendOtpMessage: vi.fn().mockRejectedValue(new Error("meta_http_400")) });
      // Telefon ve OTP İÇEREN serbest metinli hata: describeFailure bunu kod benzeri olmadığı için
      // "unknown_error"a düşürmeli (bu assertion yoksa console.error(error) mutasyonu fark edilmez).
      const noisy = makeDeps({
        sendOtpMessage: vi.fn().mockRejectedValue(new Error("send to 491701234567 with code 561166 failed")),
      });
      const limited = makeDeps({ claimSend: vi.fn().mockResolvedValue({ allowed: false, reason: "daily", retryAfterSeconds: 60 }) });
      const bodies: string[] = [];
      for (const deps of [failing, noisy, limited]) {
        const response = await createPhoneOtpHookHandler(deps)(signedRequest(VALID_PAYLOAD));
        bodies.push(await response.text());
      }
      const everything = [...logged, ...bodies].join("\n");
      expect(logged.join("\n")).toContain("unknown_error");
      expect(everything).not.toContain("561166");
      expect(everything).not.toContain("491701234567");
      expect(everything).not.toContain(KEY_BYTES.toString("base64"));
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });
});
