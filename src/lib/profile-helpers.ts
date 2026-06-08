import { supabase } from "@/integrations/supabase/client";

export type ProfileBasic = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role_key: string | null;
};

export async function getProfileBasic(userId: string): Promise<ProfileBasic | null> {
  const [attrsResult, roleResult] = await Promise.all([
    supabase
      .from("user_profile_attributes")
      .select("value_text, attribute_catalog!inner(key)")
      .eq("user_id", userId)
      .in("attribute_catalog.key", ["full_name", "avatar_url"]),
    supabase
      .from("user_role_assignments")
      .select("roles!inner(key)")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const attrs = attrsResult.data ?? [];
  const getValue = (key: string) =>
    (attrs.find((a: any) => a.attribute_catalog?.key === key)?.value_text ?? null);

  return {
    user_id: userId,
    full_name: getValue("full_name"),
    avatar_url: getValue("avatar_url"),
    role_key: (roleResult.data as any)?.roles?.key ?? null,
  };
}

export async function getAttributeValue(userId: string, key: string): Promise<string | null> {
  const { data } = await supabase
    .from("user_profile_attributes")
    .select("value_text, attribute_catalog!inner(key)")
    .eq("user_id", userId)
    .eq("attribute_catalog.key", key)
    .maybeSingle();

  return (data as any)?.value_text ?? null;
}

export async function getAttributesBatch(
  userId: string,
  keys: string[],
): Promise<Record<string, string | null>> {
  const { data } = await supabase
    .from("user_profile_attributes")
    .select("value_text, attribute_catalog!inner(key)")
    .eq("user_id", userId)
    .in("attribute_catalog.key", keys);

  const result: Record<string, string | null> = {};
  for (const key of keys) {
    result[key] = null;
  }
  for (const row of data ?? []) {
    const k = (row as any).attribute_catalog?.key;
    if (k) result[k] = (row as any).value_text ?? null;
  }
  return result;
}

export async function getProfilesBasicBatch(userIds: string[]): Promise<ProfileBasic[]> {
  if (userIds.length === 0) return [];

  const [attrsResult, rolesResult] = await Promise.all([
    supabase
      .from("user_profile_attributes")
      .select("user_id, value_text, attribute_catalog!inner(key)")
      .in("user_id", userIds)
      .in("attribute_catalog.key", ["full_name", "avatar_url"]),
    supabase
      .from("user_role_assignments")
      .select("user_id, roles!inner(key)")
      .in("user_id", userIds),
  ]);

  const attrsByUser: Record<string, Record<string, string>> = {};
  for (const row of attrsResult.data ?? []) {
    const r = row as any;
    const uid = r.user_id;
    const k = r.attribute_catalog?.key;
    if (!attrsByUser[uid]) attrsByUser[uid] = {};
    if (k && r.value_text) attrsByUser[uid][k] = r.value_text;
  }

  const roleByUser: Record<string, string> = {};
  for (const row of rolesResult.data ?? []) {
    const r = row as any;
    roleByUser[r.user_id] = r.roles?.key ?? null;
  }

  return userIds.map((uid) => ({
    user_id: uid,
    full_name: attrsByUser[uid]?.full_name ?? null,
    avatar_url: attrsByUser[uid]?.avatar_url ?? null,
    role_key: roleByUser[uid] ?? null,
  }));
}
