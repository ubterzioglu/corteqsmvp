// Sosyal Medya Paylaşım Deposu — tek birleşik liste. Eskiden 4 ayrı sekme
// (ToolPromotionsTab/DiasporaPostsTab/TestToolsTab/BurakShareTab) burada tek
// accordion'da birleşti; kaynak filtre çipleriyle daraltılabilir, kaynağa özel
// ikinci sıra kategori/tema çipleriyle daha da daraltılabilir. "Tümü" görünümünde
// kartlar 1'den başlayarak sürekli numaralanır; bir kaynağa filtrelenince o
// kaynağın kendi 1..N sırası gösterilir. Veri normalize katmanı:
// lib/admin-shell/social-share-unified.ts.
// Görünüm sırası kartın sabit globalIndex/assignedDate alanına göre (20 Tem →
// 21 Tem → ...) sıralanır — kaynaklar zaten UNIFIED_ITEMS'ta harmanlanmış
// (interleaveBySource) sırada geldiği için ardışık günlerde aynı kaynaktan
// içerik tekrarlanma olasılığı düşük.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  ImageIcon,
  Instagram,
  Linkedin,
  MessageCircle,
  Palette,
  Video,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BurakMediaPanel } from "@/components/admin/social-share/BurakMediaPanel";
import { GeneratedImagePreview } from "@/components/admin/social-share/GeneratedImagePreview";
import type { ShareTab } from "@/lib/admin-shell/social-share-log";
import { SOURCE_LABELS, UNIFIED_ITEMS, type UnifiedItem } from "@/lib/admin-shell/social-share-unified";
import {
  burakSlotKey,
  listBurakShareAssets,
  type BurakShareAsset,
} from "@/lib/admin-shell/burak-share-assets";

type CopyFn = (text: string, id: string) => void;

const ALL_FILTER = "all" as const;
type SourceFilter = typeof ALL_FILTER | ShareTab;

const SUB_ALL_FILTER = "all" as const;
type SubFilter = typeof SUB_ALL_FILTER | string;

const FILTER_ORDER: ShareTab[] = ["tools", "diaspora", "tests", "burak"];

type UnifiedShareListProps = {
  copiedId: string | null;
  onCopy: CopyFn;
  renderShareBar?: (tab: ShareTab, itemId: string) => ReactNode;
};

