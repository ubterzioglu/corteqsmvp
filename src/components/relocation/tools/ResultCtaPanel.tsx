// Sonuç CTA paneli — result.ctas + "Tekrar Çöz" tek bir 2×2 ızgarada, eşit boyutlu.
// docs/10tool/00 §CTA.
//
// 2026-09-05 REGRESYON ONARIMI (canlı revizyon 9eaba8da: "sonuç CTA linkleri çalışmıyor").
// Kronoloji:
//   * f3178d6 (2026-07-30, B21) "Yakında" kilidini kaldırdı ve CTA'ları gerçek
//     react-router linklerine çevirdi. Kilidin TEK gerekçesi, hedeflerin var olmayan
//     /relocation/tools/* rotalarına işaret etmesiydi; B17 migration'ı
//     (20260730200000_relocation_tools_cta_route_fix.sql) tüm hedefleri gerçek
//     /tools/* rotalarına çevirince kilidin açılma koşulu sağlandı.
//   * 6aa64b5 ("Improve profession salary tool UX", 2026-08-02) bu düzeltmeyi commit
//     mesajında HİÇBİR gerekçe vermeden geri aldı: CTA'lar yeniden `disabled` +
//     "Yakında" oldu ve `onCtaClick` prop'u destructure bile edilmiyordu (analytics
//     cta_click olayı da böylece sessizce öldü). Bilinçli bir ürün kararı değil,
//     yan etkiyle gelen bir geri alma.
// Hedef rotalar App.tsx rota tablosunda tek tek doğrulandı: /tools, /tools/:toolSlug,
// /directory, /profile, /cadde, /relocation — hepsi mevcut.
// "Tekrar Çöz" bu kuralın dışında: her zaman aktif buton.
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

/**
 * CTA href'i DB'den gelir (relocation_tool_results.ctas / skorlama fonksiyonlarının
 * gövdesi). `<Link to>` yalnız uygulama içi yol bekler: "https://…" ya da protokolsüz
 * "//host" gibi bir değer sessizce bozuk bir GÖRECELİ yola dönüşür ve kullanıcı
 * hiçbir yere gitmez. Uygulama içi olmayan her değeri araç hub'ına düşürüyoruz.
 */
function toInternalHref(href: string | undefined): string {
  if (!href || !href.startsWith("/") || href.startsWith("//")) return "/tools";
  return href;
}

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
            <Link to={toInternalHref(cta.href)}>
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
