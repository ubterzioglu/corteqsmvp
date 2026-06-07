import LansmanForm from "@/components/LansmanForm";
import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
const heroPoster = "/yeniinffffffff.png";
const logo = "/newlogo.png";

const launchPanelClass =
  "rounded-[2rem] border border-slate-200/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(247,243,239,0.94)_54%,rgba(240,248,255,0.98)_100%)] p-7 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.08)]";

const heroCtaClass =
  "min-w-[210px] justify-center rounded-full border border-orange-200/45 bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_52%,#fb923c_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(249,115,22,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-100 hover:bg-[linear-gradient(135deg,#fbbf24_0%,#f97316_50%,#fdba74_100%)] hover:text-white";

const LansmanPage = () => {
  useEffect(() => {
    const previousTitle = document.title;

    document.title = "CorteQS Lansman";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const benefitCards = [
    {
      title: "Yeni gelir modeli",
      body: "Referral akışları, etkinlik katkıları ve ileride doğacak marka iş birlikleri için erken konum alma fırsatı.",
    },
    {
      title: "Doğru hedef kitle",
      body: "Diaspora, expat yaşamı, global kariyer ve topluluk ekseninde yüksek uyumlu bir network yapısı.",
    },
    {
      title: "Erken partner avantajı",
      body: "Platform şekillenirken görünür olmak ve gelecekteki iş birliklerinde önden pozisyon almak.",
    },
    {
      title: "Network erişimi",
      body: "Farklı şehirlerden topluluk liderleri, iş insanları ve üreticilerle doğrudan temas kurmak.",
    },
  ];

  const agendaItems = [
    "Platform vizyonu ve influencer partner modeli",
    "Şehir bazlı diaspora büyümesi ve içerik iş birliği akışı",
    "Referral sistemi, etkinlik katkıları ve görünürlük fırsatları",
    "Erken dönem partner pozisyonunun nasıl şekilleneceği",
  ];

  const promiseItems = [
    "Görünürlük desteği ile içeriklerinin daha fazla kişiye ulaşması",
    "Paylaşım ve yönlendirmeler üzerinden çalışacak referral modeli",
    "Global Türk diasporasına doğrudan erişim",
    "Markaların ulaşacağı dashboard ve erken dönem partner görünürlüğü",
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7f3ef_52%,#ffffff_100%)] text-slate-900">
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(12,53,88,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(233,122,31,0.12),_transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0))]" />
        <div className="absolute left-[-10rem] top-32 -z-10 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="absolute right-[-6rem] top-16 -z-10 h-64 w-64 rounded-full bg-amber-200/35 blur-3xl" />

        <div className="container mx-auto px-4 pb-8 pt-5 lg:px-6 lg:pb-10 lg:pt-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.98fr)_minmax(280px,0.82fr)] lg:items-center">
            <div className="space-y-5 text-slate-900">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 shadow-sm">
                <img src={logo} alt="CorteQS" className="h-6 w-auto" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700">
                  CorteQS Lansman Daveti
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-2xl text-[2.35rem] font-black leading-[1.02] tracking-tight text-slate-900 sm:text-[2.9rem] lg:text-[3.2rem]">
                  Influencer Partner modeliyle global diaspora ağına davetlisin
                </h1>
                <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  Seni sadece bir davetli olarak değil, erken dönem görünür partnerlerimizden biri olarak lansmanda aramızda görmek istiyoruz. CorteQS; toplulukları, danışmanları, işletmeleri ve içerik üreticilerini aynı büyüme ağı içinde bir araya getiriyor.
                </p>
              </div>

              <div className="space-y-2">
                {promiseItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,245,242,0.9))] px-4 py-2.5 text-sm leading-5 text-slate-700 shadow-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className={heroCtaClass}>
                  <a href="#lansman-formu">Lansmana Kayıt Ol</a>
                </Button>
                <Button asChild size="lg" variant="outline" className={heroCtaClass}>
                  <a href="https://mvp.corteqs.net/" target="_blank" rel="noreferrer">
                    CorteQS Hakkında
                  </a>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[420px] lg:max-w-[470px]">
              <div className="absolute inset-x-12 -top-3 h-16 rounded-full bg-orange-300/25 blur-3xl" />
              <div className="relative overflow-hidden rounded-[1.8rem] border border-slate-200/90 bg-white p-2.5 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
                <img
                  src={heroPoster}
                  alt="CorteQS influencer partner lansman afişi"
                  className="w-full rounded-[1.35rem] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto space-y-6 px-4 pb-20 pt-14 lg:max-w-5xl lg:px-6 lg:pt-16">
        <section className="space-y-6">
          <Accordion type="single" collapsible className="space-y-6">
            <AccordionItem
              value="benefits-panel"
              className={`${launchPanelClass} overflow-hidden py-0`}
            >
              <AccordionTrigger className="min-h-[92px] px-0 py-0 hover:no-underline">
                <span className="flex items-center gap-4 text-left">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-[linear-gradient(135deg,rgba(43,139,230,0.12),rgba(233,122,31,0.08))] shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
                    <img src={logo} alt="" className="h-8 w-8 rounded-full object-contain" />
                  </span>
                  <span className="text-base font-semibold text-slate-900 sm:text-lg">
                    Bu lansmanda neden yer almalısın?
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-5">
                <ul className="space-y-3">
                  {benefitCards.map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[linear-gradient(135deg,#0C3558_0%,#1A94AD_100%)]" />
                      <div>
                        <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
                        <p className="mt-1 text-[13px] leading-6 text-slate-600">{item.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="agenda-panel"
              className={`${launchPanelClass} overflow-hidden py-0`}
            >
              <AccordionTrigger className="min-h-[92px] px-0 py-0 hover:no-underline">
                <span className="flex items-center gap-4 text-left">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-[linear-gradient(135deg,rgba(43,139,230,0.12),rgba(233,122,31,0.08))] shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
                    <img src={logo} alt="" className="h-8 w-8 rounded-full object-contain" />
                  </span>
                  <span className="text-base font-semibold text-slate-900 sm:text-lg">
                    Lansmanda konuşulacak konular nelerdir ?
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-5">
                <ul className="space-y-2.5">
                  {agendaItems.map((item, index) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0C3558_0%,#1A94AD_100%)] text-[11px] font-bold text-white shadow-sm">
                        {index + 1}
                      </span>
                      <span className="pt-0.5 text-[13px] leading-6 text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section id="lansman-formu">
          <div className={`mx-auto max-w-2xl ${launchPanelClass} p-4 sm:p-5`}>
            <LansmanForm />
          </div>
        </section>
      </div>
    </div>
  );
};

export default LansmanPage;
