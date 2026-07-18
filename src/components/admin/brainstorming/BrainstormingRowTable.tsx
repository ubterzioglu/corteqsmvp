// Brainstorming sağ panel üst — seçili bölümün satır tablosu.
// Konu / Teknik / Sade / Durum kolonları; yukarı/aşağı sıralama + düzenle/sil.

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";

import { AdminStatusBadge, type AdminStatusTone } from "@/components/admin/page";
import { Button } from "@/components/ui/button";
import type { BrainstormingRow } from "@/lib/brainstorming-api";
import type { BrainstormingStatus } from "@/lib/brainstorming-schemas";

const STATUS_LABELS: Record<BrainstormingStatus, string> = {
  ok: "Tamam",
  partial: "Kısmen",
  open: "Açık",
};

const STATUS_TONES: Record<BrainstormingStatus, AdminStatusTone> = {
  ok: "success",
  partial: "warning",
  open: "danger",
};

export type BrainstormingRowTableProps = {
  rows: BrainstormingRow[];
  onEdit: (row: BrainstormingRow) => void;
  onDelete: (row: BrainstormingRow) => void;
  onMoveUp: (row: BrainstormingRow) => void;
  onMoveDown: (row: BrainstormingRow) => void;
  isReordering?: boolean;
};

export function BrainstormingRowTable({
  rows,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isReordering = false,
}: BrainstormingRowTableProps) {
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row.id} className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{row.label}</span>
            {row.status ? (
              <AdminStatusBadge tone={STATUS_TONES[row.status]}>
                {STATUS_LABELS[row.status]}
              </AdminStatusBadge>
            ) : null}
            <div className="ml-auto flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMoveUp(row)}
                disabled={isReordering || index === 0}
                aria-label="Yukarı taşı"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMoveDown(row)}
                disabled={isReordering || index === rows.length - 1}
                aria-label="Aşağı taşı"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onEdit(row)}
                aria-label="Düzenle"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-red-500"
                onClick={() => onDelete(row)}
                aria-label="Sil"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Teknik
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{row.technical}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Sade
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{row.plain}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
