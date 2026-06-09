import { supabase } from "@/integrations/supabase/client";
import { getProfilesBasicBatch } from "@/lib/profile-helpers";
import type {
  AdminProfileSearchResult,
  AttributeOverrideConfig,
  CatalogClaim,
  CatalogItemEditor,
  CatalogItemRules,
  UnifiedRecord,
  UnifiedRecordPage,
} from "@/lib/catalog-types";

export type AdminCatalogFilters = {
  kind: "" | "catalog_item" | "profile";
  query: string;
  itemType: string;
  platformRoleKey: string;
  status: string;
  verificationStatus: string;
  city: string;
  countryCode: string;
};

export type AdminCatalogItemType = {
  key: string;
  label: string;
};

export type AdminCatalogRoleOption = {
  key: string;
  label: string;
};

export type AdminCatalogCategory = {
  slug: string;
  name: string;
  isPrimary: boolean;
};

export type AdminCatalogLocation = {
  city: string | null;
  countryCode: string | null;
  addressLine: string | null;
  isPrimary: boolean;
};

export type AdminCatalogSource = {
  sourceType: string;
  externalId: string;
  sourceUrl: string | null;
  importedAt: string | null;
  lastSeenAt: string | null;
};

export type AdminCatalogListItem = {
  id: string;
  itemType: string;
  slug: string;
  title: string;
  headline: string | null;
  shortDescription: string | null;
  status: string;
  visibility: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  primaryCity: string | null;
  primaryCountryCode: string | null;
  categoryLabels: string[];
  sourceTypes: string[];
  thumbnailUrl: string | null;
  platformRoleKey: string | null;
};

export type AdminCatalogDetail = AdminCatalogListItem & {
  longDescription: string | null;
  attributes: Record<string, unknown>;
  createdByUserId: string | null;
  categories: AdminCatalogCategory[];
  locations: AdminCatalogLocation[];
  sources: AdminCatalogSource[];
};

type QueryError = {
  message: string;
};

type RawCatalogCategory = {
  slug?: unknown;
  name?: unknown;
};

type RawCatalogItemCategory = {
  is_primary?: unknown;
  catalog_categories?: RawCatalogCategory | RawCatalogCategory[] | null;
};

type RawCatalogLocation = {
  city?: unknown;
  country_code?: unknown;
  address_line?: unknown;
  is_primary?: unknown;
};

type RawCatalogMedia = {
  media_type?: unknown;
  thumbnail_url?: unknown;
  url?: unknown;
  is_primary?: unknown;
};

type RawCatalogSource = {
  source_type?: unknown;
  external_id?: unknown;
  source_url?: unknown;
  imported_at?: unknown;
  last_seen_at?: unknown;
};

type RawCatalogRow = {
  id: string;
  item_type: string;
  slug: string;
  title: string;
  headline?: unknown;
  short_description?: unknown;
  long_description?: unknown;
  status: string;
  visibility: string;
  verification_status: string;
  attributes?: unknown;
  created_by_user_id?: unknown;
  platform_role_key?: unknown;
  created_at: string;
  updated_at: string;
  published_at?: unknown;
  catalog_item_categories?: RawCatalogItemCategory[] | null;
  catalog_item_locations?: RawCatalogLocation[] | null;
  catalog_item_media?: RawCatalogMedia[] | null;
  source_records?: RawCatalogSource[] | null;
};

type RawCatalogEditorRow = {
  user_id: string;
  role: CatalogItemEditor["membershipRole"];
  status: CatalogItemEditor["status"];
  created_at: string;
  profiles?: { full_name?: string | null; email?: string | null } | { full_name?: string | null; email?: string | null }[] | null;
};

type RawUnifiedRecordRow = {
  id: string;
  kind: UnifiedRecord["kind"];
  slug?: string | null;
  item_type?: string | null;
  title: string;
  summary?: string | null;
  status: string;
  visibility?: string | null;
  verification_status?: string | null;
  platform_role_key?: string | null;
  primary_city?: string | null;
  primary_country_code?: string | null;
  category_labels?: string[] | null;
  source_types?: string[] | null;
  created_at: string;
  updated_at: string;
  profile_type?: string | null;
  email?: string | null;
  total_count?: number | string | null;
};

