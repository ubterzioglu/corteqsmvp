import { useQuery } from "@tanstack/react-query";

import { getPublicCatalogProfilePage } from "@/lib/public-catalog-profile-api";

export const publicCatalogProfileKeys = {
  all: ["public-catalog-profile"] as const,
  detail: (slug: string) => [...publicCatalogProfileKeys.all, slug] as const,
};

export function usePublicCatalogProfile(slug?: string) {
  return useQuery({
    queryKey: publicCatalogProfileKeys.detail(slug ?? ""),
    queryFn: () => getPublicCatalogProfilePage(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}
