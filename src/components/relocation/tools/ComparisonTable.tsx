// Karşılaştırma tablosu — comparison result_kind (#2 maaş karşılaştırma).
// recommendations öğelerini ülke bazlı maaş tablosu olarak gösterir.
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bucketLabel } from "@/lib/relocation-tools-copy";

interface ComparisonRow {
  key?: string;
  title?: string;
  score?: number;
  bucket?: string;
  gross_min?: number;
  gross_median?: number;
  gross_max?: number;
  net_monthly?: number;
  currency?: string;
  demand?: number;
  confidence?: number;
  [extra: string]: unknown;
}

interface ComparisonTableProps {
  title: string;
  rows: ComparisonRow[];
}

function fmt(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString("tr-TR");
}

export function ComparisonTable({ title, rows }: ComparisonTableProps) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ülke</TableHead>
              <TableHead className="text-right">Brüt Medyan/yıl</TableHead>
              <TableHead className="text-right">Net Tahmini/ay</TableHead>
              <TableHead className="text-right">Talep</TableHead>
              <TableHead className="text-right">Güç Endeksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={row.key ?? idx}>
                <TableCell className="font-medium">
                  {row.title ?? row.key}
                  {row.bucket && (
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      {bucketLabel(row.bucket)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {fmt(row.gross_median)} {row.currency ?? ""}
                </TableCell>
                <TableCell className="text-right">
                  {fmt(row.net_monthly)} {row.currency ?? ""}
                </TableCell>
                <TableCell className="text-right">
                  {typeof row.demand === "number" ? `${Math.round(row.demand * 100)}` : "—"}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {typeof row.score === "number" ? `${Math.round(row.score)}` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
