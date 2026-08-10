// Cadde sağ rail — "Akışın nasıl şekilleniyor?" kartı.
//
// NEDEN VAR: `list_cadde_feed_v1` görünürlük kapısı üyeye hiçbir yerde anlatılmıyordu.
// Ölçüm (06.08.2026, canlı, 158 hesap): Antalya/Türkiye hedefli 0 etkileşimli bir postu
// 68 üye GÖREMİYOR — çünkü kapı yerel içeriği yerelde tutuyor ve global eşik (10/5/10)
// aşılmamış. Bu tasarımın kendisi, ama görünmezdi; üye "sistem bozuk" sanıyordu.
//
// Kart POTANSİYEL erişimi gösterir — "kaç üyenin akışına girebilir", okunma sayısı DEĞİL.
// Etiketler bunu açıkça söyler; aksi halde okunma metriği sanılır.
//
// Veri: get_cadde_feed_reach_v1 (migration 20260806140000). Kural burada TEKRAR EDİLMEZ;
// saf dönüşümler `src/lib/cadde-reach.ts` içindedir.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle, Globe2, MapPin } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCaddeFeedReach } from "@/lib/cadde-api";
import {
  buildCaddeReachRows,
  caddeEffectiveReach,
  caddeGlobalThresholdText,
  resolveCaddeReachState,
} from "@/lib/cadde-reach";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";

/** Sayım 158 üyeyi tarar; dakikada bir tazelemenin değeri yok. */
const REACH_STALE_MS = 1000 * 60 * 15;

const CaddeReachCard = () => {
  const { user } = useAuth();

  const reachQuery = useQuery({
    queryKey: caddeQueryKeys.feedReach(user?.id ?? null),
    queryFn: getCaddeFeedReach,
    enabled: Boolean(user?.id),
    staleTime: REACH_STALE_MS,
  });

  const data = reachQuery.data ?? null;
  const state = resolveCaddeReachState(data);

  // Veri yoksa/oturum yoksa kart hiç çizilmez — yan panel akışı bozmaz (ikincil yüzey).
  if (state === "signed-out" || !data) return null;

  // gateOpen: canlı eşikler 0'a çekildiğinde (10.08.2026) konum filtresi fiilen kalkar.
  // RPC yalnız konum dallarını saydığı için ham `reach.total` o durumda GERÇEĞİ EKSİK
  // gösterir; kartın anlattığı kısıt da geçersizleşir. İkisini de burada düzeltiyoruz.
  const { total: effectiveTotal, percent, gateOpen } = caddeEffectiveReach(data);
  const rows = buildCaddeReachRows(data);
  const rawProfileValue = [data.rawCountry, data.rawCity].filter(Boolean).join(" · ");

  return (
    <Card data-testid="cadde-reach-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[11px]">
          <Globe2 className="h-3.5 w-3.5 text-sky-500" />
          Akışın nasıl şekilleniyor?
        </CardTitle>
        <CardDescription className="text-[11px]">
          Akış önce şehrini, sonra ülkeni gösterir.{" "}
          {gateOpen
            ? "Sonrasında diğer ülkelerdeki paylaşımlar gelir — hiçbiri gizlenmez."
            : "Yerelin dışına yalnız yüksek etkileşimli paylaşımlar çıkar."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {state === "resolved" ? (
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              Konumun:{" "}
              <span className="font-semibold text-slate-900">
                {[data.countryName, data.cityName].filter(Boolean).join(" · ")}
              </span>
            </span>
          </p>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="flex items-start gap-1.5 text-[11px] font-medium text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>Konumun Cadde kataloğunda tanımlı değil.</span>
            </p>
            {rawProfileValue ? (
              <p className="mt-1 pl-5 text-[11px] leading-relaxed text-amber-800">
                Profilinde yazan: <span className="font-semibold">{rawProfileValue}</span>
              </p>
            ) : null}
            <p className="mt-1 pl-5 text-[11px] leading-relaxed text-amber-800">
              {gateOpen
                ? "Akışta her şeyi görüyorsun ve paylaşımın da herkese ulaşıyor. Yine de konumun tanımlı olursa sıralamada kendi şehrin öne çıkar. "
                : "Şu an akışta her şeyi görüyorsun, ama paylaşımın dar bir kitleye ulaşıyor. "}
              <Link
                to="/profile"
                data-testid="cadde-reach-profile-link"
                className="font-semibold underline underline-offset-2 hover:text-amber-950"
              >
                Profilinden düzelt
              </Link>
            </p>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] leading-relaxed text-slate-700">
            {gateOpen ? (
              <>
                Paylaşımın şu an{" "}
                <span className="font-semibold text-slate-900">{effectiveTotal} üyenin tamamına</span> ulaşabilir.
              </>
            ) : (
              <>
                Kendi konumunu hedefleyen bir paylaşımın{" "}
                <span className="font-semibold text-slate-900">{effectiveTotal} üyeye</span> ulaşabilir.
              </>
            )}
          </p>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Paylaşımının ulaşabileceği üye oranı"
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
          >
            <div className="h-full rounded-full bg-sky-500" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {data.reach.members} üyenin %{percent}'si
          </p>
        </div>

        {rows.length > 0 ? (
          <ul className="space-y-1">
            {rows.map((row) => (
              <li
                key={row.key}
                data-testid="cadde-reach-row"
                className="flex items-center justify-between gap-2 text-[11px] text-slate-600"
              >
                <span className="min-w-0 truncate">{row.label}</span>
                <span className="shrink-0 font-semibold text-slate-900">{row.count}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="text-[11px] leading-relaxed text-slate-500">
          {gateOpen ? "Konum sınırı şu an kapalı" : "Yerelin dışına çıkmak için"}:{" "}
          <span className="font-medium text-slate-700">{caddeGlobalThresholdText(data.thresholds)}</span>
          {gateOpen ? (
            <span className="block">Yukarıdaki konum satırları görünürlüğü değil, sıralama önceliğini gösterir.</span>
          ) : null}
        </p>
      </CardContent>
    </Card>
  );
};

export default CaddeReachCard;
