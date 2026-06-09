import { supabase } from "@/integrations/supabase/client";
import type { IndividualFeatureKey } from "@/lib/features";

export async function setRoleFeatureFlagAsAdmin(roleKey: string, featureKey: string, isEnabled: boolean) {
  const { error } = await supabase.rpc("admin_set_role_feature_flag", {
    role_key: roleKey,
    feature_key: featureKey,
    is_enabled: isEnabled,
  });

  if (error) throw error;
}

export async function setUserFeatureOverrideAsAdmin(userId: string, featureKey: IndividualFeatureKey | string, isEnabled: boolean) {
  const { error } = await supabase.rpc("admin_set_user_feature_override", {
    target_user_id: userId,
    feature_key: featureKey,
    is_enabled: isEnabled,
  });

  if (error) throw error;
}

export async function setUserFeatureOverrideDetailedAsAdmin(
  userId: string,
  featureKey: string,
  isEnabled: boolean,
  reason: string | null,
) {
  const { error } = await supabase.rpc("admin_set_user_feature_override_detailed", {
    target_user_id: userId,
    feature_key: featureKey,
    is_enabled: isEnabled,
    reason,
  });

  if (error) throw error;
}

export async function clearUserFeatureOverrideAsAdmin(userId: string, featureKey: IndividualFeatureKey | string) {
  const { error } = await supabase.rpc("admin_clear_user_feature_override", {
    target_user_id: userId,
    feature_key: featureKey,
  });

  if (error) throw error;
}

export async function setFeatureGlobalStateAsAdmin(featureKey: string, isActiveGlobally: boolean) {
  const { error } = await supabase.rpc("admin_set_feature_global_state", {
    feature_key: featureKey,
    is_active_globally: isActiveGlobally,
  });

  if (error) throw error;
}
