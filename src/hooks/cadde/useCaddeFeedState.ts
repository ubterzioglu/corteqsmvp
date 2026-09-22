import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { countCaddePostsSince, listCaddeFeed } from "@/lib/cadde-api";
import {
  caddeNewPostPollInterval,
  newestCaddeCreatedAt,
  nextCaddeZeroStreak,
} from "@/lib/cadde-feed-polling";
import { injectSponsoredPlacement, interleavePromotions } from "@/lib/cadde-format";
import { widenCaddeFilters } from "@/lib/cadde-feed-widen";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type {
  CaddeCity,
  CaddeCountry,
  CaddeFeedPage,
  CaddeFeedPageParam,
  CaddeFilterState,
  CaddePromotionCard,
  CaddeSponsoredPlacement,
} from "@/lib/cadde-types";

type UseCaddeFeedStateInput = {
  filters: CaddeFilterState;
  currentUserId: string | null;
  diasporaKey: string;
  feedPages: CaddeFeedPage[] | undefined;
  isFeedLoading: boolean;
  isFeedError: boolean;
  countries: CaddeCountry[] | undefined;
  cities: CaddeCity[] | undefined;
  allCities: CaddeCity[] | undefined;
  sponsor: CaddeSponsoredPlacement | null;
  promotions: CaddePromotionCard[];
};

export function useCaddeFeedState({
  filters,
  currentUserId,
  diasporaKey,
  feedPages,
  isFeedLoading,
  isFeedError,
  countries,
  cities,
  allCities,
  sponsor,
  promotions,
}: UseCaddeFeedStateInput) {
  const newestLoadedAt = useMemo(() => newestCaddeCreatedAt(feedPages), [feedPages]);
  const zeroStreakRef = useRef(0);

  useEffect(() => {
    zeroStreakRef.current = 0;
  }, [newestLoadedAt]);

  useEffect(() => {
    const resetStreak = () => {
      zeroStreakRef.current = 0;
    };
    window.addEventListener("focus", resetStreak);
    return () => window.removeEventListener("focus", resetStreak);
  }, []);

  const newPostsQuery = useQuery({
    queryKey: ["cadde", "new-posts-since", newestLoadedAt],
    queryFn: async () => {
      const count = await countCaddePostsSince(newestLoadedAt ?? "");
      zeroStreakRef.current = nextCaddeZeroStreak(count, zeroStreakRef.current);
      return count;
    },
    enabled: filters.mode === "real" && Boolean(newestLoadedAt),
    refetchInterval: (query) => caddeNewPostPollInterval(query.state.data ?? 0, zeroStreakRef.current),
    refetchOnWindowFocus: "always",
  });

  const feedItems = useMemo(() => feedPages?.flatMap((page) => page.items) ?? [], [feedPages]);
  const widenTarget = useMemo(
    () => widenCaddeFilters(filters, cities ?? allCities ?? [], countries ?? []),
    [allCities, cities, countries, filters],
  );

  const widenedFeedQuery = useInfiniteQuery({
    queryKey: caddeQueryKeys.feed(widenTarget?.next ?? filters, currentUserId, diasporaKey),
    initialPageParam: null as CaddeFeedPageParam,
    queryFn: ({ pageParam }) => listCaddeFeed(widenTarget!.next, pageParam, currentUserId, diasporaKey),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled:
      widenTarget !== null &&
      filters.mode === "real" &&
      !isFeedLoading &&
      !isFeedError &&
      feedItems.length === 0,
  });

  const widenedPage = widenedFeedQuery.data?.pages[0];
  const widenedCount = widenedPage?.items.length ?? 0;
  const canWiden = widenTarget !== null && !widenedFeedQuery.isError && widenedCount > 0;
  const feedWithSponsor = useMemo(
    () => interleavePromotions(injectSponsoredPlacement(feedItems, sponsor, filters.mode), promotions, filters.mode),
    [feedItems, filters.mode, promotions, sponsor],
  );

  return {
    canWiden,
    feedItems,
    feedWithSponsor,
    newPostCount: newPostsQuery.data ?? 0,
    newPostsQuery,
    newestLoadedAt,
    widenedCount,
    widenedPage,
    widenTarget,
  };
}
