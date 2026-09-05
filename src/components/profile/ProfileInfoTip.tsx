// Profil Workshop WS1 madde 3: rozetlerin (ve profil tipinin) yanında, üzerine
// gelince açıklama veren bilgi (i) ikonu. Klavye için de erişilebilir: tetikleyici
// gerçek bir <button> ve aria-label taşır; Radix Tooltip odakta da açılır.
//
// Kendi TooltipProvider'ını taşır: App.tsx'te sağlayıcı var, ancak bileşen
// testlerde ve pilot düzenlerde sağlayıcısız da render edilebilmeli.

import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileInfoTipProps {
  /** Açıklanan şeyin adı — erişilebilir ad "<label> hakkında bilgi" olur. */
  label: string;
  /** Balonda gösterilen kısa açıklama (1–2 cümle). */
  text: string;
  className?: string;
}

export function ProfileInfoTip({ label, text, className }: ProfileInfoTipProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`${label} hakkında bilgi`}
            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`}
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-[11px] leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ProfileInfoTip;
