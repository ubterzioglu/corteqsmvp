import { describe, expect, it, vi } from "vitest";

import { encryptWhatsAppIdentifier } from "./whatsapp-webhook";
import {
  buildMetaReplyPayload,
  createWhatsAppReplyHandler,
  type PreparedWhatsAppReply,
} from "./whatsapp-reply";

const APP_SECRET = "reply-test-app-secret";
const AUTHORIZATION = "Bearer admin-jwt";
const REQUEST_ID = "11111111-1111-4111-8111-111111111111";
const THREAD_ID = "22222222-2222-4222-8222-222222222222";

async function prepared(overrides: Partial<PreparedWhatsAppReply> = {}): Promise<PreparedWhatsAppReply> {
  return {
    messageId: REQUEST_ID,
    shouldSend: true,
    recipientCiphertext: await encryptWhatsAppIdentifier("49123456789", APP_SECRET),
    sendMode: "text",
    messageBody: "Size nasıl yardımcı olabiliriz?",
    templateName: null,
    templateLanguage: null,
    ...overrides,
  };
}

function request(body: Record<string, unknown>) {
  return new Request("https://example.test/functions/v1/whatsapp-reply", {
    method: "POST",
    headers: { authorization: AUTHORIZATION, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("WhatsApp controlled replies", () => {
  it("builds the official text payload without exposing secrets", async () => {
    expect(buildMetaReplyPayload("49123456789", await prepared())).toEqual({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "49123456789",
      type: "text",
      text: { preview_url: false, body: "Size nasıl yardımcı olabiliriz?" },
    });
  });

  it("sends only the approved zero-parameter template returned by the database gate", async () => {
    const sendMessage = vi.fn().mockResolvedValue("wamid.outbound-1");
    const finalizeReply = vi.fn().mockResolvedValue(undefined);
    const prepareReply = vi.fn().mockResolvedValue(await prepared({
      sendMode: "template",
      messageBody: null,
      templateName: "request_follow_up",
      templateLanguage: "tr_TR",
    }));
    const response = await createWhatsAppReplyHandler({
      appSecret: APP_SECRET,
      prepareReply,
      sendMessage,
      finalizeReply,
    })(request({
      requestId: REQUEST_ID,
      threadId: THREAD_ID,
      templateName: "request_follow_up",
      templateLanguage: "tr_TR",
    }));

    expect(response.status).toBe(200);
    expect(sendMessage).toHaveBeenCalledWith({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "49123456789",
      type: "template",
      template: { name: "request_follow_up", language: { code: "tr_TR" } },
    });
    expect(finalizeReply).toHaveBeenCalledWith(AUTHORIZATION, {
      messageId: REQUEST_ID,
      success: true,
      providerMessageId: "wamid.outbound-1",
    });
  });

  it("maps the database rate-limit gate to 409 and never calls Meta", async () => {
    const sendMessage = vi.fn();
    const response = await createWhatsAppReplyHandler({
      appSecret: APP_SECRET,
      prepareReply: vi.fn().mockRejectedValue(new Error("admin_reply_rate_limited")),
      sendMessage,
      finalizeReply: vi.fn(),
    })(request({ requestId: REQUEST_ID, threadId: THREAD_ID, body: "Merhaba" }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "admin_reply_rate_limited" });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("does not resend an idempotent request id", async () => {
    const sendMessage = vi.fn();
    const response = await createWhatsAppReplyHandler({
      appSecret: APP_SECRET,
      prepareReply: vi.fn().mockResolvedValue(await prepared({ shouldSend: false, recipientCiphertext: null })),
      sendMessage,
      finalizeReply: vi.fn(),
    })(request({ requestId: REQUEST_ID, threadId: THREAD_ID, body: "Merhaba" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ duplicate: true, messageId: REQUEST_ID });
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
