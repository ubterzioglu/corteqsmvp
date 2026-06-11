// Tanıtım kampanya kartı (feed-inline + rail; spec §11.4 ve §15.4):
// * "Sponsorlu" badge'i ZORUNLUDUR ve kaldırılamaz — kart organik post gibi görünemez.
// * Dış URL'ler <a target="_blank" rel="noopener noreferrer">; internal path'ler Link.
// * Impression mount'ta oturum başına 1 kez, click tıklamada kaydedilir (abuse limiti DB'de).

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isExternalPromotionUrl, recordPromotionEvent } from "@/lib/cadde-tanitim-api";
import type { CaddePromotionCard } from "@/lib/cadde-types";

interface SponsoredFeedCardProps {
  promotion: CaddePromotionCard;
  /** Rail'de kompakt görünüm. */
  compact?: boolean;
}

const SponsoredFeedCard = ({ promotion, compact = false }: SponsoredFeedCardProps) => {
  useEffect(() => {
    recordPromotionEvent(promotion.campaignId, promotion.placementKey, "impression");
  }, [promotion.campaignId, promotion.placementKey]);

  const handleClick = () => {
    recordPromotionEvent(promotion.campaignId, promotion.placementKey, "click");
  };

  const cta = isExternalPromotionUrl(promotion.targetUrl) ? (
    <Button asChild size={compact ? "sm" : "default"} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
      <a href={promotion.targetUrl} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
        İncele
        <ExternalLink className="ml-2 h-3.5 w-3.5" />
      </a>
    </Button>
  ) : (
    <Button asChild size={compact ? "sm" : "default"} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
      <Link to={promotion.targetUrl} onClick={handleClick}>İncele</Link>
    </Button>
  );

  return (
    <Card className="border-orange-200 bg-[linear-gradient(135deg,#fff7e8_0%,#fff1d6_100%)]">
      <CardContent className={compact ? "space-y-2 p-4" : "flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"}>
        <div className="min-w-0 space-y-2">
          <Badge className="bg-orange-500 text-white hover:bg-orange-500">Sponsorlu</Badge>
          {promotion.imageUrl && !compact ? (
            <img src={promotion.imageUrl} alt={promotion.title} className="h-32 w-full rounded-xl border border-orange-200/60 object-cover" loading="lazy" />
          ) : null}
          <h3 className={`font-semibold text-slate-900 ${compact ? "text-sm" : "text-lg"}`}>{promotion.title}</h3>
          <p className={`text-slate-700 ${compact ? "line-clamp-2 text-xs" : "text-sm"}`}>{promotion.description}</p>
        </div>
        {cta}
      </CardContent>
    </Card>
  );
};

export default SponsoredFeedCard;
