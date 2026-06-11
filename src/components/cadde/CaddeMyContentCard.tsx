// Profil paneli parity — Faz 9 kuyruğu (spec §13.5 "Açık Cafe / Etkinlik" + §14.2 carsi tab).
// Kullanıcının host olduğu cafe'leri ve Çarşı ilanlarını profil panelinde özetler;
// yönetim ilgili detay/liste sayfalarındadır (bu kart yalnız görünürlük + hızlı geçiş).
// Public profil yüzeyi (directory catalog composer) ayrı iş kaleminde.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Coffee, ShoppingBag } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMyCaddeCafes } from "@/lib/cadde-api";
import { formatCarsiPrice, listMyCarsiItems } from "@/lib/cadde-carsi-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const CaddeMyContentCard = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const cafesQuery = useQuery({
    queryKey: caddeQueryKeys.myCafes(userId),
    queryFn: () => listMyCaddeCafes(userId ?? ""),
    enabled: Boolean(userId),
  });

  const itemsQuery = useQuery({
    queryKey: caddeQueryKeys.myCarsiItems(userId),
    queryFn: () => listMyCarsiItems(userId ?? ""),
    enabled: Boolean(userId),
  });

  const cafes = cafesQuery.data ?? [];
  const items = itemsQuery.data ?? [];
  const activeCafes = cafes.filter((cafe) => cafe.isActive && !cafe.archivedAt);

  if (!user || (cafes.length === 0 && items.length === 0)) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px]">Cadde İçeriklerim</CardTitle>
        <CardDescription className="text-[11px]">
          Açık cafe'lerin ve Çarşı ilanların; yönetim ilgili sayfalarda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeCafes.length > 0 ? (
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <Coffee className="h-3.5 w-3.5 text-orange-500" />
              Açık Cafelerim ({activeCafes.length})
            </p>
            {activeCafes.slice(0, 3).map((cafe) => (
              <Link key={cafe.id} to={`/cadde/cafe/${cafe.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 transition hover:border-orange-300">
                <span className="truncate text-xs font-medium text-slate-900">{cafe.title}</span>
                <span className="shrink-0 text-[10px] text-slate-500">{cafe.memberCount} üye • bitiş {formatDate(cafe.endsAt)}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
              Çarşı İlanlarım ({items.length})
            </p>
            {items.slice(0, 3).map((item) => (
              <Link key={item.id} to={`/cadde/carsi/${item.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 transition hover:border-amber-300">
                <span className="truncate text-xs font-medium text-slate-900">{item.title}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <Badge variant={item.status === "published" ? "default" : "secondary"} className="text-[10px]">
                    {item.status === "published" ? "Yayında" : "Pasif"}
                  </Badge>
                  <span className="text-[10px] text-slate-500">{formatCarsiPrice(item)}</span>
                </span>
              </Link>
            ))}
            <div className="flex justify-end">
              <Button asChild size="sm" variant="outline">
                <Link to="/cadde/carsi">Çarşı'da Yönet</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default CaddeMyContentCard;
