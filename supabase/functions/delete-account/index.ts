// B13 · Hesap silme (D3).
//
// Kaynak: docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md §2.8
//
// Akış:
//   1. JWT doğrula
//   2. Engel kontrolü (check_account_deletion_blocks_v1)
//   3. Anonimleştirme (kişisel verileri sil, içeriği "Silinmiş üye" ile bırak)
//   4. auth.admin.deleteUser
//   5. Silme günlüğü (account_deletion_log)
//
// ⚠️ Bu edge function CANLIYA DEPLOY EDİLMEDEN önce:
//   - Tüm FK'ler analiz edilmeli (plan §2.8 D2 listesi)
//   - Anonimleştirme fonksiyonu yazılmalı
//   - Gerçek silme AYRI ONAYLA yapılmalı

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";
import { buildAssistantCorsHeaders, isAssistantOriginAllowed } from "../_shared/edge-security.ts";
import { jsonResponse } from "../_shared/http.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Engel kontrolü
    const { data: blocks, error: blocksError } = await supabaseAdmin.rpc(
      "check_account_deletion_blocks_v1",
      { p_user_id: user.id }
    );

    if (blocksError) {
      console.error("Blocks check error:", blocksError);
      return jsonResponse({ error: "Engel kontrolü başarısız" }, 500, corsHeaders);
    }

    if (!blocks?.can_delete) {
      return jsonResponse({
        error: "Hesap silinemez",
        blocks: blocks?.blocks ?? [],
      }, 403, corsHeaders);
    }

    // 3. Anonimleştirme
    // ⚠️ BU KISIM CANLIYA DEPLOY EDİLMEDEN ÖNCE TAMAMLANMALI.
    // Şu anki haliyle YALNIZCA placeholder.
    // Gerçek anonimleştirme:
    //   - user_profiles.full_name = "Silinmiş Üye"
    //   - auth.users.email = `deleted_${user.id}@deleted.corteqs.net`
    //   - profile_attributes (kişisel veriler) silinir
    //   - storage (${uid}/… tüm kovalar) silinir
    //   - FK'ler: SET NULL veya anonimleştirme (tek tek)

    // Placeholder: Yalnızca log yaz
    console.log(`[DELETE-ACCOUNT] User ${user.id} requested deletion (DRY RUN)`);

    // 4. auth.admin.deleteUser
    // ⚠️ CANLIYA DEPLOY EDİLMEDEN ÖNCE AYRI ONAY GEREKLİ.
    // Şu anki haliyle YORUM SATIRI.
    /*
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Delete user error:", deleteError);
      return jsonResponse({ error: "Hesap silinemedi" }, 500, corsHeaders);
    }
    */

    // 5. Silme günlüğü
    // ⚠️ account_deletion_log tablosu YOK, oluşturulmalı.

    return jsonResponse({
      success: true,
      message: "Hesap silme talebi alındı (DRY RUN). Gerçek silme henüz aktif değil.",
    }, 200, corsHeaders);
  } catch (error) {
    console.error("delete-account error:", error);
    return jsonResponse({ error: "Sunucu hatası" }, 500, corsHeaders);
  }
});
