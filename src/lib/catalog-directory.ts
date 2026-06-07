import { supabase } from "@/integrations/supabase/client";

type SupabaseError = { message: string };

type DirectorySearchRpcRow = {
  item_id: string;
  item_type: string;
  slug: string;
  title: string;
  role_key: string;
  role_label: string;
  description: string | null;
  city: string | null;
  country: string | null;
  image_url: string | null;
  special_label: string | null;
  special_value: string | null;
  is_featured: boolean;
  is_verified: boolean;
  is_claimable: boolean;
};

type DirectoryRpcClient = {
  rpc: (
    functionName: "search_directory_catalog",
    args: {
      p_search_text: string | null;
      p_role_key: string | null;
      p_country_code: string | null;
      p_city: string | null;
      p_featured_only: boolean;
    },
  ) => Promise<{ data: DirectorySearchRpcRow[] | null; error: SupabaseError | null }>;
};

const directoryRpcClient = supabase as unknown as DirectoryRpcClient;

type RolesQueryClient = {
  from: (
    tableName: "roles",
  ) => {
    select: (
      columns: string,
    ) => {
      eq: (
        column: string,
        value: unknown,
      ) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => Promise<{
          data: Array<{ key: string; label: string; is_directory_visible?: boolean | null }> | null;
          error: SupabaseError | null;
        }>;
      };
    };
  };
};

const rolesQueryClient = supabase as unknown as RolesQueryClient;

export type DirectoryRoleOption = {
  key: string;
  label: string;
};

export type UnifiedDirectoryRow = {
  recordType: "catalog_item" | "member";
  id: string;
  href: string;
  title: string;
  roleKey: string;
  roleLabel: string;
  description: string | null;
  country: string | null;
  city: string | null;
  imageUrl: string | null;
  specialLabel: string | null;
  specialValue: string | null;
  isFeatured: boolean;
  isVerified: boolean;
  isClaimable: boolean;
  itemType: string;
};

const legacyCountryToCode: Record<string, string> = {
  Almanya: "DE",
  Germany: "DE",
  İngiltere: "GB",
  Ingiltere: "GB",
  "Birleşik Krallık": "GB",
  ABD: "US",
  Amerika: "US",
  Fransa: "FR",
  Katar: "QA",
  BAE: "AE",
};

export const toCountryCode = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  return legacyCountryToCode[trimmed] ?? trimmed.toUpperCase();
};

const mapDirectorySearchRow = (row: DirectorySearchRpcRow): UnifiedDirectoryRow => {
  const isMember = row.item_type === "member";
  return {
    recordType: isMember ? "member" : "catalog_item",
    id: row.item_id,
    href: isMember ? `/directory/profile/${row.slug}` : `/directory/catalog/${row.slug}`,
    title: row.title,
    roleKey: row.role_key,
    roleLabel: row.role_label,
    description: row.description,
    country: row.country,
    city: row.city,
    imageUrl: row.image_url,
    specialLabel: row.special_label,
    specialValue: row.special_value,
    isFeatured: row.is_featured,
    isVerified: row.is_verified,
    isClaimable: row.is_claimable,
    itemType: row.item_type,
  };
};

export async function listDirectoryRoleOptions(): Promise<DirectoryRoleOption[]> {
  const { data, error } = await rolesQueryClient
    .from("roles")
    .select("key, label, is_directory_visible")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as Array<{ key: string; label: string; is_directory_visible?: boolean | null }>)
    .filter((role) => role.is_directory_visible !== false)
    .map((role) => ({
      key: role.key,
      label: role.label,
    }));
}

export async function listUnifiedDirectoryRows(filters: {
  searchText: string;
  roleFilter: string;
  countryFilter: string;
  cityFilter: string;
  featuredOnly: boolean;
}): Promise<UnifiedDirectoryRow[]> {
  const { data, error } = await directoryRpcClient.rpc("search_directory_catalog", {
    p_search_text: filters.searchText.trim() || null,
    p_role_key: filters.roleFilter === "all" ? null : filters.roleFilter,
    p_country_code: toCountryCode(filters.countryFilter),
    p_city: filters.cityFilter.trim() || null,
    p_featured_only: filters.featuredOnly,
  });

  if (error) throw error;

  return ((data ?? []) as DirectorySearchRpcRow[]).map(mapDirectorySearchRow);
}

type CountQueryClient = {
  from: (
    tableName: "catalog_items",
  ) => {
    select: (
      columns: string,
      options: { count: "exact"; head: boolean },
    ) => Promise<{ count: number | null; error: SupabaseError | null }>;
  };
};

const countQueryClient = supabase as unknown as CountQueryClient;

export async function getTotalDirectoryCount(): Promise<number> {
  const { count, error } = await countQueryClient
    .from("catalog_items")
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}
