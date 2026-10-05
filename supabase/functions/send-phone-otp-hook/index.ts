// Supabase "Send SMS" Auth Hook → WhatsApp (Meta Cloud API) ile telefon OTP'si.
//
// ⚠️ verify_jwt KAPALI deploy edilir (`supabase functions deploy send-phone-otp-hook
// --no-verify-jwt`): Auth hook çağrısında kullanıcı JWT'si taşımaz; kapı Standard Webhooks
// imzasıdır (SEND_SMS_HOOK_SECRET). Coolify edge function deploy ETMEZ — elle deploy.
// Çekirdek mantık ve gizlilik kuralları: ../_shared/phone-otp-hook.ts.
//
// Secret'lar: SEND_SMS_HOOK_SECRET · WHATSAPP_OTP_ACCESS_TOKEN · WHATSAPP_PHONE_NUMBER_ID
//             WHATSAPP_OTP_TEMPLATE · (ops.) WHATSAPP_OTP_TEMPLATE_LANG=tr · WHATSAPP_GRAPH_API_VERSION
//             (ops.) WHATSAPP_OTP_PHONE_PEPPER — numara özeti anahtarı; yoksa hook secret'ı kullanılır
// OTP için AYRI token kullanılır; botun WHATSAPP_ACCESS_TOKEN'ına dokunulmaz.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

import {
  buildOtpTemplatePayload,
  createPhoneOtpHookHandler,
  type ClaimResult,
} from "../_shared/phone-otp-hook.ts";
import { resolveGraphVersion, sendGraphMessage } from "../_shared/whatsapp-graph.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
const accessToken = Deno.env.get("WHATSAPP_OTP_ACCESS_TOKEN");
const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const templateName = Deno.env.get("WHATSAPP_OTP_TEMPLATE");
const templateLanguage = Deno.env.get("WHATSAPP_OTP_TEMPLATE_LANG") ?? "tr";
const graphVersion = resolveGraphVersion(Deno.env.get("WHATSAPP_GRAPH_API_VERSION"));
const phonePepper = Deno.env.get("WHATSAPP_OTP_PHONE_PEPPER") ?? hookSecret;
// Auth hook zaman aşımına (~5 sn) çarpmadan önce Meta çağrısı kesilir.
const GRAPH_TIMEOUT_MS = 4000;

if (!supabaseUrl || !serviceRoleKey || !hookSecret || !accessToken || !phoneNumberId || !templateName) {
  throw new Error("send-phone-otp-hook: required server configuration is missing");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const graphConfig = { accessToken, phoneNumberId, graphVersion };

const handler = createPhoneOtpHookHandler({
  secret: hookSecret,
  pepper: phonePepper,
  now: () => Date.now(),
  claimSend: async (userId: string, phoneHash: string): Promise<ClaimResult> => {
    const { data, error } = await admin.rpc("claim_phone_otp_send", {
      p_user_id: userId,
      p_phone_hash: phoneHash,
    });
    if (error || typeof data !== "object" || data === null) throw new Error("claim_rpc_failed");
    const row = data as { allowed?: unknown; attempt_id?: unknown; reason?: unknown; retry_after_seconds?: unknown };
    if (row.allowed === true && typeof row.attempt_id === "number") {
      return { allowed: true, attemptId: row.attempt_id };
    }
    return {
      allowed: false,
      reason: typeof row.reason === "string" ? row.reason : "limited",
      retryAfterSeconds: typeof row.retry_after_seconds === "number" ? row.retry_after_seconds : 60,
    };
  },
  sendOtpMessage: (to: string, otp: string) =>
    sendGraphMessage(
      graphConfig,
      buildOtpTemplatePayload({ to, otp, templateName, languageCode: templateLanguage }),
      (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(GRAPH_TIMEOUT_MS) }),
    ),
  finishSend: async (attemptId, outcome, detail) => {
    const { error } = await admin.rpc("finish_phone_otp_send", {
      p_attempt_id: attemptId,
      p_outcome: outcome,
      p_detail: detail,
    });
    if (error) throw new Error("finish_rpc_failed");
  },
});

Deno.serve(async (request) => {
  try {
    return await handler(request);
  } catch (error: unknown) {
    // OTP, telefon, token ve sağlayıcı yanıtı ASLA loglanmaz.
    const code = error instanceof Error && /^[a-z0-9_]{1,40}$/i.test(error.message) ? error.message : "unexpected_error";
    console.error("send-phone-otp-hook:", code);
    return new Response(JSON.stringify({ error: { http_code: 500, message: "phone_otp_unavailable" } }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
