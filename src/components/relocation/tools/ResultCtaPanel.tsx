// Sonuç CTA paneli — result.ctas + "Tekrar Çöz" tek bir 2×2 ızgarada, eşit boyutlu.
// docs/10tool/00 §CTA.
//
// B21 (2026-07-30): CTA'lar artık GERÇEK linkler. Eski "Yakında" kilidi, hedeflerin
// var olmayan /relocation/tools/* rotalarına işaret ettiği dönemin korumasıydı;
// B17 migration'ı tüm hedefleri gerçek /tools/* rotalarına çevirdi ve kilidin
// açılma koşulu ("hedefler yayına girince disabled kaldır") sağlandı.
// "Tekrar Çöz" değişmedi: buton, her zaman aktif.
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { resolveCta, TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import type { ToolCta } from "@/lib/relocation-tools-types";

interface ResultCtaPanelProps {
  ctas: ToolCta[];
  onCtaClick?: (cta: ToolCta) => void;
  /** Verilirse ızgaranın son hücresi "Tekrar Çöz" olur (aktif buton). */
  onRetake?: () => void;
}

/** Her hücre aynı genişlik/yüksekliği paylaşır; uzun etiketler taşmadan sarar. */
const CELL_CLASS =
  "h-auto min-h-16 w-full flex-col gap-1.5 whitespace-normal px-3 py-3 text-center leading-snug";

export function ResultCtaPanel({ ctas, onCtaClick, onRetake }: ResultCtaPanelProps) {
  if (ctas.length === 0 && !onRetake) return null;
  return (
    // 2 sütun + auto-rows-fr: tüm hücreler her ekran boyutunda aynı genişlik ve yükseklikte.
    <div className="grid grid-cols-2 auto-rows-fr gap-2">
      {ctas.map((raw, idx) => {
        // raw.key gelse de gelmese de copy haritasından tamamla; raw.href override eder.
        const cta = resolveCta(raw.key ?? `cta-${idx}`, raw.href);
        const label = raw.label ?? cta.label;
        return (
          <Button
            key={cta.key + idx}
            asChild
            variant="outline"
            className={CELL_CLASS}
            onClick={() => onCtaClick?.(cta)}
          >
            <Link to={cta.href ?? "/tools"}>
              <span>{label}</span>
            </Link>
          </Button>
        );
      })}
      {onRetake && (
        <Button variant="outline" onClick={onRetake} className={CELL_CLASS}>
          {TOOLS_UI_COPY.retake}
        </Button>
      )}
    </div>
  );
}
