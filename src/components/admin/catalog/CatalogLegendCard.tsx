import { useMemo } from "react";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LEGEND_ITEMS } from "@/lib/admin-catalog-display";

const CatalogLegendCard = () => {
  const legendItems = useMemo(() => [...LEGEND_ITEMS], []);

  return (
    <Collapsible defaultOpen={false}>
      <Card className="border-slate-200 bg-white shadow-[0_18px_55px_-42px_rgba(15,23,42,0.24)]">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none pb-3 transition-colors hover:bg-slate-50/60">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Kısaltma Rehberi</CardTitle>
                <CardDescription>
                  Tablodaki kısa kodlar alan kazanmak için kullanılır. Aşağıdan her kodun sistemde tam olarak neyi anlattığını açabilirsiniz.
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {legendItems.map((item) => (
                  <div
                    key={`legend-detail-${item.group}-${item.code}`}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {item.code}
                      </div>
                      <div className="text-sm font-medium text-slate-900">{item.label}</div>
                      <Badge variant="outline" className="text-[10px]">
                        {item.group}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default CatalogLegendCard;
