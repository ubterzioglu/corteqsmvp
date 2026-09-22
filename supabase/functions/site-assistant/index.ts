// Site geneli AI asistanı — katalog + blog bilgi tabanıyla çok turlu sohbet.
//
// Plan: docs/plans/2026-09-20-site-geneli-ai-bot-plani.md (Adım 4)
//
// NEDEN AYRI BİR FONKSİYON — `/api/chat` (rag.corteqs.net) YETMİYOR:
// O servis bu repoda YOKTUR, tek soruluktur (mesaj geçmişi tutmaz), sistem promptu
// alanı yoktur ve 20 Eylül'de ölçüldüğünde taşınma konusunda hiçbir şey bilmiyordu.
// Ayrıca bağlam bulamadığında da `hasContext: true` döndürüyor; bu yüzden
// `ChatBot.tsx`'teki yedek metin hiç devreye girmiyor ve kullanıcı ham
// "Sağlanan bağlamda bilgi bulunmamaktadır" görüyor. Bu fonksiyon `hasContext`
// değerini gerçekten hesaplar.
//
// Güvenlik deseni `relocation-assistant/index.ts`'ten kopyalanmıştır (origin
// allowlist, gövde sınırı, `edge_rate_limits`). Kopya bilinçlidir — bkz. providers.ts
// başlığı ve kalan işler K3.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";
import { z } from "https://esm.sh/zod@3.25.76";
import {
  ModelProviderError,
  callModel,
  resolveProviderName,
  type ModelMessage,
} from "./providers.ts";
import {
  SITE_ASSISTANT_SYSTEM_PROMPT,
  buildContextBlock,
  buildContextTurns,
  collectSources,
  lastUserQuestion,
  resolveAudiences,
  type KnowledgeHit,
} from "../_shared/ai-assistant-context.ts";
import { buildAssistantCorsHeaders, isAssistantOriginAllowed, readJsonWithLimit } from "../_shared/edge-security.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const MAX_BODY_BYTES = 32_000;
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_SECONDS = 600;

const RETRIEVAL_LIMIT = 8;

/**
 * Alaka eşiği (kosinüs mesafesi). Eşiğin üstündeki sonuç DÖNMEZ: bota alakasız
 * bağlam vermek uydurmayı teşvik eder, boş bağlam vermekten daha zararlıdır.
 *
 * ⚠️ 0.35 TAHMİN DEĞİL, ÖLÇÜMDÜR (21 Eylül 2026, 340 parçalık canlı korpus):
 *   "Almanya'da oturma izni nasıl alınır?"  → 0.261  (doğru blog yazısı)
 *   "ABD çalışma vizesi başvurusu"          → 0.257  (doğru blog yazısı)
 *   "Dortmund'da Türkçe bilen doktor"       → 0.268  (gerçek katalog kaydı)
 *   "diploma denklik işlemleri"             → 0.311  (ilgili yazı)
 *   "muz fiyatları nasıl hesaplanır"        → 0.384  (ALAKASIZ — elenmeli)
 * Gerçek eşleşmeler 0.20–0.32, gürültü 0.36+. İlk sürümdeki 0.65 eşiği alakasız
 * sorgulara da bağlam veriyordu, yani `hasContext` pratikte hep true oluyordu.
 * Eşiği gevşetmeden önce yukarıdaki sorguları YENİDEN ÖLÇ.
 */
const RETRIEVAL_MAX_DISTANCE = 0.35;

/** ⚠️ Belge tarafıyla AYNI model ve AYNI boyut olmak zorunda (scripts/ai-knowledge/embed.mjs).
 *  Farklı model ya da boyut = sessizce anlamsız mesafeler. */
const EMBEDDING_MODEL = Deno.env.get("GEMINI_EMBEDDING_MODEL") ?? "models/gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1_536;

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2_000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
});

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

/**
 * Sorguyu vektöre çevirir.
 *
 * `taskType: RETRIEVAL_QUERY` — belgeler `RETRIEVAL_DOCUMENT` ile gömüldü. Gemini bu
 * ikisi için farklı uzaylar üretir; eşleştirmek eşleşme kalitesini belirgin artırır.
 * İki taraf tutarsız olursa mesafeler SESSİZCE bozulur, hata çıkmaz.
 */
