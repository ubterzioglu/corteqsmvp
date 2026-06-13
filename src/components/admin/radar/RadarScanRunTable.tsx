import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RadarScanRun } from "@/lib/radarNewsPipeline";

type Props = {
  runs: RadarScanRun[];
  loading: boolean;
};

const STATUS_VARIANTS: Record<string, "outline" | "secondary" | "destructive"> = {
  completed: "outline",
  partial: "secondary",
  failed: "destructive",
  running: "secondary",
};

function formatDuration(start: string, end: string | null) {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(val: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(val));
}

export function RadarScanRunTable({ runs, loading }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tarih</TableHead>
          <TableHead>Tetik</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="text-right">Kaynak</TableHead>
          <TableHead className="text-right">Çekilen</TableHead>
          <TableHead className="text-right">Eklenen</TableHead>
          <TableHead className="text-right">Duplicate</TableHead>
          <TableHead className="text-right">Filtre</TableHead>
          <TableHead className="text-right">Hata</TableHead>
          <TableHead className="text-right">Süre</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center text-muted-foreground">Yükleniyor...</TableCell>
          </TableRow>
        ) : runs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center text-muted-foreground">Tarama geçmişi yok.</TableCell>
          </TableRow>
        ) : (
          runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell className="text-xs">{formatDate(run.started_at)}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs capitalize">{run.trigger_type}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[run.status] ?? "secondary"} className="text-xs capitalize">
                  {run.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{run.source_count}</TableCell>
              <TableCell className="text-right tabular-nums">{run.fetched_count}</TableCell>
              <TableCell className="text-right tabular-nums text-green-600 font-medium">{run.inserted_count}</TableCell>
              <TableCell className="text-right tabular-nums">{run.duplicate_count}</TableCell>
              <TableCell className="text-right tabular-nums">{run.filtered_count}</TableCell>
              <TableCell className="text-right tabular-nums text-destructive">{run.failed_source_count}</TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {formatDuration(run.started_at, run.completed_at)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
