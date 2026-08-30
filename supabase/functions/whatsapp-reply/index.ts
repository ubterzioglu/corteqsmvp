import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

import {
  createWhatsAppReplyHandler,
  type MetaReplyPayload,
  type PreparedWhatsAppReply,
  type WhatsAppReplyInput,
} from "../_shared/whatsapp-reply.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
const graphVersionCandidate = Deno.env.get("WHATSAPP_GRAPH_API_VERSION") ?? "v26.0";
const graphVersion = /^v\d+\.\d+$/.test(graphVersionCandidate) ? graphVersionCandidate : "v26.0";

if (!supabaseUrl || !anonKey || !accessToken || !phoneNumberId || !appSecret) {
  throw new Error("whatsapp-reply: required server configuration is missing");
}

function userClient(authorization: string) {
  return createClient(supabaseUrl!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
}

function rpcErrorCode(message: string): string {
  const known = [
    "admin_required",
    "thread_not_found",
    "thread_closed",
    "recipient_data_expired",
    "approved_template_required",
    "template_required_outside_service_window",
    "admin_reply_rate_limited",
  ];
  return known.find((code) => message.includes(code)) ?? "reply_not_allowed";
}

const handler = createWhatsAppReplyHandler({
  appSecret,
  prepareReply: async (authorization: string, input: WhatsAppReplyInput) => {
    const { data, error } = await userClient(authorization).rpc("admin_prepare_whatsapp_reply", {
      p_request_id: input.requestId,
      p_thread_id: input.threadId,
      p_body: input.body,
      p_template_name: input.templateName,
      p_template_language: input.templateLanguage,
    });
    if (error) throw new Error(rpcErrorCode(error.message));
    const row = data?.[0];
    if (!row) throw new Error("reply_not_allowed");
    return {
      messageId: row.message_id,
      shouldSend: row.should_send,
      recipientCiphertext: row.recipient_ciphertext,
      sendMode: row.send_mode,
      messageBody: row.message_body,
      templateName: row.template_name,
      templateLanguage: row.template_language,
    } as PreparedWhatsAppReply;
  },
  sendMessage: async (payload: MetaReplyPayload) => {
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    const responseBody: unknown = await response.json().catch(() => null);
    if (!response.ok || typeof responseBody !== "object" || responseBody === null) {
      throw new Error(`meta_http_${response.status}`);
    }
    const messages = (responseBody as { messages?: unknown }).messages;
    const first = Array.isArray(messages) ? messages[0] : null;
    const providerMessageId = typeof first === "object" && first !== null && "id" in first
      ? (first as { id?: unknown }).id
      : null;
    if (typeof providerMessageId !== "string" || !providerMessageId.startsWith("wamid.")) {
      throw new Error("meta_response_invalid");
    }
    return providerMessageId;
  },
  finalizeReply: async (authorization, result) => {
    const { error } = await userClient(authorization).rpc("admin_finalize_whatsapp_reply", {
      p_message_id: result.messageId,
      p_success: result.success,
      p_provider_message_id: result.providerMessageId ?? null,
      p_error_code: result.errorCode ?? null,
    });
    if (error) throw new Error("reply_finalize_failed");
  },
});

Deno.serve(async (request) => {
  try {
    return await handler(request);
  } catch (error: unknown) {
    // Tokens, recipients, message bodies and provider responses are never logged.
    const code = error instanceof Error ? error.message : "unexpected_error";
    console.error("whatsapp-reply:", code);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
