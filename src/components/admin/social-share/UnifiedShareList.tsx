// Sosyal Medya Paylaşım Deposu — tek sürekli liste. Eskiden 4 ayrı sekme
// (ToolPromotionsTab/DiasporaPostsTab/TestToolsTab/BurakShareTab), sonra
// kaynak filtre çipleriyle daraltılabilen tek accordion'du; artık filtre
// çipleri de kalktı — 1'den N'e kadar sürekli numaralanmış tek liste.
// Kartlar hâlâ hangi kaynaktan geldiğini gösteren bilgi rozeti taşır
// (Araç Tanıtımları/Diaspora/Test/Burak) ama bu yalnız görsel bilgidir; DB
// kimliği kartın sabit globalId'sidir (bkz. social-share-unified.ts).
// Görünüm sırası kartın sabit globalIndex/assignedDate alanına göre (20 Tem →
// 21 Tem → ...) sıralanır — UNIFIED_ITEMS zaten kod içine gömülü deterministik
// randomize sırada gelir (RANDOMIZED_ORDER).

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  ImageOff,
  Instagram,
  Linkedin,
  Loader2,
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BurakMediaPanel } from "@/components/admin/social-share/BurakMediaPanel";
import { GeneratedImagePreview } from "@/components/admin/social-share/GeneratedImagePreview";
import type { ShareTab } from "@/lib/admin-shell/social-share-log";
import { UNIFIED_ITEMS, type UnifiedItem } from "@/lib/admin-shell/social-share-unified";
import {
  burakSlotKey,
  countBurakShareExtraImagesBySlot,
  getBurakShareImageUrl,
  listBurakShareAssets,
  listBurakShareFirstExtraImageBySlot,
  type BurakShareAsset,
} from "@/lib/admin-shell/burak-share-assets";

type CopyFn = (text: string, id: string) => void;

type UnifiedShareListProps = {
  copiedId: string | null;
  onCopy: CopyFn;
  renderShareBar?: (globalId: string, tab: ShareTab, itemId: string) => ReactNode;
};

// Görünüm sırası kartın sabit globalIndex'ine göre (UNIFIED_ITEMS zaten bu
// sırada gelir — bkz. social-share-unified.ts RANDOMIZED_ORDER).
const VISIBLE_ITEMS: UnifiedItem[] = [...UNIFIED_ITEMS].sort(
  (a, b) => a.globalIndex - b.globalIndex,
);

