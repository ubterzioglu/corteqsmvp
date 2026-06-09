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
