/**
 * Ana sayfanın eylem düğmeleri — hero ve final CTA kartı AYNI bileşeni kullanır.
 *
 * ÜÇ KURAL (kullanıcı kararı, 2026-09-20):
 *
 * 1. TÜM DÜĞMELER AYNI EN VE AYNI BOY. Bu yüzden genişlik `1fr` grid hücresi DEĞİL,
 *    SABİT (`w-[10rem]`). Grid ile yapılsaydı üç düğmelik satırın hücreleri dört
 *    düğmelik satırınkinden geniş olurdu ve iki satır birbirini tutmazdı — ekran
 *    görüntüsünde tam olarak bu görüldü. Sabit genişlik satır sayısından, bölümden
 *    ve etiket uzunluğundan bağımsız eşitliği garanti eder.
 *    ⚠️ Yeni düğme eklerken etiketi ölç: 10rem (160px) içine `px-3` payıyla en çok
 *    ~17 karakterlik bir etiket sığar. Daha uzunu taşar; genişliği büyütmek yerine
 *    etiketi kısalt, yoksa YEDİ düğmenin hepsi birden büyür.
 *
 * 2. SAĞ OK YOK. Düğmelerde `ArrowRight` vardı, kaldırıldı — yedi düğmenin hepsinde
 *    tekrarlanan bir işaret bilgi taşımıyordu.
 *
 * 3. HEPSİNDE İPUCU VAR. Birincil düğmeler dahil her düğme fare üzerine gelince ve
 *    klavye odağında ne yaptığını anlatır.
 *
 * İPUCU MEKANİĞİ: bileşen KENDİ `TooltipProvider`'ını sarar. App.tsx kökünde zaten
 * bir tane var ve Radix iç içe provider'a izin verir; bağımlılığı içeride tutmak
 * bileşeni sağlayıcısız bir ağaçta da render edilebilir kılar (testte patlamıştı).
 * Dokunmatik cihazda ipucu açılmaz — bu yüzden ipuçları TAMAMLAYICIDIR, düğmenin ne
 * yaptığı etiketin kendisinden anlaşılmalıdır.
 */

import { Link } from "react-router-dom";

import { DemoBadge } from "@/components/common/DemoBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { ActionButtonSpec } from "./action-buttons-data";

/** Her düğmenin ortak biçimi — SABİT genişlik + sabit yükseklik. */
const BUTTON_CLASS =
  "inline-flex h-[46px] w-full items-center justify-center rounded-full bg-gradient-to-r px-3 text-center text-sm font-semibold leading-tight text-white transition-all duration-300 hover:-translate-y-0.5 sm:w-[10rem]";

interface ActionButtonsProps {
  buttons: ActionButtonSpec[];
  /** Sarmalayıcıya eklenecek yerleşim sınıfları (hizalama, üst boşluk). */
  className?: string;
  /** `state.from` değeri — Geri Bildirim kaydının `page_path` alanını doldurur. */
  originPath?: string;
  /** Düğmelerin yatay hizası; CTA kartında ortalı, hero'da sola dayalı. */
  align?: "start" | "center";
  /**
   * Verilirse satır `<nav aria-label>` olarak çizilir. Bağlantı grubunu adlandırmak
   * ekran okuyucuya "burada bir gezinme bloğu var" der; testler de bu yer işaretine
   * dayanır. Sayfada birden çok satır varsa adları FARKLI olmalı.
   */
  ariaLabel?: string;
}

export function ActionButtons({
  buttons,
  className,
  originPath = "/",
  align = "start",
  ariaLabel,
}: ActionButtonsProps) {
  const Wrapper = ariaLabel ? "nav" : "div";
  return (
    <TooltipProvider delayDuration={150}>
      <Wrapper
        aria-label={ariaLabel}
        className={`flex flex-wrap gap-2.5 ${align === "center" ? "justify-center" : "justify-start"} ${className ?? ""}`}
      >
        {buttons.map((button) => {
          // `relative`: DEMO rozeti köşeye `absolute` oturur (bkz. DemoBadge).
          const shared = {
            className: `${BUTTON_CLASS} relative ${button.gradient}`,
            style: { boxShadow: `0 16px 34px -12px ${button.shadow}` },
          };
          // Rozet düğmenin İÇİNE konur. Düğmeyi bir sarmalayıcıya almak
          // TooltipTrigger'ın `asChild` hedefini sarmalayıcıya kaydırır ve
          // ipucu düğmenin kendisinden kopardı.
          const badge = button.demo ? <DemoBadge /> : null;

          return (
            <Tooltip key={button.label}>
              <TooltipTrigger asChild>
                {button.to ? (
                  <Link
                    to={button.to}
                    state={button.carryOrigin ? { from: originPath } : undefined}
                    {...shared}
                  >
                    {button.label}
                    {badge}
                  </Link>
                ) : (
                  <button type="button" onClick={button.onClick} {...shared}>
                    {button.label}
                    {badge}
                  </button>
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[17rem] text-left leading-snug">
                {button.hint}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </Wrapper>
    </TooltipProvider>
  );
}

export default ActionButtons;
