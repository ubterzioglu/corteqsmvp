// "BURAK BURAYA BAK" bölümü: 12 aracın akordeonu; her varyant Canva + LinkedIn
// kartı, Canva'nın altında BurakMediaPanel. Veri: burak-share-tools.ts (statik) +
// social_share_assets (medya). Asset'ler açılışta bir kez yüklenir, slot_key ile eşlenir.
// Paylaşım rozetleri (renderShareBar) diğer bölümlerle aynı ortak sistemi kullanır.

import { useEffect, useState, type ReactNode } from "react";
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
import { BurakMediaPanel } from "@/components/admin/social-share/BurakMediaPanel";
import { GeneratedImagePreview } from "@/components/admin/social-share/GeneratedImagePreview";
import { BURAK_SHARE_TOOLS } from "@/lib/admin-shell/burak-share-tools";
import {
  burakSlotKey,
  listBurakShareAssets,
  type BurakShareAsset,
} from "@/lib/admin-shell/burak-share-assets";

type BurakShareTabProps = {
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  renderShareBar?: (tab: "burak", itemId: string) => ReactNode;
};

export function BurakShareTab({ copiedId, onCopy, renderShareBar }: BurakShareTabProps) {
  const { toast } = useToast();
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

  return (
    <Accordion type="single" collapsible className="space-y-2">
      {BURAK_SHARE_TOOLS.map((tool) => (
        <AccordionItem key={tool.id} value={tool.id} className="rounded-xl border bg-card px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-1 items-center gap-3 pr-3 text-left">
              <span className="font-mono text-sm font-bold text-muted-foreground">
                {String(tool.order).padStart(2, "0")}
              </span>
              <span className="text-base font-semibold">{tool.name}</span>
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300"
              >
                Burak
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="mb-4 text-sm text-muted-foreground">{tool.description}</p>
            <div className="space-y-4">
              {tool.variants.map((variant, index) => {
                const variantNo = index + 1;
                const slotKey = burakSlotKey(tool.id, index);
                return (
                  <div key={`${tool.id}-v${variantNo}`} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Varyant {variantNo}
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Palette className="h-4 w-4" /> Canva Promptu
                            <span className="text-xs font-normal text-muted-foreground">
                              metinsiz
                            </span>
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onCopy(variant.canvaPrompt, `${tool.id}-v${variantNo}-canva`)
                            }
                          >
                            {copiedId === `${tool.id}-v${variantNo}-canva` ? (
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
                          <GeneratedImagePreview toolId={tool.id} variantNo={variantNo} />
                          <BurakMediaPanel
                            slotKey={slotKey}
                            toolId={tool.id}
                            variantIndex={index}
                            asset={assets[slotKey]}
                          />
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
                            onClick={() =>
                              onCopy(variant.linkedinPost, `${tool.id}-v${variantNo}-linkedin`)
                            }
                          >
                            {copiedId === `${tool.id}-v${variantNo}-linkedin` ? (
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
            {renderShareBar?.("burak", tool.id)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
