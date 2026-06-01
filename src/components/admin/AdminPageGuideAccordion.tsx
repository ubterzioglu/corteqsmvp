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
            <AccordionTrigger className="px-4 py-2.5 text-left hover:no-underline">
              <div className="space-y-0.5">
                <p className="text-[13px] font-semibold leading-5 text-sky-950">Kullanıcı Rehberi</p>
                <p className="text-[12px] leading-4 text-sky-900/80">{summary}</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3 pt-0">
              <div className="space-y-3">
                {sections.map((section) => (
                  <section key={section.title} className="space-y-1.5">
                    <h3 className="text-[13px] font-medium leading-5 text-sky-950">{section.title}</h3>
                    <ul className="space-y-1 text-[12px] leading-4 text-sky-950/85">
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
