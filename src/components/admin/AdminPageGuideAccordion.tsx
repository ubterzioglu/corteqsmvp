import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

export type AdminPageGuideSection = {
  title: string;
  items: string[];
};

type AdminPageGuideAccordionProps = {
  summary: string;
  sections: AdminPageGuideSection[];
};

const AdminPageGuideAccordion = ({ summary, sections }: AdminPageGuideAccordionProps) => {
  return (
    <Card className="border-sky-200 bg-sky-50/40">
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="page-guide" className="border-none">
            <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-sky-950">Kullanıcı Rehberi</p>
                <p className="text-xs text-sky-900/80">{summary}</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="space-y-4">
                {sections.map((section) => (
                  <section key={section.title} className="space-y-2">
                    <h3 className="text-sm font-medium text-sky-950">{section.title}</h3>
                    <ul className="space-y-1 text-sm text-sky-950/85">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-600" aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default AdminPageGuideAccordion;