async function embedQuery(question: string, apiKey: string): Promise<number[] | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        content: { parts: [{ text: question }] },
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );

  if (!response.ok) {
    // Getirme başarısız olsa bile sohbet SÜRMELİ — model bağlamsız da cevap verir,
    // sistem promptu zaten "veri yoksa uydurma" diyor.
    console.error("site-assistant embed error", response.status, (await response.text()).slice(0, 300));
    return null;
  }

  const data = await response.json();
  const values = data?.embedding?.values;
  return Array.isArray(values) && values.length === EMBEDDING_DIMENSIONS ? values : null;
}

Deno.serve(async (req) => {
  const corsHeaders = buildAssistantCorsHeaders(req);
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    if (origin && !isAssistantOriginAllowed(origin)) {
      return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
    }
    return new Response(null, { headers: corsHeaders });
  }

  if (origin && !isAssistantOriginAllowed(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!supabaseUrl || !serviceKey || !anonKey) {
      throw new Error("Missing one of SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY");
    }
    if (!geminiKey) throw new Error("GEMINI_API_KEY tanımlı değil");

    // Sağlayıcı adı burada doğrulanır: yanlış `AI_PROVIDER` değeri isteğin en başında
    // patlasın, model çağrısına kadar taşınmasın.
    resolveProviderName();

    // Asistan üyelere açıktır ve para harcar — anonim çağrı kabul edilmez.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Giriş yapmanız gerekiyor." }, 401, corsHeaders);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: "Oturum doğrulanamadı." }, 401, corsHeaders);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    await enforceRateLimit(supabase, req, "site-assistant", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS);

    const raw = await readJsonWithLimit(req, MAX_BODY_BYTES);
    const payload = RequestSchema.parse(raw);

    // KİTLE SUNUCUDA BELİRLENİR. İstemciden gelen bir rol iddiasına güvenilmez;
    // `is_admin()` kullanıcının KENDİ oturumuyla sorulur.
    const { data: isAdminData } = await userClient.rpc("is_admin");
    const audiences = resolveAudiences(isAdminData === true);

    const question = lastUserQuestion(payload.messages);
    let hits: KnowledgeHit[] = [];

    if (question) {
      const embedding = await embedQuery(question, geminiKey);
      if (embedding) {
        const { data, error } = await supabase.rpc("ai_knowledge_search", {
          p_embedding: JSON.stringify(embedding),
          p_audiences: audiences,
          p_limit: RETRIEVAL_LIMIT,
          p_max_distance: RETRIEVAL_MAX_DISTANCE,
        });
        // Getirme hatası sohbeti DÜŞÜRMEZ; bağlamsız devam edilir.
        if (error) console.error("site-assistant search error", error.message);
        else hits = (data ?? []) as KnowledgeHit[];
      }
    }

    const context = buildContextBlock(hits);
    const contextTurns = buildContextTurns(context) as ModelMessage[];

    const { answer, usage, provider } = await callModel({
      system: SITE_ASSISTANT_SYSTEM_PROMPT,
      messages: [...contextTurns, ...payload.messages],
    });

    console.log(
      "site-assistant ok",
      JSON.stringify({
        userId: userData.user.id,
        turns: payload.messages.length,
        hits: hits.length,
        contextChars: context.length,
        isAdmin: isAdminData === true,
        provider,
        usage,
      }),
    );

    // `hasContext` GERÇEKTEN hesaplanır — `/api/chat`'in her zaman `true` dönen
    // kusuru burada tekrarlanmaz.
    return jsonResponse(
      { answer, hasContext: hits.length > 0, sources: collectSources(hits) },
      200,
      corsHeaders,
    );
  } catch (error) {
    if (error instanceof ModelProviderError) {
      const message =
        error.status === 429
          ? "Şu anda çok yoğunuz, biraz sonra tekrar deneyin."
          : error.message;
      return jsonResponse({ error: message }, error.status, corsHeaders);
    }
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: "Geçersiz istek." }, 400, corsHeaders);
    }
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonResponse({ error: "İstek gövdesi çok büyük." }, 413, corsHeaders);
    }
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return jsonResponse(
        { error: "Çok fazla istek gönderdiniz, lütfen biraz bekleyin." },
        429,
        corsHeaders,
      );
    }
    console.error("site-assistant error", error);
    return jsonResponse({ error: "Beklenmeyen bir hata oluştu." }, 500, corsHeaders);
  }
});
