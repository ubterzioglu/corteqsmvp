// Cadde sağ kolon Tanıtım rail'i (placement: cadde-right-rail, spec §15.2).
// Onaylı + tarih aralığındaki kampanyaları geo filtresine göre listeler;
// kart başına zorunlu "Sponsorlu" badge SponsoredFeedCard içindedir.

import { useQuery } from "@tanstack/react-query";

import SponsoredFeedCard from "@/components/cadde/SponsoredFeedCard";
import { useCaddeDiasporaKey } from "@/hooks/cadde/useCaddeDiasporaKey";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listCaddePromotions } from "@/lib/cadde-tanitim-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { CaddeFilterState } from "@/lib/cadde-types";

interface PromotionRailProps {
  filters: CaddeFilterState;
}

const PromotionRail = ({ filters }: PromotionRailProps) => {
  const diasporaKey = useCaddeDiasporaKey();
  const geoFilters = { countries: filters.countries, cities: filters.cities, diaspora: diasporaKey };
  const promotionsQuery = useQuery({
    queryKey: caddeQueryKeys.promotions("cadde-right-rail", geoFilters),
    queryFn: () => listCaddePromotions("cadde-right-rail", geoFilters, 3),
  });

  const promotions = promotionsQuery.data ?? [];

  return (
    <Card className="border-orange-100 bg-white/90">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">Tanıtım</CardTitle>
        <CardDescription>Sponsorlu keşif alanı</CardDescription>
      </CardHeader>
      {promotions.length > 0 ? (
        <div className="space-y-3 px-4 pb-4">
          {promotions.map((promotion) => (
            <SponsoredFeedCard key={promotion.campaignId} promotion={promotion} compact />
          ))}
        </div>
      ) : (
        <div
          data-testid="cadde-promotions-empty-state"
          className="px-4 pb-4"
        >
          <div className="rounded-[22px] border border-dashed border-orange-200 bg-orange-50 px-4 py-5">
            <p className="text-sm font-semibold text-slate-900">İlk tanıtım kartı burada yayınlanacak.</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Yerel kampanyalar, topluluk çağrıları ve sponsorlu keşif alanları bu bölümde görünür.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PromotionRail;
