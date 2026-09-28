import { supabase } from "@/integrations/supabase/client";

import { fetchInChunks } from "./supabase-chunked";

/** Toplu profil okumasında çekilen nitelikler. Parça boyu bu sayıdan türetilir. */
const ATTRIBUTE_KEYS = ["full_name", "avatar_url"] as const;

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
      .select("value_text, afs_attributes!inner(key)")
      .eq("user_id", userId)
      .in("afs_attributes.key", ["full_name", "avatar_url"]),
    supabase
      .from("user_role_assignments")
      .select("roles!inner(key)")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const attrs = attrsResult.data ?? [];
  const getValue = (key: string) =>
    (attrs.find((attribute) => attribute.afs_attributes?.key === key)?.value_text ?? null);

  return {
    user_id: userId,
    full_name: getValue("full_name"),
    avatar_url: getValue("avatar_url"),
    role_key: roleResult.data?.roles?.key ?? null,
  };
}

export async function getAttributeValue(userId: string, key: string): Promise<string | null> {
  const { data } = await supabase
    .from("user_profile_attributes")
    .select("value_text, afs_attributes!inner(key)")
    .eq("user_id", userId)
    .eq("afs_attributes.key", key)
    .maybeSingle();

  return data?.value_text ?? null;
}

export async function getAttributesBatch(
  userId: string,
  keys: string[],
): Promise<Record<string, string | null>> {
  const { data } = await supabase
    .from("user_profile_attributes")
    .select("value_text, afs_attributes!inner(key)")
    .eq("user_id", userId)
    .in("afs_attributes.key", keys);

  const result: Record<string, string | null> = {};
  for (const key of keys) {
    result[key] = null;
  }
  for (const row of data ?? []) {
    const key = row.afs_attributes?.key;
    if (key) result[key] = row.value_text ?? null;
  }
  return result;
}

export async function getProfilesBasicBatch(userIds: string[]): Promise<ProfileBasic[]> {
  if (userIds.length === 0) return [];

  // ⚠️ PARÇALI SORGU (S07a). `.in("user_id", userIds)` tek başına güvenli değildir:
  // burada kullanıcı başına İKİ nitelik çekiliyor, yani 500 kullanıcıda 1000 satıra
  // ulaşılır ve PostgREST sessizce keser. Liste büyüdükçe eksik profil sayısı artar
  // ve hiçbir yerde hata görünmez.
  const [attrsResult, rolesResult] = await Promise.all([
    fetchInChunks(userIds, ATTRIBUTE_KEYS.length, (chunk) =>
      supabase
        .from("user_profile_attributes")
        .select("user_id, value_text, afs_attributes!inner(key)")
        .in("user_id", chunk)
        .in("afs_attributes.key", ATTRIBUTE_KEYS),
    ),
    fetchInChunks(userIds, 1, (chunk) =>
      supabase
        .from("user_role_assignments")
        .select("user_id, roles!inner(key)")
        .in("user_id", chunk),
    ),
  ]);

  const attrsByUser: Record<string, Record<string, string>> = {};
  for (const row of attrsResult) {
    const key = row.afs_attributes?.key;
    if (!attrsByUser[row.user_id]) attrsByUser[row.user_id] = {};
    if (key && row.value_text) attrsByUser[row.user_id][key] = row.value_text;
  }

  const roleByUser: Record<string, string> = {};
  for (const row of rolesResult) {
    const roleKey = row.roles?.key;
    if (roleKey) roleByUser[row.user_id] = roleKey;
  }

  return userIds.map((uid) => ({
    user_id: uid,
    full_name: attrsByUser[uid]?.full_name ?? null,
    avatar_url: attrsByUser[uid]?.avatar_url ?? null,
    role_key: roleByUser[uid] ?? null,
  }));
}
