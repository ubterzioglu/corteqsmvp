// Cadde sağ kolon Tanıtım rail'i (placement: cadde-right-rail, spec §15.2).
// Onaylı + tarih aralığındaki kampanyaları geo filtresine göre listeler;
// kart başına zorunlu "Sponsorlu" badge SponsoredFeedCard içindedir.

import { useQuery } from "@tanstack/react-query";

import SponsoredFeedCard from "@/components/cadde/SponsoredFeedCard";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listCaddePromotions } from "@/lib/cadde-tanitim-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { CaddeFilterState } from "@/lib/cadde-types";

interface PromotionRailProps {
  filters: CaddeFilterState;
}

const PromotionRail = ({ filters }: PromotionRailProps) => {
  const geoFilters = { countries: filters.countries, cities: filters.cities };
  const promotionsQuery = useQuery({
    queryKey: caddeQueryKeys.promotions("cadde-right-rail", geoFilters),
    queryFn: () => listCaddePromotions("cadde-right-rail", geoFilters, 3),
  });

  const promotions = promotionsQuery.data ?? [];
  if (promotions.length === 0) return null;

  return (
    <Card className="border-orange-100 bg-white/90">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tanıtım</CardTitle>
        <CardDescription>Sponsorlu keşif alanı</CardDescription>
      </CardHeader>
      <div className="space-y-3 px-4 pb-4">
        {promotions.map((promotion) => (
          <SponsoredFeedCard key={promotion.campaignId} promotion={promotion} compact />
        ))}
      </div>
    </Card>
  );
};

export default PromotionRail;
