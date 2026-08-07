// Araç hub gövdesi — /tools. 18 aktif aracı "dizin" kurgusuyla sunar:
// uzay hero + arama (birincil eylem) + kategori çipleri + tek responsive kart gridi.
//
// Mobil accordion varyantı 2026-08-06'da kaldırıldı: 18 araçta katlanmış başlık listesi
// içeriği gizliyordu; bulunabilirliği artık arama + kategori filtresi sağlıyor ve mobil
// ile masaüstü aynı kartı görüyor (tek kod yolu, tek görsel dil).
import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLandingCard } from "@/components/relocation/tools/ToolLandingCard";
import { ToolCardSkeleton } from "@/components/relocation/tools/ToolCardSkeleton";
import { ToolsHubHero } from "@/components/relocation/tools/ToolsHubHero";
import { ToolsHubCategoryFilter } from "@/components/relocation/tools/ToolsHubCategoryFilter";
import { ALL_TOOL_CATEGORIES, buildCategoryFilters, toolCategoryMeta } from "@/lib/relocation-tools-category";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import { trIncludes } from "@/lib/text-normalization";
import { cn } from "@/lib/utils";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";

/** Yüklenirken gösterilen iskelet kart sayısı — ilk ekranı dolduracak kadar. */
const SKELETON_COUNT = 6;

interface RelocationToolsHubProps {
  tools: RelocationToolRow[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * Arama eşleşmesi. trIncludes ZORUNLU: Türkçe'de bare toLowerCase yanlıştır
 * ("İstanbul" → "i̇stanbul"), ayrıca aksan-toleranslıdır ("almanya" → "Almanya",
 * "maas" → "maaş"). Kategori etiketi de taranır: "almanya" yazan kullanıcı
 * başlığında Almanya geçmeyen Almanya araçlarını da bulur.
 */
function toolMatchesQuery(tool: RelocationToolRow, query: string): boolean {
  if (!query.trim()) return true;
  return (
    trIncludes(tool.title_tr, query) ||
    trIncludes(tool.summary_tr, query) ||
    trIncludes(toolCategoryMeta(tool.category).label, query)
  );
}

export function RelocationToolsHub({ tools, isLoading, isError, onRetry }: RelocationToolsHubProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(ALL_TOOL_CATEGORIES);

  const categories = useMemo(() => buildCategoryFilters(tools), [tools]);

  const visibleTools = useMemo(
    () =>
      tools.filter(
        (tool) =>
          (activeCategory === ALL_TOOL_CATEGORIES || tool.category === activeCategory) &&
          toolMatchesQuery(tool, query),
      ),
    [tools, activeCategory, query],
  );

  const isFiltered = query.trim().length > 0 || activeCategory !== ALL_TOOL_CATEGORIES;

  const resetFilters = () => {
    setQuery("");
    setActiveCategory(ALL_TOOL_CATEGORIES);
  };

  return (
    <div className="space-y-6">
      <ToolsHubHero
        query={query}
        onQueryChange={setQuery}
        toolCount={tools.length}
        // "Tümü" gerçek bir kategori değil — sayımdan düşülür.
        categoryCount={Math.max(categories.length - 1, 0)}
      />

      {isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
          <p className="text-sm text-destructive">{TOOLS_UI_COPY.hubError}</p>
          {onRetry && (
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              {TOOLS_UI_COPY.hubRetry}
            </Button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <ToolCardSkeleton key={index} />
          ))}
          <span className="sr-only" role="status">
            {TOOLS_UI_COPY.loading}
          </span>
        </div>
      )}

      {!isLoading && !isError && tools.length > 0 && (
        <>
          <ToolsHubCategoryFilter
            categories={categories}
            activeKey={activeCategory}
            onSelect={setActiveCategory}
          />

          {/* Çipler zaten kendi sayılarını taşıyor; görünür sayaç yalnızca filtre aktifken
              bilgi verir. aria-live her durumda bağlı: ekran okuyucu sonucun değiştiğini duyar. */}
          <p
            className={cn("text-center text-xs text-muted-foreground", !isFiltered && "sr-only")}
            aria-live="polite"
          >
            {visibleTools.length} araç
          </p>

          {visibleTools.length > 0 ? (
            // key={activeCategory}: kategori değişince kartlar yeniden mount olur ve
            // stagger açılışı tekrar oynar (filtre uygulandığına dair görsel geri bildirim).
            // Arama yazarken remount olmaz — tuş başına animasyon titremesi istemiyoruz.
            <div key={activeCategory} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTools.map((tool, index) => (
                <ToolLandingCard key={tool.key} tool={tool} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-12 text-center">
              <SearchX className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">
                {query.trim() ? `"${query.trim()}" ${TOOLS_UI_COPY.hubNoMatch}` : TOOLS_UI_COPY.hubEmpty}
              </p>
              <p className="text-xs text-muted-foreground">{TOOLS_UI_COPY.hubNoMatchHint}</p>
              {isFiltered && (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  {TOOLS_UI_COPY.hubResetFilters}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {!isLoading && !isError && tools.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">{TOOLS_UI_COPY.hubEmpty}</p>
      )}
    </div>
  );
}
