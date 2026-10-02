// G13 · Sahiplik kodu doğrulama — davet sayfasını SUNUCU TARAFINDA okur.
//
// G08 kural 1: okuma asla tarayıcıdan yapılmaz — ziyaretçinin IP'siyle istek
// atmak ve davet linkini istemciye vermek G03'ün kapattığı sızıntıyı geri açar.
// G08 kural 8: davet linki yanıta VE log'a YAZILMAZ; link DB'den okunur,
// yalnız okunan ad ve sonuç döner.
//
// Akış: kullanıcı "Kontrol et"e basar → bu fonksiyon claim'i doğrular (sahiplik +
// method=code + pending) → davet sayfasını platform-özel işaretle okur
// (_shared/group-invite-read.ts, G08 ölçümleri) → CQ kodunu ad/açıklamada arar →
// sonucu YALNIZ service_role'e açık `group_claim_record_verification` RPC'sine
// yazar (attempt sayacı, expired/verified/rejected geçişleri orada).
//
// ⚠️ verify_jwt TEK BAŞINA yetki değildir (anon anahtarı da geçerli JWT'dir —
// edge-authorization.ts dersi): çağıran getUser ile doğrulanır ve claim'in
// SAHİBİ mi diye bakılır.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";
import { z } from "https://esm.sh/zod@3.25.76";
import {
  buildAssistantCorsHeaders,
  isAssistantOriginAllowed,
  readJsonWithLimit,
} from "../_shared/edge-security.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { findClaimCode, readInvitePage } from "../_shared/group-invite-read.ts";

const MAX_BODY_BYTES = 1_024;
// Claim başına deneme zaten 3 (group_settings); bu sınır IP başına — G08:
// "üretimde kendi sınırımızı koymak zorunludur".
const RATE_LIMIT_MAX = 12;
const RATE_LIMIT_WINDOW_SECONDS = 600;

const RequestSchema = z
  .object({
    claim_id: z.string().uuid(),
  })
  .strict();

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
    const uid = userData.user.id;

    // 2) IP bazlı hız sınırı (mevcut yardımcı)
    await enforceRateLimit(service, req, "group-claim-verify", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS);

    // 3) Claim: çağıranın KENDİ talebi, kod yolu, hâlâ açık
    const payload = RequestSchema.parse(await readJsonWithLimit(req, MAX_BODY_BYTES));
    const { data: claim, error: claimError } = await service
      .from("group_claims")
      .select("id, user_id, method, status, code, landing_id")
      .eq("id", payload.claim_id)
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claim) return jsonResponse({ error: "Talep bulunamadi." }, 404, corsHeaders);
    if (claim.user_id !== uid) return jsonResponse({ error: "Yetkisiz." }, 403, corsHeaders);
    if (claim.method !== "code" || claim.status !== "pending") {
      return jsonResponse({ error: "Bu talep kodla dogrulanamaz." }, 409, corsHeaders);
    }

    // 4) Davet linki DB'den — yanıt/log'a asla yazılmaz (G08 kural 1+8)
    const { data: landing, error: landingError } = await service
      .from("whatsapp_landings")
      .select("whatsapp_link, platform")
      .eq("id", claim.landing_id)
      .maybeSingle();
    if (landingError) throw landingError;
    if (!landing?.whatsapp_link) {
      // Boş linkli kayıtlar (U07 kapsamındaki 2 grup) — deneme SAYMADAN dön.
      return jsonResponse(
        { result: "unknown", detail: "Grup linki bos — kodla dogrulama yapilamaz." },
        200,
        corsHeaders,
      );
    }

    // 5) Okuma her zaman TAZE: kod az önce grup adına eklendi; önbellek onu kaçırır.
    //    (Önbellek G18 ön doldurma yolunun işi — tasarım farklı, kural 7 orada.)
    const read = await readInvitePage(landing.whatsapp_link, landing.platform ?? "whatsapp");

    // 6) Kodu ad VE açıklamada ara (Telegram'da açıklamada olabilir)
    const codeFound =
      read.result === "ok" &&
      (findClaimCode(read.name, claim.code as string) || findClaimCode(read.description, claim.code as string));

    // 7) Sonucu service_role RPC'sine yaz — authenticated'a AÇIK DEĞİL
    const { data: outcome, error: recordError } = await service.rpc("group_claim_record_verification", {
      p_claim_id: claim.id,
      p_code_found: codeFound,
      p_name_read: read.name,
      p_read_result: read.result,
    });
    if (recordError) {
      // RPC hataları DÜZ NESNE — instanceof Error ile daraltma YASAK (G serisi kuralı)
      const code = (recordError as { code?: string }).code;
      console.error("group-claim-verify record failed", { code, message: recordError.message });
      return jsonResponse({ error: "Dogrulama kaydi basarisiz." }, 500, corsHeaders);
    }

    // Log: claim_id + sonuç. Link YOK, kullanıcı girdisi YOK (kural 8).
    console.info("group-claim-verify", { claim_id: claim.id, read_result: read.result, outcome });
    return jsonResponse({ ...(outcome as Record<string, unknown>), name_read: read.name }, 200, corsHeaders);
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
    console.error("group-claim-verify error", error);
    return jsonResponse({ error: "Beklenmeyen bir hata olustu." }, 500, corsHeaders);
  }
});
