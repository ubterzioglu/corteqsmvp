// Profil paneli parity — Faz 9 kuyruğu (spec §13.5 "Açık Cafe / Etkinlik").
// Kullanıcının host olduğu cafe'leri profil panelinde özetler; yönetim cafe detay
// sayfasındadır (bu kart yalnız görünürlük + hızlı geçiş).
//
// Plan 2026-09-25: profilin "Cadde" bölümü YALNIZ Cadde'dir — Çarşı ilanları, Çarşı
// sorgusu ve /cadde/carsi bağlantısı bu karttan kaldırıldı. Çarşı ürün olarak
// açıldığında ayrı bir yüzeyle eklenecek; buraya geri koyma.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import CaddeCafeIcon from "@/components/cadde/CaddeCafeIcon";

import { useAuth } from "@/components/auth/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMyCaddeCafes } from "@/lib/cadde-api";
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

  const cafes = cafesQuery.data ?? [];
  const activeCafes = cafes.filter((cafe) => cafe.isActive && !cafe.archivedAt);

  if (!user || activeCafes.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px]">Cadde İçeriklerim</CardTitle>
        <CardDescription className="text-[11px]">
          Açık cafe'lerin; yönetim cafe sayfasında.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
          <CaddeCafeIcon className="h-3.5 w-3.5 text-orange-500" />
          Açık Cafelerim ({activeCafes.length})
        </p>
        {activeCafes.slice(0, 3).map((cafe) => (
          <Link key={cafe.id} to={`/cadde/cafe/${cafe.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 transition hover:border-orange-300">
            <span className="truncate text-xs font-medium text-slate-900">{cafe.title}</span>
            <span className="shrink-0 text-[10px] text-slate-500">{cafe.memberCount} üye • bitiş {formatDate(cafe.endsAt)}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default CaddeMyContentCard;
