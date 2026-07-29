// Sonuç CTA paneli — result.ctas + "Tekrar Çöz" tek bir 2×2 ızgarada, eşit boyutlu.
// docs/10tool/00 §CTA.
//
// CTA hedefleri (ör. /relocation/tools/sehir-eslestirme) henüz canlı route değil —
// gerçek rotalar /tools/:toolSlug altında. Bu yüzden CTA'lar "Yakında" rozetiyle
// devre dışı gösterilir; hedefler yayına girince tek yapılacak `disabled` kaldırmak.
// "Tekrar Çöz" bu kuralın dışında: her zaman aktif ve rozetsiz.
import { Button } from "@/components/ui/button";
import { resolveCta, TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import type { ToolCta } from "@/lib/relocation-tools-types";

interface ResultCtaPanelProps {
  ctas: ToolCta[];
  onCtaClick?: (cta: ToolCta) => void;
  /** Verilirse ızgaranın son hücresi "Tekrar Çöz" olur (aktif, rozetsiz). */
  onRetake?: () => void;
}

/** Her hücre aynı genişlik/yüksekliği paylaşır; uzun etiketler taşmadan sarar. */
const CELL_CLASS =
  "h-auto min-h-16 w-full flex-col gap-1.5 whitespace-normal px-3 py-3 text-center leading-snug";

export function ResultCtaPanel({ ctas, onCtaClick, onRetake }: ResultCtaPanelProps) {
  if (ctas.length === 0 && !onRetake) return null;
  return (
    // 2 sütun + auto-rows-fr: tüm hücreler her ekran boyutunda aynı genişlik ve yükseklikte
    // (en uzun etiket hepsini birlikte büyütür; rozetsiz "Tekrar Çöz" de geride kalmaz).
    <div className="grid grid-cols-2 auto-rows-fr gap-2">
      {ctas.map((raw, idx) => {
        // raw.key gelse de gelmese de copy haritasından tamamla; raw.href override eder.
        const cta = resolveCta(raw.key ?? `cta-${idx}`, raw.href);
        const label = raw.label ?? cta.label;
        return (
          <Button
            key={cta.key + idx}
            variant="outline"
            disabled
            aria-label={`${label} — ${TOOLS_UI_COPY.comingSoon}`}
            onClick={() => onCtaClick?.(cta)}
            className={CELL_CLASS}
          >
            <span>{label}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
              {TOOLS_UI_COPY.comingSoon}
            </span>
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
