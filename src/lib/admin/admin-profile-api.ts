import { supabase } from "@/integrations/supabase/client";

export async function setAttributeRuleAsAdmin(roleKey: string, attributeKey: string, rulePayload: Record<string, unknown>) {
  const { error } = await supabase.rpc("admin_set_attribute_rule", {
    role_key: roleKey,
    attribute_key: attributeKey,
    rule_payload: rulePayload,
  });

  if (error) throw error;
}

export async function updateUserProfileAttributeAsAdmin(
  userId: string,
  attributeKey: string,
  attributeValue: unknown,
  visibility?: "public" | "private" | null,
) {
  const { error } = await supabase.rpc("admin_update_user_profile_attribute", {
    target_user_id: userId,
    attribute_key: attributeKey,
    attribute_value: attributeValue,
    visibility: visibility ?? null,
  });

  if (error) throw error;
}

export async function upsertRoleProfileSectionRuleAsAdmin(params: {
  roleKey: string;
  sectionKey: string;
  isEnabled: boolean;
  requiresApproval: boolean;
  sortOrder: number;
}) {
  const { error } = await (supabase as any).rpc("admin_upsert_role_profile_section_rule", {
    role_key: params.roleKey,
    section_key: params.sectionKey,
    is_enabled: params.isEnabled,
    requires_approval: params.requiresApproval,
    sort_order: params.sortOrder,
  });

  if (error) throw error;
}

export async function upsertEntityMetadataAsAdmin(params: {
  entityType: "attribute" | "feature" | "profile_section";
  entityKey: string;
  description?: string | null;
  adminNote?: string | null;
}): Promise<void> {
  const { error } = await (supabase as any).rpc("admin_upsert_entity_metadata", {
    p_entity_type: params.entityType,
    p_entity_key:  params.entityKey,
    p_description: params.description ?? null,
    p_admin_note:  params.adminNote ?? null,
  });

  if (error) throw error;
}
