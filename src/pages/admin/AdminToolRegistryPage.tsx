// Agent Tool Registry — admin görünümü.
// İçerik tek kaynaktan gelir: docs/agent/tools.json (scripts/ingest-tools.mjs üretir).
// Bir ajan/geliştirici hangi tool'un aktif/deprecated olduğunu, girdi şemasını,
// kullandığı tabloları ve versiyon pin'lerini buradan kaynak kod okumadan görür.
// Salt-okuma; düzenleme yoktur. Güncellemek için: `npm run ingest:tools`.

import { useMemo, useState } from "react";
import { BookOpen, Boxes, Cloud, Cpu, FileCode2, Search, Terminal } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminPageShell } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trIncludes } from "@/lib/text-normalization";
import { toolCatalog as catalog } from "@/lib/agent/tools-catalog.generated";

type CatalogTool = {
  tool_key: string;
  tool_name: string;
  family: string;
  status: string;
  entrypoint: string;
  interface_kind: string;
  input_schema?: { validation?: string; fields?: string[] };
  tables_read_write?: string[];
  rpcs?: string[];
  exports?: string[];
  dependencies?: string[];
  version_pins?: Record<string, string | null>;
  node_engine?: string | null;
  description?: string | null;
  commands?: string[];
};

const FAMILY_META: Record<
  string,
  { label: string; icon: typeof Cpu; accent: string }
> = {
  edge_function: { label: "Edge Function (HTTP)", icon: Cloud, accent: "text-sky-500" },
  worker: { label: "Worker (arka plan)", icon: Cpu, accent: "text-violet-500" },
  ui_module: { label: "UI Modülü (dahili API)", icon: FileCode2, accent: "text-emerald-500" },
  script: { label: "CLI Script", icon: Terminal, accent: "text-amber-500" },
};

const FAMILY_ORDER = ["edge_function", "worker", "ui_module", "script"];

const tools = catalog.tools as unknown as CatalogTool[];

const AdminToolRegistryPage = () => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return tools;
    return tools.filter(
      (t) =>
        trIncludes(t.tool_name, query) ||
        trIncludes(t.tool_key, query) ||
        trIncludes(t.entrypoint, query) ||
        (t.tables_read_write ?? []).some((tbl) => trIncludes(tbl, query)),
    );
  }, [query]);

  const groups = useMemo(() => {
    const byFamily = new Map<string, CatalogTool[]>();
    for (const t of filtered) {
      if (!byFamily.has(t.family)) byFamily.set(t.family, []);
      byFamily.get(t.family)!.push(t);
    }
    return FAMILY_ORDER.filter((f) => byFamily.has(f)).map((f) => ({
      family: f,
      meta: FAMILY_META[f] ?? { label: f, icon: Boxes, accent: "text-muted-foreground" },
      items: byFamily.get(f)!,
    }));
  }, [filtered]);

  const deprecatedCount = tools.filter((t) => t.status === "deprecated").length;

  return (
    <AdminPageShell
      title="Araç Kataloğu (Tool Registry)"
      description="Platformun tüm çalıştırılabilir araçları — edge function, worker, modül ve script'ler. Bu liste koddan otomatik üretilir; bir aracı ajan da geliştirici de kaynak kod okumadan buradan tanır."
      icon={Boxes}
      accent="indigo"
    >
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Badge variant="secondary">{tools.length} araç</Badge>
        <Badge variant="secondary">{catalog.counts.edge_functions} edge function</Badge>
        <Badge variant="secondary">{catalog.counts.workers} worker</Badge>
        <Badge variant="secondary">{catalog.counts.ui_modules} modül</Badge>
        {deprecatedCount > 0 && (
          <Badge variant="destructive">{deprecatedCount} kullanımdan kaldırıldı</Badge>
        )}
        <Link
          to="/admin/guide#agent-altyapisi"
          className="ml-auto inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <BookOpen className="h-4 w-4" /> Kullanım kılavuzu
        </Link>
      </div>

      <div className="relative mt-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Araç adı, dosya veya tablo ara…"
          className="pl-9"
        />
      </div>

      {groups.map((group) => {
        const Icon = group.meta.icon;
        return (
          <section key={group.family} className="mt-6 space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Icon className={`h-4 w-4 ${group.meta.accent}`} />
              {group.meta.label}
              <span className="font-normal normal-case">({group.items.length})</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {group.items.map((tool) => (
                <Card key={tool.tool_key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{tool.tool_name}</CardTitle>
                      <Badge
                        variant={tool.status === "deprecated" ? "destructive" : "outline"}
                        className="shrink-0"
                      >
                        {tool.status === "deprecated" ? "kaldırıldı" : "aktif"}
                      </Badge>
                    </div>
                    <CardDescription className="font-mono text-xs">
                      {tool.entrypoint}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {tool.description && <p>{tool.description}</p>}

                    {tool.input_schema?.validation && (
                      <p>
                        <span className="font-medium text-foreground">Girdi:</span>{" "}
                        {tool.input_schema.validation === "zod" ? "Zod şeması" : "elle doğrulama"}
                        {tool.input_schema.fields?.length
                          ? ` · ${tool.input_schema.fields.join(", ")}`
                          : ""}
                      </p>
                    )}

                    {!!tool.tables_read_write?.length && (
                      <p>
                        <span className="font-medium text-foreground">Tablolar:</span>{" "}
                        {tool.tables_read_write.join(", ")}
                      </p>
                    )}

                    {!!tool.rpcs?.length && (
                      <p>
                        <span className="font-medium text-foreground">RPC:</span>{" "}
                        {tool.rpcs.join(", ")}
                      </p>
                    )}

                    {!!tool.exports?.length && (
                      <p className="line-clamp-2">
                        <span className="font-medium text-foreground">Fonksiyonlar:</span>{" "}
                        {tool.exports.join(", ")}
                      </p>
                    )}

                    {tool.node_engine && (
                      <p>
                        <span className="font-medium text-foreground">Node:</span> {tool.node_engine}
                      </p>
                    )}

                    {tool.version_pins?.["@supabase/supabase-js"] && (
                      <p>
                        <span className="font-medium text-foreground">supabase-js:</span>{" "}
                        {tool.version_pins["@supabase/supabase-js"]}
                      </p>
                    )}

                    {!!tool.commands?.length && (
                      <p className="line-clamp-3">
                        <span className="font-medium text-foreground">Komutlar:</span>{" "}
                        {tool.commands.join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {groups.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          "{query}" için araç bulunamadı.
        </p>
      )}
    </AdminPageShell>
  );
};

export default AdminToolRegistryPage;
