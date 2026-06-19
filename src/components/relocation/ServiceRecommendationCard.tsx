// Tek servis önerisi kartı (housing/airline/gsm/doctor/community).
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { RelocationServiceRow } from "@/lib/relocation-types";

interface ServiceRecommendationCardProps {
  service: RelocationServiceRow;
}

function formatPrice(service: RelocationServiceRow): string | null {
  if (service.price_min == null && service.price_max == null) return null;
  const cur = service.currency ?? "";
  if (service.price_min != null && service.price_max != null) {
    return `${service.price_min}–${service.price_max} ${cur}`.trim();
  }
  return `${service.price_min ?? service.price_max} ${cur}`.trim();
}

export function ServiceRecommendationCard({ service }: ServiceRecommendationCardProps) {
  const price = formatPrice(service);
  const link = service.appointment_url ?? service.website_url;
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {service.provider_name}
            </span>
            <Badge variant="outline" className="shrink-0 text-xs">
              {Math.round(service.trust_score * 100)}% güven
            </Badge>
          </div>
          {service.plan_name && (
            <p className="text-xs text-muted-foreground">{service.plan_name}</p>
          )}
          {service.languages.length > 0 && (
            <p className="text-xs text-muted-foreground">{service.languages.join(", ")}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {price && <span className="text-sm font-medium text-foreground">{price}</span>}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Detay <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
