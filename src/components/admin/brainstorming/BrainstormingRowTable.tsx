// Brainstorming sağ panel üst — seçili bölümün satır tablosu.
// Her satır akordeon kartı: kapalıyken sadece konu + durum rozeti görünür,
// tıklayınca teknik/sade içerik açılır (varsayılan: kapalı). Desen kaynağı: AdminRevisionRequestsPage.

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Pencil, Trash2 } from "lucide-react";

import { AdminStatusBadge, type AdminStatusTone } from "@/components/admin/page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-2">
      {rows.map((row, index) => {
        const isExpanded = expandedId === row.id;
        return (
          <div key={row.id} className="rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 p-2.5">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => toggleExpanded(row.id)}
                aria-expanded={isExpanded}
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {row.label}
                </span>
                {row.status ? (
                  <AdminStatusBadge tone={STATUS_TONES[row.status]} className="shrink-0">
                    {STATUS_LABELS[row.status]}
                  </AdminStatusBadge>
                ) : null}
              </button>

              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onMoveUp(row)}
                  disabled={isReordering || index === 0}
                  aria-label="Yukarı taşı"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onMoveDown(row)}
                  disabled={isReordering || index === rows.length - 1}
                  aria-label="Aşağı taşı"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(row)}
                  aria-label="Düzenle"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-500"
                  onClick={() => onDelete(row)}
                  aria-label="Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {isExpanded ? (
              <div className="grid grid-cols-1 gap-3 border-t border-border p-3 sm:grid-cols-2">
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
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
