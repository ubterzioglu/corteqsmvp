// Admin Panel V2 — operasyonel dashboard (/admin, masterplan §8).
// Bloklar: welcome hero, KPI strip, dikkat isteyenler, hızlı işlemler,
// favoriler + son kullanılanlar, modül kartları. Metrikler React Query ile
// lib/admin-shell/admin-dashboard-api üzerinden gelir; başarısız metrik
// graceful fallback gösterir.

import { AlertTriangle } from "lucide-react";

import { useAdminOutletContext } from "@/components/admin/shell/AdminShell";
import { useAdminDashboardSummary } from "@/hooks/admin/useAdminDashboardSummary";

import AdminAttentionQueue from "@/components/admin/dashboard/AdminAttentionQueue";
import AdminDashboardHero from "@/components/admin/dashboard/AdminDashboardHero";
import AdminDashboardKpis from "@/components/admin/dashboard/AdminDashboardKpis";
import AdminFavorites from "@/components/admin/dashboard/AdminFavorites";
import AdminModuleGrid from "@/components/admin/dashboard/AdminModuleGrid";
import AdminQuickActions from "@/components/admin/dashboard/AdminQuickActions";
import AdminRecentPages from "@/components/admin/dashboard/AdminRecentPages";

const AdminDashboardPage = () => {
  const { session } = useAdminOutletContext();
  const { data: summary, isLoading, isError } = useAdminDashboardSummary();

  return (
    <div className="space-y-4">
      <AdminDashboardHero email={session?.user.email} summary={summary} />

      {isError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-500/10 px-3 py-2.5 text-sm text-foreground"
        >
          <AlertTriangle aria-hidden="true" className="h-4 w-4 text-amber-600" />
          Özet metrikler şu an yüklenemedi. Ekran linkleri çalışmaya devam ediyor.
        </div>
      )}

      <AdminDashboardKpis summary={summary} isLoading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminAttentionQueue summary={summary} isLoading={isLoading} />
        <AdminQuickActions />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminFavorites />
        <AdminRecentPages />
      </div>

      <AdminModuleGrid />
    </div>
  );
};

export default AdminDashboardPage;