type RawCatalogClaimRow = {
  id: string;
  item_id: string;
  item_title: string;
  requested_by_user_id: string;
  requester_full_name: string;
  requester_email?: string | null;
  claim_type: string;
  note?: string | null;
  status: CatalogClaim["status"];
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by_user_id?: string | null;
  reviewer_full_name?: string | null;
};

type RawProfileSearchRow = {
  id: string;
  full_name: string;
  email?: string | null;
};

const ADMIN_CATALOG_SELECT = [
  "id",
  "item_type",
  "slug",
  "title",
  "headline",
  "short_description",
  "long_description",
  "status",
  "visibility",
  "verification_status",
  "attributes",
  "created_by_user_id",
  "platform_role_key",
  "created_at",
  "updated_at",
  "published_at",
  "catalog_item_categories(is_primary,catalog_categories(slug,name))",
  "catalog_item_locations(city,country_code,address_line,is_primary)",
  "catalog_item_media(media_type,thumbnail_url,url,is_primary)",
  "source_records(source_type,external_id,source_url,imported_at,last_seen_at)",
].join(",");

const normalizeString = (value: unknown) => (typeof value === "string" ? value : null);

const normalizeRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const normalizeArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
};

const mapCategories = (rows: RawCatalogItemCategory[] | null | undefined): AdminCatalogCategory[] =>
  normalizeArray(rows)
    .flatMap((row) =>
      normalizeArray(row.catalog_categories).map((category) => ({
        slug: normalizeString(category.slug) ?? "",
        name: normalizeString(category.name) ?? "",
        isPrimary: Boolean(row.is_primary),
      })),
    )
    .filter((category) => category.slug && category.name);

const mapLocations = (rows: RawCatalogLocation[] | null | undefined): AdminCatalogLocation[] =>
  normalizeArray(rows).map((row) => ({
    city: normalizeString(row.city),
    countryCode: normalizeString(row.country_code),
    addressLine: normalizeString(row.address_line),
    isPrimary: Boolean(row.is_primary),
  }));

const mapSources = (rows: RawCatalogSource[] | null | undefined): AdminCatalogSource[] =>
  normalizeArray(rows)
    .map((row) => ({
      sourceType: normalizeString(row.source_type) ?? "",
      externalId: normalizeString(row.external_id) ?? "",
      sourceUrl: normalizeString(row.source_url),
      importedAt: normalizeString(row.imported_at),
      lastSeenAt: normalizeString(row.last_seen_at),
    }))
    .filter((row) => row.sourceType && row.externalId);

const getThumbnailUrl = (rows: RawCatalogMedia[] | null | undefined) => {
  const mediaRows = normalizeArray(rows);
  const primaryMedia = mediaRows.find((row) => Boolean(row.is_primary));
  const preferredMedia = primaryMedia ?? mediaRows[0];

  return normalizeString(preferredMedia?.thumbnail_url) ?? normalizeString(preferredMedia?.url);
};

