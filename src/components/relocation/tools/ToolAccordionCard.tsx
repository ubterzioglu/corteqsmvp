// Araç hub kartı — mobil accordion varyantı. Kapalıyken sadece başlık görünür;
// açılınca görsel + özet + "Aracı Aç" linki gelir. Masaüstü ToolLandingCard kullanır.
import { Link } from "react-router-dom";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { toolHeroImage } from "@/lib/relocation-tools-images";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";

interface ToolAccordionCardProps {
  tool: RelocationToolRow;
}

export function ToolAccordionCard({ tool }: ToolAccordionCardProps) {
  const heroImage = toolHeroImage(tool.slug);

  return (
    <AccordionItem value={tool.key}>
      <AccordionTrigger className="text-left text-base">{tool.title_tr}</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3">
          {heroImage && (
            <img
              src={heroImage}
              alt=""
              loading="lazy"
              className="aspect-[16/9] w-full rounded-md object-cover"
            />
          )}
          <p className="text-sm text-muted-foreground">{tool.summary_tr}</p>
          <Button asChild size="sm">
            <Link to={`/tools/${tool.slug}`}>Aracı Aç</Link>
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
