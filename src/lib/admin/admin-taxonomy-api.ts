import { supabase } from "@/integrations/supabase/client";

export async function updateUserTaxonomySelectionAsAdmin(
  userId: string,
  groupKey: string,
  optionKeys: string[],
) {
  const { error } = await (supabase as any).rpc("admin_update_user_taxonomy_selection", {
    target_user_id: userId,
    group_key: groupKey,
    option_keys: optionKeys,
  });

  if (error) throw error;
}

export async function upsertRoleTaxonomyRuleAsAdmin(params: {
  roleKey: string;
  groupKey: string;
  isEnabled: boolean;
  isRequired: boolean;
  selectionMode: "single" | "multiple";
}) {
  const { error } = await (supabase as any).rpc("admin_upsert_role_taxonomy_rule", {
    role_key: params.roleKey,
    group_key: params.groupKey,
    is_enabled: params.isEnabled,
    is_required: params.isRequired,
    selection_mode: params.selectionMode,
  });

  if (error) throw error;
}

export async function setTaxonomyOptionActiveAsAdmin(optionKey: string, isActive: boolean) {
  const { error } = await (supabase as any).rpc("admin_set_taxonomy_option_active", {
    option_key: optionKey,
    is_active: isActive,
  });

  if (error) throw error;
}
