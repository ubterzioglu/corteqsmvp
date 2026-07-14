// Araç hub gövdesi — aktif araçları gösterir. docs/10tool/00 §UX.
// Masaüstü (md+): 3 sütunlu kart grid, kart tamamı tıklanabilir link.
// Mobil (<md): accordion — kapalıyken sadece başlık, açılınca görsel+özet+"Aracı Aç".
import { Accordion } from "@/components/ui/accordion";
import { ToolLandingCard } from "@/components/relocation/tools/ToolLandingCard";
import { ToolAccordionCard } from "@/components/relocation/tools/ToolAccordionCard";
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

      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {tools.map((tool) => (
          <ToolLandingCard key={tool.key} tool={tool} />
        ))}
      </div>

      <Accordion type="single" collapsible className="md:hidden">
        {tools.map((tool) => (
          <ToolAccordionCard key={tool.key} tool={tool} />
        ))}
      </Accordion>

      {!isLoading && tools.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">Henüz aktif araç yok.</p>
      )}
    </div>
  );
}
