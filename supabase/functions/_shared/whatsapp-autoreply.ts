// WhatsApp autoreply shared logic (W05)
// This module contains the core business logic for automated WhatsApp responses.
// It's separated from the edge function to enable unit testing without Deno dependencies.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { recordAssistantUsage } from "./assistant-usage.ts";
import { sendGraphMessage } from "./whatsapp-graph.ts";
import { decryptWhatsAppIdentifier } from "./whatsapp-webhook.ts";

export type WhatsAppAutoReplyConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
  geminiApiKey: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappAppSecret: string;
  whatsappGraphVersion: string;
};

export type WhatsAppAutoReplyRequest = {
  threadId: string;
  messageId: string;
  waIdHash: string;
  waIdCiphertext: string;
  messageText: string;
};

export type WhatsAppAutoReplyResult = {
  success: boolean;
  skipped?: string;
  error?: string;
  providerMessageId?: string;
};

const WHATSAPP_ASSISTANT_SYSTEM_PROMPT = `Sen CorteQS asistanısın. Kısa, net, yardımcı ol.
WhatsApp için: Markdown YOK, yalnız *kalın* kullan. 600 karakteri aşma.
Bilmiyorsan: "Bir insan temsilci size yardımcı olacak" de ve bitir.`;

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1536;
const SEARCH_THRESHOLD = 0.35;
const MAX_CONTEXT_TOKENS = 2000;

