import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RadarSourceForm } from "@/components/admin/radar/RadarSourceForm";
import {
  listRadarSources,
  updateRadarSource,
  type RadarNewsSource,
} from "@/lib/radarNewsPipeline";

const AdminRadarSourcesPage = () => {
  const { toast } = useToast();
  const [sources, setSources] = useState<RadarNewsSource[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSources(await listRadarSources());
    } catch (err) {
      toast({ title: "Kaynaklar yüklenemedi", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (id: string, patch: Partial<RadarNewsSource>) => {
    const updated = await updateRadarSource(id, patch);
    setSources((prev) => prev.map((s) => (s.id === id ? updated : s)));
    toast({ title: "Kaynak güncellendi" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Haber Kaynakları</CardTitle>
              <CardDescription>
                RSS, Atom ve GDELT kaynaklarını yönetin. Bir kaynak yalnızca kullanım şartları
                onaylandıktan sonra aktif edilebilir.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
            <strong>Kaynak açma kuralı:</strong> Her yeni RSS kaynağı için kullanım şartları,
            syndication izni ve ticari kullanım kısıtları manuel olarak kontrol edilmeli ve
            "Şart Notları" alanına kaydedilmelidir. GDELT açık veri olduğu için doğrudan aktiftir.
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Yükleniyor...
        </div>
      ) : sources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Kayıtlı kaynak yok.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sources.map((source) => (
            <RadarSourceForm key={source.id} source={source} onSave={handleSave} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRadarSourcesPage;
