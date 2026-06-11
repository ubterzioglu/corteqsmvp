// Cadde React Query anahtarları — tüm Cadde sorguları bu fabrikaları kullanmalıdır.
// Kök anahtarlar (feedRoot/cafesRoot) prefix-invalidation içindir.

import type { CaddeFilterState } from "./cadde-types";

export const caddeQueryKeys = {
  all: ["cadde"] as const,
  actorContext: ["cadde", "actor-context"] as const,
  countries: () => ["cadde", "countries"] as const,
  cities: (countries: string[]) => ["cadde", "cities", countries] as const,
  feedRoot: ["cadde", "feed"] as const,
  feed: (filters: CaddeFilterState, userId: string | null) => ["cadde", "feed", filters, userId] as const,
  cafesRoot: ["cadde", "cafes"] as const,
  cafes: (filters: CaddeFilterState, userId: string | null) => ["cadde", "cafes", filters, userId] as const,
  cafe: (cafeId: string, userId: string | null) => ["cadde", "cafes", "detail", cafeId, userId] as const,
  cafeMembers: (cafeId: string) => ["cadde", "cafes", "members", cafeId] as const,
  cafeFeed: (cafeId: string, userId: string | null) => ["cadde", "cafes", "feed", cafeId, userId] as const,
  billboards: (filters: CaddeFilterState) => ["cadde", "billboards", filters] as const,
  sponsor: (filters: CaddeFilterState) => ["cadde", "sponsor", filters] as const,
  interestCatalog: ["cadde", "interest-catalog"] as const,
  myInterests: (userId: string | null) => ["cadde", "my-interests", userId] as const,
  carsiRoot: ["cadde", "carsi"] as const,
  carsiCategories: ["cadde", "carsi", "categories"] as const,
  carsiItems: (filters: { countries: string[]; cities: string[]; categoryKey?: string }) => ["cadde", "carsi", "items", filters] as const,
  carsiItem: (itemId: string) => ["cadde", "carsi", "item", itemId] as const,
  myCarsiItems: (userId: string | null) => ["cadde", "carsi", "mine", userId] as const,
};
