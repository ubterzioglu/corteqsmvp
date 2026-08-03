// ZGEN — "diğer kuşaklarla nasıl geçinilir": yönlü uyum rehberi, kuşak başına bir accordion satırı.
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getZgenCompat, getZgenOtherGenerations } from "@/lib/zgen/zgen-helpers";
import type { ZgenGeneration } from "@/lib/zgen/zgen-types";

const ACCENT_BORDER_CLASSES = [
  "border-l-glow-teal/60",
  "border-l-brand-blue/60",
  "border-l-brand-indigo/60",
  "border-l-brand-pink/60",
  "border-l-brand-orange/60",
  "border-l-brand-yellow/60",
];

interface ZgenCompatibilityAccordionProps {
  youGen: ZgenGeneration;
}

export function ZgenCompatibilityAccordion({ youGen }: ZgenCompatibilityAccordionProps) {
  const others = getZgenOtherGenerations(youGen.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Diğer kuşaklarla nasıl geçinilir?</CardTitle>
        <p className="text-sm text-muted-foreground">Bir kuşağa dokun, aç; do's & don'ts + bir şaka bulacaksın.</p>
      </CardHeader>
      <Accordion type="single" collapsible className="px-6 pb-4">
        {others.map((other, index) => {
          const content = getZgenCompat(youGen.id, other.id);
          const accentClass = ACCENT_BORDER_CLASSES[index % ACCENT_BORDER_CLASSES.length];

          return (
            <AccordionItem key={other.id} value={other.id} className={cn("border-l-4 pl-3", accentClass)}>
              <AccordionTrigger className="text-left text-base">{other.name} ile</AccordionTrigger>
              <AccordionContent>
                <div className="mb-4 flex items-center justify-center gap-4">
                  <ZgenAvatarPair gen={youGen} label="Sen" />
                  <span className="text-xl text-muted-foreground" aria-hidden="true">
                    ⇄
                  </span>
                  <ZgenAvatarPair gen={other} label={other.name} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-1.5 text-sm font-semibold text-foreground">✅ Yap</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {(content?.dos ?? []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-1.5 text-sm font-semibold text-foreground">❌ Yapma</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {(content?.donts ?? []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {content?.joke && (
                  <p className="mt-4 text-xs italic text-muted-foreground">"{content.joke}"</p>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Card>
  );
}

function ZgenAvatarPair({ gen, label }: { gen: ZgenGeneration; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex -space-x-2">
        <img
          src={gen.avatars.m}
          alt=""
          loading="lazy"
          className="h-10 w-10 rounded-full border-2 border-background object-cover"
        />
        <img
          src={gen.avatars.f}
          alt=""
          loading="lazy"
          className="h-10 w-10 rounded-full border-2 border-background object-cover"
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
