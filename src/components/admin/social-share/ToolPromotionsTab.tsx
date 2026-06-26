// Sosyal Medya Paylaşım Deposu — "Araç Tanıtımları" sekmesi.
// 10 platform aracı; her araç için 3 Canva promptu + 1 LinkedIn postu, akordeon.
// Veri tek kaynak: lib/admin-shell/social-share-vault.ts.

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
import {
  SOCIAL_SHARE_CATEGORY_LABELS,
  SOCIAL_SHARE_TOOLS,
  type SocialShareCategory,
} from "@/lib/admin-shell/social-share-vault";

type CopyFn = (text: string, id: string) => void;

const categoryBadgeClass: Record<SocialShareCategory, string> = {
  kesfet: "border-teal-500/40 bg-teal-500/15 text-teal-600 dark:text-teal-300",
  baglan: "border-indigo-500/40 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  kullan: "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:text-orange-300",
  koru: "border-pink-500/40 bg-pink-500/15 text-pink-600 dark:text-pink-300",
};

type ToolPromotionsTabProps = {
  copiedId: string | null;
  onCopy: CopyFn;
};

export function ToolPromotionsTab({ copiedId, onCopy }: ToolPromotionsTabProps) {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {SOCIAL_SHARE_TOOLS.map((tool) => (
        <AccordionItem key={tool.id} value={tool.id} className="rounded-xl border bg-card px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-1 items-center gap-3 pr-3 text-left">
              <span className="font-mono text-sm font-bold text-muted-foreground">
                {String(tool.order).padStart(2, "0")}
              </span>
              <span className="text-base font-semibold">{tool.name}</span>
              <Badge variant="outline" className={categoryBadgeClass[tool.category]}>
                {SOCIAL_SHARE_CATEGORY_LABELS[tool.category]}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="mb-4 text-sm text-muted-foreground">{tool.description}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Palette className="h-4 w-4" /> Canva Promptları
                    <span className="text-xs font-normal text-muted-foreground">
                      3 görsel · metinsiz
                    </span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(tool.canvaPrompts.join("\n\n"), `${tool.id}-canva-all`)}
                  >
                    {copiedId === `${tool.id}-canva-all` ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tool.canvaPrompts.map((prompt, index) => {
                    const promptId = `${tool.id}-canva-${index}`;
                    return (
                      <div key={promptId} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Görsel {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => onCopy(prompt, promptId)}
                          >
                            {copiedId === promptId ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                        <Textarea readOnly value={prompt} className="min-h-[88px] resize-y text-xs" />
                      </div>
                    );
                  })}
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
                    onClick={() => onCopy(tool.linkedinPost, `${tool.id}-linkedin`)}
                  >
                    {copiedId === `${tool.id}-linkedin` ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <Textarea
                    readOnly
                    value={tool.linkedinPost}
                    className="min-h-[300px] resize-y text-sm"
                  />
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
