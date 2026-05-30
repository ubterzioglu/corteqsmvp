import { Bot, Lock } from "lucide-react";

/**
 * Blurred teaser banner for CorBot WhatsApp subscription.
 * Feature description is visible; price + CTA are blurred (coming soon).
 * Used across Consultant / Business / Association / Blogger / Vlogger dashboards.
 */
const CorBotPromoBanner = () => {
  return (
    <div className="relative rounded-2xl border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-success/10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 overflow-hidden">
      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Bot className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-base">
          CorBot'u cebine al — <span className="select-none blur-sm">ayda sadece —— €</span>
        </p>
        <p className="text-xs text-muted-foreground">
          WhatsApp üzerinden bildirimler, RFQ uyarıları, AI destekli yanıtlar ve canlı destek tek bir abonelikte.
        </p>
      </div>
      <div className="relative shrink-0">
        <div className="px-4 py-2 rounded-md bg-primary/80 text-primary-foreground text-sm font-semibold blur-sm select-none">
          Ayda Sadece —— €'ya Cebinde
        </div>
        <span className="absolute inset-0 flex items-center justify-center gap-1 text-[11px] font-bold text-foreground">
          <Lock className="h-3 w-3" /> Yakında
        </span>
      </div>
    </div>
  );
};

export default CorBotPromoBanner;
