import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RadarScanRunTable } from "@/components/admin/radar/RadarScanRunTable";
import { listScanRuns, type RadarScanRun } from "@/lib/radarNewsPipeline";

const AdminRadarRunsPage = () => {
  const { toast } = useToast();
  const [runs, setRuns] = useState<RadarScanRun[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRuns(await listScanRuns(100));
    } catch (err) {
      toast({ title: "Tarama geçmişi yüklenemedi", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const totalInserted = runs.reduce((s, r) => s + r.inserted_count, 0);
  const totalFetched = runs.reduce((s, r) => s + r.fetched_count, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Tarama Geçmişi</CardTitle>
              <CardDescription>
                Günlük cron ve manuel taramaların sonuçlarını izleyin.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Toplam Tarama</p>
              <p className="text-2xl font-bold tabular-nums">{runs.length}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Toplam Çekilen</p>
              <p className="text-2xl font-bold tabular-nums">{totalFetched}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Toplam Eklenen</p>
              <p className="text-2xl font-bold tabular-nums text-green-600">{totalInserted}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Başarı Oranı</p>
              <p className="text-2xl font-bold tabular-nums">
                {runs.length > 0
                  ? `${Math.round((runs.filter((r) => r.status === "completed").length / runs.length) * 100)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <RadarScanRunTable runs={runs} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRadarRunsPage;
