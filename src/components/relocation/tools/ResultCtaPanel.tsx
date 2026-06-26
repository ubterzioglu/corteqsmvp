// Sonuç CTA paneli — result.ctas öğelerini buton olarak gösterir. docs/10tool/00 §CTA.
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { resolveCta } from "@/lib/relocation-tools-copy";
import type { ToolCta } from "@/lib/relocation-tools-types";

interface ResultCtaPanelProps {
  ctas: ToolCta[];
  onCtaClick?: (cta: ToolCta) => void;
}

export function ResultCtaPanel({ ctas, onCtaClick }: ResultCtaPanelProps) {
  if (ctas.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {ctas.map((raw, idx) => {
        // raw.key gelse de gelmese de copy haritasından tamamla; raw.href override eder.
        const cta = resolveCta(raw.key ?? `cta-${idx}`, raw.href);
        const label = raw.label ?? cta.label;
        return (
          <Button
            key={cta.key + idx}
            asChild
            variant={idx === 0 ? "default" : "outline"}
            onClick={() => onCtaClick?.(cta)}
          >
            <Link to={cta.href}>{label}</Link>
          </Button>
        );
      })}
    </div>
  );
}
