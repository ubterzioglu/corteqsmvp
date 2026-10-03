// M15 · Admin traction panosu — Faz 6'nın 5 türetilmiş metriği (M14 view'ları).
//
// `KpiCard` muhasebe deseninin görsel dili (shadcn Card + büyük değer + alt
// başlık); metrikler sayı/oran/erişilemez olabildiği için değer string'e
// formatlanır (uydurma sayı YOK: cohort boşsa ya da tavsiye M17'ye dek "—").
//
// 🔴 Bu sayfa AdminLayout (admin-guarded) içindedir; view'lar zaten admin-only
// (M14 `is_admin(auth.uid())` guard + anon grant YOK). Admin olmayan 0 satır
// alır → metrik null → kart "—" çizer (sızma yok).
import { useQuery } from "@tanstack/react-query";
import { FileText, MessageSquare, RotateCcw, UserPlus, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchTractionMetrics,
  formatRatePercent,
  totalContentCreated,
} from "@/lib/admin/admin-traction-api";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
}

function MetricCard({ label, value, subtitle, icon: Icon }: MetricCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

const count = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : new Intl.NumberFormat("tr-TR").format(n);

export default function AdminTractionPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "traction-metrics"],
    queryFn: fetchTractionMetrics,
  });

  const wau = data?.weeklyActiveUsers ?? null;
  const content = data?.contentCreated ?? null;
  const recommendation = data?.recommendationResponseRate ?? null;
  const invites = data?.inviteSignups ?? null;
  const returnRate = data?.returnRate30d ?? null;

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Traction — Büyüme Metrikleri</h1>
        <p className="text-sm text-muted-foreground">
          Faz 6 türetilmiş metrikler (M14 view'ları). Sayılar canlı veritabanından okunur;
          tavsiye yanıt oranı M17 tavsiye modülü gelene dek boş görünür (normal).
        </p>
      </header>

      {isError ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Metrikler okunamadı. Yönetici yetkisi gerekiyor olabilir; sayfayı yenileyip tekrar
          deneyin.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Haftalık Aktif Kullanıcı"
          value={isLoading ? "…" : count(wau?.active_7d)}
          subtitle="Son 7 günde giriş yapan veya içerik üreten"
          icon={Users}
        />
        <MetricCard
          label="Üretilen İçerik (toplam)"
          value={isLoading ? "…" : count(content ? totalContentCreated(content) : null)}
          subtitle={
            content
              ? `Etkinlik ${content.events_total} · Cadde ${content.cadde_posts_total} · Çarşı ${content.carsi_items_total} · Grup ${content.groups_total} · Grup gönderisi ${content.group_posts_total}`
              : "Tür kırılımı yükleniyor"
          }
          icon={FileText}
        />
        <MetricCard
          label="Tavsiye Yanıt Oranı"
          value={
            isLoading
              ? "…"
              : recommendation?.available
                ? formatRatePercent(recommendation.response_rate)
                : "—"
          }
          subtitle={
            recommendation?.available
              ? `${recommendation.responded}/${recommendation.total} talep yanıtlandı`
              : "M17 tavsiye modülü gelene dek boş (normal)"
          }
          icon={MessageSquare}
        />
        <MetricCard
          label="Davetle Gelen Kayıt"
          value={isLoading ? "…" : count(invites?.total)}
          subtitle={
            invites
              ? `Son 30 gün: ${invites.last_30d} · son 7 gün: ${invites.last_7d}`
              : "Davet kullanımları yükleniyor"
          }
          icon={UserPlus}
        />
        <MetricCard
          label="30 Gün Geri Dönüş Oranı"
          value={isLoading ? "…" : formatRatePercent(returnRate?.return_rate ?? null)}
          subtitle={
            returnRate
              ? `≥30 gün önce kaydolan ${returnRate.cohort_size} kişiden ${returnRate.returned} kişi döndü`
              : "Cohort yükleniyor"
          }
          icon={RotateCcw}
        />
      </div>
    </div>
  );
}
