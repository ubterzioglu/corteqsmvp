// /admin/service-finder/jobs — filtrelenebilir sayfalı iş listesi.
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServiceFinderJobStatusBadge } from "@/components/admin/service-finder/ServiceFinderBadges";
import {
  useCancelServiceFinderJob,
  useRetryServiceFinderJob,
  useServiceFinderJobs,
} from "@/hooks/useServiceFinder";
import { JOB_STATUS_LABELS, formatDateTime, formatUsd } from "@/lib/service-finder-format";
import type { ServiceFinderJobStatus } from "@/lib/service-finder-schemas";

const PAGE_SIZE = 25;

export default function ServiceFinderJobsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const status = statusFilter === "all" ? null : statusFilter;

  const { data, isLoading } = useServiceFinderJobs(status, page, PAGE_SIZE);
  const cancelJob = useCancelServiceFinderJob();
  const retryJob = useRetryServiceFinderJob();

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">İşler</h1>
          <p className="text-sm text-muted-foreground">{total} kayıt</p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm durumlar</SelectItem>
            {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlık</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Lokasyon</TableHead>
                <TableHead className="text-right">Maliyet</TableHead>
                <TableHead>Oluşturma</TableHead>
                <TableHead className="text-right">Aksiyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Kayıt bulunamadı.
                  </TableCell>
                </TableRow>
              )}
              {jobs.map((job) => {
                const cancellable = job.status === "queued" || job.status === "running";
                const retryable = ["failed", "cancelled", "budget_stopped"].includes(job.status);
                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link
                        to={`/admin/service-finder/jobs/${job.id}`}
                        className="font-medium hover:underline"
                      >
                        {job.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ServiceFinderJobStatusBadge status={job.status as ServiceFinderJobStatus} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{job.location_label}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatUsd(job.cost_total_usd)} / {formatUsd(job.hard_cap_usd)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(job.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {cancellable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={cancelJob.isPending}
                          onClick={() => cancelJob.mutate(job.id)}
                        >
                          İptal
                        </Button>
                      )}
                      {retryable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={retryJob.isPending}
                          onClick={() => retryJob.mutate({ jobId: job.id })}
                        >
                          Yeniden Dene
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Önceki
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            Sonraki
          </Button>
        </div>
      )}
    </div>
  );
}
