// Sosyal Medya Paylaşım Deposu — "Test Araçları" sekmesi.
// 10 click-through test aracı; her araç bir akordeon, içinde 3 varyant
// (her varyant = 1 Canva promptu + 1 LinkedIn postu). Veri tek kaynak:
// lib/admin-shell/social-test-tools.ts.

import type { ReactNode } from "react";
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
import { SOCIAL_TEST_TOOLS } from "@/lib/admin-shell/social-test-tools";

type CopyFn = (text: string, id: string) => void;

type TestToolsTabProps = {
  copiedId: string | null;
  onCopy: CopyFn;
  renderShareBar?: (tab: "tests", itemId: string) => ReactNode;
};

export function TestToolsTab({ copiedId, onCopy, renderShareBar }: TestToolsTabProps) {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {SOCIAL_TEST_TOOLS.map((tool) => (
        <AccordionItem key={tool.id} value={tool.id} className="rounded-xl border bg-card px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-1 items-center gap-3 pr-3 text-left">
              <span className="font-mono text-sm font-bold text-muted-foreground">
                {String(tool.order).padStart(2, "0")}
              </span>
              <span className="text-base font-semibold">{tool.name}</span>
              <Badge variant="outline" className="border-blue-500/40 bg-blue-500/15 text-blue-600 dark:text-blue-300">
                Test Aracı
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="mb-4 text-sm text-muted-foreground">{tool.description}</p>
            <div className="space-y-4">
              {tool.variants.map((variant, index) => {
                const variantNo = index + 1;
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
            {renderShareBar?.("tests", tool.id)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
