// Araç hub kartı — bir relocation_tools satırını link kartı olarak gösterir.
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";

interface ToolLandingCardProps {
  tool: RelocationToolRow;
}

export function ToolLandingCard({ tool }: ToolLandingCardProps) {
  return (
    <Link to={`/relocation/tools/${tool.slug}`}>
      <Card className="h-full transition-colors hover:border-primary">
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
