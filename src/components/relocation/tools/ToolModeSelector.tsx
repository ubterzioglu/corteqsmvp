// Quick/Detailed mod seçici. docs/10tool/00 §UX (ToolModeSelector).
// Dikey, geniş, açıklamalı kartlar; mobilde tek sütun w-full (bozulmaz).
import { Card } from "@/components/ui/card";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import type { ToolMode } from "@/lib/relocation-tools-types";

interface ToolModeSelectorProps {
  quickCount: number;
  detailedCount: number;
  onSelect: (mode: ToolMode) => void;
}

interface ModeOptionProps {
  title: string;
  count: number;
  description: string;
  onClick: () => void;
}

function ModeOption({ title, count, description, onClick }: ModeOptionProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="w-full cursor-pointer p-4 text-left transition-colors hover:border-primary hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">({count} soru)</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}

export function ToolModeSelector({ quickCount, detailedCount, onSelect }: ToolModeSelectorProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <ModeOption
        title={TOOLS_UI_COPY.quickMode}
        count={quickCount}
        description={TOOLS_UI_COPY.quickModeDesc}
        onClick={() => onSelect("quick")}
      />
      {detailedCount > 0 && (
        <ModeOption
          title={TOOLS_UI_COPY.detailedMode}
          count={detailedCount}
          description={TOOLS_UI_COPY.detailedModeDesc}
          onClick={() => onSelect("detailed")}
        />
      )}
    </div>
  );
}
