import { Clapperboard, Globe, PenTool, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
const logo = "/newlogo.png";

const featuredLinks = [
  {
    to: "/founding-1000",
    icon: Globe,
    className:
      "border-[#f0b73b]/35 bg-[linear-gradient(135deg,#fff3cf_0%,#ffe79e_52%,#ffd768_100%)] text-[#8f5b00] shadow-[0_14px_30px_rgba(240,183,59,0.18)]",
    label: "Founding 1000'e Katıl",
  },
  {
    to: "/blogger-yarismasi",
    icon: PenTool,
    className:
      "border-[#ef8c3f]/35 bg-[linear-gradient(135deg,#fff0de_0%,#ffd6af_52%,#ffbc7b_100%)] text-[#c96a1a] shadow-[0_14px_30px_rgba(239,140,63,0.18)]",
    label: "Blogger Yarışması",
  },
  {
    to: "/vlogger-yarismasi",
    icon: Clapperboard,
    className:
      "border-[#2f8fb4]/35 bg-[linear-gradient(135deg,#eef9fc_0%,#cfeefa_52%,#a9dff2_100%)] text-[#1f7595] shadow-[0_14px_30px_rgba(47,143,180,0.18)]",
    label: "Vlogger Yarışması",
  },
] as const;

const SEOContentSection = () => {
  return (
    <section className="relative mt-12 overflow-hidden py-4 lg:mt-16 lg:py-5">
      <article className="container relative z-10 mx-auto flex max-w-6xl flex-col gap-4 px-4" aria-labelledby="geo-content-title">
        <Accordion type="single" collapsible>
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
                  Dünyaya dağılmış Türk topluluklarının ekonomik ve sosyal sinir ağlarını örüyoruz. CorteQS,
                  dünyanın farklı şehirlerinde yaşayan Türkleri; sadece bir sosyal ağda değil, gerçek fırsatlar,
                  topluluklar ve bağlantılar etrafında bir araya getirir.
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

        <div className="flex flex-col gap-4">
          {featuredLinks.map((link) => {
            const Icon = link.icon;

            return (
            <Link
              key={link.to}
              to={link.to}
              className={`group flex min-h-[72px] items-center gap-3 rounded-[1.25rem] border px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.10)] sm:min-h-[76px] sm:px-5 ${link.className}`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/70 shadow-[0_10px_24px_rgba(255,255,255,0.22)] backdrop-blur-md">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-base font-semibold leading-tight sm:text-[1.08rem]">{link.label}</span>
            </Link>
            );
          })}
        </div>
      </article>
    </section>
  );
};

export default SEOContentSection;
