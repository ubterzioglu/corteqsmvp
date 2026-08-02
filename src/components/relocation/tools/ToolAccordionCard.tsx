// Araç hub kartı — mobil accordion varyantı. Kapalıyken sadece başlık görünür;
// açılınca görsel + özet + "Aracı Aç" linki gelir. Masaüstü ToolLandingCard kullanır.
import { Link } from "react-router-dom";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toolHeroImage } from "@/lib/relocation-tools-images";
import { RESULT_KIND_BADGE_LABELS } from "@/lib/relocation-tools-copy";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";

interface ToolAccordionCardProps {
  tool: RelocationToolRow;
}

export function ToolAccordionCard({ tool }: ToolAccordionCardProps) {
  const heroImage = toolHeroImage(tool.slug);
  const resultLabel = RESULT_KIND_BADGE_LABELS[tool.result_kind] ?? tool.result_kind;
  const questionCount = tool.quick_question_count || tool.detailed_question_count;

  return (
    <AccordionItem value={tool.key}>
      <AccordionTrigger className="text-left text-base">
        <span className="flex flex-1 items-center justify-between gap-2 pr-2">
          <span>{tool.title_tr}</span>
          <span className="flex shrink-0 gap-1.5">
            <Badge variant="outline" className="shadow-sm">
              {resultLabel}
            </Badge>
            <Badge className="bg-emerald-500 text-white shadow-md hover:bg-emerald-500">🎉 Ücretsiz</Badge>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3">
          {heroImage && (
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={heroImage}
                alt=""
                loading="lazy"
                className="aspect-[16/9] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
            </div>
          )}
          <p className="text-sm text-muted-foreground">{tool.summary_tr}</p>
          {questionCount > 0 && (
            <p className="text-xs font-medium text-primary">{questionCount} soru · birkaç dakika</p>
          )}
          <Button asChild size="sm" className="shadow-glow-teal">
            <Link to={`/tools/${tool.slug}`}>Aracı Aç</Link>
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
