import { supabase } from "@/integrations/supabase/client";

export type DirectoryUserProfileRow = {
  user_id: string;
  role_key: string;
  role_label: string;
  role_slug: string;
  display_name: string;
  short_bio: string | null;
  country: string | null;
  city: string | null;
  profile_image_url: string | null;
  special_attribute_key: string | null;
  special_attribute_label: string | null;
  special_attribute_value: string | null;
  is_featured: boolean;
  is_verified: boolean;
};

export type CatalogSearchRow = {
  item_id: string;
  item_type: string;
  slug: string;
  title: string;
  headline: string | null;
  short_description: string | null;
  city: string | null;
  country_code: string | null;
  verification_status: string;
  category_slugs: string[] | null;
  language_codes: string[] | null;
  thumbnail_url: string | null;
  score: number;
  filter_data: Record<string, unknown> | null;
};

type SupabaseError = { message: string };

type SearchCatalogRpcClient = {
  rpc: (
    functionName: "search_catalog",
    args: {
      search_query: string | null;
      item_types: string[] | null;
      category_slugs: string[] | null;
      city_filter: string | null;
      country_filter: string | null;
      language_filters: string[] | null;
      verified_only: boolean;
      limit_count: number;
      offset_count: number;
    },
  ) => Promise<{ data: CatalogSearchRow[] | null; error: SupabaseError | null }>;
};

const catalogRpcClient = supabase as unknown as SearchCatalogRpcClient;

export type DirectoryRoleOption = {
  key: string;
  label: string;
};

export type UnifiedDirectoryRow =
  | {
      recordType: "user_profile";
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
      isClaimable: false;
    }
  | {
      recordType: "catalog_item";
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

const countryCodeToLabel: Record<string, string> = {
  DE: "Almanya",
  GB: "İngiltere",
  US: "ABD",
  FR: "Fransa",
  QA: "Katar",
  AE: "BAE",
};

export const toCountryCode = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  return legacyCountryToCode[trimmed] ?? trimmed;
};

const toCountryLabel = (value: string | null | undefined) => {
  if (!value) return null;
  const code = toCountryCode(value);
  return code ? countryCodeToLabel[code] ?? code : null;
};

const readAttribute = (attributes: Record<string, unknown> | null | undefined, key: string) => {
  const value = attributes?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

export const mapUserProfileToDirectoryRow = (row: DirectoryUserProfileRow): UnifiedDirectoryRow => ({
  recordType: "user_profile",
  id: row.user_id,
  href: `/directory/profile/${row.user_id}`,
  title: row.display_name,
  roleKey: row.role_key,
  roleLabel: row.role_label,
  description: row.short_bio,
  country: row.country,
  city: row.city,
  imageUrl: row.profile_image_url,
  specialLabel: row.special_attribute_label,
  specialValue: row.special_attribute_value,
  isFeatured: row.is_featured,
  isVerified: row.is_verified,
  isClaimable: false,
});

export const mapCatalogSearchToDirectoryRow = (
  row: CatalogSearchRow,
  roleLabelByKey: Map<string, string>,
): UnifiedDirectoryRow => {
  const attributes = row.filter_data && typeof row.filter_data === "object" ? row.filter_data : {};
  const roleKey = readAttribute(attributes, "platform_role_key") ?? row.item_type;
  const roleLabel = readAttribute(attributes, "platform_role_label") ?? roleLabelByKey.get(roleKey) ?? roleKey;
  const specialValue = readAttribute(attributes, "specialty_summary") ?? row.headline;

  return {
    recordType: "catalog_item",
    id: row.item_id,
    href: `/directory/catalog/${row.slug}`,
    title: row.title,
    roleKey,
    roleLabel,
    description: row.short_description,
    country: toCountryLabel(row.country_code),
    city: row.city,
    imageUrl: row.thumbnail_url,
    specialLabel: specialValue ? "Uzmanlık / Kategori" : null,
    specialValue,
    isFeatured: false,
    isVerified: ["verified", "official_source", "claimed"].includes(row.verification_status),
    isClaimable: row.verification_status !== "claimed",
  };
};

export async function listDirectoryRoleOptions(): Promise<DirectoryRoleOption[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("key, label")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as DirectoryRoleOption[];
}

export async function listUnifiedDirectoryRows(filters: {
  searchText: string;
  roleFilter: string;
  countryFilter: string;
  cityFilter: string;
  featuredOnly: boolean;
}): Promise<UnifiedDirectoryRow[]> {
  const [roleOptions, profilesResult] = await Promise.all([
    listDirectoryRoleOptions(),
    supabase.rpc("list_public_directory_profiles", {
      search_text: filters.searchText || null,
      role_filter: filters.roleFilter === "all" ? null : filters.roleFilter,
      country_filter: filters.countryFilter || null,
      city_filter: filters.cityFilter || null,
      featured_only: filters.featuredOnly,
      verified_only: false,
    }),
  ]);

  if (profilesResult.error) throw profilesResult.error;

  const roleLabelByKey = new Map(roleOptions.map((role) => [role.key, role.label]));
  const countryCode = toCountryCode(filters.countryFilter);
  const itemTypes = roleFilterToItemTypes(filters.roleFilter);
  const catalogResult = await catalogRpcClient.rpc("search_catalog", {
    search_query: filters.searchText || null,
    item_types: itemTypes,
    category_slugs: null,
    city_filter: filters.cityFilter || null,
    country_filter: countryCode,
    language_filters: null,
    verified_only: false,
    limit_count: 100,
    offset_count: 0,
  });

  if (catalogResult.error) throw catalogResult.error;

  const profileRows = ((profilesResult.data ?? []) as DirectoryUserProfileRow[]).map(mapUserProfileToDirectoryRow);
  const catalogRows = ((catalogResult.data ?? []) as CatalogSearchRow[])
    .map((row) => mapCatalogSearchToDirectoryRow(row, roleLabelByKey))
    .filter((row) => filters.roleFilter === "all" || row.roleKey === filters.roleFilter)
    .filter((row) => !filters.featuredOnly || row.isFeatured);

  return [...profileRows, ...catalogRows];
}

function roleFilterToItemTypes(roleFilter: string): string[] | null {
  if (!roleFilter || roleFilter === "all") return null;
  if (
    roleFilter.startsWith("Consultant_") ||
    ["Healthcare_Doctor", "Healthcare_Dentist", "Healthcare_Psychologist"].includes(roleFilter)
  ) {
    return ["advisor"];
  }
  if (roleFilter.startsWith("Business_") || roleFilter === "Healthcare_Clinic" || roleFilter === "Healthcare_Pharmacy") {
    return ["business"];
  }
  if (roleFilter.startsWith("Organization_") || roleFilter === "Healthcare_Hospital") {
    return ["organization"];
  }
  if (roleFilter.startsWith("Event_")) return ["event"];
  if (roleFilter.startsWith("Job_")) return ["job_posting"];
  if (roleFilter.startsWith("Community_")) return ["community_group"];
  if (roleFilter.startsWith("Marketplace_")) return ["marketplace_listing"];
  return null;
}
