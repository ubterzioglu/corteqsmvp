import { supabase } from "@/integrations/supabase/client";
import type { AttributeVisibility } from "@/lib/member-profile";
import { getCurrentMemberCatalogProfile } from "@/lib/member-catalog";
import {
  getReferralValidationMessage,
  resolveReferralStatusFromRpcError,
  validateReferralCodeBeforeSubmit,
} from "@/lib/submissions";

export async function submitRoleChangeRequest(targetRoleKey: string, note: string) {
  const { data, error } = await supabase.rpc("submit_role_change_request", {
    target_role_key: targetRoleKey,
    note,
  });

  if (error) throw error;
  return data;
}

export async function requestNewCatalogItem(roleKey: string, title: string, note: string) {
  const { data, error } = await supabase.rpc("request_new_catalog_item", {
    p_role_key: roleKey,
    p_title: title.trim(),
    p_note: note,
  });

  if (error) throw error;
  return data as string;
}

export async function submitFeatureRequest(featureKey: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.rpc("submit_feature_request", {
    feature_key: featureKey,
    payload,
  });

  if (error) throw error;
  return data;
}

export async function updateProfileAttribute(attributeKey: string, value: unknown, visibility?: AttributeVisibility) {
  if (attributeKey === "full_name") {
    const currentMemberProfile = await getCurrentMemberCatalogProfile();
    if (!currentMemberProfile?.itemId) {
      throw new Error("Member profil kaydı bulunamadı.");
    }

    const normalizedValue = typeof value === "string"
      ? value.trim()
      : String(value ?? "").trim();

    const { error } = await supabase.rpc("update_catalog_item_attribute", {
      p_item_id: currentMemberProfile.itemId,
      p_attribute_key: "full_name",
      p_value: normalizedValue || null,
      p_visibility: visibility ?? "public",
    });

    if (error) throw error;

    return {
      attribute_key: attributeKey,
      status: "approved",
      visibility: "public",
    };
  }

  if (attributeKey === "referral_code") {
    const rawInput = typeof value === "string" ? value.trim() : String(value ?? "").trim();

    // Ön kayıt akışıyla AYNI doğrulayıcı — geçersiz kodda RPC hiç çağrılmaz ve hazır
    // Türkçe mesaj fırlar. Nihai otorite yine SQL (update_profile_attribute içindeki
    // backstop: locked/not_found/... P0001 DETAIL ile döner) — defense in depth.
    const normalizedCode = rawInput ? await validateReferralCodeBeforeSubmit(rawInput) : null;

    const { data, error } = await supabase.rpc("update_profile_attribute", {
      attribute_key: attributeKey,
      attribute_value: normalizedCode,
      visibility: visibility ?? null,
    });

    if (error) {
      const status = resolveReferralStatusFromRpcError(error);
      if (status) throw new Error(getReferralValidationMessage(status));
      throw error;
    }
    return data;
  }

  const { data, error } = await supabase.rpc("update_profile_attribute", {
    attribute_key: attributeKey,
    attribute_value: value,
    visibility: visibility ?? null,
  });

  if (error) throw error;
  return data;
}

export type MyReferralCodeUsage = {
  referralCodeId: string;
  usedAt: string | null;
  source: "submission" | "profile";
};

/**
 * Üyenin kendi referral kullanım kaydı — kilit durumunun tek kaynağı.
 * RLS self_select politikası satırı zaten kullanıcıya daraltır (filtre gerekmez);
 * user_id üzerindeki partial unique index en fazla 1 satır garanti eder.
 * Kod metni ayrıca dönmez: profil alanındaki değer zaten normalize edilmiş kodun kendisi.
 */
export async function getMyReferralCodeUsage(): Promise<MyReferralCodeUsage | null> {
  const { data, error } = await supabase
    .from("referral_code_usages")
    .select("referral_code_id, used_at, source")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    referralCodeId: String(data.referral_code_id),
    usedAt: (data.used_at as string | null) ?? null,
    source: (data.source as "submission" | "profile") ?? "profile",
  };
}

export async function updateProfileAvatar(avatarUrl: string | null) {
  const { data, error } = await supabase.rpc("update_profile_avatar", {
    next_avatar_url: avatarUrl,
  });

  if (error) throw error;
  return data;
}