export function UnifiedShareList({ copiedId, onCopy, renderShareBar }: UnifiedShareListProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<SourceFilter>(ALL_FILTER);
  const [subFilter, setSubFilter] = useState<SubFilter>(SUB_ALL_FILTER);
  const [assets, setAssets] = useState<Record<string, BurakShareAsset>>({});

  useEffect(() => {
    let active = true;
    listBurakShareAssets()
      .then((map) => {
        if (active) setAssets(map);
      })
      .catch((error: unknown) => {
        toast({
          title: "Medya kayıtları yüklenemedi",
          description: error instanceof Error ? error.message : "Beklenmeyen hata",
          variant: "destructive",
        });
      });
    return () => {
      active = false;
    };
  }, [toast]);

  // Sekme değişince alt filtre sıfırlanır (bir sekmenin kategori/tema seçimi diğerine taşınmaz).
  const changeFilter = (next: SourceFilter) => {
    setFilter(next);
    setSubFilter(SUB_ALL_FILTER);
  };

  const counts = useMemo(() => {
    const map: Partial<Record<ShareTab, number>> = {};
    for (const item of UNIFIED_ITEMS) {
      map[item.tab] = (map[item.tab] ?? 0) + 1;
    }
    return map;
  }, []);

  // Aktif sekmedeki kalemlerin benzersiz kategori/tema etiketleri (görünüm sırasına göre).
  const subFilterOptions = useMemo(() => {
    if (filter === ALL_FILTER) return [];
    const seen = new Set<string>();
    const options: string[] = [];
    for (const item of UNIFIED_ITEMS) {
      if (item.tab !== filter) continue;
      const label = item.categoryLabel ?? item.themeLabel;
      if (label && !seen.has(label)) {
        seen.add(label);
        options.push(label);
      }
    }
    return options;
  }, [filter]);

  const tabFilteredItems = useMemo(
    () => (filter === ALL_FILTER ? UNIFIED_ITEMS : UNIFIED_ITEMS.filter((i) => i.tab === filter)),
    [filter],
  );

  const subFilteredItems = useMemo(() => {
    if (subFilter === SUB_ALL_FILTER) return tabFilteredItems;
    return tabFilteredItems.filter((item) => (item.categoryLabel ?? item.themeLabel) === subFilter);
  }, [tabFilteredItems, subFilter]);

  // Görünüm sırası kartın sabit assignedDate'ine göre (20 Tem → 21 Tem → ...) sıralanır.
  const visibleItems = useMemo(
    () => [...subFilteredItems].sort((a, b) => a.globalIndex - b.globalIndex),
    [subFilteredItems],
  );

  // "Tümü" görünümünde 1..N sürekli numara; bir kaynağa filtrelenince o kaynağın kendi order'ı.
  const displayOrders = useMemo(() => {
    const map = new Map<string, number>();
    visibleItems.forEach((item, index) => {
      map.set(`${item.tab}-${item.id}`, filter === ALL_FILTER ? index + 1 : item.order);
    });
    return map;
  }, [visibleItems, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={filter === ALL_FILTER}
          label={`Tümü (${UNIFIED_ITEMS.length})`}
          onClick={() => changeFilter(ALL_FILTER)}
        />
        {FILTER_ORDER.map((tab) => (
          <FilterChip
            key={tab}
            active={filter === tab}
            label={`${SOURCE_LABELS[tab]} (${counts[tab] ?? 0})`}
            onClick={() => changeFilter(tab)}
          />
        ))}
      </div>

      {subFilterOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-l-2 border-muted pl-3">
          <FilterChip
            active={subFilter === SUB_ALL_FILTER}
            label="Tümü"
            small
            onClick={() => setSubFilter(SUB_ALL_FILTER)}
          />
          {subFilterOptions.map((label) => (
            <FilterChip
              key={label}
              active={subFilter === label}
              label={label}
              small
              onClick={() => setSubFilter(label)}
            />
          ))}
        </div>
      )}

      <Accordion type="single" collapsible className="space-y-2">
        {visibleItems.map((item) => (
          <UnifiedAccordionItem
            key={`${item.tab}-${item.id}`}
            item={item}
            displayOrder={displayOrders.get(`${item.tab}-${item.id}`) ?? item.order}
            copiedId={copiedId}
            onCopy={onCopy}
            asset={item.hasMediaPanel ? assets : undefined}
            renderShareBar={renderShareBar}
          />
        ))}
      </Accordion>
    </div>
  );
}

type UnifiedAccordionItemProps = {
  item: UnifiedItem;
  displayOrder: number;
  copiedId: string | null;
  onCopy: CopyFn;
  asset: Record<string, BurakShareAsset> | undefined;
  renderShareBar?: (tab: ShareTab, itemId: string) => ReactNode;
};

