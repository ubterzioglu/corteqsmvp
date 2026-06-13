// /admin/service-finder/costs — sağlayıcı/tip bazında maliyet özetleri.
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useServiceFinderCostSummary } from "@/hooks/useServiceFinder";
import { formatUsd } from "@/lib/service-finder-format";

type RangeKey = "month" | "week" | "all";

function rangeToIso(range: RangeKey): string | undefined {
  const now = new Date();
  if (range === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return weekAgo.toISOString();
  }
  return undefined;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  search: "Arama",
  extract: "Ekstraksiyon",
  classify: "Sınıflandırma",
  grounding: "Grounding",
  manual_adjustment: "Manuel düzeltme",
};

export default function ServiceFinderCostsPage() {
  const [range, setRange] = useState<RangeKey>("month");
  const { data: summary, isLoading } = useServiceFinderCostSummary(rangeToIso(range));

  const total = (summary ?? []).reduce((sum, row) => sum + row.total_amount_usd, 0);
  const totalCalls = (summary ?? []).reduce((sum, row) => sum + row.call_count, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Maliyetler</h1>
          <p className="text-sm text-muted-foreground">
            Maliyet defteri toplamları — her sağlayıcı çağrısı bir satırdır.
          </p>
        </div>
        <Select value={range} onValueChange={(value) => setRange(value as RangeKey)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Son 7 gün</SelectItem>
            <SelectItem value="month">Bu ay</SelectItem>
            <SelectItem value="all">Tüm zamanlar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Harcama</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatUsd(total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Çağrı</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCalls}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sağlayıcı</TableHead>
                <TableHead>İşlem tipi</TableHead>
                <TableHead className="text-right">Çağrı</TableHead>
                <TableHead className="text-right">Toplam (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (summary ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Bu aralıkta maliyet kaydı yok.
                  </TableCell>
                </TableRow>
              )}
              {(summary ?? []).map((row) => (
                <TableRow key={`${row.provider_key}:${row.event_type}`}>
                  <TableCell className="font-medium">{row.provider_key}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {EVENT_TYPE_LABELS[row.event_type] ?? row.event_type}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{row.call_count}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{formatUsd(row.total_amount_usd)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
