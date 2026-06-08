import { supabase } from "@/integrations/supabase/client";
import {
  createReferralCodeWithRetry,
  type ReferralCodeRow,
  type ReferralGroupRow,
  type ReferralSourceRow,
  type ReferralTypeRow,
  validateReferralCodeToken,
} from "@/lib/referral-codes";
import { normalizeTurkishText } from "@/lib/text-normalization";
import type { ProfileType } from "@/lib/profile-types";
import type { IndividualFeatureKey } from "@/lib/features";

export async function userIsAdmin(userId: string) {
  const { data, error } = await supabase
    .from("user_role_assignments")
    .select("roles!inner(key)")
    .eq("user_id", userId)
    .ilike("roles.key", "Admin_%")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function setUserProfileTypeAsAdmin(userId: string, profileType: ProfileType) {
  const { error } = await supabase.rpc("admin_set_user_profile_type", {
    target_user_id: userId,
    next_profile_type: profileType,
  });

  if (error) throw error;
}

export async function setUserRoleAsAdmin(userId: string, roleKey: string) {
  const { error } = await supabase.rpc("admin_set_user_role", {
    target_user_id: userId,
    role_key: roleKey,
  });

  if (error) throw error;
}

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

export async function reviewApprovalRequestAsAdmin(requestId: string, decision: "approved" | "rejected", note: string | null) {
  const { error } = await supabase.rpc("admin_review_approval_request", {
    request_id: requestId,
    decision,
    note,
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

export async function listReferralSources(onlyActive = false): Promise<ReferralSourceRow[]> {
  let query = supabase.from("referral_sources").select("*").order("name", { ascending: true });
  if (onlyActive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listReferralTypes(onlyActive = false): Promise<ReferralTypeRow[]> {
  let query = supabase.from("referral_types").select("*").order("name", { ascending: true });
  if (onlyActive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listReferralGroups(onlyActive = false): Promise<ReferralGroupRow[]> {
  let query = supabase.from("referral_groups").select("*").order("name", { ascending: true });
  if (onlyActive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createReferralSource(params: { name: string; code: string }) {
  const payload = {
    name: normalizeTurkishText(params.name),
    code: validateReferralCodeToken(params.code),
  };
  const { data, error } = await supabase.from("referral_sources").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function createReferralGroup(params: { name: string; code: string }) {
  const payload = {
    name: normalizeTurkishText(params.name),
    code: validateReferralCodeToken(params.code),
  };
  const { data, error } = await supabase.from("referral_groups").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function createReferralType(params: { name: string; code: string }) {
  const payload = {
    name: normalizeTurkishText(params.name),
    code: validateReferralCodeToken(params.code),
  };
  const { data, error } = await supabase.from("referral_types").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateReferralSource(params: { id: string; name?: string; is_active?: boolean }) {
  const payload: { name?: string; is_active?: boolean } = {};
  if (typeof params.name === "string") payload.name = normalizeTurkishText(params.name);
  if (typeof params.is_active === "boolean") payload.is_active = params.is_active;
  const { data, error } = await supabase.from("referral_sources").update(payload).eq("id", params.id).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateReferralGroup(params: { id: string; name?: string; is_active?: boolean }) {
  const payload: { name?: string; is_active?: boolean } = {};
  if (typeof params.name === "string") payload.name = normalizeTurkishText(params.name);
  if (typeof params.is_active === "boolean") payload.is_active = params.is_active;
  const { data, error } = await supabase.from("referral_groups").update(payload).eq("id", params.id).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateReferralType(params: { id: string; name?: string; is_active?: boolean }) {
  const payload: { name?: string; is_active?: boolean } = {};
  if (typeof params.name === "string") payload.name = normalizeTurkishText(params.name);
  if (typeof params.is_active === "boolean") payload.is_active = params.is_active;
  const { data, error } = await supabase.from("referral_types").update(payload).eq("id", params.id).select("*").single();
  if (error) throw error;
  return data;
}

export async function createReferralCode(params: {
  sourceId: string;
  groupId: string;
  typeId: string;
  validFrom: string;
  validUntil: string;
  note?: string | null;
  createdBy?: string | null;
  randomLength?: 5 | 6 | 7;
}): Promise<ReferralCodeRow> {
  const [sourceList, groupList, typeList] = await Promise.all([
    listReferralSources(false),
    listReferralGroups(false),
    listReferralTypes(false),
  ]);
  const source = sourceList.find((item) => item.id === params.sourceId);
  const group = groupList.find((item) => item.id === params.groupId);
  const type = typeList.find((item) => item.id === params.typeId);
  if (!source) throw new Error("Referral source not found.");
  if (!group) throw new Error("Referral group not found.");
  if (!type) throw new Error("Referral type not found.");

  return createReferralCodeWithRetry(
    {
      source,
      group,
      type,
      validFrom: params.validFrom,
      validUntil: params.validUntil,
      note: params.note ?? null,
      createdBy: params.createdBy ?? null,
      randomLength: params.randomLength ?? 6,
    },
    async (payload) => {
      const { data, error } = await supabase.from("referral_codes").insert(payload).select("*").single();
      return { data, error };
    },
  );
}

export async function updateReferralCodeEditableFields(params: {
  id: string;
  note: string | null;
  valid_from: string;
  valid_until: string;
}): Promise<ReferralCodeRow> {
  const fromDate = new Date(params.valid_from);
  const untilDate = new Date(params.valid_until);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(untilDate.getTime())) {
    throw new Error("Geçerlilik tarihleri geçersiz.");
  }
  if (untilDate < fromDate) {
    throw new Error("Bitiş tarihi başlangıç tarihinden önce olamaz.");
  }

  const payload = {
    valid_from: params.valid_from,
    valid_until: params.valid_until,
    note: params.note ? normalizeTurkishText(params.note) : null,
  };

  const { data, error } = await supabase
    .from("referral_codes")
    .update(payload)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function setReferralCodeActive(params: { id: string; is_active: boolean }): Promise<ReferralCodeRow> {
  const { data, error } = await supabase
    .from("referral_codes")
    .update({ is_active: params.is_active })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReferralCodeHard(id: string): Promise<void> {
  const [submissionCountResult, usageCountResult] = await Promise.all([
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("referral_code_id", id),
    supabase
      .from("referral_code_usages")
      .select("id", { count: "exact", head: true })
      .eq("referral_code_id", id),
  ]);

  if (submissionCountResult.error) throw submissionCountResult.error;
  if (usageCountResult.error) throw usageCountResult.error;

  if ((submissionCountResult.count ?? 0) > 0 || (usageCountResult.count ?? 0) > 0) {
    throw new Error("Kullanılmış referral kodu hard delete edilemez.");
  }

  const { error } = await supabase.from("referral_codes").delete().eq("id", id);
  if (error) throw error;
}

// --- Role management bundle ---

export type AttributeRule = {
  is_enabled: boolean;
  is_required: boolean;
  is_public_default: boolean;
  user_can_edit: boolean;
  user_can_hide: boolean;
  requires_admin_approval_on_change: boolean;
  sort_order: number;
};

export type RoleManagementAttribute = {
  key: string;
  label: string;
  description: string | null;
  admin_note: string | null;
  rule: AttributeRule;
};

export type RoleManagementFeature = {
  key: string;
  label: string;
  description: string | null;
  admin_note: string | null;
  is_active_globally: boolean;
  is_enabled: boolean;
};

export type SectionRule = {
  is_enabled: boolean;
  requires_approval: boolean;
  sort_order: number;
};

export type RoleManagementSection = {
  key: string;
  label: string;
  description: string | null;
  admin_note: string | null;
  section_area: string;
  rule: SectionRule;
};

export type RoleManagementBundle = {
  role: { id: string; key: string; label: string };
  attributes: RoleManagementAttribute[];
  features: RoleManagementFeature[];
  sections: RoleManagementSection[];
};

export async function getRoleManagementBundle(roleKey: string): Promise<RoleManagementBundle> {
  const { data, error } = await (supabase as any).rpc("get_role_management_bundle", {
    p_role_key: roleKey,
  });

  if (error) throw error;
  return data as RoleManagementBundle;
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
