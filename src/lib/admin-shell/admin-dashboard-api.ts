// Admin Panel V2 — dashboard özet metrikleri.
// İlk sürüm: mevcut tablolardan güvenli count sorguları (masterplan §8.2).
// Her metrik bağımsız hesaplanır; başarısız olan metrik null döner ve UI
// graceful fallback gösterir. Çok istek soruna dönüşürse ikinci sürümde
// tek get_admin_dashboard_summary() RPC'sine geçilebilir.

import { supabase } from "@/integrations/supabase/client";

export type AdminDashboardSummary = {
  /** Toplam katalog kaydı. Hesaplanamazsa null. */
  catalogItems: number | null;
  /** Tanımlı flat rol sayısı. */
  roles: number | null;
  /** status="pending" approval_requests sayısı. */
  pendingApprovals: number | null;
  /** Aktif kullanıcı feature override sayısı. */
  featureOverrides: number | null;
  /** Son 24 saatteki admin_audit_logs kaydı. */
  auditLogsLast24h: number | null;
};

type CountQuery = PromiseLike<{ count: number | null; error: unknown }>;

async function safeCount(label: string, query: CountQuery): Promise<number | null> {
  try {
    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  } catch (error: unknown) {
    console.error(`Dashboard metriği hesaplanamadı (${label}):`, error);
    return null;
  }
}

export async function fetchAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [catalogItems, roles, pendingApprovals, featureOverrides, auditLogsLast24h] =
    await Promise.all([
      safeCount(
        "catalogItems",
        supabase.from("catalog_items").select("id", { count: "exact", head: true }),
      ),
      safeCount("roles", supabase.from("roles").select("key", { count: "exact", head: true })),
      safeCount(
        "pendingApprovals",
        supabase
          .from("approval_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ),
      safeCount(
        "featureOverrides",
        supabase.from("user_feature_overrides").select("user_id", { count: "exact", head: true }),
      ),
      safeCount(
        "auditLogsLast24h",
        supabase
          .from("admin_audit_logs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", last24h),
      ),
    ]);

  return { catalogItems, roles, pendingApprovals, featureOverrides, auditLogsLast24h };
}
