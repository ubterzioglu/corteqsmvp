// M15 · Admin traction panosu veri katmanı — Faz 6'nın 5 metrik view'ını okur (M14).
//
// View'lar `public.metrics_*` (M14 migration `20261003120000`): admin-only
// (`where is_admin(auth.uid())` guard + `grant select to authenticated`, anon
// grant YOK). Bu API AdminLayout (admin-guarded) içinden çağrılır; admin olmayan
// kullanıcı view'dan 0 satır alır -> `maybeSingle` null döner (hata DEĞİL).
//
// ⚠️ types.ts regen BORCU (G12): metrik view'ları üretilmiş tiplerde YOK —
// `as never` deseni bilinçli (emsal: group-claims.ts, invites-api.ts).
// ⚠️ View/RPC hataları DÜZ NESNE — tip daraltması (instanceof) YASAK (KR03).
import { supabase } from "@/integrations/supabase/client";

/** M14 `metrics_weekly_active_users` — son 7 gün aktif (giriş VEYA içerik) kullanıcı. */
export interface WeeklyActiveUsersMetric {
  active_7d: number;
  window_days: number;
}

/** M14 `metrics_content_created` — haftalık + toplam içerik (tür kırılımı). */
export interface ContentCreatedMetric {
  events_7d: number;
  events_total: number;
  cadde_posts_7d: number;
  cadde_posts_total: number;
  carsi_items_7d: number;
  carsi_items_total: number;
  groups_7d: number;
  groups_total: number;
  group_posts_7d: number;
  group_posts_total: number;
  recommendations_total: number;
  window_days: number;
}

/** M14 `metrics_recommendation_response_rate` — M17 öncesi `available=false` (boş, normal). */
export interface RecommendationResponseMetric {
  available: boolean;
  total: number;
  responded: number;
  response_rate: number | null;
  note: string | null;
}

/** M14 `metrics_invite_signups` — davetle gelen kayıt (7g/30g/toplam). */
export interface InviteSignupsMetric {
  last_7d: number;
  last_30d: number;
  total: number;
}

/** M14 `metrics_30d_return_rate` — ≥30g cohort, son 30g dönüş; cohort boşsa rate null. */
export interface ReturnRate30dMetric {
  cohort_size: number;
  returned: number;
  return_rate: number | null;
  window_days: number;
}

export interface TractionMetrics {
  weeklyActiveUsers: WeeklyActiveUsersMetric | null;
  contentCreated: ContentCreatedMetric | null;
  recommendationResponseRate: RecommendationResponseMetric | null;
  inviteSignups: InviteSignupsMetric | null;
  returnRate30d: ReturnRate30dMetric | null;
}

/**
 * Tek metrik view'ını okur. Admin değilse (veya oturumsuz) view 0 satır döner →
 * `maybeSingle` null (hata değil). Ağ/PostgREST hatası fırlatılır (react-query yakalar).
 */
async function readMetricView<T>(view: string): Promise<T | null> {
  const { data, error } = await supabase
    .from(view as never)
    .select("*" as never)
    .maybeSingle();
  if (error) throw error;
  return data as T | null;
}

/** 5 metrik view'ını paralel okur (Faz 6 panosu). */
export async function fetchTractionMetrics(): Promise<TractionMetrics> {
  const [weeklyActiveUsers, contentCreated, recommendationResponseRate, inviteSignups, returnRate30d] =
    await Promise.all([
      readMetricView<WeeklyActiveUsersMetric>("metrics_weekly_active_users"),
      readMetricView<ContentCreatedMetric>("metrics_content_created"),
      readMetricView<RecommendationResponseMetric>("metrics_recommendation_response_rate"),
      readMetricView<InviteSignupsMetric>("metrics_invite_signups"),
      readMetricView<ReturnRate30dMetric>("metrics_30d_return_rate"),
    ]);

  return {
    weeklyActiveUsers,
    contentCreated,
    recommendationResponseRate,
    inviteSignups,
    returnRate30d,
  };
}

/**
 * `metrics_content_created` toplam içerik adedi (tavsiye M17'ye dek 0 katılır).
 * Panele tek sayı lazımsa bu kullanılır; tür kırılımı kartın alt başlığında.
 */
export function totalContentCreated(metric: ContentCreatedMetric | null): number {
  if (!metric) return 0;
  return (
    metric.events_total +
    metric.cadde_posts_total +
    metric.carsi_items_total +
    metric.groups_total +
    metric.group_posts_total +
    metric.recommendations_total
  );
}

/**
 * Oranı (0–1) yüzde string'ine çevirir. `null` → "—" (uydurma sayı yok: cohort
 * boşsa ya da tavsiye modülü gelene dek rate null döner, M14 sözleşmesi).
 */
export function formatRatePercent(rate: number | null): string {
  if (rate === null || rate === undefined || Number.isNaN(rate)) return "—";
  return `%${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(rate * 100)}`;
}
