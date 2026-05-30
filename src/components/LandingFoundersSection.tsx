import { useState } from "react";
import { ChevronDown, Linkedin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import burakPhoto from "../../burak.png";
import ubtPhoto from "../../ubt.png";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const founders = [
  {
    name: "Burak Akçakanat",
    role: "Kurucu Ortak",
    summary:
      "35 yılı aşkın üretim, ticaret, girişimcilik, danışmanlık ve uluslararası iş geliştirme deneyimiyle CorteQS'in stratejik büyüme, diaspora yapılanması ve şehir bazlı ekosistem vizyonunu şekillendiriyor.",
    strengths: [
      "Uluslararası pazar geliştirme",
      "Şirket yapılanması ve ölçeklenme",
      "Diaspora odaklı network kurgusu",
    ],
    imageSrc: burakPhoto,
    imageAlt: "Burak Akçakanat profil fotoğrafı",
    linkedinUrl: "https://www.linkedin.com/in/burakakcakanat/",
  },
  {
    name: "Umut Barış Terzioğlu",
    role: "Kurucu Ortak",
    summary:
      "Mühendislik, kalite güvencesi, otomasyon ve ölçeklenebilir sistem deneyimiyle CorteQS'in güvenilir, sürdürülebilir ve ürün odaklı teknik altyapısını kurguluyor.",
    strengths: [
      "Kalite ve güven odaklı ürün yaklaşımı",
      "Süreç ve operasyon tasarımı",
      "Ölçeklenebilir teknik mimari",
    ],
    imageSrc: ubtPhoto,
    imageAlt: "Umut Barış Terzioğlu profil fotoğrafı",
    linkedinUrl: "https://www.linkedin.com/in/ubterzioglu",
  },
];

const LandingFoundersSection = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section id="founders-landing" className="relative overflow-hidden pb-7 pt-0 lg:pb-10 lg:pt-0">
      <div className="container relative z-10 mx-auto max-w-6xl px-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="overflow-hidden rounded-[1.75rem] border border-[#bfe5de] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,250,247,0.96),rgba(247,252,255,0.94))] shadow-[0_18px_40px_rgba(69,145,132,0.10)] backdrop-blur-sm">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-white/20 md:px-7"
                aria-expanded={isOpen}
              >
                <div className="min-w-0">
                  <h2 className="text-xl font-black md:text-2xl">
                    <span className="inline-flex items-center gap-2 bg-[linear-gradient(90deg,#0f766e_0%,#2563eb_50%,#7c3aed_100%)] bg-clip-text text-transparent">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Biz Kimiz?
                    </span>
                  </h2>
                </div>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#b7dcd4] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,246,0.96))] text-[#153a5b] shadow-[0_10px_24px_rgba(21,58,91,0.10)] transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown className="h-[1.05rem] w-[1.05rem]" />
                </span>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden border-t border-white/50">
              <div className="space-y-6 p-5 md:p-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  {founders.map((founder) => (
                    <article
                      key={founder.name}
                      className="rounded-[1.8rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,248,255,0.94),rgba(255,247,239,0.92))] p-6 shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
                    >
                      <div className="flex flex-col items-start gap-5 sm:flex-row">
                        <img
                          src={founder.imageSrc}
                          alt={founder.imageAlt}
                          className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_18px_38px_rgba(10,79,150,0.18)]"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex rounded-full border border-[#0f6fc2]/16 bg-[#0f6fc2]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0a4f96]">
                            {founder.role}
                          </span>
                          <h3 className="mt-3 text-2xl font-black tracking-tight text-[#071c3f]">{founder.name}</h3>
                          <p className="mt-3 text-sm leading-7 text-slate-600">{founder.summary}</p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-[#0f6fc2]/10 bg-white/70 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0a4f96]">Öne Çıkan Güçler</div>
                        <div className="mt-3 grid gap-2">
                          {founder.strengths.map((strength) => (
                            <div key={strength} className="flex items-start gap-3">
                              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff8a00]" />
                              <p className="text-sm leading-6 text-slate-600">{strength}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <a
                        href={founder.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#1d74c8]/35 bg-[linear-gradient(135deg,#1382d0_0%,#1e9bd7_44%,#26b0d9_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(19,130,208,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(19,130,208,0.3)]"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    </article>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Link
                    to="/founders"
                    className="inline-flex items-center justify-center rounded-full border border-[#d96d2f]/35 bg-[linear-gradient(135deg,#f57f2c_0%,#ff9835_48%,#ffb046_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(245,127,44,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(245,127,44,0.3)]"
                  >
                    Daha Fazla Bilgi
                  </Link>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </section>
  );
};

export default LandingFoundersSection;
