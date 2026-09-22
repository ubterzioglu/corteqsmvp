import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useCaddeActorContext } from "@/hooks/cadde/useCaddeActorContext";
import { useCaddeDiasporaKey } from "@/hooks/cadde/useCaddeDiasporaKey";
import {
  getCaddeSponsoredPlacement,
  listCaddeBillboardCards,
  listCaddeCafes,
  listCaddeCities,
  listCaddeCountries,
  listCaddeFeed,
  listCaddeInterestCatalog,
  searchCaddePeople,
} from "@/lib/cadde-api";
import { listCaddeCafeThemes } from "@/lib/cadde-cafe-api";
import { listCaddePromotions } from "@/lib/cadde-tanitim-api";
import { CADDE_LIST_STALE_MS, CADDE_PROMO_STALE_MS, CADDE_REFERENCE_STALE_MS } from "@/lib/cadde-query-cache";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { CaddeFeedPageParam, CaddeFilterState } from "@/lib/cadde-types";

type UseCaddePageDataInput = {
  filters: CaddeFilterState;
  hasSession: boolean;
  currentUserId: string | null;
};

export function useCaddePageData({ filters, hasSession, currentUserId }: UseCaddePageDataInput) {
  const diasporaKey = useCaddeDiasporaKey();
  const actorContextQuery = useCaddeActorContext(hasSession);
  const [peopleQueryText, setPeopleQueryText] = useState("");
  const [debouncedPeopleQuery, setDebouncedPeopleQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedPeopleQuery(peopleQueryText.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [peopleQueryText]);

  const countriesQuery = useQuery({
    queryKey: caddeQueryKeys.countries(),
    queryFn: listCaddeCountries,
    staleTime: CADDE_REFERENCE_STALE_MS,
  });

  const citiesQuery = useQuery({
    queryKey: caddeQueryKeys.cities(filters.countries),
    queryFn: () => listCaddeCities(filters.countries),
    staleTime: CADDE_REFERENCE_STALE_MS,
  });

  const peopleSearch = useQuery({
    queryKey: ["cadde", "people-search", debouncedPeopleQuery],
    queryFn: () => searchCaddePeople(debouncedPeopleQuery),
    enabled: debouncedPeopleQuery.length >= 2,
    placeholderData: (previous) => previous,
    staleTime: CADDE_LIST_STALE_MS,
  });

  const interestCatalogQuery = useQuery({
    queryKey: caddeQueryKeys.interestCatalog,
    queryFn: listCaddeInterestCatalog,
    staleTime: CADDE_REFERENCE_STALE_MS,
  });

  const allCitiesQuery = useQuery({
    queryKey: caddeQueryKeys.cities(["__all__"]),
    queryFn: () => listCaddeCities([]),
    enabled: hasSession,
    staleTime: CADDE_REFERENCE_STALE_MS,
  });

  const feedQueryKey = caddeQueryKeys.feed(filters, currentUserId, diasporaKey);
  const feedQuery = useInfiniteQuery({
    queryKey: feedQueryKey,
    initialPageParam: null as CaddeFeedPageParam,
    queryFn: ({ pageParam }) => listCaddeFeed(filters, pageParam, currentUserId, diasporaKey),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const cafesQuery = useQuery({
    queryKey: caddeQueryKeys.cafes(filters, currentUserId, diasporaKey),
    queryFn: () => listCaddeCafes(filters, currentUserId, diasporaKey),
    staleTime: CADDE_LIST_STALE_MS,
  });

  const billboardsQuery = useQuery({
    queryKey: caddeQueryKeys.billboards(filters),
    queryFn: () => listCaddeBillboardCards(filters),
    staleTime: CADDE_PROMO_STALE_MS,
  });

  const sponsorQuery = useQuery({
    queryKey: caddeQueryKeys.sponsor(filters),
    queryFn: () => getCaddeSponsoredPlacement(filters),
    staleTime: CADDE_PROMO_STALE_MS,
  });

  const feedPromotionsQuery = useQuery({
    queryKey: caddeQueryKeys.promotions("cadde-feed-inline", {
      countries: filters.countries,
      cities: filters.cities,
      diaspora: diasporaKey,
    }),
    queryFn: () =>
      listCaddePromotions(
        "cadde-feed-inline",
        { countries: filters.countries, cities: filters.cities, diaspora: diasporaKey },
        5,
      ),
    staleTime: CADDE_PROMO_STALE_MS,
  });

  const cafeThemesQuery = useQuery({
    queryKey: ["cadde", "cafe-themes"],
    queryFn: listCaddeCafeThemes,
    staleTime: CADDE_REFERENCE_STALE_MS,
  });

  return {
    actorContextQuery,
    allCitiesQuery,
    billboardsQuery,
    cafeThemesQuery,
    cafesQuery,
    citiesQuery,
    countriesQuery,
    debouncedPeopleQuery,
    diasporaKey,
    feedPromotionsQuery,
    feedQuery,
    feedQueryKey,
    interestCatalogQuery,
    peopleQueryText,
    peopleSearch,
    setPeopleQueryText,
    sponsorQuery,
  };
}
