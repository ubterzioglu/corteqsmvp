// B2 · Başkasının CV'sini görüntüleme (sahibin rızasıyla, Premium kilitli).
//
// Kaynak: docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md §2.1
//
// Akış:
//   1. JWT doğrula (getUser)
//   2. Çağıran kullanıcının `career.cv.view` yetkisi var mı? (role_features)
//   3. Hedef kullanıcının CV'si var mı? (profile_attributes.cv_doc)
//   4. Hedef kullanıcının `cv_share_with_premium` anahtarı true mu?
//   5. Signed URL döndür (5 dk geçerli)
//
// Güvenlik:
//   - Storage RLS'i GEVŞETİLMEZ. Signed URL service_role ile üretilir.
//   - `getPublicUrl` KULLANILMAZ (herkese açık URL üretmez).
//   - Hedefin rızası yoksa 403.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";
import { z } from "https://esm.sh/zod@3.25.76";
import { buildAssistantCorsHeaders, isAssistantOriginAllowed } from "../_shared/edge-security.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CV_BUCKET = "profile-cv-files";
const CV_ATTRIBUTE_KEY = "cv_doc";
const SHARE_ATTRIBUTE_KEY = "cv_share_with_premium";

const RequestSchema = z.object({
  target_user_id: z.string().uuid(),
});

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

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. JWT doğrula
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Yetkisiz" }, 401, corsHeaders);
    }

    const jwt = authHeader.slice(7);
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Geçersiz JWT" }, 401, corsHeaders);
    }

    // 2. Request body doğrula
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: "Geçersiz istek" }, 400, corsHeaders);
    }

    const { target_user_id } = parsed.data;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Kendi CV'sini görüntüleme her zaman serbest (yetki kontrolü YOK)
    if (user.id === target_user_id) {
      return await generateSignedUrl(target_user_id, supabaseAdmin, corsHeaders);
    }

    // 3. Çağıran kullanıcının `career.cv.view` yetkisi var mı?
    // role_features tablosundan: kullanıcının rolü için bu yetki aktif mi?
    const { data: featureRow, error: featureError } = await supabaseAdmin
      .from("role_features")
      .select("is_enabled")
      .eq("feature_key", "career.cv.view")
      .in(
        "role_id",
        // Kullanıcının aktif rollerini bul
        (await supabaseAdmin
          .from("user_role_assignments")
          .select("role_id")
          .eq("user_id", user.id)
          .eq("status", "active"))
          .data?.map((r) => r.role_id) ?? []
      )
      .eq("is_enabled", true)
      .maybeSingle();

    if (featureError) {
      console.error("Feature check error:", featureError);
      return jsonResponse({ error: "Yetki kontrolü başarısız" }, 500, corsHeaders);
    }

    if (!featureRow) {
      return jsonResponse({ error: "Premium özellik: CV görüntüleme" }, 403, corsHeaders);
    }

    // 4. Hedef kullanıcının paylaşım izni var mı?
    const { data: shareAttr, error: shareError } = await supabaseAdmin
      .from("profile_attributes")
      .select("value")
      .eq("user_id", target_user_id)
      .eq("key", SHARE_ATTRIBUTE_KEY)
      .maybeSingle();

    if (shareError) {
      console.error("Share attribute error:", shareError);
      return jsonResponse({ error: "İzin kontrolü başarısız" }, 500, corsHeaders);
    }

    // Varsayılan KAPALI: anahtar yoksa veya false ise reddet
    const shareEnabled = shareAttr?.value === true || shareAttr?.value === "true";
    if (!shareEnabled) {
      return jsonResponse({ error: "Kullanıcı CV paylaşımını devre dışı bırakmış" }, 403, corsHeaders);
    }

    // 5. Signed URL üret
    return await generateSignedUrl(target_user_id, supabaseAdmin, corsHeaders);
  } catch (error) {
    console.error("member-cv-link error:", error);
    return jsonResponse({ error: "Sunucu hatası" }, 500, corsHeaders);
  }
});

async function generateSignedUrl(
  targetUserId: string,
  supabaseAdmin: ReturnType<typeof createClient>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Hedefin CV'sini bul
  const { data: cvAttr, error: cvError } = await supabaseAdmin
    .from("profile_attributes")
    .select("value")
    .eq("user_id", targetUserId)
    .eq("key", CV_ATTRIBUTE_KEY)
    .maybeSingle();

  if (cvError) {
    console.error("CV attribute error:", cvError);
    return jsonResponse({ error: "CV kontrolü başarısız" }, 500, corsHeaders);
  }

  if (!cvAttr?.value) {
    return jsonResponse({ error: "CV bulunamadı" }, 404, corsHeaders);
  }

  // cv_doc JSON'dan path'i çıkar
  let cvRecord: { path?: string };
  try {
    cvRecord = typeof cvAttr.value === "object" ? cvAttr.value : JSON.parse(cvAttr.value as string);
  } catch {
    return jsonResponse({ error: "CV verisi bozuk" }, 500, corsHeaders);
  }

  const cvPath = cvRecord?.path;
  if (!cvPath || typeof cvPath !== "string") {
    return jsonResponse({ error: "CV yolu geçersiz" }, 404, corsHeaders);
  }

  // Signed URL üret (5 dk geçerli)
  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from(CV_BUCKET)
    .createSignedUrl(cvPath, 300);

  if (signedError || !signedData?.signedUrl) {
    console.error("Signed URL error:", signedError);
    return jsonResponse({ error: "Dosya URL'si üretilemedi" }, 500, corsHeaders);
  }

  return jsonResponse({ signed_url: signedData.signedUrl }, 200, corsHeaders);
}
