// Workshop m35 — Köprü anahtarının yanındaki bilgi baloncuğu.
//
// Köprü modunun ne olduğu sol kolondaki tek satırdan anlaşılmıyordu; hedef kitle
// dört grup halinde burada açıklanıyor. Bilinçli olarak Tooltip DEĞİL Popover:
// Radix Tooltip dokunmatikte açılmaz, bu balon mobilde de okunabilmeli
// (masaüstünde hover, mobilde dokunuş açar).
//
// Bu bileşen yalnız ANLATIR — filtre davranışına dokunmaz (m36'nın kanıtlanmış
// köprü filtresi CaddePage'deki Switch'te kalır).

import { useState } from "react";
import { Info } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Köprü modunun buluşturduğu dört grup (m35 metni). */
export const BRIDGE_AUDIENCES = [
  "Yurt dışına gitmek isteyenler",
  "Yurt dışıyla iş yapmak isteyenler",
  "Yurt dışından Türkiye ile iş yapmak isteyenler",
  "Türkiye'ye dönmek isteyenler",
] as const;

const CaddeBridgeInfo = () => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Hover masaüstü için; tıklama/dokunuş Popover'ın kendi davranışı. */}
      <span onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Köprü nedir?"
            data-testid="cadde-bridge-info-trigger"
            onClick={(event) => {
              // Radix'in kendi "toggle" davranışı bilinçli olarak devre dışı: dokunmatikte
              // tap önce mouseenter (aç) sonra click (kapat) üretiyor ve balon hiç görünmüyordu.
              // preventDefault, Radix'in composeEventHandlers zincirini keser; kapatma
              // dışarı tıklama / Esc / mouseleave ile olur.
              event.preventDefault();
              setOpen(true);
            }}
            className="rounded-full p-0.5 text-emerald-600 transition hover:bg-emerald-100 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
          </button>
        </PopoverTrigger>
      </span>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[min(17rem,calc(100vw-2rem))] space-y-2 p-3"
        data-testid="cadde-bridge-info-content"
      >
        <p className="text-xs font-semibold text-emerald-950">Köprü kimler için?</p>
        <ul className="space-y-1">
          {BRIDGE_AUDIENCES.map((audience) => (
            <li key={audience} className="flex gap-1.5 text-xs leading-relaxed text-slate-600">
              <span aria-hidden className="text-emerald-500">
                •
              </span>
              <span>{audience}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Köprü açıkken akış bu dört grubun buluştuğu paylaşımlara odaklanır.
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default CaddeBridgeInfo;
