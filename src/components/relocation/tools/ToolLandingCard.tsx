// Araç hub kartı — bir relocation_tools satırını link kartı olarak gösterir.
import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toolHeroImage } from "@/lib/relocation-tools-images";
import { resultKindStyle } from "@/lib/relocation-tools-result-style";
import { cn } from "@/lib/utils";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";

interface ToolLandingCardProps {
  tool: RelocationToolRow;
}

export function ToolLandingCard({ tool }: ToolLandingCardProps) {
  const heroImage = toolHeroImage(tool.slug);
  const { label, Icon, chipClass, ringClass, barClass } = resultKindStyle(tool.result_kind);
  const questionCount = tool.quick_question_count || tool.detailed_question_count;

  return (
    <Link to={`/tools/${tool.slug}`} className="group block h-full">
      <Card
        className={cn(
          "relative flex h-full flex-col overflow-hidden border-border/50 ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-teal",
          ringClass,
        )}
      >
        <div className={cn("h-1.5 w-full", barClass)} aria-hidden="true" />
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {heroImage && (
            <img
              src={heroImage}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div
            className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
            aria-hidden="true"
          />
          <Badge className={cn("absolute left-2 top-2 z-10 gap-1 border shadow-md hover:bg-white/95", chipClass)}>
            <Icon className="h-3 w-3" aria-hidden="true" />
            {label}
          </Badge>
          <Badge className="absolute right-2 top-2 z-10 rotate-2 border border-white/50 bg-emerald-500 text-white shadow-lg hover:bg-emerald-500">
            🎉 Ücretsiz
          </Badge>
          <CardTitle className="absolute inset-x-0 bottom-0 px-4 pb-3 text-base leading-snug text-white drop-shadow-sm">
            {tool.title_tr}
          </CardTitle>
        </div>
        <CardContent className="flex flex-1 flex-col justify-between pt-4">
          <p className="text-sm text-muted-foreground">{tool.summary_tr}</p>
          {questionCount > 0 && (
            <p className="mt-3 text-xs font-medium text-primary">{questionCount} soru · birkaç dakika</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
