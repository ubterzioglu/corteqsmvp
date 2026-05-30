/**
 * Shared map entity model.
 * Sources real provider data from `src/data/mock.ts`
 *  (consultants, associations, businesses).
 *
 * Used by:
 *  - the in-app Map Search (`/map`)
 *  - the WhatsApp AI bot edge function (e.g. "consulate address please")
 *
 * NOTE: Today provider addresses come from the mock dataset because the
 * production provider tables (consultants_profiles, businesses, associations)
 * do not yet expose address columns. As soon as those tables get
 * `address`, `lat`, `lng` columns, swap the mock loaders below for
 * `supabase.from(...).select(...)` calls — the consumers stay the same.
 */

import { consultants, associations, businesses } from "@/data/mock";

export type MapEntityKind = "consultant" | "association" | "business";

export interface MapEntity {
  id: string;
  kind: MapEntityKind;
  /** Display label, e.g. "Türk-Alman Sağlık Merkezi" */
  name: string;
  /** Human category, e.g. "Konsolosluk", "Hastane", "Restoran", "Vize & Göçmenlik" */
  category: string;
  country: string;
  city: string;
  /** Street address (free text) — used by WhatsApp bot DM */
  address: string;
  lat: number;
  lng: number;
  /** Optional contact info usable by the bot */
  website?: string;
  whatsapp?: string;
  rating?: number;
}

/** Approximate city center coordinates so we can place entities on the map. */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Berlin: { lat: 52.52, lng: 13.41 },
  Münih: { lat: 48.14, lng: 11.58 },
  Frankfurt: { lat: 50.11, lng: 8.68 },
  Hamburg: { lat: 53.55, lng: 9.99 },
  Londra: { lat: 51.51, lng: -0.13 },
  Manchester: { lat: 53.48, lng: -2.24 },
  Amsterdam: { lat: 52.37, lng: 4.9 },
  Rotterdam: { lat: 51.92, lng: 4.48 },
  Paris: { lat: 48.86, lng: 2.35 },
  Lyon: { lat: 45.76, lng: 4.84 },
  Dubai: { lat: 25.2, lng: 55.27 },
  "Abu Dhabi": { lat: 24.45, lng: 54.38 },
  Doha: { lat: 25.29, lng: 51.53 },
  Washington: { lat: 38.9, lng: -77.04 },
  "Washington DC": { lat: 38.9, lng: -77.04 },
  "New York": { lat: 40.71, lng: -74.0 },
  "Los Angeles": { lat: 34.05, lng: -118.24 },
  Toronto: { lat: 43.65, lng: -79.38 },
  Montreal: { lat: 45.5, lng: -73.57 },
  Sydney: { lat: -33.87, lng: 151.21 },
  Viyana: { lat: 48.21, lng: 16.37 },
  Zürih: { lat: 47.38, lng: 8.54 },
  Madrid: { lat: 40.42, lng: -3.7 },
  Roma: { lat: 41.9, lng: 12.5 },
  Stockholm: { lat: 59.33, lng: 18.07 },
  Brüksel: { lat: 50.85, lng: 4.35 },
  Lisbon: { lat: 38.72, lng: -9.14 },
};

/** Stable jitter so multiple entities in the same city don't sit on top of each other. */
const jitter = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const dx = ((h % 100) / 100 - 0.5) * 0.05;
  const dy = (((h >> 8) % 100) / 100 - 0.5) * 0.05;
  return { dx, dy };
};

const coordsFor = (city: string, id: string): { lat: number; lng: number } => {
  const base = CITY_COORDS[city];
  if (!base) return { lat: 0, lng: 0 };
  const { dx, dy } = jitter(id);
  return { lat: base.lat + dy, lng: base.lng + dx };
};

/** Build the unified entity list from real provider mocks. */
export const getAllMapEntities = (): MapEntity[] => {
  const list: MapEntity[] = [];

  // Consultants — synthesize an "office address" string
  for (const c of consultants) {
    const { lat, lng } = coordsFor(c.city, c.id);
    if (lat === 0 && lng === 0) continue;
    list.push({
      id: `c-${c.id}`,
      kind: "consultant",
      name: c.name,
      category: c.category,
      country: c.country,
      city: c.city,
      address: `${c.role}, ${c.city} ${c.country} (görüşme talebi için randevu)`,
      lat,
      lng,
      website: c.website,
      whatsapp: c.whatsapp,
      rating: c.rating,
    });
  }

  // Associations — embassies, consulates, schools, hospitals etc.
  for (const a of associations) {
    const { lat, lng } = coordsFor(a.city, a.id);
    if (lat === 0 && lng === 0) continue;
    list.push({
      id: `a-${a.id}`,
      kind: "association",
      name: a.name,
      category: a.type,
      country: a.country,
      city: a.city,
      address: `${a.name}, ${a.city} ${a.country}`,
      lat,
      lng,
      website: a.website,
    });
  }

  // Businesses
  for (const b of businesses) {
    const { lat, lng } = coordsFor(b.city, b.id);
    if (lat === 0 && lng === 0) continue;
    list.push({
      id: `b-${b.id}`,
      kind: "business",
      name: b.name,
      category: b.sector,
      country: b.country,
      city: b.city,
      address: `${b.name}, ${b.city} ${b.country}`,
      lat,
      lng,
      website: b.website,
    });
  }

  return list;
};

/** All countries that have at least one entity. */
export const getMapCountries = (): string[] => {
  const set = new Set<string>();
  for (const e of getAllMapEntities()) set.add(e.country);
  return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
};

/** Cities for a given country. */
export const getMapCities = (country: string): string[] => {
  const set = new Set<string>();
  for (const e of getAllMapEntities()) {
    if (e.country === country) set.add(e.city);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
};

/**
 * Bot-friendly lookup. Used by the WhatsApp bot to answer
 * "consulate address Berlin" → returns up to 5 matches with address & maps link.
 *
 * Matching is case-insensitive, accent-insensitive,
 * and runs across name + category + city + country + address.
 */
export interface BotLookupResult {
  name: string;
  category: string;
  city: string;
  country: string;
  address: string;
  mapsUrl: string;
  website?: string;
  whatsapp?: string;
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const lookupForBot = (
  query: string,
  opts?: { country?: string; city?: string; limit?: number }
): BotLookupResult[] => {
  const q = norm(query.trim());
  if (!q) return [];
  const limit = opts?.limit ?? 5;

  const all = getAllMapEntities();
  const filtered = all.filter((e) => {
    if (opts?.country && norm(e.country) !== norm(opts.country)) return false;
    if (opts?.city && norm(e.city) !== norm(opts.city)) return false;
    const haystack = norm(
      `${e.name} ${e.category} ${e.city} ${e.country} ${e.address}`
    );
    return haystack.includes(q);
  });

  return filtered.slice(0, limit).map((e) => ({
    name: e.name,
    category: e.category,
    city: e.city,
    country: e.country,
    address: e.address,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${e.lat},${e.lng}`,
    website: e.website,
    whatsapp: e.whatsapp,
  }));
};
