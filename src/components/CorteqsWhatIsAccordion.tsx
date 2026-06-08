import { Sparkles } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const logo = "/newlogo.png";

type CorteqsWhatIsAccordionProps = {
  className?: string;
};

const CorteqsWhatIsAccordion = ({ className }: CorteqsWhatIsAccordionProps) => {
  return (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem
        value="corteqs-nedir"
        className="overflow-hidden rounded-[1.75rem] border border-[#bfe5de] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,250,247,0.96),rgba(247,252,255,0.94))] px-5 shadow-[0_18px_40px_rgba(69,145,132,0.10)] backdrop-blur-sm md:px-7"
      >
        <AccordionTrigger
          className="gap-3 py-4 text-left hover:no-underline md:gap-4 md:py-5"
          chevronWrapperClassName="border border-[#b7dcd4] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,246,0.96))] text-[#153a5b] shadow-[0_10px_24px_rgba(21,58,91,0.10)]"
          chevronClassName="h-4.5 w-4.5"
        >
          <span className="inline-flex max-w-full items-center gap-2 bg-[linear-gradient(90deg,#0f766e_0%,#2563eb_50%,#7c3aed_100%)] bg-clip-text text-lg font-black leading-tight text-transparent sm:text-xl md:text-2xl">
            <Sparkles className="h-4 w-4 text-primary" />
            CorteQS nedir?
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8">
            <p
              id="geo-content-title"
              className="max-w-4xl text-justify text-[1.08rem] leading-relaxed text-foreground md:text-[1.2rem]"
            >
              CorteQS, dünyanın farklı şehirlerinde yaşayan Türkleri birbirine bağlayan bir platformdur.
              İnsanlar burada toplulukları bulur, yeni bağlantılar kurar ve iş, destek veya işbirliği
              fırsatlarına ulaşır.
            </p>

            <div className="relative mx-auto hidden lg:flex lg:items-center lg:justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.18)_0%,rgba(15,118,110,0.12)_42%,rgba(255,255,255,0)_74%)] blur-2xl"
              />
              <div className="relative rounded-[2rem] border border-white/75 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(232,247,243,0.82))] p-4 shadow-[0_26px_50px_-24px_rgba(37,99,235,0.34),0_14px_32px_-18px_rgba(15,118,110,0.28)] backdrop-blur-md">
                <img
                  src={logo}
                  alt="CorteQS logosu"
                  className="h-[132px] w-[132px] rounded-full object-contain drop-shadow-[0_16px_24px_rgba(21,58,91,0.22)]"
                />
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default CorteqsWhatIsAccordion;
