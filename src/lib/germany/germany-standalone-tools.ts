// Almanya standalone araçları — DB skorlama/oturum motoruna UYMAYAN araçlar (deterministik
// hesaplayıcı, dallanmalı karar ağacı veya soru havuzu). Bunlar /relocation/tools/:toolSlug
// altında kendi React bileşenleriyle render edilir; relocation_tool_sessions akışına girmez.
//
// Hub kartı yine DB'den gelir (relocation_tools satırı) — sadece sayfa gövdesi farklıdır.
// RelocationToolPage bu slug kümesini kontrol edip eşleşirse ilgili bileşeni gösterir.

import type { ComponentType } from "react";

export interface StandaloneTool {
  slug: string;
  /** Hub satırı bulunamazsa kullanılacak başlık/özet (fallback). */
  title: string;
  summary: string;
  load: () => Promise<{ default: ComponentType }>;
}

export const GERMANY_STANDALONE_TOOLS: Record<string, StandaloneTool> = {
  "maas-hesaplama-almanya": {
    slug: "maas-hesaplama-almanya",
    title: "Maaş Hesaplama (Almanya)",
    summary: "Brütten nete ve netten brüte; vergi sınıfı, eyalet ve sigortaya göre 2026 hesabı.",
    load: () => import("@/pages/relocation/tools/germany/MaasHesaplamaToolPage"),
  },
  "vize-secim-almanya": {
    slug: "vize-secim-almanya",
    title: "Vize Seçimi (Almanya)",
    summary: "Birkaç soruda sana en uygun Almanya vize yolunu (Mavi Kart, Chancenkarte, Ausbildung…) bul.",
    load: () => import("@/pages/relocation/tools/germany/VizeSecimToolPage"),
  },
  "vatandaslik-testi-almanya": {
    slug: "vatandaslik-testi-almanya",
    title: "Vatandaşlık Testi (Almanya)",
    summary: "Einbürgerungstest pratiği: 300 soruluk havuz, deneme sınavı ve eyalet soruları (DE+TR).",
    load: () => import("@/pages/relocation/tools/germany/VatandaslikTestiToolPage"),
  },
  "para-transferi-almanya": {
    slug: "para-transferi-almanya",
    title: "Para Transferi (Almanya)",
    summary: "Almanya'dan Türkiye'ye gönderimde en avantajlı yöntemi bul (ücret + kur sonrası net TL).",
    load: () => import("@/pages/relocation/tools/germany/ParaTransferiToolPage"),
  },
  "stepstone-karsilastirma-almanya": {
    slug: "stepstone-karsilastirma-almanya",
    title: "StepStone Maaş Karşılaştırma (Almanya)",
    summary: "StepStone 2026 maaş raporuna göre maaşını sektör/deneyim/eyalet medyanıyla karşılaştır.",
    load: () => import("@/pages/relocation/tools/germany/StepstoneKarsilastirmaToolPage"),
  },
};

/** Bir slug standalone Almanya aracı mı? */
export function isGermanyStandaloneTool(slug: string): boolean {
  return slug in GERMANY_STANDALONE_TOOLS;
}

export function getGermanyStandaloneTool(slug: string): StandaloneTool | null {
  return GERMANY_STANDALONE_TOOLS[slug] ?? null;
}
