import { supabase } from "@/integrations/supabase/client";
import { normalizeTurkishText } from "@/lib/text-normalization";

export type EntityKind = "attribute" | "feature" | "profile_section";

export type CatalogRow = {
  kind: EntityKind;
  key: string;
  label: string;
  description: string | null;
  adminNote: string | null;
  sectionArea?: string;
  dataType?: string;
  isActiveGlobally?: boolean;
  sortOrder: number;
};

export type CatalogFilterState = {
  search: string;
  kind: EntityKind | "all";
};

type MetaRow = {
  entity_type: string;
  entity_key: string;
  description: string | null;
  admin_note: string | null;
};

export async function fetchCatalogRows(): Promise<CatalogRow[]> {
  const [attrResult, featResult, sectResult, metaResult] = await Promise.all([
    supabase
      .from("attribute_catalog")
      .select("key, label, description, data_type, sort_order")
      .eq("is_active", true)
      .order("sort_order"),

    supabase
      .from("feature_catalog")
      .select("key, label, description, is_active_globally")
      .order("key"),

    (supabase as any)
      .from("profile_section_catalog")
      .select("key, label, description, section_area, sort_order")
      .eq("is_active", true)
      .order("sort_order"),

    (supabase as any)
      .from("entity_metadata")
      .select("entity_type, entity_key, description, admin_note"),
  ]);

  if (attrResult.error) throw attrResult.error;
  if (featResult.error) throw featResult.error;
  if (sectResult.error) throw sectResult.error;
  if (metaResult.error) throw metaResult.error;

  const metaMap = new Map<string, MetaRow>();
  for (const m of (metaResult.data ?? []) as MetaRow[]) {
    metaMap.set(`${m.entity_type}:${m.entity_key}`, m);
  }

  const getMeta = (kind: EntityKind, key: string) =>
    metaMap.get(`${kind}:${key}`) ?? null;

  const attrs: CatalogRow[] = ((attrResult.data ?? []) as any[]).map((a) => {
    const meta = getMeta("attribute", a.key);
    return {
      kind: "attribute",
      key: a.key,
      label: a.label,
      description: meta?.description ?? a.description ?? null,
      adminNote: meta?.admin_note ?? null,
      dataType: a.data_type,
      sortOrder: a.sort_order ?? 0,
    };
  });

  const feats: CatalogRow[] = ((featResult.data ?? []) as any[]).map((f) => {
    const meta = getMeta("feature", f.key);
    return {
      kind: "feature",
      key: f.key,
      label: f.label,
      description: meta?.description ?? f.description ?? null,
      adminNote: meta?.admin_note ?? null,
      isActiveGlobally: f.is_active_globally ?? false,
      sortOrder: 0,
    };
  });

  const sects: CatalogRow[] = ((sectResult.data ?? []) as any[]).map((s) => {
    const meta = getMeta("profile_section", s.key);
    return {
      kind: "profile_section",
      key: s.key,
      label: s.label,
      description: meta?.description ?? s.description ?? null,
      adminNote: meta?.admin_note ?? null,
      sectionArea: s.section_area,
      sortOrder: s.sort_order ?? 0,
    };
  });

  return [...attrs, ...feats, ...sects];
}

const turkishLower = (s: string) =>
  s.replace(/İ/g, "i").replace(/I/g, "i").toLowerCase();

export function filterCatalogRows(
  rows: CatalogRow[],
  { search, kind }: CatalogFilterState,
): CatalogRow[] {
  const needle = turkishLower(normalizeTurkishText(search.trim()));

  return rows.filter((row) => {
    if (kind !== "all" && row.kind !== kind) return false;

    if (!needle) return true;

    const haystack = turkishLower(
      normalizeTurkishText(
        [row.label, row.key, row.description ?? "", row.adminNote ?? ""].join(" "),
      ),
    );

    return haystack.includes(needle);
  });
}

export const ENTITY_KIND_LABELS: Record<EntityKind | "all", string> = {
  all: "Tümü",
  attribute: "Attribute",
  feature: "Feature",
  profile_section: "Bölüm",
};
