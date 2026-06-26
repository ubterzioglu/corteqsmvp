// Quick/Detailed mod seçici. docs/10tool/00 §UX (ToolModeSelector).
import { Button } from "@/components/ui/button";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import type { ToolMode } from "@/lib/relocation-tools-types";

interface ToolModeSelectorProps {
  quickCount: number;
  detailedCount: number;
  onSelect: (mode: ToolMode) => void;
}

export function ToolModeSelector({ quickCount, detailedCount, onSelect }: ToolModeSelectorProps) {
  return (
    <div className="flex justify-center gap-3">
      <Button onClick={() => onSelect("quick")}>
        {TOOLS_UI_COPY.quickMode} ({quickCount})
      </Button>
      {detailedCount > 0 && (
        <Button variant="outline" onClick={() => onSelect("detailed")}>
          {TOOLS_UI_COPY.detailedMode} ({detailedCount})
        </Button>
      )}
    </div>
  );
}
