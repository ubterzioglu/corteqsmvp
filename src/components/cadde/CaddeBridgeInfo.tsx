// Workshop m35 — Köprü anahtarının yanındaki bilgi baloncuğu.
//
// Köprü modunun ne olduğu sol kolondaki tek satırdan anlaşılmıyordu; hedef kitle
// dört grup halinde burada açıklanıyor. Popover/hover davranışı ve dokunmatik
// tuzağının çözümü ortak CaddeInfoPopover'a taşındı (m49/m51 aynı deseni istedi).
//
// Bu bileşen yalnız ANLATIR — filtre davranışına dokunmaz (m36'nın kanıtlanmış
// köprü filtresi CaddePage'deki Switch'te kalır).

import CaddeInfoPopover from "@/components/cadde/CaddeInfoPopover";

/** Köprü modunun buluşturduğu dört grup (m35 metni). */
export const BRIDGE_AUDIENCES = [
  "Yurt dışına gitmek isteyenler",
  "Yurt dışıyla iş yapmak isteyenler",
  "Yurt dışından Türkiye ile iş yapmak isteyenler",
  "Türkiye'ye dönmek isteyenler",
] as const;

const CaddeBridgeInfo = () => (
  <CaddeInfoPopover
    label="Köprü nedir?"
    triggerTestId="cadde-bridge-info-trigger"
    contentTestId="cadde-bridge-info-content"
    triggerClassName="text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 focus-visible:ring-emerald-500"
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
  </CaddeInfoPopover>
);

export default CaddeBridgeInfo;
