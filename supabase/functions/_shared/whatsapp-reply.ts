import { decryptWhatsAppIdentifier } from "./whatsapp-webhook.ts";

export type WhatsAppReplyInput = {
  requestId: string;
  threadId: string;
  body: string | null;
  templateName: string | null;
  templateLanguage: string | null;
};

export type PreparedWhatsAppReply = {
  messageId: string;
  shouldSend: boolean;
  recipientCiphertext: string | null;
  sendMode: "text" | "template";
  messageBody: string | null;
  templateName: string | null;
  templateLanguage: string | null;
};

export type MetaReplyPayload =
  | {
      messaging_product: "whatsapp";
      recipient_type: "individual";
      to: string;
      type: "text";
      text: { preview_url: false; body: string };
    }
  | {
      messaging_product: "whatsapp";
      recipient_type: "individual";
      to: string;
      type: "template";
      template: { name: string; language: { code: string } };
    };

export type WhatsAppReplyDependencies = {
  appSecret: string;
  prepareReply: (authorization: string, input: WhatsAppReplyInput) => Promise<PreparedWhatsAppReply>;
  sendMessage: (payload: MetaReplyPayload) => Promise<string>;
  finalizeReply: (
    authorization: string,
    result: { messageId: string; success: boolean; providerMessageId?: string; errorCode?: string },
  ) => Promise<void>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TEMPLATE_PATTERN = /^[a-z0-9_]{1,512}$/;
const LANGUAGE_PATTERN = /^[A-Za-z]{2,3}(?:_[A-Z]{2})?$/;
const MAX_BODY_BYTES = 16_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

export function parseWhatsAppReplyInput(value: unknown): WhatsAppReplyInput | null {
  if (!isRecord(value)) return null;
  const requestId = typeof value.requestId === "string" ? value.requestId : "";
  const threadId = typeof value.threadId === "string" ? value.threadId : "";
  if (!UUID_PATTERN.test(requestId) || !UUID_PATTERN.test(threadId)) return null;

  const body = typeof value.body === "string" ? value.body.trim() : "";
  const templateName = typeof value.templateName === "string" ? value.templateName.trim() : "";
  const templateLanguage = typeof value.templateLanguage === "string" ? value.templateLanguage.trim() : "";
  const hasText = body.length > 0;
  const hasTemplate = templateName.length > 0 || templateLanguage.length > 0;
  if (hasText === hasTemplate || body.length > 4_000) return null;
  if (hasTemplate && (!TEMPLATE_PATTERN.test(templateName) || !LANGUAGE_PATTERN.test(templateLanguage))) return null;

  return {
    requestId,
    threadId,
    body: hasText ? body : null,
    templateName: hasTemplate ? templateName : null,
    templateLanguage: hasTemplate ? templateLanguage : null,
  };
}

export function buildMetaReplyPayload(
  recipient: string,
  prepared: PreparedWhatsAppReply,
): MetaReplyPayload {
  if (prepared.sendMode === "template") {
    if (!prepared.templateName || !prepared.templateLanguage) throw new Error("invalid_prepared_template");
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "template",
      template: { name: prepared.templateName, language: { code: prepared.templateLanguage } },
    };
  }
  if (!prepared.messageBody) throw new Error("invalid_prepared_text");
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "text",
    text: { preview_url: false, body: prepared.messageBody },
  };
}

export function createWhatsAppReplyHandler(dependencies: WhatsAppReplyDependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS") return json({}, 200);
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const rawBody = new Uint8Array(await request.arrayBuffer());
    if (rawBody.byteLength > MAX_BODY_BYTES) return json({ error: "payload_too_large" }, 413);
    let parsed: unknown;
    try {
      parsed = JSON.parse(new TextDecoder().decode(rawBody));
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    const input = parseWhatsAppReplyInput(parsed);
    if (!input) return json({ error: "invalid_request" }, 400);

    let prepared: PreparedWhatsAppReply;
    try {
      prepared = await dependencies.prepareReply(authorization, input);
    } catch (error: unknown) {
      const code = error instanceof Error ? error.message : "reply_not_allowed";
      const known = new Set([
        "admin_required",
        "thread_not_found",
        "thread_closed",
        "recipient_data_expired",
        "approved_template_required",
        "template_required_outside_service_window",
        "admin_reply_rate_limited",
      ]);
      return json({ error: known.has(code) ? code : "reply_not_allowed" }, code === "admin_required" ? 403 : 409);
    }

    if (!prepared.shouldSend) return json({ duplicate: true, messageId: prepared.messageId }, 200);
    if (!prepared.recipientCiphertext) return json({ error: "recipient_unavailable" }, 409);

    try {
      const recipient = await decryptWhatsAppIdentifier(prepared.recipientCiphertext, dependencies.appSecret);
      const providerMessageId = await dependencies.sendMessage(buildMetaReplyPayload(recipient, prepared));
      await dependencies.finalizeReply(authorization, {
        messageId: prepared.messageId,
        success: true,
        providerMessageId,
      });
      return json({ sent: true, messageId: prepared.messageId }, 200);
    } catch (error: unknown) {
      const errorCode = error instanceof Error ? error.message.slice(0, 120) : "provider_error";
      await dependencies.finalizeReply(authorization, {
        messageId: prepared.messageId,
        success: false,
        errorCode,
      });
      return json({ error: "provider_send_failed", messageId: prepared.messageId }, 502);
    }
  };
}
