// Admin Panel V2 — ortak kullanıcı etiketi yükleyici (Faz 8).
// Approvals ve Audit Logs ekranları actor/target kullanıcılarını isimle göstermek
// için aynı sorguyu kullanır: user_role_assignments'taki kullanıcılar +
// user_profile_attributes'tan full_name. E-posta client'a açık değil → null kalır.

import { supabase } from "@/integrations/supabase/client";

export type AdminUserLabel = {
  user_id: string;
  email: string | null;
  full_name: string | null;
};

export async function fetchAdminUserLabels(): Promise<AdminUserLabel[]> {
  const { data, error } = await supabase.from("user_role_assignments").select("user_id");
  if (error) throw error;

  const userIds = ((data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id);
  if (userIds.length === 0) return [];

  const { data: attrRows, error: attrsError } = await supabase
    .from("user_profile_attributes")
    .select("user_id, value_text, afs_attributes!inner(key)")
    .in("user_id", userIds)
    .eq("afs_attributes.key", "full_name");
  if (attrsError) throw attrsError;

  const nameByUser: Record<string, string | null> = {};
  for (const row of (attrRows ?? []) as Array<{ user_id: string; value_text: string | null }>) {
    nameByUser[row.user_id] = row.value_text ?? null;
  }

  return userIds.map((userId) => ({
    user_id: userId,
    email: null,
    full_name: nameByUser[userId] ?? null,
  }));
}

/** Listeden kullanıcıyı isim → e-posta → id önceliğiyle etiketler. */
export function resolveAdminUserLabel(users: AdminUserLabel[], userId: string | null): string {
  if (!userId) return "-";
  const user = users.find((item) => item.user_id === userId);
  return user?.full_name ?? user?.email ?? userId;
}
