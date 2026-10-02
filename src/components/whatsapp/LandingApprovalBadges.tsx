import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  approvedGroupBadgeMeta,
  getOwnershipStatusMeta,
  newBadgeMeta,
} from "@/lib/whatsapp-landing-presentation";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

interface LandingBadgeProps {
  landing: WhatsAppLanding;
}

/**
 * G19 · Politika §6 rozet dili: sahiplik rozeti HER zaman görünür
 * ("Sahibi doğruladı" ya da "Üye önerisi"), üstüne "Yeni" (ilk 72 saat) ve
 * "Onaylı Grup" (skor ≥70 — sunucuda hesaplanır, istemci eşik taşımaz)
 * etiketleri biner. Eski "Admin onaylı!"/"Üye onaylı!" rozetleri KALKTI.
 */
/** `as const` daraltmasının birleşimi — üç rozet de aynı şekli taşır. */
type BadgeMeta = { label: string; tooltip: string; className: string };

export function LandingApprovalBadges({ landing }: LandingBadgeProps) {
  const badges: BadgeMeta[] = [getOwnershipStatusMeta(landing)];

  if (landing.isNew) badges.push(newBadgeMeta);
  if (landing.hasApprovedBadge) badges.push(approvedGroupBadgeMeta);

  return (
    <div className="flex flex-col gap-2">
      {badges.map((badge) => (
        <Tooltip key={badge.label}>
          <TooltipTrigger asChild>
            <Badge className={`flex h-8 w-full cursor-default items-center justify-center border px-3 text-center text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{badge.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
