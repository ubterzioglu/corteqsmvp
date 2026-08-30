import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

import {
  createWhatsAppWebhookHandler,
  type StoredWhatsAppWebhookEvent,
} from "../_shared/whatsapp-webhook.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");

if (!supabaseUrl || !serviceRoleKey || !verifyToken || !appSecret) {
  throw new Error("whatsapp-webhook: required server configuration is missing");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const handler = createWhatsAppWebhookHandler({
  verifyToken,
  appSecret,
  claimRateLimit: async (requesterHash) => {
    const { data, error } = await admin.rpc("claim_whatsapp_webhook_rate_limit", {
      p_requester_hash: requesterHash,
    });
    if (error) throw new Error("webhook_rate_limit_failed");
    return data === true;
  },
  ingestEvent: async (event: StoredWhatsAppWebhookEvent) => {
    const { data, error } = await admin.rpc("ingest_whatsapp_webhook_event", {
      p_provider_event_key: event.providerEventKey,
      p_provider_message_id: event.providerMessageId,
      p_event_type: event.eventType,
      p_wa_id_hash: event.waIdHash,
      p_wa_id_ciphertext: event.waIdCiphertext,
      p_phone_number_id_hash: event.phoneNumberIdHash,
      p_message_type: event.messageType,
      p_message_text: event.messageText,
      p_message_status: event.messageStatus,
      p_provider_timestamp: event.providerTimestamp,
    });
    if (error) throw new Error("webhook_ingest_failed");
    return data === true;
  },
});

Deno.serve(async (request) => {
  try {
    return await handler(request);
  } catch (error: unknown) {
    // Request body, phone identity and secrets are deliberately never logged.
    const code = error instanceof Error ? error.message : "unexpected_error";
    console.error("whatsapp-webhook:", code);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
