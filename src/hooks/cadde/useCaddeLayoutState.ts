import { useMemo, useState } from "react";

import type { CaddeCafeTheme } from "@/lib/cadde-cafe-api";
import type { CaddeWidenTarget } from "@/lib/cadde-feed-widen";
import { resolveCaddeClockTarget } from "@/lib/cadde-local-clock";
import type {
  CaddeBillboardCard,
  CaddeCafe,
  CaddeCity,
  CaddeFilterState,
  CaddeInterest,
} from "@/lib/cadde-types";

type UseCaddeLayoutStateInput = {
  filters: CaddeFilterState;
  registeredCity: string;
  allCities: CaddeCity[];
  interests: CaddeInterest[];
  cafeThemes: CaddeCafeTheme[];
  cafes: CaddeCafe[];
  billboards: CaddeBillboardCard[];
  feedItemCount: number;
  isFeedLoading: boolean;
  isFeedError: boolean;
  isCafesLoading: boolean;
  canWiden: boolean;
  widenTarget: CaddeWidenTarget | null;
  isAuthenticated: boolean;
};

export function useCaddeLayoutState({
  filters,
  registeredCity,
  allCities,
  interests,
  cafeThemes,
  cafes,
  billboards,
  feedItemCount,
  isFeedLoading,
  isFeedError,
  isCafesLoading,
  canWiden,
  widenTarget,
  isAuthenticated,
}: UseCaddeLayoutStateInput) {
  const [cafesOpenOverride, setCafesOpenOverride] = useState<boolean | null>(null);
  const [geoFilterOpenOverride, setGeoFilterOpenOverride] = useState<boolean | null>(null);
  const [coldRailOpen, setColdRailOpen] = useState(false);
  const [showAllCafes, setShowAllCafes] = useState(false);

  const directoryLink = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.countries[0]) params.set("country", filters.countries[0]);
    if (filters.cities[0]) params.set("city", filters.cities[0]);
    return `/directory${params.toString() ? `?${params.toString()}` : ""}`;
  }, [filters.countries, filters.cities]);

  const interestLabelByKey = useMemo(
    () => new Map(interests.map((interest) => [interest.key, interest.labelTr])),
    [interests],
  );
  const cafeThemeLabelByKey = useMemo(
    () => new Map(cafeThemes.map((theme) => [theme.key, theme.labelTr])),
    [cafeThemes],
  );

  const hasGeoSelection = filters.countries.length > 0 || filters.cities.length > 0;
  const cafeLocationLabel = filters.cities[0] ?? filters.countries[0] ?? null;
  const hasNarrowingFilter =
    hasGeoSelection || filters.bridge || Boolean(filters.hashtag) || filters.scope !== "all";
  const sparseContentHint = canWiden
    ? `Daraltılmış akışın boş; ${widenTarget!.label} akışına tek dokunuşla geçebilirsin.`
    : hasNarrowingFilter
      ? "Bu seçimde ve bir üst kapsamda henüz paylaşım yok."
      : "İçerik az olduğunda global akışla başlayıp ilk hareketi sen başlatabilirsin.";

  const caddeDataResolved = !isFeedLoading && !isCafesLoading;
  const isColdStart =
    caddeDataResolved &&
    !isFeedError &&
    feedItemCount === 0 &&
    cafes.length === 0 &&
    !hasNarrowingFilter;
  const cafesOpen = cafesOpenOverride ?? (caddeDataResolved && !isColdStart);
  const geoFilterOpen = geoFilterOpenOverride ?? (caddeDataResolved && !isColdStart);
  const asideRhythm = isColdStart ? "space-y-3" : "space-y-5";

  const hasAnyBillboard = billboards.length > 0;
  const featuredBillboards = billboards.filter((card) => card.isFeatured);
  const spotlightBillboard = featuredBillboards[0] ?? null;
  const listedBillboards = (featuredBillboards.length > 0 ? featuredBillboards : billboards).filter(
    (card) => card.id !== spotlightBillboard?.id,
  );
  const promotionCtaTarget = isAuthenticated ? "/profile#cadde-tanitim" : "/login?mode=signup";
  const promotionCtaLabel = isAuthenticated
    ? "Profilinden İlk Tanıtımını Yap"
    : "Profil Aç ve Tanıtıma Başla";

  const clockTarget = useMemo(
    () => resolveCaddeClockTarget(filters.cities, registeredCity, allCities),
    [filters.cities, registeredCity, allCities],
  );

  return {
    activeCafes: cafes,
    asideRhythm,
    cafeLocationLabel,
    cafesOpen,
    cafeThemeLabelByKey,
    clockTarget,
    coldRailOpen,
    directoryLink,
    geoFilterOpen,
    hasAnyBillboard,
    hasGeoSelection,
    interestLabelByKey,
    isColdStart,
    listedBillboards,
    promotionCtaLabel,
    promotionCtaTarget,
    setCafesOpenOverride,
    setColdRailOpen,
    setGeoFilterOpenOverride,
    setShowAllCafes,
    showAllCafes,
    sparseContentHint,
    spotlightBillboard,
  };
}
