import { MapPin, ShieldCheck, Sparkles } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatGroupScore, getApprovalStatusMeta, getCategoryMeta } from "@/lib/whatsapp-landing-presentation";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

const detailMetaCardClass = "flex min-h-[76px] items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm";

interface LandingDetailMetaCardsProps {
  landing: WhatsAppLanding;
}

export function LandingDetailMetaCards({ landing }: LandingDetailMetaCardsProps) {
  const cat = getCategoryMeta(landing.category);
  const CatIcon = cat.icon;
  const approvalStatus = getApprovalStatusMeta(landing);
  const formattedScore = formatGroupScore(landing.groupScore);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className={`${detailMetaCardClass} border-slate-700 bg-slate-600 text-white`}>
        <MapPin className="h-4.5 w-4.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Lokasyon</p>
          <p className="truncate text-sm font-semibold">{landing.city}, {landing.country}</p>
        </div>
      </div>

      <div className={`${detailMetaCardClass} ${cat.chipClass}`}>
        <CatIcon className="h-4.5 w-4.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">Kategori</p>
          <p className="truncate text-sm font-semibold">{cat.label}</p>
        </div>
      </div>

      <div className={`${detailMetaCardClass} border-violet-600 bg-violet-500 text-white`}>
        <Sparkles className="h-4.5 w-4.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">CorteQS Grup Skoru</p>
          <p className="truncate text-sm font-semibold">
            {formattedScore ? `${formattedScore} / 10` : "Skor bekleniyor"}
          </p>
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${detailMetaCardClass} cursor-default ${approvalStatus.className}`}>
            <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">Onay Durumu</p>
              <p className="truncate text-sm font-semibold">{approvalStatus.label}</p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{approvalStatus.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
