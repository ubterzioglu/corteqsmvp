// M09 · GettingStartedCard — "Başlangıç" ilerleme kartı (Faz 5).
//
// Plan kuralı: tamamlanma GERÇEK VERİDEN okunur — uydurma yüzde YOK.
//   • Profili tamamla   → profile.profileCompletion (get_current_user_profile
//                         RPC'sinin required alan sayımı — rol bazlı, SQL'de)
//   • İlk hizmet/ürün   → carsi_items (owner_user_id, deleted_at null —
//                         `listMyCarsiItems` ile birebir aynı sorgu/anahtar)
//   • İlk etkinlik      → events (user_id — `useMyEvents` paylaşımlı anahtar,
//                         "Etkinliklerim" sekmesiyle aynı cache)
//   • 3 davet           → ⚠️ PASİF: davet altyapısı M11-M13'te. Veri kaynağı
//                         olmayan satıra SAHTE tamamlanma yazılmaz (plan notu);
//                         referral_code_usages farklı bir şeydir (pazarlama
//                         kodu), onunla ölçülmez.
//
// KARAR (03.10): "hizmet/ürün" = Çarşı ilanı (carsi_items). 25.09 kararı
// "Çarşı İLAN LİSTESİ profil kartından kaldırıldı" der — bu kart liste
// göstermez, yalnız İLERLEME satırı gösterir; katalog (catalog_items) üye/
// danışman dizin kaydıdır, hizmet/ürün değildir.
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, ListChecks, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyEvents } from "@/hooks/use-events";
import { listMyCarsiItems } from "@/lib/cadde-carsi-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import { GOOGLE_SOFT_CARD_BLUE_SECTION } from "./profile-card-styles";

export interface GettingStartedCardProps {
  userId: string | null;
  /** profile.profileCompletion — gerçek sayım (uydurma yüzde yok). */
  completion: { requiredTotal: number; requiredCompleted: number };
}

type RowState = "done" | "todo" | "passive";

export function GettingStartedCard({ userId, completion }: GettingStartedCardProps) {
  const eventsQuery = useMyEvents(userId ?? undefined);
  // CaddeCarsiPage ile AYNI query key — kart ekstra istek üretmez, çarşı
  // sayfası açıldığında cache paylaşılır.
  const carsiQuery = useQuery({
    queryKey: [...caddeQueryKeys.myCarsiItems(userId ?? "")],
    queryFn: () => listMyCarsiItems(userId as string),
    enabled: Boolean(userId),
  });

  const profileDone =
    completion.requiredTotal > 0
      ? completion.requiredCompleted >= completion.requiredTotal
      : true; // required alan yoksa profil "tamam" sayılır (SQL: total 0 → %100)
  const eventsCount = eventsQuery.data?.length ?? 0;
  const carsiCount = carsiQuery.data?.length ?? 0;

  const rows: Array<{
    id: string;
    label: string;
    detail: string;
    state: RowState;
    to?: string;
  }> = [
    {
      id: "profile",
      label: "Profilini tamamla",
      detail:
        completion.requiredTotal > 0
          ? `${completion.requiredCompleted}/${completion.requiredTotal} zorunlu alan`
          : "Zorunlu alanın yok — profilin tamam.",
      state: profileDone ? "done" : "todo",
    },
    {
      id: "listing",
      label: "İlk hizmet veya ürününü ekle",
      detail: carsiCount > 0 ? `${carsiCount} Çarşı ilanın var` : "Çarşı'da hizmet/ürün ilanı aç",
      state: carsiCount > 0 ? "done" : "todo",
      to: "/cadde/carsi",
    },
    {
      id: "event",
      label: "İlk etkinliğini oluştur",
      detail: eventsCount > 0 ? `${eventsCount} etkinliğin var` : "İlk etkinlik onaydan geçer, sonrakiler otomatik",
      state: eventsCount > 0 ? "done" : "todo",
      to: "/events/create",
    },
    {
      id: "invites",
      label: "3 arkadaşını davet et",
      detail: "Davet sistemi yakında — geldiğinde buradan izleyeceksin.",
      state: "passive", // ⚠️ M11-M13'e dek veri kaynağı YOK — sahte tik yok
    },
  ];

  const doneCount = rows.filter((row) => row.state === "done").length;

  return (
    <Card
      data-testid="getting-started-card"
      className={`overflow-hidden ${GOOGLE_SOFT_CARD_BLUE_SECTION}`}
      aria-label="Başlangıç adımları"
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
          Başlangıç · {doneCount}/{rows.length} tamam
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} data-testid={`getting-started-row-${row.id}`} className="flex items-start gap-2.5">
              {row.state === "done" ? (
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : row.state === "passive" ? (
                <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-slate-400" aria-hidden="true" />
              ) : (
                <Circle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-slate-400" aria-hidden="true" />
              )}
              <div className="min-w-0 text-left">
                {row.to && row.state !== "done" ? (
                  <Link to={row.to} className="text-sm font-semibold text-slate-900 hover:underline">
                    {row.label}
                  </Link>
                ) : (
                  <span
                    className={`text-sm font-semibold ${
                      row.state === "passive" ? "text-slate-400" : row.state === "done" ? "text-emerald-700" : "text-slate-900"
                    }`}
                  >
                    {row.label}
                  </span>
                )}
                <span className="mt-0.5 block text-xs text-slate-500">{row.detail}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
          <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
          Durumlar gerçek kayıtlarından okunur — profil alanların, Çarşı ilanların ve etkinliklerin.
        </p>
      </CardContent>
    </Card>
  );
}

export default GettingStartedCard;
