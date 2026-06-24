// Agent Analytics & Skor Denetimi (Faz 5) — salt-okuma admin paneli.
// Kaynak tasarım: newtools.md §"Skorlama, gizlilik ve yönetici deneyimi".
// Tool sağlığı + routing skor breakdown + gizlilik/retention özeti.
// ops.* tabloları henüz boş olabilir; sayfa katalog + skor modelinden beslenir.

import { useMemo } from "react";
import { Activity, Gauge, ShieldCheck } from "lucide-react";

import { AdminPageShell } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toolCatalog } from "@/lib/agent/tools-catalog.generated";
import {
  confidenceBand,
  contractCompleteness,
  scoreFeatures,
  type RouteFeatures,
} from "@/lib/agent/tool-router";

type CatalogTool = {
  tool_key: string;
  tool_name: string;
  family: string;
  status: string;
  input_schema?: { validation?: string; fields?: string[] };
};

const tools = toolCatalog.tools as unknown as CatalogTool[];

// Demo amaçlı sabit feature profili (gerçek telemetri gelince ops.* ile değişir).
// determinism/availability katalogtan; intent/freshness/latency varsayılan orta.
function demoFeatures(tool: CatalogTool): RouteFeatures {
  const eligible = tool.status === "active";
  return {
    intent: 0.6,
    contract: contractCompleteness(tool),
    privacy: tool.input_schema?.validation === "zod" ? 0.8 : 0.6,
    freshness: 0.7,
    latency: tool.family === "edge_function" ? 0.7 : 0.6,
    determinism: tool.input_schema?.validation === "zod" ? 0.85 : 0.6,
    availability: eligible ? 0.9 : 0,
  };
}

const BAND_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  high: { label: "yüksek güven", variant: "default" },
  medium: { label: "orta güven", variant: "secondary" },
  low: { label: "ikincil", variant: "outline" },
  reject: { label: "gösterme", variant: "destructive" },
};

const AdminAgentAnalyticsPage = () => {
  const scored = useMemo(() => {
    return tools
      .filter((t) => t.family === "edge_function" || t.family === "worker")
      .map((t) => {
        const features = demoFeatures(t);
        const score = t.status === "active" ? scoreFeatures(features) : 0;
        return { tool: t, features, score, band: confidenceBand(score) };
      })
      .sort((a, b) => b.score - a.score);
  }, []);

  const activeCount = tools.filter((t) => t.status === "active").length;
  const deprecatedCount = tools.filter((t) => t.status === "deprecated").length;

  return (
    <AdminPageShell
      title="Agent Analitik & Skor Denetimi"
      description="Araç sağlığı, yönlendirme (routing) skorları ve gizlilik özeti. Skorlar çok ölçütlü modelle hesaplanır; gerçek kullanım telemetrisi geldikçe canlı verilerle güncellenir."
      icon={Activity}
      accent="red"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktif araç</CardDescription>
            <CardTitle className="text-2xl">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kullanımdan kalkmış</CardDescription>
            <CardTitle className="text-2xl">{deprecatedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Skorlanan endpoint</CardDescription>
            <CardTitle className="text-2xl">{scored.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-violet-500" /> Yönlendirme Skoru (tool selection)
          </CardTitle>
          <CardDescription>
            S = 100 × (0.30·niyet + 0.20·sözleşme + 0.15·gizlilik + 0.10·tazelik + 0.10·gecikme + 0.10·belirlilik + 0.05·erişilebilirlik)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {scored.map(({ tool, score, band }) => (
            <div
              key={tool.tool_key}
              className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{tool.tool_name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{tool.tool_key}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={BAND_LABEL[band].variant}>{BAND_LABEL[band].label}</Badge>
                <span className="w-12 text-right font-mono text-sm tabular-nums">{score.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Gizlilik & Saklama
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Telemetri yazılmadan önce serbest metin redakte edilir (e-posta, telefon, URL, TC kimlik).</li>
            <li>Doğrudan tanımlayıcılar HMAC-SHA256 ile pseudonymize edilir; ham kimlik saklanmaz.</li>
            <li>Ham yürütme kayıtları varsayılan 90 gün sonra silinir (retention RPC).</li>
            <li>Günlük raporlarda k-anonimlik eşiği (k≥20) altındaki küçük kümeler baskılanır.</li>
            <li>ops.* tabloları yalnız yönetici erişimine açıktır (RLS deny-all default).</li>
          </ul>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
};

export default AdminAgentAnalyticsPage;