const mapCatalogRow = (row: RawCatalogRow): AdminCatalogDetail => {
  const categories = mapCategories(row.catalog_item_categories);
  const locations = mapLocations(row.catalog_item_locations);
  const sources = mapSources(row.source_records);
  const attributes = normalizeRecord(row.attributes);
  const primaryLocation = locations.find((location) => location.isPrimary) ?? locations[0] ?? null;

  return {
    id: row.id,
    itemType: row.item_type,
    slug: row.slug,
    title: row.title,
    headline: normalizeString(row.headline),
    shortDescription: normalizeString(row.short_description),
    longDescription: normalizeString(row.long_description),
    status: row.status,
    visibility: row.visibility,
    verificationStatus: row.verification_status,
    attributes,
    createdByUserId: normalizeString(row.created_by_user_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: normalizeString(row.published_at),
    primaryCity: primaryLocation?.city ?? null,
    primaryCountryCode: primaryLocation?.countryCode ?? null,
    categoryLabels: categories.map((category) => category.name),
    sourceTypes: Array.from(new Set(sources.map((source) => source.sourceType))),
    thumbnailUrl: getThumbnailUrl(row.catalog_item_media),
    platformRoleKey: normalizeString(row.platform_role_key) ?? normalizeString(attributes.platform_role_key),
    categories,
    locations,
    sources,
  };
};

const mapUnifiedRecord = (row: RawUnifiedRecordRow): UnifiedRecord => ({
  id: row.id,
  kind: row.kind,
  slug: normalizeString(row.slug) ?? null,
  itemType: normalizeString(row.item_type) ?? null,
  title: row.title,
  summary: normalizeString(row.summary) ?? null,
  status: row.status,
  visibility: normalizeString(row.visibility) ?? null,
  verificationStatus: normalizeString(row.verification_status) ?? null,
  platformRoleKey: normalizeString(row.platform_role_key) ?? null,
  primaryCity: normalizeString(row.primary_city) ?? null,
  primaryCountryCode: normalizeString(row.primary_country_code) ?? null,
  categoryLabels: Array.isArray(row.category_labels) ? row.category_labels.filter(Boolean) : [],
  sourceTypes: Array.isArray(row.source_types) ? row.source_types.filter(Boolean) : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  profileType: normalizeString(row.profile_type) ?? null,
  email: normalizeString(row.email) ?? null,
});

type CatalogRpcClient = {
  rpc: (
    functionName:
      | "admin_set_catalog_item_role"
      | "get_catalog_item_rules"
      | "admin_upsert_catalog_item_attribute_override"
      | "admin_delete_catalog_item_attribute_override"
      | "admin_upsert_catalog_item_feature_override"
      | "admin_delete_catalog_item_feature_override"
      | "admin_upsert_catalog_item_section_override"
      | "admin_delete_catalog_item_section_override"
      | "admin_grant_catalog_editor"
      | "admin_revoke_catalog_editor"
      | "admin_approve_catalog_claim"
      | "admin_reject_catalog_claim"
      | "admin_list_catalog_claims"
      | "admin_search_profiles"
      | "admin_list_unified_records",
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: QueryError | null }>;
};

const catalogRpcClient = supabase as unknown as CatalogRpcClient;

const ITEM_TYPE_LABEL = (value: string): string =>
  value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");

// The `catalog_item_types` lookup table was dropped in migration 016
// (rebuild_016_drop_legacy_schema); `catalog_items.item_type` is now free text.
// Item type options are derived from the distinct values actually in use.
export async function listAdminCatalogItemTypes(): Promise<AdminCatalogItemType[]> {
  const { data, error } = await (supabase
    .from("catalog_items")
    .select("item_type")
    .not("item_type", "is", null) as unknown as Promise<{
      data: Array<{ item_type: string | null }> | null;
      error: QueryError | null;
    }>);

  if (error) throw error;

  const keys = Array.from(
    new Set((data ?? []).map((row) => row.item_type).filter((value): value is string => Boolean(value))),
  ).sort((left, right) => left.localeCompare(right, "tr"));

  return keys.map((key) => ({
    key,
    label: ITEM_TYPE_LABEL(key),
  }));
}

export async function listAdminCatalogRoles(): Promise<AdminCatalogRoleOption[]> {
  const { data, error } = await (supabase
    .from("roles")
    .select("key, label")
    .eq("is_active", true)
    .order("sort_order", { ascending: true }) as unknown as Promise<{
      data: Array<{ key: string; label: string }> | null;
      error: QueryError | null;
    }>);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    key: row.key,
    label: row.label,
  }));
}

export async function getAdminCatalogItemDetail(itemId: string): Promise<AdminCatalogDetail> {
  const { data, error } = await (supabase
    .from("catalog_items")
    .select(ADMIN_CATALOG_SELECT)
    .eq("id", itemId)
    .single() as unknown as Promise<{
      data: RawCatalogRow | null;
      error: QueryError | null;
    }>);

  if (error) throw error;
  if (!data) {
    throw new Error("Katalog kaydı bulunamadı.");
  }

  return mapCatalogRow(data);
}

