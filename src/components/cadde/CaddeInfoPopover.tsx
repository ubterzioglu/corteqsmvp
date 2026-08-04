// Cadde'nin bilgi baloncuğu deseni — tek kaynak.
//
// Bilinçli olarak Tooltip DEĞİL Popover: Radix Tooltip dokunmatikte açılmaz ve
// balonlar mobilde de okunabilmeli (masaüstünde hover, mobilde dokunuş açar).
// Bu davranış F12'de (m35 Köprü balonu) kanıtlandı; m49 (Cafe) ve m51 (Çarşı)
// aynı şeyi isteyince desen buraya çıkarıldı — üç yerde üç kopya yaşamasın.
//
// Trigger'daki preventDefault KASITLIDIR: dokunmatikte tap önce mouseenter (aç)
// sonra click (kapat) üretiyor ve balon hiç görünmüyordu. Kaldırma.

import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CaddeInfoPopoverProps {
  /** Ekran okuyucu etiketi, ör. "Köprü nedir?" */
  label: string;
  children: ReactNode;
  triggerTestId?: string;
  contentTestId?: string;
  /** Tetikleyicinin renk sınıfları — çağıran yüzeyin paletine uyar. */
  triggerClassName?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

const CaddeInfoPopover = ({
  label,
  children,
  triggerTestId,
  contentTestId,
  triggerClassName,
  align = "start",
  side = "bottom",
}: CaddeInfoPopoverProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Hover masaüstü için; tıklama/dokunuş Popover'ın kendi davranışı. */}
      <span onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={label}
            data-testid={triggerTestId}
            onClick={(event) => {
              // Radix'in "toggle" davranışını kes — yukarıdaki nota bak.
              event.preventDefault();
              setOpen(true);
            }}
            className={cn(
              "rounded-full p-0.5 transition focus-visible:outline-none focus-visible:ring-2",
              triggerClassName ??
                "text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-slate-400",
            )}
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
          </button>
        </PopoverTrigger>
      </span>
      <PopoverContent
        align={align}
        side={side}
        className="w-[min(17rem,calc(100vw-2rem))] space-y-2 p-3"
        data-testid={contentTestId}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};

export default CaddeInfoPopover;
