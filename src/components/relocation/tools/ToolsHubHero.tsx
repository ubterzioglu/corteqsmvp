// Araç hub karşılama bandı — /tools. Araç detay sayfasıyla (RelocationToolPage) AYNI
// "uzay" yüzeyini kullanır (tools-space-shell + tools-space-stars): hub'dan bir araca
// geçerken yüzey değişmez, bu süreklilik sayfanın premium okunmasının ana kaynağı.
//
// Arama kutusu bilinçli olarak hero'nun İÇİNDE: 18 araçlık bir dizinde birincil eylem
// gezinmek değil aramaktır (ui-ux-pro-max "Marketplace / Directory" deseni).
import { Search, Sparkles, X } from "lucide-react";
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
    <div className="tools-space-shell relative mb-6 overflow-hidden rounded-3xl px-5 py-10 text-center sm:px-8 sm:py-14">
      <div className="tools-space-stars" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-inset ring-white/20 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {TOOLS_UI_COPY.hubFree} · {TOOLS_UI_COPY.hubNoAccount}
        </span>

        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          {TOOLS_UI_COPY.hubTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/70 md:text-base">
          {TOOLS_UI_COPY.hubSubtitle}
        </p>

        {toolCount > 0 && (
          <p className="mt-4 text-xs font-medium text-white/70">
            {toolCount} araç
            <span aria-hidden="true" className="mx-2 text-white/30">
              ·
            </span>
            {categoryCount} kategori
          </p>
        )}

        <div className="relative mt-6">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label={TOOLS_UI_COPY.hubSearchLabel}
            placeholder={TOOLS_UI_COPY.hubSearchPlaceholder}
            className="h-12 rounded-full border-white/20 bg-white/10 pl-11 pr-12 text-base text-white shadow-lg backdrop-blur-sm placeholder:text-white/60 focus-visible:ring-white/60 focus-visible:ring-offset-0 md:text-sm [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label={TOOLS_UI_COPY.hubSearchClear}
              // h-11/w-11 = 44px dokunma hedefi; ikon küçük ama basılabilir alan tam.
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
