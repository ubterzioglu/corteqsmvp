import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleWhatsAppAutoReply } from "../_shared/whatsapp-autoreply.ts";
import { secretsMatch } from "../_shared/edge-authorization.ts";

const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_APP_SECRET",
  "WHATSAPP_GRAPH_API_VERSION",
  "WHATSAPP_AUTOREPLY_SECRET",
] as const;

// Validate all required environment variables at startup
for (const varName of requiredEnvVars) {
  if (!Deno.env.get(varName)) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

const config = {
  supabaseUrl: Deno.env.get("SUPABASE_URL")!,
  serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  geminiApiKey: Deno.env.get("GEMINI_API_KEY")!,
  whatsappAccessToken: Deno.env.get("WHATSAPP_ACCESS_TOKEN")!,
  whatsappPhoneNumberId: Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!,
  whatsappAppSecret: Deno.env.get("WHATSAPP_APP_SECRET")!,
  whatsappGraphVersion: Deno.env.get("WHATSAPP_GRAPH_API_VERSION")!,
};

const autoreplySecret = Deno.env.get("WHATSAPP_AUTOREPLY_SECRET")!;

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-autoreply-secret",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Verify shared secret
  const secret = req.headers.get("x-autoreply-secret");
  if (!secretsMatch(secret, autoreplySecret)) {
    return new Response(
      JSON.stringify({ error: "unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse request body
  let body: any;
  try {
    body = await req.json();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "invalid_json" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate required fields
  const { threadId, messageId, waIdHash, waIdCiphertext, messageText } = body;
  if (!threadId || !messageId || !waIdHash || !waIdCiphertext || !messageText) {
    return new Response(
      JSON.stringify({ error: "missing_required_fields" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Handle auto-reply
  const result = await handleWhatsAppAutoReply(config, {
    threadId,
    messageId,
    waIdHash,
    waIdCiphertext,
    messageText,
  });

  if (result.success) {
    return new Response(
      JSON.stringify({
        success: true,
        skipped: result.skipped,
        providerMessageId: result.providerMessageId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } else {
    return new Response(
      JSON.stringify({
        success: false,
        error: result.error,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
