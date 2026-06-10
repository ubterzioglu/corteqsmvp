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
  billboards: (filters: CaddeFilterState) => ["cadde", "billboards", filters] as const,
  sponsor: (filters: CaddeFilterState) => ["cadde", "sponsor", filters] as const,
  interestCatalog: ["cadde", "interest-catalog"] as const,
  myInterests: (userId: string | null) => ["cadde", "my-interests", userId] as const,
};
