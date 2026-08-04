// Çarşı global ticker'ı (spec §14.1) + m39-m40 görünürlük kapısı (F10).
// `cadde.carsi.visible=false` (bugünkü ürün kararı) iken ilan şeridi YERİNE
// "Çarşı yakında" teaser'ı çizilir ve /cadde/carsi'ye hiç link verilmez.
// Geri açmak SQL update'i — deploy gerektirmez. Tanıtım/sponsor kartlarıyla
// karışmaz (D-01) — yalnız carsi_items okur.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import CaddeInfoPopover from "@/components/cadde/CaddeInfoPopover";
import { formatCarsiPrice, getCarsiVisible, listCarsiItems } from "@/lib/cadde-carsi-api";
import { useCaddeDiasporaKey } from "@/hooks/cadde/useCaddeDiasporaKey";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { CaddeFilterState } from "@/lib/cadde-types";

interface CarsiGlobalTickerProps {
  filters: CaddeFilterState;
}

const CarsiGlobalTicker = ({ filters }: CarsiGlobalTickerProps) => {
  const diasporaKey = useCaddeDiasporaKey();
  const visibleQuery = useQuery({
    queryKey: ["cadde", "carsi-visible"],
    queryFn: getCarsiVisible,
    staleTime: 5 * 60_000,
  });
  const carsiVisible = visibleQuery.data === true;

  const itemsQuery = useQuery({
    queryKey: caddeQueryKeys.carsiItems({ countries: filters.countries, cities: filters.cities, diasporaKey }),
    queryFn: () => listCarsiItems({ countries: filters.countries, cities: filters.cities, diasporaKey }, 10),
    // Çarşı gizliyken ilanları hiç çekme — teaser veriye ihtiyaç duymaz.
    enabled: carsiVisible,
  });

  const items = itemsQuery.data ?? [];

  if (!carsiVisible) {
    // m40: linksiz teaser. m51+m53: marka adı her yerde "CorteQS Çarşı" — isim hakkı
    // alınana kadar sade "Çarşı" kullanılmıyor; hover metni de madde metninden birebir.
    return (
      <div
        className="cadde-carsi-teaser rounded-2xl border p-4"
        data-testid="carsi-teaser"
      >
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900">
          <ShoppingBag className="h-4 w-4" />
          CorteQS Çarşı Yakında Açılıyor
          <CaddeInfoPopover
            label="CorteQS Çarşı nedir?"
            triggerTestId="carsi-teaser-info-trigger"
            contentTestId="carsi-teaser-info-content"
            triggerClassName="text-amber-700 hover:bg-amber-100 hover:text-amber-900 focus-visible:ring-amber-500"
          >
            <p className="text-xs leading-relaxed text-amber-900">
              CorteQS'in ikinci el pazarı yakında!
            </p>
          </CaddeInfoPopover>
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-amber-800/90">
          Diaspora'nın ikinci el pazarı çok yakında burada — eşyanı sat, aradığını
          şehrindeki üyelerden bul.
        </p>
      </div>
    );
  }

  return (
    <div className="cadde-carsi-teaser rounded-2xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900">
          <ShoppingBag className="h-4 w-4" />
          CorteQS Çarşı
        </p>
        <Link to="/cadde/carsi" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline">
          Tümü
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/cadde/carsi/${item.id}`}
              className="min-w-[150px] max-w-[180px] shrink-0 rounded-xl border border-amber-200/70 bg-white/90 p-2.5 transition hover:border-amber-300"
            >
              <Badge variant="outline" className="border-amber-300 text-[10px] text-amber-800">{item.categoryLabel}</Badge>
              <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-4 text-slate-900">{item.title}</p>
              <p className="mt-1 text-[11px] font-semibold text-amber-900">{formatCarsiPrice(item)}</p>
              {item.city ? <p className="text-[10px] text-slate-500">{item.city}</p> : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-amber-800/80">
          {itemsQuery.isLoading ? "İlanlar yükleniyor..." : "İlk ilanı sen ver."}
        </p>
      )}
    </div>
  );
};

export default CarsiGlobalTicker;
