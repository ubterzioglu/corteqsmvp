// src/pages/admin/relocation/RelocationToolsQuestionCountsPage.tsx
// Admin — hangi relocation aracında kaç soru/düğüm/alan var, hızlı/normal mod kırılımıyla.
// Veri canlı DB'den (relocation_tool_questions + germany_citizenship_questions) + kod-kaynaklı
// standalone sayılardan gelir — bkz. src/lib/relocation-tools-admin-api.ts.

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListChecks, Search } from "lucide-react";

import { AdminPageShell } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trIncludes } from "@/lib/text-normalization";
import {
  listToolQuestionCounts,
  type ToolCountKind,
} from "@/lib/relocation-tools-admin-api";

const KIND_LABEL: Record<ToolCountKind, string> = {
  question_bank: "Soru Bankası",
  decision_tree: "Karar Ağacı",
  calculator: "Hesaplayıcı",
};

const KIND_BADGE_VARIANT: Record<ToolCountKind, "default" | "secondary" | "outline"> = {
  question_bank: "default",
  decision_tree: "secondary",
  calculator: "outline",
};

const RelocationToolsQuestionCountsPage = () => {
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "relocation-tools", "question-counts"],
    queryFn: listToolQuestionCounts,
    staleTime: 0,
  });

  const rows = data ?? [];

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    return rows.filter(
      (row) => trIncludes(row.title_tr, query) || trIncludes(row.category, query),
    );
  }, [rows, query]);

  return (
    <AdminPageShell
      title="Araç Soru Sayıları"
      description="Her relocation aracında hızlı/normal modda kaç soru, karar ağacı düğümü veya form alanı olduğunu canlı DB'den gösterir."
      icon={ListChecks}
      accent="sky"
    >
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Araç adı veya kategori ara…"
          className="pl-9"
        />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      )}
      {isError && (
        <p className="text-sm text-destructive">Araç listesi yüklenemedi.</p>
      )}

      {!isLoading && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Araç Adı</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead className="text-right">Hızlı</TableHead>
              <TableHead className="text-right">Normal</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium">{row.title_tr}</TableCell>
                <TableCell className="text-muted-foreground">{row.category}</TableCell>
                <TableCell>
                  <Badge variant={KIND_BADGE_VARIANT[row.kind]}>{KIND_LABEL[row.kind]}</Badge>
                </TableCell>
                <TableCell className="text-right">{row.quick_count}</TableCell>
                <TableCell className="text-right">{row.detailed_count}</TableCell>
                <TableCell className="text-right font-semibold">{row.total_count}</TableCell>
                <TableCell>
                  <Badge variant={row.is_active ? "default" : "secondary"}>
                    {row.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">"{query}" için araç bulunamadı.</p>
      )}
    </AdminPageShell>
  );
};

export default RelocationToolsQuestionCountsPage;
