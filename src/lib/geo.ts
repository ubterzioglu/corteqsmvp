import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { geoCountryNames, geoCountrySeeds } from "@/data/geoCountries.generated";
import { countryCities } from "@/data/countryCities";

export interface GeoCountry {
  code: string;
  name: string;
}

export interface GeoCity {
  countryCode: string;
  countryName: string;
  name: string;
}

type GeoCountryRow = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
};

type GeoCityRow = {
  name: string;
  country_id: string;
  sort_order: number;
};

const db = supabase as any;

// PostgREST tek istekte en fazla 1000 satır döndürür; büyük ülkeler (DE ~7k, US ~13k şehir)
// için tüm sayfalar range() ile dolaşılmalı.
const GEO_PAGE_SIZE = 1000;

async function fetchAllCityRows(countryIds: string[]): Promise<GeoCityRow[]> {
  const rows: GeoCityRow[] = [];
  for (let offset = 0; ; offset += GEO_PAGE_SIZE) {
    const { data, error } = await db
      .from("geo_cities")
      .select("name, country_id, sort_order")
      .eq("is_active", true)
      .in("country_id", countryIds)
      .order("country_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .range(offset, offset + GEO_PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as GeoCityRow[];
    rows.push(...page);
    if (page.length < GEO_PAGE_SIZE) break;
  }
  return rows;
}

const fallbackCountryByName = new Map(geoCountrySeeds.map((country) => [country.name, country]));
const fallbackCountryByCode = new Map(geoCountrySeeds.map((country) => [country.code, country]));

function getFallbackCountryCode(countryNameOrCode: string) {
  return fallbackCountryByName.get(countryNameOrCode)?.code
    ?? fallbackCountryByCode.get(countryNameOrCode)?.code
    ?? null;
}

function dedupeAndSortCities(cities: string[]) {
  return Array.from(new Set(cities.filter(Boolean))).sort((a, b) => a.localeCompare(b, "tr"));
}

async function resolveCountryRows(countryNamesOrCodes: string[]) {
  const normalized = Array.from(new Set(countryNamesOrCodes.map((value) => value.trim()).filter(Boolean)));
  if (normalized.length === 0) return [] as GeoCountryRow[];

  const [byNameResult, byCodeResult] = await Promise.all([
    db
      .from("geo_countries")
      .select("id, code, name, sort_order")
      .eq("is_active", true)
      .in("name", normalized),
    db
      .from("geo_countries")
      .select("id, code, name, sort_order")
      .eq("is_active", true)
      .in("code", normalized),
  ]);

  if (byNameResult.error) throw byNameResult.error;
  if (byCodeResult.error) throw byCodeResult.error;

  const merged = new Map<string, GeoCountryRow>();
  for (const row of ([...(byNameResult.data ?? []), ...(byCodeResult.data ?? [])] as GeoCountryRow[])) {
    merged.set(row.id, row);
  }

  return Array.from(merged.values()).sort((left, right) =>
    left.sort_order === right.sort_order
      ? left.name.localeCompare(right.name, "tr")
      : left.sort_order - right.sort_order,
  );
}

export async function listGeoCountries(): Promise<GeoCountry[]> {
  if (!isSupabaseConfigured) {
    return geoCountrySeeds;
  }

  try {
    const { data, error } = await db
      .from("geo_countries")
      .select("code, name, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;

    return ((data ?? []) as Array<Pick<GeoCountryRow, "code" | "name">>).map((row) => ({
      code: row.code,
      name: row.name,
    }));
  } catch {
    return geoCountrySeeds;
  }
}

export async function listGeoCities(countryNameOrCode: string): Promise<GeoCity[]> {
  const normalized = countryNameOrCode.trim();
  if (!normalized) return [];

  if (!isSupabaseConfigured) {
    const fallbackCode = getFallbackCountryCode(normalized);
    const fallbackCountry = fallbackCode ? fallbackCountryByCode.get(fallbackCode) : null;
    const fallbackCities = fallbackCountry ? dedupeAndSortCities(countryCities[fallbackCountry.name] ?? []) : [];
    return fallbackCities.map((name) => ({
      countryCode: fallbackCountry?.code ?? normalized,
      countryName: fallbackCountry?.name ?? normalized,
      name,
    }));
  }

  try {
    const countries = await resolveCountryRows([normalized]);
    if (countries.length === 0) return [];

    const country = countries[0];
    const rows = await fetchAllCityRows([country.id]);

    return rows.map((row) => ({
      countryCode: country.code,
      countryName: country.name,
      name: row.name,
    }));
  } catch {
    const fallbackCode = getFallbackCountryCode(normalized);
    const fallbackCountry = fallbackCode ? fallbackCountryByCode.get(fallbackCode) : null;
    const fallbackCities = fallbackCountry ? dedupeAndSortCities(countryCities[fallbackCountry.name] ?? []) : [];
    return fallbackCities.map((name) => ({
      countryCode: fallbackCountry?.code ?? normalized,
      countryName: fallbackCountry?.name ?? normalized,
      name,
    }));
  }
}

export async function listGeoCitiesForCountries(countryNamesOrCodes: string[]): Promise<GeoCity[]> {
  const normalized = Array.from(new Set(countryNamesOrCodes.map((value) => value.trim()).filter(Boolean)));
  if (normalized.length === 0) return [];

  if (!isSupabaseConfigured) {
    const results: GeoCity[] = [];
    for (const value of normalized) {
      results.push(...await listGeoCities(value));
    }
    return results;
  }

  try {
    const countries = await resolveCountryRows(normalized);
    if (countries.length === 0) return [];

    const countryById = new Map(countries.map((country) => [country.id, country]));
    const rows = await fetchAllCityRows(countries.map((country) => country.id));

    return rows
      .map((row) => {
        const country = countryById.get(row.country_id);
        if (!country) return null;
        return {
          countryCode: country.code,
          countryName: country.name,
          name: row.name,
        } satisfies GeoCity;
      })
      .filter((row): row is GeoCity => row !== null);
  } catch {
    const results: GeoCity[] = [];
    for (const value of normalized) {
      results.push(...await listGeoCities(value));
    }
    return results;
  }
}

export function listFallbackCountryNames() {
  return geoCountryNames;
}
