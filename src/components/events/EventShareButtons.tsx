import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { EVENT_SHARE_TARGETS, type EventShareInput } from "@/lib/event-share";

type EventShareButtonsProps = {
  share: EventShareInput;
  /**
   * `"full"`: detay sayfasındaki düğme sırası.
   * `"compact"`: liste kartındaki tek ikon + menü.
   */
  variant?: "full" | "compact";
};

/**
 * Etkinlik paylaşım düğmeleri. Bağlantıları `@/lib/event-share` kurar; burada
 * yalnız sunum ve kopyalama geri bildirimi vardır.
 *
 * `compact` varyantı bir bağlantının üstüne bindirilerek kullanılır (liste
 * kartı). Düğme bugün `<Link>`in KARDEŞİDİR, içinde değil — `<button>`ı `<a>`
 * içine koymak geçersiz HTML'dir. Aşağıdaki `stopPropagation` +
 * `preventDefault` bu kurulumda gerekli değildir ama ucuz bir emniyettir:
 * bileşen ileride tıklanabilir bir kabın İÇİNE taşınırsa düğme yine çalışır.
 */
export function EventShareButtons({ share, variant = "full" }: EventShareButtonsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const openShare = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      toast({ title: "Bağlantı kopyalandı" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Kopyalanamadı", variant: "destructive" });
    }
  };

  if (variant === "compact") {
    return (
      <div
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <DropdownMenu>
          {/* Kapak görseli olan kartlarda düğme fotoğrafın üstüne düşer;
              yarı saydam zemin olmadan ikon görünmez oluyor. */}
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-white/80 text-slate-500 backdrop-blur-sm hover:bg-white hover:text-slate-800"
              aria-label="Etkinliği paylaş"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {EVENT_SHARE_TARGETS.map((target) => (
              <DropdownMenuItem key={target.key} onSelect={() => openShare(target.buildHref(share))}>
                {target.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onSelect={() => void handleCopyLink()}>
              {copied ? "Kopyalandı" : "Bağlantı Kopyala"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {EVENT_SHARE_TARGETS.map((target) => (
        <Button
          key={target.key}
          variant="outline"
          size="sm"
          onClick={() => openShare(target.buildHref(share))}
        >
          {target.label}
        </Button>
      ))}
      <Button variant="outline" size="sm" onClick={() => void handleCopyLink()}>
        {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
        {copied ? "Kopyalandı" : "Bağlantı Kopyala"}
      </Button>
    </div>
  );
}

export default EventShareButtons;