export async function handleWhatsAppAutoReply(
  config: WhatsAppAutoReplyConfig,
  request: WhatsAppAutoReplyRequest,
): Promise<WhatsAppAutoReplyResult> {
  const supabase = createClient(config.supabaseUrl, config.serviceRoleKey);

  // 1. Check if bot is enabled
  const { data: settings, error: settingsError } = await supabase
    .from("whatsapp_bot_settings")
    .select("enabled, model, max_replies_per_sender_per_day, handover_keywords, fallback_message")
    .eq("id", true)
    .single();

  if (settingsError || !settings) {
    return { success: false, error: "bot_settings_not_found" };
  }

  if (!settings.enabled) {
    return { success: true, skipped: "disabled" };
  }

  // 2. Check handover keywords
  const lowerText = request.messageText.toLowerCase();
  const handoverKeywords = settings.handover_keywords || ["insan", "temsilci", "yetkili"];
  if (handoverKeywords.some(keyword => lowerText.includes(keyword))) {
    // Mark thread as handed over
    await supabase
      .from("whatsapp_customer_threads")
      .update({ bot_handed_over_at: new Date().toISOString(), status: "in_progress" })
      .eq("id", request.threadId);
    
    return { success: true, skipped: "handover_keyword" };
  }

  // 3. Check if thread is handed over or assigned
  const { data: thread, error: threadError } = await supabase
    .from("whatsapp_customer_threads")
    .select("bot_handed_over_at, assigned_to, status")
    .eq("id", request.threadId)
    .single();

  if (threadError || !thread) {
    return { success: false, error: "thread_not_found" };
  }

  if (thread.bot_handed_over_at || thread.assigned_to) {
    return { success: true, skipped: "thread_handed_over" };
  }

  // 4. Rate limit check (using edge_rate_limits)
  const rateLimitKey = `whatsapp-autoreply:${request.waIdHash}`;
  const { data: rateLimit, error: rateLimitError } = await supabase
    .from("edge_rate_limits")
    .select("request_count, window_started_at")
    .eq("scope", "whatsapp-autoreply")
    .eq("client_key", rateLimitKey)
    .single();

  const now = new Date();
  const windowStart = rateLimit?.window_started_at ? new Date(rateLimit.window_started_at) : null;
  const isNewWindow = !windowStart || (now.getTime() - windowStart.getTime()) > 24 * 60 * 60 * 1000;

  if (!isNewWindow && rateLimit && rateLimit.request_count >= settings.max_replies_per_sender_per_day) {
    return { success: true, skipped: "rate_limited" };
  }

  // Update or insert rate limit
  if (isNewWindow) {
    await supabase
      .from("edge_rate_limits")
      .upsert({
        scope: "whatsapp-autoreply",
        client_key: rateLimitKey,
        window_started_at: now.toISOString(),
        request_count: 1,
      }, { onConflict: "scope,client_key" });
  } else {
    await supabase
      .from("edge_rate_limits")
      .update({ request_count: rateLimit.request_count + 1 })
      .eq("scope", "whatsapp-autoreply")
      .eq("client_key", rateLimitKey);
  }

  // 5. Embed query
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const embeddingModel = genAI.getGenerativeModel({
    model: EMBEDDING_MODEL,
    generationConfig: { outputDimensionality: EMBEDDING_DIMENSIONS },
  });

  let queryEmbedding: number[];
  try {
    const result = await embeddingModel.embedContent({
      content: request.messageText,
      taskType: "RETRIEVAL_QUERY",
    });
    queryEmbedding = result.embedding.values;
  } catch (error) {
    await recordAssistantUsage(supabase, {
      userId: null,
      functionName: "whatsapp-autoreply",
      provider: "gemini",
      usage: { error: "embedding_failed" },
      status: "error",
      httpStatus: 500,
    });
    return { success: false, error: "embedding_failed" };
  }

  // 6. Search knowledge base (audience=["public"] only)
  const { data: searchResults, error: searchError } = await supabase.rpc(
    "ai_knowledge_search",
    {
      p_embedding: queryEmbedding,
      p_audiences: ["public"],
      p_limit: 5,
      p_max_distance: SEARCH_THRESHOLD,
    }
  );

  if (searchError) {
    await recordAssistantUsage(supabase, {
      userId: null,
      functionName: "whatsapp-autoreply",
      provider: "gemini",
      usage: { error: "search_failed" },
      status: "error",
      httpStatus: 500,
    });
    return { success: false, error: "search_failed" };
  }

  const hasContext = searchResults && searchResults.length > 0;
  let contextText = "";
  if (hasContext) {
    contextText = searchResults
      .map((r: any) => r.content)
      .join("\n\n")
      .substring(0, MAX_CONTEXT_TOKENS * 4); // rough token estimate
  }

  // 7. Generate response with Gemini
  const model = genAI.getGenerativeModel({ model: settings.model || "gemini-2.0-flash" });
  const prompt = hasContext
    ? `${WHATSAPP_ASSISTANT_SYSTEM_PROMPT}\n\nBağlam:\n${contextText}\n\nKullanıcı sorusu: ${request.messageText}`
    : WHATSAPP_ASSISTANT_SYSTEM_PROMPT;

  let responseText: string;
  let tokenUsage: any;

  try {
    const result = await model.generateContent(prompt);
    responseText = result.response.text();
    tokenUsage = {
      promptTokenCount: result.response.usageMetadata?.promptTokenCount || 0,
      candidatesTokenCount: result.response.usageMetadata?.candidatesTokenCount || 0,
      totalTokenCount: result.response.usageMetadata?.totalTokenCount || 0,
    };
  } catch (error) {
    await recordAssistantUsage(supabase, {
      userId: null,
      functionName: "whatsapp-autoreply",
      provider: "gemini",
      usage: { error: "model_failed" },
      status: "error",
      httpStatus: 500,
    });
    return { success: false, error: "model_failed" };
  }

  // If no context, use fallback and hand over
  if (!hasContext) {
    responseText = settings.fallback_message;
    await supabase
      .from("whatsapp_customer_threads")
      .update({ bot_handed_over_at: new Date().toISOString(), status: "new" })
      .eq("id", request.threadId);
  }

  // 8. Decrypt recipient
  let recipientPhone: string;
  try {
    recipientPhone = await decryptWhatsAppIdentifier(
      request.waIdCiphertext,
      config.whatsappAppSecret
    );
  } catch (error) {
    return { success: false, error: "decrypt_failed" };
  }

  // 9. Prepare reply via bot_prepare_whatsapp_reply
  const requestId = crypto.randomUUID();
  const { data: prepareData, error: prepareError } = await supabase.rpc(
    "bot_prepare_whatsapp_reply",
    {
      p_request_id: requestId,
      p_thread_id: request.threadId,
      p_body: responseText,
      p_template_name: null,
      p_template_language: null,
    }
  );

  if (prepareError || !prepareData || prepareData.length === 0) {
    await recordAssistantUsage(supabase, {
      userId: null,
      functionName: "whatsapp-autoreply",
      provider: "gemini",
      usage: tokenUsage,
      status: "error",
      httpStatus: 500,
    });
    return { success: false, error: prepareError?.message || "prepare_failed" };
  }

  const prepareResult = prepareData[0];
  if (!prepareResult.should_send) {
    return { success: true, skipped: "idempotent" };
  }

  // 10. Send via Graph API
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientPhone,
    type: "text",
    text: { preview_url: false, body: responseText },
  };

  let providerMessageId: string;
  try {
    providerMessageId = await sendGraphMessage(
      {
        accessToken: config.whatsappAccessToken,
        phoneNumberId: config.whatsappPhoneNumberId,
        graphVersion: config.whatsappGraphVersion,
      },
      payload
    );
  } catch (error) {
    await supabase.rpc("bot_finalize_whatsapp_reply", {
      p_message_id: requestId,
      p_success: false,
      p_provider_message_id: null,
      p_error_code: error instanceof Error ? error.message : "send_failed",
    });

    await recordAssistantUsage(supabase, {
      userId: null,
      functionName: "whatsapp-autoreply",
      provider: "gemini",
      usage: tokenUsage,
      status: "error",
      httpStatus: 502,
    });

    return { success: false, error: "send_failed" };
  }

  // 11. Finalize reply
  await supabase.rpc("bot_finalize_whatsapp_reply", {
    p_message_id: requestId,
    p_success: true,
    p_provider_message_id: providerMessageId,
    p_error_code: null,
  });

  // 12. Record usage
  await recordAssistantUsage(supabase, {
    userId: null,
    functionName: "whatsapp-autoreply",
    provider: "gemini",
    usage: tokenUsage,
    status: "success",
    httpStatus: 200,
  });

  return { success: true, providerMessageId };
}
