import { supabase } from "@/integrations/supabase/client";
import type { AttributeVisibility } from "@/lib/member-profile";

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
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const userId = userData.user?.id;
    if (!userId) {
      throw new Error("Kullanıcı bulunamadı.");
    }

    const normalizedValue = typeof value === "string"
      ? value.trim()
      : String(value ?? "").trim();

    const { error } = await supabase
      .from("user_profiles")
      .update({
        full_name: normalizedValue || null,
      })
      .eq("user_id", userId);

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

export async function updateUserTaxonomySelection(groupKey: string, optionKeys: string[]) {
  const { data, error } = await (supabase as any).rpc("update_user_taxonomy_selection", {
    group_key: groupKey,
    option_keys: optionKeys,
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
