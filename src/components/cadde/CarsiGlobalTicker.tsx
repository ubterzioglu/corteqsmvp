// Çarşı global ticker'ı (spec §14.1): son ilanların yatay şeridi + "Tüm Çarşı" CTA.
// CaddePage sol kolonunun en üstüne monte edilir; geo filtresine göre daralır.
// Tanıtım/sponsor kartlarıyla karışmaz (D-01) — yalnız carsi_items okur.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCarsiPrice, listCarsiItems } from "@/lib/cadde-carsi-api";
import { useCaddeDiasporaKey } from "@/hooks/cadde/useCaddeDiasporaKey";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { CaddeFilterState } from "@/lib/cadde-types";

interface CarsiGlobalTickerProps {
  filters: CaddeFilterState;
}

const CarsiGlobalTicker = ({ filters }: CarsiGlobalTickerProps) => {
  const diasporaKey = useCaddeDiasporaKey();
  const itemsQuery = useQuery({
    queryKey: caddeQueryKeys.carsiItems({ countries: filters.countries, cities: filters.cities, diasporaKey }),
    queryFn: () => listCarsiItems({ countries: filters.countries, cities: filters.cities, diasporaKey }, 10),
  });

  const items = itemsQuery.data ?? [];

  return (
    <div className="rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#fef3c7_100%)] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900">
          <ShoppingBag className="h-4 w-4" />
          Çarşı
        </p>
        <Link to="/cadde/carsi" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline">
          Tüm Çarşı
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
          {itemsQuery.isLoading ? "İlanlar yükleniyor..." : "Bu kapsamda ilan yok — ilk ilanı sen ver."}
        </p>
      )}
    </div>
  );
};

export default CarsiGlobalTicker;
