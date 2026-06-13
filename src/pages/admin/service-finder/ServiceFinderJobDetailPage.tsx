// /admin/service-finder/jobs/:jobId — sekmeli iş detayı:
// Özet / Sorgular / Kaynaklar / Adaylar / Maliyetler / Olaylar.
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ServiceFinderFetchStatusBadge,
  ServiceFinderJobStatusBadge,
  ServiceFinderReviewStatusBadge,
} from "@/components/admin/service-finder/ServiceFinderBadges";
import { ServiceFinderBudgetMeter } from "@/components/admin/service-finder/ServiceFinderBudgetMeter";
import { ServiceFinderCandidateDrawer } from "@/components/admin/service-finder/ServiceFinderCandidateDrawer";
import {
  useCancelServiceFinderJob,
  useRetryServiceFinderJob,
  useServiceFinderJobDetail,
} from "@/hooks/useServiceFinder";
import {
  formatConfidence,
  formatDateTime,
  formatUsd,
} from "@/lib/service-finder-format";
import type { ServiceFinderCandidateRow } from "@/lib/service-finder-schemas";

export default function ServiceFinderJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data, isLoading, error } = useServiceFinderJobDetail(jobId);
  const cancelJob = useCancelServiceFinderJob();
  const retryJob = useRetryServiceFinderJob();
  const [selectedCandidate, setSelectedCandidate] = useState<ServiceFinderCandidateRow | null>(null);

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Yükleniyor...</p>;
  }
  if (error || !data?.job) {
    return (
      <div className="space-y-2 py-8 text-center">
        <p className="text-sm text-muted-foreground">İş bulunamadı.</p>
        <Link to="/admin/service-finder/jobs" className="text-sm text-blue-600 hover:underline">
          İş listesine dön
        </Link>
      </div>
    );
  }

  const { job, queries, sources, candidates, costs, events } = data;
  const cancellable = job.status === "queued" || job.status === "running";
  const retryable = ["failed", "cancelled", "budget_stopped"].includes(job.status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-bold">{job.title}</h1>
            <ServiceFinderJobStatusBadge status={job.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {job.role_key} · {job.location_label} · {formatDateTime(job.created_at)}
          </p>
          {job.last_error_message && (
            <p className="mt-1 text-sm text-red-600">
              Hata: {job.last_error_code} — {job.last_error_message}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {cancellable && (
            <Button variant="outline" size="sm" disabled={cancelJob.isPending} onClick={() => cancelJob.mutate(job.id)}>
              İptal Et
            </Button>
          )}
          {retryable && (
            <Button variant="outline" size="sm" disabled={retryJob.isPending} onClick={() => retryJob.mutate({ jobId: job.id })}>
              Yeniden Dene
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Bütçe</p>
            <ServiceFinderBudgetMeter
              costTotalUsd={job.cost_total_usd}
              softCapUsd={job.soft_cap_usd}
              hardCapUsd={job.hard_cap_usd}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sorgular</p>
            <p className="text-xl font-semibold">{job.search_requests}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ekstraksiyon</p>
            <p className="text-xl font-semibold">{job.extract_requests}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Aday</p>
            <p className="text-xl font-semibold">{candidates.length}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="candidates">
        <TabsList>
          <TabsTrigger value="candidates">Adaylar ({candidates.length})</TabsTrigger>
          <TabsTrigger value="queries">Sorgular ({queries.length})</TabsTrigger>
          <TabsTrigger value="sources">Kaynaklar ({sources.length})</TabsTrigger>
          <TabsTrigger value="costs">Maliyetler ({costs.length})</TabsTrigger>
          <TabsTrigger value="events">Olaylar ({events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İsim</TableHead>
                    <TableHead>Şehir</TableHead>
                    <TableHead>Güven</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Hizmetler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        Henüz aday yok.
                      </TableCell>
                    </TableRow>
                  )}
                  {candidates.map((candidate) => (
                    <TableRow
                      key={candidate.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <TableCell className="font-medium">{candidate.canonical_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{candidate.city ?? "—"}</TableCell>
                      <TableCell className="text-sm tabular-nums">{formatConfidence(candidate.confidence_score)}</TableCell>
                      <TableCell>
                        <ServiceFinderReviewStatusBadge status={candidate.review_status} />
                      </TableCell>
                      <TableCell className="max-w-64 truncate text-sm text-muted-foreground">
                        {(candidate.services ?? []).join(", ") || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sorgu</TableHead>
                    <TableHead>Sağlayıcı</TableHead>
                    <TableHead className="text-right">Sonuç</TableHead>
                    <TableHead className="text-right">Maliyet</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queries.map((query) => (
                    <TableRow key={query.id}>
                      <TableCell className="max-w-80 truncate text-sm">{query.query_text}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{query.provider_key}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{query.result_count}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatUsd(query.estimated_cost_usd)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{query.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Alan Adı</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="max-w-96 truncate text-sm">
                        <a href={source.source_url} target="_blank" rel="noreferrer noopener" className="hover:underline">
                          {source.source_title ?? source.source_url}
                        </a>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{source.source_domain}</TableCell>
                      <TableCell>
                        <ServiceFinderFetchStatusBadge status={source.fetch_status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zaman</TableHead>
                    <TableHead>Sağlayıcı</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(cost.created_at)}</TableCell>
                      <TableCell className="text-sm">{cost.provider_key}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cost.event_type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cost.model_name ?? "—"}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatUsd(cost.amount_usd)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Olay günlüğü</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {events.map((event) => (
                  <li key={event.id} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(event.created_at)}</span>
                    <span
                      className={
                        event.event_level === "error"
                          ? "text-red-600"
                          : event.event_level === "warn"
                            ? "text-orange-600"
                            : ""
                      }
                    >
                      <span className="font-medium">{event.event_type}</span> — {event.message}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ServiceFinderCandidateDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}
