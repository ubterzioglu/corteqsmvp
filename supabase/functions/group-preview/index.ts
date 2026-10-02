// G18 · Grup önizleme — S1 formunun "link yapıştır" adımı (tasarım §3.A 3-4).
//
// İki iş:
//   1. DEDUP: davet kodu (G10 `group_invite_code` — SQL tek kaynak) listede var
//      mı? Varsa dış istek ATILMADAN dönülür: "Bu grup zaten listede. Sahibi
//      misin?" (kabul #1'in form tarafı).
//   2. ÖN DOLDURMA: davet sayfasından ad + görsel SUNUCU TARAFINDA okunur
//      (G08 kural 1: tarayıcıdan asla). Başarısız olursa alanlar boş kalır —
//      form bu adıma TAKILMAZ (tasarım §3.A adım 4).
//
// G08 kural 8: davet linki yanıta VE log'a YAZILMAZ.
// ⚠️ verify_jwt TEK BAŞINA yetki değildir (anon anahtarı da geçerli JWT):
// çağıran `getUser` ile doğrulanır — form zaten girişli kullanıcıya açık.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";
import { z } from "https://esm.sh/zod@3.25.76";
import {
  buildAssistantCorsHeaders,
  isAssistantOriginAllowed,
  readJsonWithLimit,
} from "../_shared/edge-security.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { readInvitePage } from "../_shared/group-invite-read.ts";

const MAX_BODY_BYTES = 1_024;
// Önizleme dış istek doğurur (dolu linkte HTTP fetch) — IP başına sıkı sınır
// (G08: "üretimde kendi sınırımızı koymak zorunludur").
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_SECONDS = 600;

const RequestSchema = z
  .object({
    url: z.string().min(1).max(2048),
  })
  .strict();

/**
 * Platform ŞEMA-ÇIPALI türetilir (tasarım §3.A adım 2: başka alan adı
 * reddedilir). `submit_group_v1` ile aynı üç alan adı; regex'ler birebir aynı
 * çıpada tutulur (sözleşme testi ikisini birden kilitler).
 */
function detectPlatform(url: string): "whatsapp" | "telegram" | "discord" | null {
  if (/^https?:\/\/chat\.whatsapp\.com\//i.test(url)) return "whatsapp";
  if (/^https?:\/\/(t\.me|telegram\.me)\//i.test(url)) return "telegram";
  if (/^https?:\/\/(discord\.gg|discord\.com\/invite)\//i.test(url)) return "discord";
  return null;
}

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = buildAssistantCorsHeaders(req);

  if (!isAssistantOriginAllowed(req.headers.get("Origin"))) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase configuration");

    const service = createClient(supabaseUrl, serviceKey);

    // 1) Çağıran gerçek girişli kullanıcı mı
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return jsonResponse({ error: "Giris gerekli." }, 401, corsHeaders);

    const authClient = createClient(supabaseUrl, anonKey ?? "", { auth: { persistSession: false } });
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user) return jsonResponse({ error: "Giris gerekli." }, 401, corsHeaders);

    // 2) IP bazlı hız sınırı
    await enforceRateLimit(service, req, "group-preview", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS);

    // 3) Link: normalize + platform (desteklenmeyen alan adı reddedilir)
    const payload = RequestSchema.parse(await readJsonWithLimit(req, MAX_BODY_BYTES));
    const url = payload.url.trim();
    const platform = detectPlatform(url);
    if (!platform) {
      return jsonResponse(
        { error: "Yalnizca WhatsApp, Telegram ve Discord davet linkleri destekleniyor." },
        400,
        corsHeaders,
      );
    }

    // 4) DEDUP — davet kodu SQL'de türetilir (G10 fonksiyonu tek kaynak;
    //    TS'te ikinci bir regex YAZILMAZ, backfill ile ayrışır).
    const { data: inviteCode, error: codeError } = await service.rpc("group_invite_code", {
      p_url: url,
    });
    if (codeError) {
      console.error("group-preview invite code failed", { code: (codeError as { code?: string }).code });
      return jsonResponse({ error: "Onizleme basarisiz." }, 500, corsHeaders);
    }

    if (typeof inviteCode === "string" && inviteCode !== "") {
      const { data: existing, error: dupError } = await service
        .from("whatsapp_landings")
        .select("slug, group_name, ownership, listing_status")
        .eq("invite_code", inviteCode)
        .limit(1)
        .maybeSingle();
      if (dupError) throw dupError;
      if (existing) {
        // Dış istek atılmadan dönülür. Link YOK (kural 8); slug grup sayfasına
        // götürür, sahiplik akışı oradan başlar (G20/G21).
        return jsonResponse({ exists: true, ...existing }, 200, corsHeaders);
      }
    }

    // 5) ÖN DOLDURMA — ad + görsel (tasarım §3.A adım 4). Okunamazsa null'lar
    //    döner; form elle doldurmaya düşer, asla bu adıma takılmaz.
    const read = await readInvitePage(url, platform);

    // Log: platform + sonuç. Link YOK, kullanıcı girdisi YOK (kural 8).
    console.info("group-preview", { platform, read_result: read.result, exists: false });
    return jsonResponse(
      {
        exists: false,
        platform,
        read_result: read.result,
        name: read.name,
        description: read.description,
        image_url: read.image,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: "Gecersiz istek." }, 400, corsHeaders);
    }
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonResponse({ error: "Istek govdesi cok buyuk." }, 413, corsHeaders);
    }
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return jsonResponse({ error: "Cok fazla istek gonderdiniz." }, 429, corsHeaders);
    }
    console.error("group-preview error", error);
    return jsonResponse({ error: "Beklenmeyen bir hata olustu." }, 500, corsHeaders);
  }
});
