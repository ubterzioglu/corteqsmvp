// Araç hub gövdesi — aktif araçları kart grid'inde gösterir. docs/10tool/00 §UX.
import { ToolLandingCard } from "@/components/relocation/tools/ToolLandingCard";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";

interface RelocationToolsHubProps {
  tools: RelocationToolRow[];
  isLoading?: boolean;
  isError?: boolean;
}

export function RelocationToolsHub({ tools, isLoading, isError }: RelocationToolsHubProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2 text-center">
        <span className="mb-1 block text-3xl">🧭</span>
        <h1 className="text-2xl font-extrabold text-foreground">{TOOLS_UI_COPY.hubTitle}</h1>
        <p className="text-sm text-muted-foreground">{TOOLS_UI_COPY.hubSubtitle}</p>
      </div>

      {isLoading && (
        <p className="text-center text-sm text-muted-foreground">{TOOLS_UI_COPY.loading}</p>
      )}
      {isError && (
        <p className="text-center text-sm text-destructive">Araçlar yüklenemedi.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <ToolLandingCard key={tool.key} tool={tool} />
        ))}
      </div>

      {!isLoading && tools.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">Henüz aktif araç yok.</p>
      )}
    </div>
  );
}
