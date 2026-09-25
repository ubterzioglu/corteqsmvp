/**
 * Ana sayfanın iki satırlık eylem şeridi — hero ve kapanış kartı AYNI bileşeni
 * kullanır.
 *
 * NEDEN VAR: masaüstünde düğmeler 5 + 4 iki satır çizer ve bu sözleşme
 * korunur (bkz. action-buttons-data.ts ölçü notu). Dar ekranda ise düğme
 * `w-full` olduğu için DOKUZ düğme alt alta DOKUZ SATIR olur ve şerit tek başına
 * ekranı yer. Kullanıcı kararı (2026-09-20): mobilde yalnız İLK ÜÇ düğme
 * açık kalır, kalanlar bir aç/kapa düğmesinin arkasına girer.
 *
 * DOM SIRASI DEĞİŞMEZ. Gizleme sadece sınıfla yapılır (`hidden sm:inline-flex`
 * / `hidden sm:flex`), çünkü satırları mobilde yeniden dizmek masaüstündeki
 * 5 + 4 sözleşmesini sessizce bozardı. `sm` (640px) eşiğinin üstünde aç/kapa
 * düğmesi de kaybolur ve şerit bugünkü haliyle çizilir.
 */

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { ActionButtons } from "./ActionButtons";
import type { ActionButtonSpec } from "./action-buttons-data";

/** Mobilde aç/kapa olmadan görünen düğme sayısı (kullanıcı kararı). */
const MOBILE_VISIBLE_COUNT = 3;

interface HomeActionStackProps {
  rowOne: ActionButtonSpec[];
  rowTwo: ActionButtonSpec[];
  /** Birinci satırın erişilebilirlik adı — sayfada BENZERSİZ olmalı. */
  rowOneLabel: string;
  /** İkinci satırın erişilebilirlik adı — sayfada BENZERSİZ olmalı. */
  rowTwoLabel: string;
  align?: "start" | "center";
  /** `state.from` değeri — Geri Bildirim kaydının `page_path` alanını doldurur. */
  originPath?: string;
  /** Şeridin üstündeki boşluk; hero `mt-7`, kapanış kartı `mt-9` ister. */
  topSpacingClassName?: string;
}

export function HomeActionStack({
  rowOne,
  rowTwo,
  rowOneLabel,
  rowTwoLabel,
  align = "start",
  originPath = "/",
  topSpacingClassName = "mt-7",
}: HomeActionStackProps) {
  const [expanded, setExpanded] = useState(false);
  // useId: aynı sayfada iki şerit var (hero + kapanış), id'ler çakışamaz.
  const stackId = useId();
  const rowOneId = `${stackId}-row-one`;
  const rowTwoId = `${stackId}-row-two`;

  const hiddenCount = Math.max(rowOne.length - MOBILE_VISIBLE_COUNT, 0) + rowTwo.length;

  return (
    <div>
      <ActionButtons
        id={rowOneId}
        buttons={rowOne}
        hideOnMobileFrom={expanded ? undefined : MOBILE_VISIBLE_COUNT}
        className={topSpacingClassName}
        align={align}
        originPath={originPath}
        ariaLabel={rowOneLabel}
      />
      <ActionButtons
        id={rowTwoId}
        buttons={rowTwo}
        className={`mt-2.5 ${expanded ? "" : "hidden sm:flex"}`}
        align={align}
        originPath={originPath}
        ariaLabel={rowTwoLabel}
      />
      {hiddenCount > 0 ? (
        <div className={`mt-2.5 flex sm:hidden ${align === "center" ? "justify-center" : "justify-start"}`}>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            aria-controls={`${rowOneId} ${rowTwoId}`}
            className="inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {expanded ? "Daha az göster" : `Tüm kısayollar (${hiddenCount})`}
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default HomeActionStack;
