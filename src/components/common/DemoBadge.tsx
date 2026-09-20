/**
 * "DEMO" rozeti — demo bir sayfaya GÖTÜREN düğme/kartın sağ üst köşesine oturur.
 *
 * Desenin yarısı budur; öbür yarısı `DemoBanner`. Ayrıntı ve kural:
 * `src/lib/demo-pages.ts` dosya başı ile `docs/guides/demo-icerik-deseni.md`.
 *
 * KULLANIM: taşıyıcı öğe `relative` olmalı (rozet `absolute`). Rozet
 * `pointer-events-none` taşır — üzerine gelmek düğmenin tıklamasını ya da
 * ipucunu engellemez.
 *
 * ERİŞİLEBİLİRLİK: rozet SÜS DEĞİL, bilgi taşır. Bu yüzden `aria-hidden`
 * verilmez; ekran okuyucu düğmenin adından sonra "DEMO" der. `title` ise
 * fareyle gelene tam cümleyi gösterir.
 */

import { DEMO_COPY } from "@/lib/demo-pages";

interface DemoBadgeProps {
  /** Ek konum sınıfları — varsayılan sağ üst köşedir. */
  className?: string;
}

export function DemoBadge({ className }: DemoBadgeProps) {
  return (
    <span
      title={DEMO_COPY.badgeTitle}
      className={`pointer-events-none absolute -right-1 -top-1.5 rounded-full border border-white/70 bg-slate-900/90 px-1.5 py-px text-[0.55rem] font-bold uppercase tracking-[0.12em] text-white shadow-sm ${className ?? ""}`}
    >
      {DEMO_COPY.badge}
    </span>
  );
}

export default DemoBadge;
