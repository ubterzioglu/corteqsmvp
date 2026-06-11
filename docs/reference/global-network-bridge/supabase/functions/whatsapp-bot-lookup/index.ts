// WhatsApp AI bot — location lookup endpoint
// The bot calls this with a free-text query (e.g. "konsolosluk berlin")
// and gets back up to 5 matching providers with address + Google Maps link
// it can DM to the user.
//
// Data is mirrored from the in-app /map page (src/lib/mapEntities.ts).
// As soon as the production provider tables expose address columns,
// swap the mock import for direct Supabase queries here.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BotLookupResult {
  name: string;
  category: string;
  city: string;
  country: string;
  address: string;
  mapsUrl: string;
  website?: string;
  whatsapp?: string;
}

interface Entity {
  name: string;
  category: string;
  country: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  website?: string;
}

// City coordinates (mirrors src/lib/mapEntities.ts CITY_COORDS)
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
  "New York": { lat: 40.71, lng: -74.0 },
  Toronto: { lat: 43.65, lng: -79.38 },
};

// Curated set of well-known Türk diaspora landmarks
// (embassies, consulates, hospitals) the bot is most likely to be asked about.
const ENTITIES: Entity[] = [
  { name: "T.C. Berlin Büyükelçiliği", category: "Büyükelçilik", country: "Almanya", city: "Berlin", address: "Tiergartenstr. 19-21, 10785 Berlin", lat: 52.513, lng: 13.35, website: "https://berlin.be.mfa.gov.tr" },
  { name: "T.C. Londra Başkonsolosluğu", category: "Konsolosluk", country: "İngiltere", city: "Londra", address: "Rutland Lodge, Rutland Gardens, Knightsbridge, London SW7 1BW", lat: 51.502, lng: -0.165, website: "https://londra.bk.mfa.gov.tr" },
  { name: "T.C. Washington Büyükelçiliği", category: "Büyükelçilik", country: "ABD", city: "Washington", address: "2525 Massachusetts Ave NW, Washington, DC 20008", lat: 38.915, lng: -77.053, website: "https://washington.emb.mfa.gov.tr" },
  { name: "T.C. Dubai Başkonsolosluğu", category: "Konsolosluk", country: "BAE", city: "Dubai", address: "Trade Centre Area, Al Manara Tower, Dubai", lat: 25.2285, lng: 55.2832, website: "https://dubai.bk.mfa.gov.tr" },
  { name: "T.C. Paris Büyükelçiliği", category: "Büyükelçilik", country: "Fransa", city: "Paris", address: "16 Avenue de Lamballe, 75016 Paris", lat: 48.853, lng: 2.273 },
  { name: "Türk-Alman Sağlık Merkezi", category: "Hastane", country: "Almanya", city: "Berlin", address: "Berlin Sağlık Merkezi", lat: 52.515, lng: 13.4 },
  { name: "Anatolia Health Clinic", category: "Hastane", country: "İngiltere", city: "Londra", address: "Anatolia Health, Londra", lat: 51.51, lng: -0.13 },
];

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function lookup(query: string, country?: string, city?: string): BotLookupResult[] {
  const q = norm(query.trim());
  if (!q) return [];

  const filtered = ENTITIES.filter((e) => {
    if (country && norm(e.country) !== norm(country)) return false;
    if (city && norm(e.city) !== norm(city)) return false;
    const haystack = norm(`${e.name} ${e.category} ${e.city} ${e.country} ${e.address}`);
    return haystack.includes(q);
  });

  return filtered.slice(0, 5).map((e) => ({
    name: e.name,
    category: e.category,
    city: e.city,
    country: e.country,
    address: e.address,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${e.lat},${e.lng}`,
    website: e.website,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let query = "";
    let country: string | undefined;
    let city: string | undefined;

    if (req.method === "GET") {
      const url = new URL(req.url);
      query = url.searchParams.get("q") || "";
      country = url.searchParams.get("country") || undefined;
      city = url.searchParams.get("city") || undefined;
    } else {
      const body = await req.json().catch(() => ({}));
      query = String(body.query || body.q || "").trim();
      country = body.country;
      city = body.city;
    }

    if (!query) {
      return new Response(
        JSON.stringify({ error: "missing query (q)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = lookup(query, country, city);

    // Build a WhatsApp-DM-friendly string
    const dmText = results.length === 0
      ? `📍 "${query}" için kayıt bulunamadı.`
      : results
          .map((r, i) =>
            `${i + 1}. *${r.name}* (${r.category})\n📍 ${r.address}\n🗺️ ${r.mapsUrl}${r.website ? `\n🌐 ${r.website}` : ""}`
          )
          .join("\n\n");

    return new Response(
      JSON.stringify({ query, count: results.length, results, dmText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
