// Araç hub karşılama bandı — /tools.
//
// 2026-09-20 (kullanıcı kararı): bant, Etkinlikler ve Radar ile AYNI kabuğa geçti
// (`components/common/PageHero`). Önceki `tools-daylight-shell` düz açık bandı
// kaldırıldı; akrabalık artık üç sayfanın paylaştığı DÜZENDEN geliyor, ayrı ayrı
// tutturulan hue çapalarından değil.
//
// ⚠️ Araç detay sayfası (RelocationToolPage) KOYU uzay yüzeyinde KALIR — bu ayrılık
// 10.08.2026'da bilinçli olarak konuldu, "tutarsız" diye koyuya geri çevirme.
//
// Arama kutusu bilinçli olarak hero'nun İÇİNDE: 18 araçlık bir dizinde birincil eylem
// gezinmek değil aramaktır (ui-ux-pro-max "Marketplace / Directory" deseni). PageHero'nun
// `children` yuvası tam olarak bunun için var.
import { Search, Wrench, X } from "lucide-react";

import { PageHero } from "@/components/common/PageHero";
import { Input } from "@/components/ui/input";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";

interface ToolsHubHeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  /** Toplam aktif araç sayısı — 0 ise (yükleniyor/boş) istatistik satırı gizlenir. */
  toolCount: number;
  categoryCount: number;
}

export function ToolsHubHero({ query, onQueryChange, toolCount, categoryCount }: ToolsHubHeroProps) {
  return (
    <div className="mb-6">
      <PageHero
        icon={Wrench}
        iconClassName="text-amber-600"
        shellClassName="border border-amber-100 bg-[radial-gradient(circle_at_top_left,#fffbeb_0%,#fafafa_45%,#ffffff_100%)]"
        tintClassName="bg-[linear-gradient(135deg,rgba(245,158,11,0.07),transparent_45%,rgba(139,92,246,0.07))]"
        // Arama kutusu için sol kolon Etkinlikler'dekinden geniş; 52%'de giriş alanı sıkışıyordu.
        contentWidthClassName="md:w-[58%]"
        image={{
          src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=400&fit=crop",
          alt: "Masada plan ve hesap üzerinde çalışan eller — yurt dışı yol haritası araçları",
        }}
        titleLines={[
          {
            text: "CorteQS",
            gradientClassName: "bg-[linear-gradient(90deg,#d97706_0%,#f59e0b_40%,#fbbf24_75%)]",
          },
          {
            text: "Araçlar",
            gradientClassName: "bg-[linear-gradient(90deg,#f59e0b_0%,#8b5cf6_55%,#6366f1_100%)]",
          },
        ]}
        badges={[
          { label: TOOLS_UI_COPY.hubFree, className: "border-amber-200/70 text-amber-700" },
          { label: TOOLS_UI_COPY.hubNoAccount, className: "border-violet-200/70 text-violet-700" },
          ...(toolCount > 0
            ? [
                {
                  label: `${toolCount} araç · ${categoryCount} kategori`,
                  className: "border-slate-200/70 text-slate-700",
                },
              ]
            : []),
        ]}
        // Alt başlık uzun; nowrap açık kalsaydı okunabilirlik örtüsünü aşıp
        // görselin kalabalık kısmına taşardı.
        nowrapLines={false}
        lines={[TOOLS_UI_COPY.hubSubtitle]}
      >
        <div className="relative mt-5 max-w-md">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label={TOOLS_UI_COPY.hubSearchLabel}
            placeholder={TOOLS_UI_COPY.hubSearchPlaceholder}
            className="h-12 rounded-full border-slate-300 bg-white pl-11 pr-12 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:ring-slate-500 focus-visible:ring-offset-0 md:text-sm [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label={TOOLS_UI_COPY.hubSearchClear}
              // h-11/w-11 = 44px dokunma hedefi; ikon küçük ama basılabilir alan tam.
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </PageHero>
    </div>
  );
}

export default ToolsHubHero;