function UnifiedAccordionItem({
  item,
  displayOrder,
  copiedId,
  onCopy,
  asset,
  renderShareBar,
}: UnifiedAccordionItemProps) {
  const singleVariant = item.variants.length === 1;

  return (
    <AccordionItem value={`${item.tab}-${item.id}`} className="rounded-xl border bg-card px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-1 flex-wrap items-center gap-2 pr-3 text-left">
          <span className="font-mono text-sm font-bold text-muted-foreground">
            {String(displayOrder).padStart(2, "0")}
          </span>
          <span className="text-base font-semibold">{item.name}</span>
          <Badge variant="outline" className={item.sourceBadgeClass}>
            {item.sourceLabel}
          </Badge>
          <Badge
            variant="outline"
            className="border-muted-foreground/30 bg-muted/40 text-muted-foreground"
          >
            {item.assignedDate}
          </Badge>
          {item.categoryLabel && (
            <Badge variant="outline" className={item.categoryBadgeClass}>
              {item.categoryLabel}
            </Badge>
          )}
          {item.themeLabel && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300"
            >
              {item.themeLabel}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {item.description && (
          <p className="mb-4 text-sm text-muted-foreground">{item.description}</p>
        )}
        <div className="space-y-4">
          {item.variants.map((variant, index) => {
            const variantNo = index + 1;
            const idPrefix = singleVariant ? item.id : `${item.id}-v${variantNo}`;
            const slotKey = item.hasMediaPanel
              ? burakSlotKey(item.tab, item.id, index)
              : undefined;

            return (
              <div key={idPrefix} className="space-y-2">
                {!singleVariant && (
                  <Badge variant="secondary" className="text-xs">
                    Varyant {variantNo}
                  </Badge>
                )}
                <div className="flex flex-col gap-4">
                  {variant.imagePrompts.map((prompt, promptIndex) => {
                    const promptNo = promptIndex + 1;
                    const promptId = `${idPrefix}-image-${promptNo}`;
                    const simpleLabel = singleVariant
                      ? `${displayOrder}_${promptNo}`
                      : `${displayOrder}_${variantNo}_${promptNo}`;
                    return (
                      <Card key={promptId}>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Palette className="h-4 w-4" /> Görsel Promptu {promptNo}
                            <span className="text-xs font-normal text-muted-foreground">
                              ChatGPT · metinsiz
                            </span>
                            <span className="font-mono text-[0.68rem] font-normal text-muted-foreground">
                              {simpleLabel}
                            </span>
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopy(prompt, promptId)}
                          >
                            {copiedId === promptId ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <Textarea
                            readOnly
                            value={prompt}
                            className="min-h-[140px] resize-y text-xs"
                          />
                          {item.tab === "burak" && promptIndex === 0 && (
                            <GeneratedImagePreview toolId={item.id} variantNo={variantNo} />
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Linkedin className="h-4 w-4" /> LinkedIn Postu
                        <span className="text-xs font-normal text-muted-foreground">
                          kopyala-yapıştır
                        </span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopy(variant.linkedinPost, `${idPrefix}-linkedin`)}
                      >
                        {copiedId === `${idPrefix}-linkedin` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        readOnly
                        value={variant.linkedinPost}
                        className="min-h-[220px] resize-y text-sm"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Instagram className="h-4 w-4" /> Instagram Postu
                        <span className="text-xs font-normal text-muted-foreground">
                          kopyala-yapıştır
                        </span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopy(variant.instagramPost, `${idPrefix}-instagram`)}
                      >
                        {copiedId === `${idPrefix}-instagram` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        readOnly
                        value={variant.instagramPost}
                        className="min-h-[220px] resize-y text-sm"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <MessageCircle className="h-4 w-4" /> Reddit Postu
                        <span className="text-xs font-normal text-muted-foreground">
                          kopyala-yapıştır
                        </span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopy(variant.redditPost, `${idPrefix}-reddit`)}
                      >
                        {copiedId === `${idPrefix}-reddit` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        readOnly
                        value={variant.redditPost}
                        className="min-h-[220px] resize-y text-sm"
                      />
                    </CardContent>
                  </Card>
                </div>

                {item.hasMediaPanel && (
                  <MediaToggle
                    slotKey={slotKey as string}
                    tab={item.tab}
                    itemId={item.id}
                    variantIndex={index}
                    asset={asset?.[slotKey as string]}
                  />
                )}
              </div>
            );
          })}
        </div>
        {renderShareBar?.(item.tab, item.id)}
      </AccordionContent>
    </AccordionItem>
  );
}

type MediaToggleProps = {
  slotKey: string;
  tab: ShareTab;
  itemId: string;
  variantIndex: number;
  asset: BurakShareAsset | undefined;
};

/** Kart altında küçük "Görsel"/"Video" ikon-butonları — tıklanınca medya paneli aç/kapat. */
function MediaToggle({ slotKey, tab, itemId, variantIndex, asset }: MediaToggleProps) {
  const [open, setOpen] = useState(false);
  const hasMedia = Boolean(asset?.imageBucket || asset?.imageUrl || asset?.videoUrl);

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Button
          variant={open ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setOpen((v) => !v)}
        >
          <ImageIcon className="mr-1 h-3.5 w-3.5" />
          Görsel
        </Button>
        <Button
          variant={open ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setOpen((v) => !v)}
        >
          <Video className="mr-1 h-3.5 w-3.5" />
          Video
        </Button>
        {hasMedia && !open && (
          <span className="text-xs text-muted-foreground">Medya eklendi</span>
        )}
      </div>
      {open && (
        <BurakMediaPanel
          slotKey={slotKey}
          tab={tab}
          itemId={itemId}
          variantIndex={variantIndex}
          asset={asset}
        />
      )}
    </div>
  );
}

type FilterChipProps = {
  active: boolean;
  label: string;
  onClick: () => void;
  small?: boolean;
};

function FilterChip({ active, label, onClick, small }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border font-medium transition-colors",
        small ? "px-2.5 py-0.5 text-[0.7rem]" : "px-3 py-1 text-xs",
        active
          ? "border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-200"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
