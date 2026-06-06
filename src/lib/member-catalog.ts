import { supabase } from "@/integrations/supabase/client";
import { defaultProfileType, isProfileType, type ProfileType } from "@/lib/profile-types";

type QueryError = { message: string };

export type MemberCatalogProfileSummary = {
  itemId: string;
  userId: string;
  fullName: string | null;
  profileType: string | null;
  createdAt: string | null;
  email?: string | null;
  authProvider?: string | null;
};

export type EditableCatalogItemSummary = {
  itemId: string;
  slug: string;
  title: string;
  itemType: string;
  roleKey: string | null;
  accessLevel: "owner" | "manager" | "editor";
  isPrimaryOwner: boolean;
  createdAt: string | null;
  legacyProfileType: ProfileType;
};

type MemberCatalogRpcClient = {
  rpc: (
    functionName:
      | "get_current_member_catalog_profile"
      | "list_member_catalog_names"
      | "admin_list_member_catalog_profiles"
      | "admin_set_member_catalog_role"
      | "get_my_editable_catalog_items",
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: QueryError | null }>;
};

const memberCatalogRpcClient = supabase as unknown as MemberCatalogRpcClient;

const normalizeLegacyProfileType = (value: string | null | undefined): ProfileType => {
  if (value && isProfileType(value)) return value;
  return defaultProfileType;
};

export async function getCurrentMemberCatalogProfile(): Promise<MemberCatalogProfileSummary | null> {
  const { data, error } = await memberCatalogRpcClient.rpc("get_current_member_catalog_profile");
  if (error) throw error;

  const payload = (data ?? {}) as Record<string, unknown>;
  const itemId = typeof payload.item_id === "string" ? payload.item_id : null;
  const userId = typeof payload.user_id === "string" ? payload.user_id : null;

  if (!itemId || !userId) return null;

  return {
    itemId,
    userId,
    fullName: typeof payload.full_name === "string" ? payload.full_name : null,
    profileType: typeof payload.profile_type === "string" ? payload.profile_type : null,
    createdAt: typeof payload.created_at === "string" ? payload.created_at : null,
  };
}

export async function listMemberCatalogNames(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await memberCatalogRpcClient.rpc("list_member_catalog_names", {
    p_user_ids: userIds,
  });
  if (error) throw error;

  const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
  return new Map(
    rows.flatMap((row) => {
      const userId = typeof row.user_id === "string" ? row.user_id : null;
      const fullName = typeof row.full_name === "string" ? row.full_name : null;
      return userId && fullName ? [[userId, fullName] as const] : [];
    }),
  );
}

export async function listAdminMemberCatalogProfiles(params: {
  query: string;
  provider: string;
  fromDate: string;
  toDate: string;
  sort: string;
}): Promise<MemberCatalogProfileSummary[]> {
  const { data, error } = await memberCatalogRpcClient.rpc("admin_list_member_catalog_profiles", {
    p_query: params.query.trim() || null,
    p_provider: params.provider || null,
    p_from: params.fromDate ? `${params.fromDate}T00:00:00.000Z` : null,
    p_to: params.toDate ? new Date(new Date(`${params.toDate}T00:00:00.000Z`).getTime() + 86400000).toISOString() : null,
    p_sort: params.sort || "created_desc",
  });
  if (error) throw error;

  const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
  return rows.flatMap((row) => {
    const itemId = typeof row.item_id === "string" ? row.item_id : null;
    const userId = typeof row.user_id === "string" ? row.user_id : null;
    if (!itemId || !userId) return [];

    return [{
      itemId,
      userId,
      email: typeof row.email === "string" ? row.email : null,
      fullName: typeof row.full_name === "string" ? row.full_name : null,
      profileType: typeof row.profile_type === "string" ? row.profile_type : null,
      authProvider: typeof row.auth_provider === "string" ? row.auth_provider : null,
      createdAt: typeof row.created_at === "string" ? row.created_at : null,
    }];
  });
}

export async function setMemberCatalogRoleAsAdmin(itemId: string, roleKey: string): Promise<void> {
  const { error } = await memberCatalogRpcClient.rpc("admin_set_member_catalog_role", {
    p_item_id: itemId,
    p_role_key: roleKey,
  });
  if (error) throw error;
}

export async function getMyEditableCatalogItems(): Promise<EditableCatalogItemSummary[]> {
  const { data, error } = await memberCatalogRpcClient.rpc("get_my_editable_catalog_items");
  if (error) throw error;

  const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];

  return rows.flatMap((row) => {
    const itemId = typeof row.item_id === "string" ? row.item_id : null;
    const slug = typeof row.slug === "string" ? row.slug : null;
    const title = typeof row.title === "string" ? row.title : null;
    const itemType = typeof row.item_type === "string" ? row.item_type : null;
    const accessLevel = typeof row.access_level === "string" ? row.access_level : null;

    if (!itemId || !slug || !title || !itemType || !accessLevel) {
      return [];
    }

    const roleKey = typeof row.platform_role_key === "string" ? row.platform_role_key : null;

    return [{
      itemId,
      slug,
      title,
      itemType,
      roleKey,
      accessLevel: accessLevel as EditableCatalogItemSummary["accessLevel"],
      isPrimaryOwner: Boolean(row.is_primary_owner),
      createdAt: typeof row.created_at === "string" ? row.created_at : null,
      legacyProfileType: normalizeLegacyProfileType(roleKey),
    }];
  });
}
