import { associations, businesses, consultants, events } from "@/data/mock";

export interface DiasporaSearchResult {
  title: string;
  description: string;
  category: string;
  location: string;
  type: "consultant" | "association" | "business" | "event";
  icon: string;
}

const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const tokenize = (value: string) =>
  normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);

const keywordExpansions: Record<string, string[]> = {
  konsolosluk: ["konsolosluk", "baskonsolosluk", "buyukelcilik", "diplomatik", "resmi", "randevu"],
  buyukelcilik: ["buyukelcilik", "konsolosluk", "diplomatik", "resmi"],
  doktor: ["doktor", "hekim", "dis", "disci", "saglik", "pratisyen", "dahiliye"],
  hastane: ["hastane", "saglik", "klinik", "doctor", "doktor"],
  vize: ["vize", "gocmenlik", "oturum", "vatandaslik", "blue", "card"],
  gocmenlik: ["gocmenlik", "vize", "oturum", "vatandaslik"],
  market: ["market", "turk", "gida", "perakende", "baklava"],
  is: ["is", "kariyer", "ise", "alım", "alim", "recruitment"],
  ilanlari: ["ilan", "kariyer", "pozisyon", "ise alim", "job"],
  tasinma: ["tasinma", "relocation", "nakliye", "lojistik", "moving"],
};

const expandTerms = (query: string) => {
  const tokens = tokenize(query);
  const expanded = new Set(tokens);

  for (const token of tokens) {
    for (const [key, aliases] of Object.entries(keywordExpansions)) {
      if (token.includes(key) || key.includes(token)) {
        aliases.forEach((alias) => expanded.add(alias));
      }
    }
  }

  return Array.from(expanded);
};

const scoreMatch = (haystack: string, terms: string[]) =>
  terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);

export const searchDiaspora = (query: string, country?: string | null): DiasporaSearchResult[] => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const terms = expandTerms(trimmedQuery);
  const inCountry = (itemCountry: string) => !country || itemCountry === country;

  const consultantMatches = consultants
    .filter((consultant) => inCountry(consultant.country))
    .map((consultant) => {
      const haystack = normalizeText(
        [
          consultant.name,
          consultant.role,
          consultant.category,
          consultant.bio,
          consultant.country,
          consultant.city,
          consultant.specialties.join(" "),
        ].join(" "),
      );

      return {
        score: scoreMatch(haystack, terms),
        result: {
          title: consultant.name,
          description: consultant.role,
          category: consultant.category,
          location: `${consultant.city}, ${consultant.country}`,
          type: "consultant" as const,
          icon: consultant.role.toLocaleLowerCase("tr").includes("doktor") || consultant.role.toLocaleLowerCase("tr").includes("diş")
            ? "🩺"
            : consultant.category.toLocaleLowerCase("tr").includes("vize")
              ? "✈️"
              : "👤",
        },
      };
    });

  const associationMatches = associations
    .filter((association) => inCountry(association.country))
    .map((association) => {
      const haystack = normalizeText(
        [
          association.name,
          association.type,
          association.description,
          association.country,
          association.city,
        ].join(" "),
      );

      return {
        score: scoreMatch(haystack, terms),
        result: {
          title: association.name,
          description: association.description,
          category: association.type,
          location: `${association.city}, ${association.country}`,
          type: "association" as const,
          icon: ["Büyükelçilik", "Konsolosluk"].includes(association.type)
            ? "🏛️"
            : association.type === "Hastane"
              ? "🏥"
              : "🏢",
        },
      };
    });

  const businessMatches = businesses
    .filter((business) => inCountry(business.country))
    .map((business) => {
      const haystack = normalizeText(
        [
          business.name,
          business.sector,
          business.description,
          business.country,
          business.city,
          business.offerings.join(" "),
        ].join(" "),
      );

      return {
        score: scoreMatch(haystack, terms),
        result: {
          title: business.name,
          description: business.description,
          category: business.sector,
          location: `${business.city}, ${business.country}`,
          type: "business" as const,
          icon: business.sector === "Perakende"
            ? "🛒"
            : business.sector === "Sağlık"
              ? "🏥"
              : "🏪",
        },
      };
    });

  const eventMatches = events
    .filter((event) => inCountry(event.country))
    .map((event) => {
      const haystack = normalizeText(
        [
          event.title,
          event.description,
          event.category,
          event.country,
          event.city,
          event.tags.join(" "),
        ].join(" "),
      );

      return {
        score: scoreMatch(haystack, terms),
        result: {
          title: event.title,
          description: event.description,
          category: "Etkinlik",
          location: `${event.city}, ${event.country}`,
          type: "event" as const,
          icon: "📅",
        },
      };
    });

  return [...associationMatches, ...consultantMatches, ...businessMatches, ...eventMatches]
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title, "tr"))
    .slice(0, 6)
    .map((entry) => entry.result);
};
