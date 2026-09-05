// Cadde sağ kolon Tanıtım rail'i (placement: cadde-right-rail, spec §15.2).
// Onaylı + tarih aralığındaki kampanyaları geo filtresine göre listeler;
// kart başına zorunlu "Sponsorlu" badge SponsoredFeedCard içindedir.

import { useQuery } from "@tanstack/react-query";

import SponsoredFeedCard from "@/components/cadde/SponsoredFeedCard";
import { useCaddeDiasporaKey } from "@/hooks/cadde/useCaddeDiasporaKey";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listCaddePromotions } from "@/lib/cadde-tanitim-api";
import { CADDE_PROMO_STALE_MS } from "@/lib/cadde-query-cache";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { CaddeFilterState } from "@/lib/cadde-types";

interface PromotionRailProps {
  filters: CaddeFilterState;
  /**
   * Soğuk başlangıçta (B2) kart hiç çizilmez. Gerekçe: kampanya yokken bu kartın
   * TEK içeriği kendi boş-durum kutusudur ve iki kart aşağıdaki koyu "Cadde İçinde
   * Görünür Ol" kartı aynı şeyi ÜSTELİK çalışan bir butonla söyler. Aynı kural
   * billboard yüzeyine `hasAnyBillboard` ile zaten uygulanmıştı (CaddePage) —
   * burada tutarlı hale getirildi. Sayfada içerik varken kutu KALIR: o bağlamda
   * boşluk bir tekrar değil, "bu alanı alabilirsin" daveti olarak okunur.
   */
  hideWhenEmpty?: boolean;
}

const PromotionRail = ({ filters, hideWhenEmpty = false }: PromotionRailProps) => {
  const diasporaKey = useCaddeDiasporaKey();
  const geoFilters = { countries: filters.countries, cities: filters.cities, diaspora: diasporaKey };
  const promotionsQuery = useQuery({
    queryKey: caddeQueryKeys.promotions("cadde-right-rail", geoFilters),
    queryFn: () => listCaddePromotions("cadde-right-rail", geoFilters, 3),
    staleTime: CADDE_PROMO_STALE_MS,
  });

  const promotions = promotionsQuery.data ?? [];

  if (hideWhenEmpty && promotions.length === 0) return null;

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
          <div className="flex items-center gap-3 rounded-[22px] border border-dashed border-orange-200 bg-orange-50 px-4 py-5">
            {/* 05.09.2026 revizyon c1a3aaf0 ("Sağdaki billboard bölgesine maskot görseli
                konsun"): boş tanıtım kutusu düz metindi. Maskot DEKORATİF — `alt=""` +
                `aria-hidden` ile erişilebilirlik ağacından çıkarılır; metnin söylemediği
                bir şey söylemiyor. Boyut iki eksende de sabit (`h-14 w-14` +
                `object-contain`): rail 320px, `w-auto` bırakılsaydı görselin en/boy oranı
                metni ezebilirdi. Billboard kutusundakinden bir kademe küçük, çünkü bu
                kutunun metni daha kısa ve kart daha dar. */}
            <img
              src="/lmaskot.png"
              alt=""
              aria-hidden="true"
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className="h-14 w-14 shrink-0 object-contain drop-shadow"
            />
            {/* m98: pasif "yayınlanacak/görünür" dili aktife çevrildi. CTA bilinçli
                olarak YOK — ana tanıtım butonu hemen aşağıdaki kartta, üst üste üç
                buton yığmıyoruz (F14 kararı). */}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Bu tanıtım alanı şu an boş.</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Yerel kampanyanı, topluluk çağrını veya sponsorlu keşif kartını buraya taşıyabilirsin.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PromotionRail;
