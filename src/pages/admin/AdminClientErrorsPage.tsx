// Admin — İstemci Hataları (client_error_reports). m134 gibi "tekrar üretilemeyen"
// tarayıcı hatalarının kalıcı kanıtı: ham Postgres kodu/detayı, rota, kullanıcı,
// render hatalarında bileşen yığını. Yazma yolu: src/lib/client-error-reports.ts.

import { useMemo, useState } from "react";
import { Bug } from "lucide-react";

import {
  AdminEmptyState,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageShell,
} from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminClientErrors } from "@/hooks/admin/useAdminClientErrors";
import {
  CLIENT_ERROR_SOURCE_FILTER_ALL as SOURCE_FILTER_ALL,
  CLIENT_ERROR_SOURCE_LABELS,
  filterClientErrorReports,
} from "@/lib/admin-shell/admin-client-errors-api";
import { resolveAdminUserLabel } from "@/lib/admin-shell/admin-user-labels";
import type { ClientErrorSource } from "@/lib/client-error-reports";

const SOURCE_ORDER: ClientErrorSource[] = ["cadde_write", "cadde_read", "render", "unhandled"];

const SOURCE_BADGE_CLASS: Record<ClientErrorSource, string> = {
  cadde_write: "border-rose-200 bg-rose-50 text-rose-800",
  cadde_read: "border-amber-200 bg-amber-50 text-amber-800",
  render: "border-violet-200 bg-violet-50 text-violet-800",
  unhandled: "border-slate-200 bg-slate-50 text-slate-700",
};

const AdminClientErrorsPage = () => {
  const { data, isLoading, error, refetch } = useAdminClientErrors();
  const [sourceFilter, setSourceFilter] = useState<string>(SOURCE_FILTER_ALL);
  const [searchText, setSearchText] = useState("");

  const reports = useMemo(() => data?.reports ?? [], [data]);
  const users = data?.users ?? [];

  const filtered = useMemo(
    () => filterClientErrorReports(reports, { source: sourceFilter, search: searchText }),
    [reports, sourceFilter, searchText],
  );

  const hasActiveFilters = sourceFilter !== SOURCE_FILTER_ALL || searchText.trim().length > 0;

  return (
    <AdminPageShell
      title="İstemci Hataları"
      eyebrow="Tanılama"
      description="Tarayıcıda yakalanan hataların kalıcı kaydı: Cadde yazma/okuma yolları ve render hata sınırları. Son 200 kayıt; 90 gün saklanır."
      icon={Bug}
      accent="sky"
      contentWidth="wide"
      filters={
        <AdminFilterBar
          onReset={
            hasActiveFilters
              ? () => {
                  setSourceFilter(SOURCE_FILTER_ALL);
                  setSearchText("");
                }
              : undefined
          }
        >
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-9 w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SOURCE_FILTER_ALL}>Tüm kaynaklar</SelectItem>
              {SOURCE_ORDER.map((source) => (
                <SelectItem key={source} value={source}>
                  {CLIENT_ERROR_SOURCE_LABELS[source]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Bağlam / mesaj / kod / rota ara…"
            className="h-9 w-full sm:w-80"
          />
        </AdminFilterBar>
      }
    >
      {isLoading ? <AdminLoadingState label="Hata kayıtları yükleniyor..." /> : null}

      {error ? (
        <AdminErrorState
          title="Hata kayıtları alınamadı"
          description={
            error instanceof Error
              ? `${error.message} — tablo canlıda yoksa migration 20260904210000_client_error_reports uygulanmalı.`
              : "Bilinmeyen hata"
          }
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !error ? (
        <div className="space-y-3">
          {filtered.map((report) => (
            <article key={report.id} className="rounded-xl border p-4" data-testid="client-error-row">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`text-[11px] ${SOURCE_BADGE_CLASS[report.source]}`}>
                      {CLIENT_ERROR_SOURCE_LABELS[report.source]}
                    </Badge>
                    <span className="font-mono text-xs font-medium">{report.context}</span>
                    {report.error_code ? (
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {report.error_code}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="break-words text-sm text-foreground">{report.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {resolveAdminUserLabel(users, report.user_id)}
                    {report.route ? ` · ${report.route}` : ""}
                    {` · ${new Date(report.created_at).toLocaleString("tr-TR")}`}
                  </p>
                </div>
              </div>
              {report.details || report.hint || report.component_stack ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                    Ayrıntı
                  </summary>
                  <div className="mt-2 grid gap-2">
                    {report.details ? (
                      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{report.details}</pre>
                    ) : null}
                    {report.hint ? (
                      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{report.hint}</pre>
                    ) : null}
                    {report.component_stack ? (
                      <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">
                        {report.component_stack}
                      </pre>
                    ) : null}
                    {report.user_agent ? (
                      <p className="text-[11px] text-muted-foreground">{report.user_agent}</p>
                    ) : null}
                  </div>
                </details>
              ) : null}
            </article>
          ))}

          {filtered.length === 0 ? (
            <AdminEmptyState
              icon={Bug}
              title={hasActiveFilters ? "Filtreye uygun kayıt yok" : "Henüz kayıt yok"}
              description={
                hasActiveFilters
                  ? "Filtreyi sıfırlayıp tekrar dene."
                  : "Tarayıcıda bir Cadde yazma/okuma hatası ya da render hatası oluştuğunda kayıt buraya düşer."
              }
            />
          ) : null}
        </div>
      ) : null}
    </AdminPageShell>
  );
};

export default AdminClientErrorsPage;