export async function listAdminUnifiedRecords({
  page,
  pageSize,
  filters,
}: {
  page: number;
  pageSize: number;
  filters: AdminCatalogFilters;
}): Promise<UnifiedRecordPage> {
  const { data, error } = await catalogRpcClient.rpc("admin_list_unified_records", {
    p_page: page,
    p_page_size: pageSize,
    p_kind: filters.kind || null,
    p_query: filters.query.trim() || null,
    p_item_type: filters.itemType || null,
    p_platform_role_key: filters.platformRoleKey || null,
    p_status: filters.status || null,
    p_verification_status: filters.verificationStatus || null,
    p_city: filters.city.trim() || null,
    p_country_code: filters.countryCode.trim() || null,
  });

  if (error) throw error;

  const rows = (data as RawUnifiedRecordRow[] | null) ?? [];
  const records = rows.map(mapUnifiedRecord);
  const totalCount = Number(rows[0]?.total_count ?? 0);

  return {
    records,
    totalCount,
    page,
    pageSize,
  };
}

export async function setCatalogItemRole(itemId: string, roleKey: string | null): Promise<void> {
  const { error } = await catalogRpcClient.rpc("admin_set_catalog_item_role", {
    p_item_id: itemId,
    p_role_key: roleKey,
  });

  if (error) throw error;
}

export async function getCatalogItemRules(itemId: string): Promise<CatalogItemRules> {
  const { data, error } = await catalogRpcClient.rpc("get_catalog_item_rules", {
    p_item_id: itemId,
  });

  if (error) throw error;
  const rules = data as Partial<CatalogItemRules> | null;

  return {
    platformRoleKey: rules?.platformRoleKey ?? null,
    attributes: rules?.attributes ?? [],
    features: rules?.features ?? [],
    sections: rules?.sections ?? [],
    overrides: rules?.overrides ?? { attributes: [], features: [], sections: [] },
  };
}

export async function setCatalogItemAttributeOverride(
  itemId: string,
  attributeKey: string,
  config: AttributeOverrideConfig,
): Promise<void> {
  const { error } = await catalogRpcClient.rpc("admin_upsert_catalog_item_attribute_override", {
    p_item_id: itemId,
    p_attribute_key: attributeKey,
    p_is_enabled: config.isEnabled ?? true,
    p_display_order: config.displayOrder ?? null,
    p_override_label: config.overrideLabel ?? null,
  });

  if (error) throw error;
}

export async function removeCatalogItemAttributeOverride(itemId: string, attributeKey: string): Promise<void> {
  const { error } = await catalogRpcClient.rpc("admin_delete_catalog_item_attribute_override", {
    p_item_id: itemId,
    p_attribute_key: attributeKey,
  });

  if (error) throw error;
}

export async function setCatalogItemFeatureOverride(
  itemId: string,
  featureKey: string,
  isEnabled: boolean,
): Promise<void> {
  const { error } = await catalogRpcClient.rpc("admin_upsert_catalog_item_feature_override", {
    p_item_id: itemId,
    p_feature_key: featureKey,
    p_is_enabled: isEnabled,
  });

  if (error) throw error;
}

export async function removeCatalogItemFeatureOverride(itemId: string, featureKey: string): Promise<void> {
  const { error } = await catalogRpcClient.rpc("admin_delete_catalog_item_feature_override", {
    p_item_id: itemId,
    p_feature_key: featureKey,
  });

  if (error) throw error;
}

export async function setCatalogItemSectionOverride(
  itemId: string,
  sectionKey: string,
  {
    isVisible,
    displayOrder,
  }: {
    isVisible: boolean;
    displayOrder?: number | null;
  },
): Promise<void> {
  const { error } = await catalogRpcClient.rpc("admin_upsert_catalog_item_section_override", {
    p_item_id: itemId,
    p_section_key: sectionKey,
    p_is_visible: isVisible,
    p_display_order: displayOrder ?? null,
  });

  if (error) throw error;
}

