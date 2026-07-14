// Araç hub kartı — bir relocation_tools satırını link kartı olarak gösterir.
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toolHeroImage } from "@/lib/relocation-tools-images";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";

interface ToolLandingCardProps {
  tool: RelocationToolRow;
}

export function ToolLandingCard({ tool }: ToolLandingCardProps) {
  const heroImage = toolHeroImage(tool.slug);

  return (
    <Link to={`/tools/${tool.slug}`}>
      <Card className="relative h-full overflow-hidden transition-colors hover:border-primary">
        <Badge className="absolute right-2 top-2 z-10 bg-emerald-500 text-white shadow-md hover:bg-emerald-500">
          🎉 ÜCRETSİZ
        </Badge>
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
        )}
        <CardHeader>
          <CardTitle className="text-base">{tool.title_tr}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{tool.summary_tr}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
