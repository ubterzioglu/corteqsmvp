import { forwardRef } from "react";
import { BookOpen, ChevronDown, HelpCircle } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { GOOGLE_SOFT_CARD_BLUE_SECTION } from "./profile-card-styles";
import type { GuideSection } from "./profile-guide-sections";

export type ProfileHelpCardProps = {
  open: boolean;
  onOpenToggle: () => void;
  sections: GuideSection[];
};

/** "Yardım & Kılavuzlar" katlanır kartı — hero'daki Yardım düğmesi buraya kaydırır. */
export const ProfileHelpCard = forwardRef<HTMLDivElement, ProfileHelpCardProps>(
  ({ open, onOpenToggle, sections }, ref) => (
    <Card ref={ref} className={`overflow-hidden ${GOOGLE_SOFT_CARD_BLUE_SECTION}`}>
      <CardHeader className="p-0">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-[30px] px-6 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-expanded={open}
          aria-controls="help-card-content"
          onClick={onOpenToggle}
        >
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-[11px]">
              <HelpCircle className="h-4 w-4 text-primary" />
              Yardım & Kılavuzlar
            </CardTitle>
            <CardDescription className="text-[11px]">
              Profilini doldururken ihtiyaç duyacağın tüm açıklamaları tek yerde topladık.
            </CardDescription>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CardHeader>
      {open ? (
        <CardContent id="help-card-content" className="pt-0">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {sections.map((section) => (
              <AccordionItem key={section.key} value={section.key} className={`rounded-lg border border-white/80 px-3 shadow-[0_18px_32px_-30px_rgba(66,133,244,0.28)] ${section.accentClassName}`}>
                <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                  <span className="inline-flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {section.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent>{section.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      ) : null}
    </Card>
  ),
);

ProfileHelpCard.displayName = "ProfileHelpCard";

export default ProfileHelpCard;
