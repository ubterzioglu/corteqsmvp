import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Loader2, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RadarCandidateCard } from "@/components/admin/radar/RadarCandidateCard";
import {
  listCandidates,
  approveCandidate,
  rejectCandidate,
  markDuplicate,
  triggerManualScan,
  type RadarCandidate,
  type RadarReviewStatus,
} from "@/lib/radarNewsPipeline";

const STATUS_TABS: { value: RadarReviewStatus | "all"; label: string }[] = [
  { value: "pending", label: "Bekleyenler" },
  { value: "approved", label: "Onaylananlar" },
  { value: "rejected", label: "Reddedilenler" },
  { value: "duplicate", label: "Duplicate" },
  { value: "archived", label: "Arşiv" },
  { value: "all", label: "Tümü" },
];

const AdminRadarQueuePage = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<RadarReviewStatus | "all">("pending");
  const [candidates, setCandidates] = useState<RadarCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCandidates(await listCandidates(status));
    } catch (err) {
      toast({ title: "Kuyruk yüklenemedi", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [status, toast]);

  useEffect(() => { void load(); }, [load]);

  const handleApprovePool = async (id: string, note?: string) => {
    await approveCandidate(id, { publishToMarquee: false, reviewNote: note });
    toast({ title: "Haber havuzuna onaylandı" });
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const handleApprovePublish = async (id: string, note?: string) => {
    await approveCandidate(id, { publishToMarquee: true, reviewNote: note });
    toast({ title: "Haber onaylandı ve Radar'a yayınlandı" });
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const handleReject = async (id: string, note?: string) => {
    await rejectCandidate(id, note);
    toast({ title: "Haber reddedildi" });
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const handleMarkDuplicate = (id: string) => {
    const first = candidates.find((c) => c.id !== id);
    if (!first) { toast({ title: "Referans aday bulunamadı", variant: "destructive" }); return; }
    void markDuplicate(id, first.id).then(() => {
      toast({ title: "Duplicate olarak işaretlendi" });
      setCandidates((prev) => prev.filter((c) => c.id !== id));
    });
  };

  const handleScanNow = async () => {
    setScanning(true);
    try {
      const result = await triggerManualScan({ dryRun: false });
      const r = result as Record<string, number>;
      toast({
        title: "Tarama tamamlandı",
        description: `${r["insertedCount"] ?? 0} yeni aday, ${r["duplicateCount"] ?? 0} duplicate, ${r["filteredCount"] ?? 0} filtrelendi`,
      });
      await load();
    } catch (err) {
      toast({ title: "Tarama başlatılamadı", description: String(err), variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const pendingCount = candidates.filter((c) => c.review_status === "pending").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary" />
                Radar Haber Kuyruğu
              </CardTitle>
              <CardDescription>
                Harici kaynaklardan gelen haberleri inceleyin, onaylayın veya reddedin.
                Onaylanan haberler news_posts havuzuna ve isteğe bağlı olarak Radar bandına aktarılır.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </Button>
              <Button size="sm" onClick={() => void handleScanNow()} disabled={scanning}>
                {scanning ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                Şimdi Tara
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={status === tab.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(tab.value)}
              >
                {tab.label}
                {tab.value === "pending" && pendingCount > 0 && (
                  <Badge className="ml-1 h-4 px-1 text-[10px]">{pendingCount}</Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Yükleniyor...
        </div>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {status === "pending" ? "Bekleyen haber yok." : "Kayıt yok."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {candidates.map((c) => (
            <RadarCandidateCard
              key={c.id}
              candidate={c}
              onApprovePool={handleApprovePool}
              onApprovePublish={handleApprovePublish}
              onReject={handleReject}
              onMarkDuplicate={handleMarkDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRadarQueuePage;