export async function removeCatalogItemSectionOverride(itemId: string, sectionKey: string): Promise<void> {
  const { error } = await catalogRpcClient.rpc("admin_delete_catalog_item_section_override", {
    p_item_id: itemId,
    p_section_key: sectionKey,
  });

  if (error) throw error;
}

export async function grantCatalogItemEditor(itemId: string, targetUserId: string): Promise<void> {
  const { error } = await catalogRpcClient.rpc("admin_grant_catalog_editor", {
    p_item_id: itemId,
    p_target_user_id: targetUserId,
  });

  if (error) throw error;
}

export async function revokeCatalogItemEditor(itemId: string, targetUserId: string): Promise<void> {
  const { error } = await catalogRpcClient.rpc("admin_revoke_catalog_editor", {
    p_item_id: itemId,
    p_target_user_id: targetUserId,
  });

  if (error) throw error;
}

export async function approveCatalogClaim(claimId: string): Promise<void> {
  const { error } = await catalogRpcClient.rpc("admin_approve_catalog_claim", {
    p_claim_id: claimId,
  });

  if (error) throw error;
}

export async function rejectCatalogClaim(claimId: string, reviewNote?: string | null): Promise<void> {
  const { error } = await catalogRpcClient.rpc("admin_reject_catalog_claim", {
    p_claim_id: claimId,
    p_review_note: reviewNote ?? null,
  });

  if (error) throw error;
}

export async function listCatalogClaims(itemId: string, status?: CatalogClaim["status"] | ""): Promise<CatalogClaim[]> {
  const { data, error } = await catalogRpcClient.rpc("admin_list_catalog_claims", {
    p_item_id: itemId,
    p_status: status || null,
  });

  if (error) throw error;

  return ((data as RawCatalogClaimRow[] | null) ?? []).map((row) => ({
    id: row.id,
    itemId: row.item_id,
    itemTitle: row.item_title,
    requestedByUserId: row.requested_by_user_id,
    requesterFullName: row.requester_full_name,
    requesterEmail: normalizeString(row.requester_email) ?? null,
    claimType: row.claim_type,
    note: normalizeString(row.note) ?? null,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: normalizeString(row.reviewed_at) ?? null,
    reviewedByUserId: normalizeString(row.reviewed_by_user_id) ?? null,
    reviewerFullName: normalizeString(row.reviewer_full_name) ?? null,
  }));
}

export async function searchAdminProfiles(query: string, limit = 10): Promise<AdminProfileSearchResult[]> {
  if (!query.trim()) return [];

  const { data, error } = await catalogRpcClient.rpc("admin_search_profiles", {
    p_query: query.trim(),
    p_limit: limit,
  });

  if (error) throw error;

  return ((data as RawProfileSearchRow[] | null) ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: normalizeString(row.email) ?? null,
  }));
}

// The legacy `profiles` table was dropped (migration 003); `catalog_item_managers`
// no longer has a profiles relationship to embed. Names are resolved from
// `user_profile_attributes` (full_name) via getProfilesBasicBatch. Email is no
// longer reachable from this surface (it lives in auth), so it is left blank.
export async function listCatalogItemEditors(itemId: string): Promise<CatalogItemEditor[]> {
  const { data, error } = await (supabase
    .from("catalog_item_managers")
    .select("user_id, role, status, created_at")
    .eq("item_id", itemId)
    .in("role", ["owner", "manager", "editor"])
    .order("created_at", { ascending: false }) as unknown as Promise<{
      data: Array<Pick<RawCatalogEditorRow, "user_id" | "role" | "status" | "created_at">> | null;
      error: QueryError | null;
    }>);

  if (error) throw error;

  const rows = data ?? [];
  const nameByUserId = new Map<string, string | null>();

  if (rows.length > 0) {
    const profiles = await getProfilesBasicBatch(rows.map((row) => row.user_id));
    for (const profile of profiles) {
      nameByUserId.set(profile.user_id, profile.full_name);
    }
  }

  return rows.map((row) => ({
    userId: row.user_id,
    fullName: nameByUserId.get(row.user_id) ?? "İsimsiz kullanıcı",
    email: "",
    membershipRole: row.role,
    status: row.status,
    grantedAt: row.created_at,
  }));
}
