// Admin Panel V2 — User Feature Overrides veri katmanı (masterplan §17/Faz 8).
// Kullanıcılar admin_list_member_catalog_profiles RPC'sinden, feature kataloğu ve
// mevcut override listesi tablolardan. Yazma işlemleri @/lib/admin RPC sarmalayıcıları.

import { supabase } from "@/integrations/supabase/client";
import { listAdminMemberCatalogProfiles } from "@/lib/member-catalog";

export type AdminOverrideUser = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  profile_type: string;
};

export type AdminOverrideFeature = {
  key: string;
  label: string;
  scope_role: string;
};

export type AdminOverrideRow = {
  user_id: string;
  feature_key: string;
  is_enabled: boolean;
  reason: string | null;
  updated_at: string;
};

export type AdminOverridesBundle = {
  users: AdminOverrideUser[];
  features: AdminOverrideFeature[];
  overrides: AdminOverrideRow[];
};

export async function fetchAdminOverridesBundle(): Promise<AdminOverridesBundle> {
  const [profiles, featuresResult, overridesResult] = await Promise.all([
    listAdminMemberCatalogProfiles({
      query: "",
      provider: "all",
      fromDate: "",
      toDate: "",
      sort: "created_desc",
    }),
    supabase.from("afs_features").select("key, label, scope_role").order("key"),
    supabase
      .from("user_feature_overrides")
      .select("user_id, feature_key, is_enabled, reason, updated_at")
      .order("updated_at", { ascending: false }),
  ]);

  if (featuresResult.error) throw featuresResult.error;
  if (overridesResult.error) throw overridesResult.error;

  const users: AdminOverrideUser[] = profiles.map((row) => ({
    user_id: row.userId,
    email: row.email ?? null,
    full_name: row.fullName ?? null,
    profile_type: row.profileType ?? "bireysel",
  }));

  return {
    users,
    features: (featuresResult.data ?? []) as AdminOverrideFeature[],
    overrides: (overridesResult.data ?? []) as AdminOverrideRow[],
  };
}