export function UnifiedShareList({ copiedId, onCopy, renderShareBar }: UnifiedShareListProps) {
  const { toast } = useToast();
  const [assets, setAssets] = useState<Record<string, BurakShareAsset>>({});
  const [extraImageCounts, setExtraImageCounts] = useState<Record<string, number>>({});
  const [firstExtraImages, setFirstExtraImages] = useState<
    Record<string, { imageBucket: string; imagePath: string }>
  >({});

  useEffect(() => {
    let active = true;
    Promise.all([
      listBurakShareAssets(),
      countBurakShareExtraImagesBySlot(),
      listBurakShareFirstExtraImageBySlot(),
    ])
      .then(([map, counts, firstExtras]) => {
        if (active) {
          setAssets(map);
          setExtraImageCounts(counts);
          setFirstExtraImages(firstExtras);
        }
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

  return (
    <div className="space-y-3">
      <Accordion type="single" collapsible className="space-y-2">
        {VISIBLE_ITEMS.map((item, index) => (
          <UnifiedAccordionItem
            key={item.globalId}
            item={item}
            displayOrder={index + 1}
            copiedId={copiedId}
            onCopy={onCopy}
            asset={item.hasMediaPanel ? assets : undefined}
            extraImageCounts={item.hasMediaPanel ? extraImageCounts : undefined}
            firstExtraImages={item.hasMediaPanel ? firstExtraImages : undefined}
            onExtraImageCountChange={
              item.hasMediaPanel
                ? (slotKey, count) =>
                    setExtraImageCounts((current) => ({ ...current, [slotKey]: count }))
                : undefined
            }
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
  extraImageCounts: Record<string, number> | undefined;
  firstExtraImages: Record<string, { imageBucket: string; imagePath: string }> | undefined;
  onExtraImageCountChange?: (slotKey: string, count: number) => void;
  renderShareBar?: (tab: ShareTab, itemId: string) => ReactNode;
};

function UnifiedAccordionItem({
  item,
  displayOrder,
  copiedId,
  onCopy,
  asset,
  extraImageCounts,
  firstExtraImages,
  onExtraImageCountChange,
  renderShareBar,
}: UnifiedAccordionItemProps) {
  const singleVariant = item.variants.length === 1;

  // Kalemin her varyant slot'u — kapak (asset) + ek görseller (extraImageCounts/firstExtraImages)
  // eşleşmesi için önceden hesapla (akordeon başlığındaki rozet + prompt kartları ortak kullanır).
  const variantSlotKeys = item.hasMediaPanel
    ? item.variants.map((_variant, index) => burakSlotKey(item.globalId, index))
    : [];

  // Kalemin tüm varyantlarındaki toplam görsel sayısı (kapak + ek) — akordeon başlığındaki rozet için.
  const totalImageCount = item.hasMediaPanel
    ? variantSlotKeys.reduce((sum, slotKey) => {
        const hasCover = Boolean(asset?.[slotKey]?.imageBucket || asset?.[slotKey]?.imageUrl);
        const extra = extraImageCounts?.[slotKey] ?? 0;
        return sum + (hasCover ? 1 : 0) + extra;
      }, 0)
    : 0;

  // Kapalıyken de dikkat çeksin diye: en az bir kapak görseli varsa tıklanabilir hızlı link.
  const firstVariantWithCover = item.hasMediaPanel
    ? variantSlotKeys.find((slotKey) => Boolean(asset?.[slotKey]?.imageBucket))
    : undefined;
  const firstCoverAsset = firstVariantWithCover ? asset?.[firstVariantWithCover] : undefined;

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
          {totalImageCount > 0 ? (
            <ImageLinkBadge
              bucket={firstCoverAsset?.imageBucket ?? null}
              path={firstCoverAsset?.imagePath ?? null}
              count={totalImageCount}
            />
          ) : item.hasMediaPanel ? (
            <Badge
              variant="outline"
              className="gap-1 border-muted-foreground/30 bg-muted/20 text-muted-foreground"
            >
              <ImageOff className="h-3 w-3" /> Görsel yok
            </Badge>
          ) : null}
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
            const slotKey = item.hasMediaPanel ? variantSlotKeys[index] : undefined;
            const coverAsset = slotKey ? asset?.[slotKey] : undefined;
            const firstExtra = slotKey ? firstExtraImages?.[slotKey] : undefined;

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
                      ? `${displayOrder}${promptNo}`
                      : `${displayOrder}${variantNo}${promptNo}`;
                    // Eşleşme kuralı: prompt 1 → kapak (social_share_assets),
                    // prompt 2 → ilk ek görsel (social_share_asset_images, sort_order=0).
                    const promptImage =
                      promptIndex === 0
                        ? coverAsset?.imageBucket && coverAsset.imagePath
                          ? { bucket: coverAsset.imageBucket, path: coverAsset.imagePath }
                          : null
                        : firstExtra
                          ? { bucket: firstExtra.imageBucket, path: firstExtra.imagePath }
                          : null;
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
                            {item.hasMediaPanel && (
                              <PromptImageLink bucket={promptImage?.bucket ?? null} path={promptImage?.path ?? null} />
                            )}
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
                          <Input readOnly value={prompt} className="text-xs" />
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
                      <Input readOnly value={variant.linkedinPost} className="text-xs" />
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
                      <Input readOnly value={variant.instagramPost} className="text-xs" />
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
                      <Input readOnly value={variant.redditPost} className="text-xs" />
                    </CardContent>
                  </Card>
                </div>

                {item.hasMediaPanel && (
                  <MediaToggle
                    slotKey={slotKey as string}
                    globalId={item.globalId}
                    variantIndex={index}
                    asset={asset?.[slotKey as string]}
                    extraImageCount={extraImageCounts?.[slotKey as string] ?? 0}
                    onExtraImageCountChange={(count) =>
                      onExtraImageCountChange?.(slotKey as string, count)
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
        {renderShareBar?.(item.globalId, item.tab, item.id)}
      </AccordionContent>
    </AccordionItem>
  );
}

type MediaToggleProps = {
  slotKey: string;
  globalId: string;
  variantIndex: number;
  asset: BurakShareAsset | undefined;
  extraImageCount: number;
  onExtraImageCountChange: (count: number) => void;
};

/** Kart altında küçük "Görsel"/"Video" ikon-butonları — tıklanınca medya paneli aç/kapat. */
function MediaToggle({
  slotKey,
  globalId,
  variantIndex,
  asset,
  extraImageCount,
  onExtraImageCountChange,
}: MediaToggleProps) {
  const [open, setOpen] = useState(false);
  const hasCoverImage = Boolean(asset?.imageBucket || asset?.imageUrl);
  const totalImageCount = (hasCoverImage ? 1 : 0) + extraImageCount;
  const hasVideo = Boolean(asset?.videoUrl);

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Button
          variant={totalImageCount > 0 ? "default" : open ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "h-7 px-2 text-xs",
            totalImageCount > 0 && "bg-emerald-600 text-white hover:bg-emerald-700",
          )}
          onClick={() => setOpen((v) => !v)}
        >
          <ImageIcon className="mr-1 h-3.5 w-3.5" />
          Görsel{totalImageCount > 0 ? ` (${totalImageCount})` : ""}
        </Button>
        <Button
          variant={hasVideo ? "default" : open ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "h-7 px-2 text-xs",
            hasVideo && "bg-emerald-600 text-white hover:bg-emerald-700",
          )}
          onClick={() => setOpen((v) => !v)}
        >
          <Video className="mr-1 h-3.5 w-3.5" />
          Video
        </Button>
      </div>
      {open && (
        <BurakMediaPanel
          slotKey={slotKey}
          globalId={globalId}
          variantIndex={variantIndex}
          asset={asset}
          onExtraImageCountChange={onExtraImageCountChange}
        />
      )}
    </div>
  );
}

type ImageLinkBadgeProps = {
  bucket: string | null;
  path: string | null;
  count: number;
};

/**
 * Akordeon başlığındaki (kapalıyken de görünen) görsel rozeti — tıklanınca
 * signed URL'i lazy-fetch edip yeni sekmede açar. Kartın açılmasını beklemeye
 * gerek kalmadan görseli dikkat çekecek şekilde işaretler.
 */
function ImageLinkBadge({ bucket, path, count }: ImageLinkBadgeProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!bucket || !path) return;
    setLoading(true);
    try {
      const url = await getBurakShareImageUrl(bucket, path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error: unknown) {
      toast({
        title: "Görsel linki açılamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Badge
      onClick={(event) => void handleClick(event)}
      className="cursor-pointer gap-1 border-emerald-500/40 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-300"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <ImageIcon className="h-3 w-3" />
      )}
      {count}
      <ExternalLink className="h-3 w-3" />
    </Badge>
  );
}

type PromptImageLinkProps = {
  bucket: string | null;
  path: string | null;
};

/**
 * "Görsel Promptu N" kart başlığının yanındaki küçük gösterge — o promptun
 * kendi görseli varsa tıklanabilir link (yeşil), yoksa "eksik" ikonu (gri).
 * Eşleşme: prompt 1 → kapak görseli, prompt 2 → ilk ek görsel (bkz. çağıran).
 */
function PromptImageLink({ bucket, path }: PromptImageLinkProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!bucket || !path) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[0.68rem] font-normal text-muted-foreground/70"
        title="Bu promptun görseli henüz yüklenmedi"
      >
        <ImageOff className="h-3 w-3" /> görsel yok
      </span>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    try {
      const url = await getBurakShareImageUrl(bucket, path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error: unknown) {
      toast({
        title: "Görsel linki açılamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className="inline-flex items-center gap-1 text-[0.68rem] font-normal text-emerald-600 hover:underline dark:text-emerald-400"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <ExternalLink className="h-3 w-3" />
      )}
      görseli aç
    </button>
  );
}
