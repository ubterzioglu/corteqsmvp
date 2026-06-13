// /admin/service-finder — özet kartlar + hızlı iş oluşturma + son işler.
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceFinderJobCreateForm } from "@/components/admin/service-finder/ServiceFinderJobCreateForm";
import { ServiceFinderJobStatusBadge } from "@/components/admin/service-finder/ServiceFinderBadges";
import { useServiceFinderCostSummary, useServiceFinderJobs } from "@/hooks/useServiceFinder";
import { formatUsd } from "@/lib/service-finder-format";

export default function ServiceFinderDashboardPage() {
  const { data: jobsData, isLoading } = useServiceFinderJobs(null, 0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data: costSummary } = useServiceFinderCostSummary(monthStart);

  const jobs = jobsData?.jobs ?? [];
  const activeCount = jobs.filter((job) => job.status === "queued" || job.status === "running").length;
  const reviewCount = jobs.filter((job) => job.status === "review").length;
  const budgetStops = jobs.filter((job) => job.status === "budget_stopped").length;
  const monthlySpend = (costSummary ?? []).reduce((sum, row) => sum + row.total_amount_usd, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hizmet Bulucu</h1>
        <p className="text-sm text-muted-foreground">
          AI destekli hizmet sağlayıcı keşfi — iş kuyruğu, aday incelemesi ve katalog yayını.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aylık Harcama</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatUsd(monthlySpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktif İş</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">İncelemede</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{reviewCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bütçe Durdurması</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{budgetStops}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hızlı İş Oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceFinderJobCreateForm compact />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Son İşler</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
          {!isLoading && jobs.length === 0 && (
            <p className="text-sm text-muted-foreground">Henüz iş yok. Yukarıdan ilk işi oluştur.</p>
          )}
          <ul className="divide-y">
            {jobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-3 py-2">
                <Link
                  to={`/admin/service-finder/jobs/${job.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                >
                  {job.title}
                </Link>
                <ServiceFinderJobStatusBadge status={job.status} />
                <span className="w-20 text-right text-sm tabular-nums">{formatUsd(job.cost_total_usd)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
