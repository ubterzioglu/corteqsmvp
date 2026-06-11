import { supabase } from "@/integrations/supabase/client";
import type { AttributeVisibility } from "@/lib/member-profile";
import { getCurrentMemberCatalogProfile } from "@/lib/member-catalog";

export async function submitRoleChangeRequest(targetRoleKey: string, note: string) {
  const { data, error } = await supabase.rpc("submit_role_change_request", {
    target_role_key: targetRoleKey,
    note,
  });

  if (error) throw error;
  return data;
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

  const { data, error } = await supabase.rpc("update_profile_attribute", {
    attribute_key: attributeKey,
    attribute_value: value,
    visibility: visibility ?? null,
  });

  if (error) throw error;
  return data;
}

export async function updateProfileAvatar(avatarUrl: string | null) {
  const { data, error } = await (supabase as any).rpc("update_profile_avatar", {
    next_avatar_url: avatarUrl,
  });

  if (error) throw error;
  return data;
}
