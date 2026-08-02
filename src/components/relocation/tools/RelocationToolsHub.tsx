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
      <div className="relative mb-2 overflow-hidden rounded-3xl border border-border/60 px-6 py-10 text-center">
        <div className="tech-aurora pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative z-10">
          <span className="mb-2 block text-4xl">🧭</span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gradient-tech md:text-4xl">
            {TOOLS_UI_COPY.hubTitle}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">{TOOLS_UI_COPY.hubSubtitle}</p>
        </div>
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
