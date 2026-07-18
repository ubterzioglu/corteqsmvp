// Brainstorming sol panel — bölüm listesi.
// Her satırda grup etiketi + başlık, yukarı/aşağı sıralama okları, düzenle/sil ikonları.

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BrainstormingSection } from "@/lib/brainstorming-api";

export type BrainstormingSectionListProps = {
  sections: BrainstormingSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (section: BrainstormingSection) => void;
  onDelete: (section: BrainstormingSection) => void;
  onMoveUp: (section: BrainstormingSection) => void;
  onMoveDown: (section: BrainstormingSection) => void;
  isReordering?: boolean;
};

export function BrainstormingSectionList({
  sections,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isReordering = false,
}: BrainstormingSectionListProps) {
  return (
    <div className="space-y-1.5">
      {sections.map((section, index) => {
        const isSelected = section.id === selectedId;
        return (
          <div
            key={section.id}
            className={cn(
              "flex items-start gap-1 rounded-lg border p-2 transition",
              isSelected ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-card",
            )}
          >
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onSelect(section.id)}
            >
              {section.groupLabel ? (
                <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {section.groupLabel}
                </p>
              ) : null}
              <p className="truncate text-sm font-medium text-foreground">{section.title}</p>
              <p className="text-xs text-muted-foreground">{section.rows.length} satır</p>
            </button>

            <div className="flex shrink-0 flex-col items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMoveUp(section)}
                disabled={isReordering || index === 0}
                aria-label="Yukarı taşı"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onMoveDown(section)}
                disabled={isReordering || index === sections.length - 1}
                aria-label="Aşağı taşı"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onEdit(section)}
                aria-label="Düzenle"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-red-500"
                onClick={() => onDelete(section)}
                aria-label="Sil"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
