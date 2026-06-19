// Admin — Relocation ingestion iş listesi (service-finder JobsPage kalıbı, sade).
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listIngestionJobs } from "@/lib/relocation-admin-api";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  queued: "secondary",
  running: "default",
  review: "default",
  completed: "outline",
  failed: "destructive",
  budget_stopped: "destructive",
  cancelled: "outline",
};

export default function RelocationJobsPage() {
  const jobsQuery = useQuery({
    queryKey: ["relocation", "admin", "jobs"],
    queryFn: () => listIngestionJobs(),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Taşınma — Veri Toplama İşleri</h1>
        <p className="text-sm text-muted-foreground">
          Worker (relocation-ingestion) tarafından claim edilen işler ve durumları.
        </p>
      </div>

      {jobsQuery.isLoading && <p className="text-sm text-muted-foreground">Yükleniyor…</p>}
      {jobsQuery.isError && (
        <p className="text-sm text-destructive">İşler yüklenemedi.</p>
      )}

      <div className="space-y-2">
        {(jobsQuery.data ?? []).map((job) => (
          <Card key={job.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">{job.title}</CardTitle>
                <Badge variant={STATUS_VARIANT[job.status] ?? "outline"} className="text-xs">
                  {job.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>Tür: {job.target_kind}</span>
                {job.service_category && <span>Kategori: {job.service_category}</span>}
                <span>
                  Konum: {job.country_code}
                  {job.city_code ? ` / ${job.city_code}` : ""}
                </span>
                <span>Maliyet: ${Number(job.cost_total_usd).toFixed(4)}</span>
                <span>Deneme: {job.attempts}</span>
              </div>
              {job.last_error_message && (
                <p className="mt-1 text-destructive">Hata: {job.last_error_message}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {jobsQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Henüz iş yok.</p>
        )}
      </div>
    </div>
  );
}
