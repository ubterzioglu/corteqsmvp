// Sosyal Medya Paylaşım Deposu — tek birleşik liste. Eskiden 4 ayrı sekme
// (ToolPromotionsTab/DiasporaPostsTab/TestToolsTab/BurakShareTab) burada tek
// accordion'da birleşti; kaynak filtre çipleriyle daraltılabilir. Veri normalize
// katmanı: lib/admin-shell/social-share-unified.ts.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, Linkedin, Palette } from "lucide-react";

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

const FILTER_ORDER: ShareTab[] = ["tools", "diaspora", "tests", "burak"];

type UnifiedShareListProps = {
  copiedId: string | null;
  onCopy: CopyFn;
  renderShareBar?: (tab: ShareTab, itemId: string) => ReactNode;
};

export function UnifiedShareList({ copiedId, onCopy, renderShareBar }: UnifiedShareListProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<SourceFilter>(ALL_FILTER);
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

  const visibleItems = useMemo(
    () => (filter === ALL_FILTER ? UNIFIED_ITEMS : UNIFIED_ITEMS.filter((i) => i.tab === filter)),
    [filter],
  );

  const counts = useMemo(() => {
    const map: Partial<Record<ShareTab, number>> = {};
    for (const item of UNIFIED_ITEMS) {
      map[item.tab] = (map[item.tab] ?? 0) + 1;
    }
    return map;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={filter === ALL_FILTER}
          label={`Tümü (${UNIFIED_ITEMS.length})`}
          onClick={() => setFilter(ALL_FILTER)}
        />
        {FILTER_ORDER.map((tab) => (
          <FilterChip
            key={tab}
            active={filter === tab}
            label={`${SOURCE_LABELS[tab]} (${counts[tab] ?? 0})`}
            onClick={() => setFilter(tab)}
          />
        ))}
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {visibleItems.map((item) => (
          <UnifiedAccordionItem
            key={`${item.tab}-${item.id}`}
            item={item}
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
  copiedId: string | null;
  onCopy: CopyFn;
  asset: Record<string, BurakShareAsset> | undefined;
  renderShareBar?: (tab: ShareTab, itemId: string) => ReactNode;
};

function UnifiedAccordionItem({ item, copiedId, onCopy, asset, renderShareBar }: UnifiedAccordionItemProps) {
  const singleVariant = item.variants.length === 1;

  return (
    <AccordionItem value={`${item.tab}-${item.id}`} className="rounded-xl border bg-card px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-1 flex-wrap items-center gap-2 pr-3 text-left">
          <span className="font-mono text-sm font-bold text-muted-foreground">
            {String(item.order).padStart(2, "0")}
          </span>
          <span className="text-base font-semibold">{item.name}</span>
          <Badge variant="outline" className={item.sourceBadgeClass}>
            {item.sourceLabel}
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
            const slotKey = item.hasMediaPanel ? burakSlotKey(item.id, index) : undefined;

            return (
              <div key={idPrefix} className="space-y-2">
                {!singleVariant && (
                  <Badge variant="secondary" className="text-xs">
                    Varyant {variantNo}
                  </Badge>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Palette className="h-4 w-4" /> Canva Promptu
                        <span className="text-xs font-normal text-muted-foreground">metinsiz</span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopy(variant.canvaPrompt, `${idPrefix}-canva`)}
                      >
                        {copiedId === `${idPrefix}-canva` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        readOnly
                        value={variant.canvaPrompt}
                        className="min-h-[140px] resize-y text-xs"
                      />
                      {item.hasMediaPanel && (
                        <>
                          <GeneratedImagePreview toolId={item.id} variantNo={variantNo} />
                          <BurakMediaPanel
                            slotKey={slotKey as string}
                            toolId={item.id}
                            variantIndex={index}
                            asset={asset?.[slotKey as string]}
                          />
                        </>
                      )}
                    </CardContent>
                  </Card>

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
                </div>
              </div>
            );
          })}
        </div>
        {renderShareBar?.(item.tab, item.id)}
      </AccordionContent>
    </AccordionItem>
  );
}

type FilterChipProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function FilterChip({ active, label, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-200"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
