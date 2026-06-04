import { supabase } from "@/integrations/supabase/client";

export type AdminCatalogFilters = {
  query: string;
  itemType: string;
  status: string;
  verificationStatus: string;
  city: string;
  countryCode: string;
};

export type AdminCatalogItemType = {
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
  created_at: string;
  updated_at: string;
  published_at?: unknown;
  catalog_item_categories?: RawCatalogItemCategory[] | null;
  catalog_item_locations?: RawCatalogLocation[] | null;
  catalog_item_media?: RawCatalogMedia[] | null;
  source_records?: RawCatalogSource[] | null;
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
    attributes: normalizeRecord(row.attributes),
    createdByUserId: normalizeString(row.created_by_user_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: normalizeString(row.published_at),
    primaryCity: primaryLocation?.city ?? null,
    primaryCountryCode: primaryLocation?.countryCode ?? null,
    categoryLabels: categories.map((category) => category.name),
    sourceTypes: Array.from(new Set(sources.map((source) => source.sourceType))),
    thumbnailUrl: getThumbnailUrl(row.catalog_item_media),
    categories,
    locations,
    sources,
  };
};

const normalizeFilterText = (value: string) => value.trim().toLocaleLowerCase("tr-TR");

export function filterAdminCatalogItems(
  items: AdminCatalogDetail[],
  filters: AdminCatalogFilters,
): AdminCatalogDetail[] {
  const normalizedQuery = normalizeFilterText(filters.query);
  const normalizedCity = normalizeFilterText(filters.city);
  const normalizedCountryCode = normalizeFilterText(filters.countryCode);

  return items.filter((item) => {
    if (filters.itemType && item.itemType !== filters.itemType) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.verificationStatus && item.verificationStatus !== filters.verificationStatus) return false;

    if (
      normalizedCity &&
      !item.locations.some((location) => normalizeFilterText(location.city ?? "") === normalizedCity)
    ) {
      return false;
    }

    if (
      normalizedCountryCode &&
      !item.locations.some(
        (location) => normalizeFilterText(location.countryCode ?? "") === normalizedCountryCode,
      )
    ) {
      return false;
    }

    if (!normalizedQuery) return true;

    const searchHaystack = [
      item.title,
      item.slug,
      item.headline ?? "",
      item.shortDescription ?? "",
      item.longDescription ?? "",
      item.primaryCity ?? "",
      item.primaryCountryCode ?? "",
      ...item.categoryLabels,
      ...item.sourceTypes,
    ]
      .join(" ")
      .toLocaleLowerCase("tr-TR");

    return searchHaystack.includes(normalizedQuery);
  });
}

export async function listAdminCatalogItemTypes(): Promise<AdminCatalogItemType[]> {
  const { data, error } = await (supabase
    .from("catalog_item_types")
    .select("key, label")
    .eq("is_active", true)
    .order("label", { ascending: true }) as unknown as Promise<{
      data: Array<{ key: string; label: string }> | null;
      error: QueryError | null;
    }>);

  if (error) throw error;

  return (data ?? []).map((row: { key: string; label: string }) => ({
    key: row.key,
    label: row.label,
  }));
}

export async function listAdminCatalogItems(limit = 1000): Promise<AdminCatalogDetail[]> {
  const { data, error } = await (supabase
    .from("catalog_items")
    .select(ADMIN_CATALOG_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit) as unknown as Promise<{
      data: RawCatalogRow[] | null;
      error: QueryError | null;
    }>);

  if (error) throw error;

  return (data ?? []).map(mapCatalogRow);
}
