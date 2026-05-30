import { useState } from "react";
import { BookOpen, BriefcaseBusiness, Building2, CalendarDays, ChevronDown, GraduationCap, HandHeart, MapPin, Network, Radio, Users } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const stats = [
  { label: "164 Ülke", icon: MapPin },
  { label: "8.8 Milyon Türk", icon: Users },
  { label: "120.000+ Kuruluş", icon: Building2 },
  { label: "35.000+ Türk Girişimi", icon: BriefcaseBusiness },
  { label: "50.000+ Öğrenci", icon: GraduationCap },
  { label: "10.000+ Akademisyen", icon: BookOpen },
  { label: "5.000+ STK", icon: HandHeart },
  { label: "2.000+ Medya Platformu", icon: Radio },
  { label: "1.000+ Kültür Etkinliği", icon: CalendarDays },
  { label: "500+ Profesyonel Ağ", icon: Network },
];

const cities = [
  { name: "Berlin", country: "Almanya", population: "200.000+", desc: "Avrupa'nın en büyük Türk diasporası ve güçlü girişimcilik merkezi." },
  { name: "Londra", country: "Birleşik Krallık", population: "150.000+", desc: "Finans, yaratıcı endüstriler ve profesyonel bağlantıların odak noktası." },
  { name: "New York", country: "ABD", population: "120.000+", desc: "İş, sanat ve topluluk hayatının dinamik Türk-Amerikan merkezi." },
  { name: "Paris", country: "Fransa", population: "90.000+", desc: "Sanat, moda ve gastronomide etkili diaspora köprüsü." },
  { name: "Amsterdam", country: "Hollanda", population: "80.000+", desc: "Teknoloji ve uluslararası iş dünyasında aktif Türk ağı." },
  { name: "Dubai", country: "BAE", population: "70.000+", desc: "Hızlı büyüyen girişimci ve profesyonel Türk topluluğu." },
];

const triggerCitySelect = (city: string, mode: "ai" | "form") => {
  window.dispatchEvent(new CustomEvent("corteqs:select-city", { detail: { city, mode } }));
  const target = document.getElementById("kaydol");
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
};

const NetworkOverviewSection = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section id="diaspora-ekosistemi" className="relative overflow-hidden py-7 lg:py-10">
      <div className="container relative z-10 mx-auto max-w-6xl px-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-card/80 shadow-xl shadow-primary/10 backdrop-blur-sm">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/20 md:px-8 md:py-6"
                aria-expanded={isOpen}
              >
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-foreground md:text-4xl">
                    Diasporanın Gücü ve Şehirler
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    CorteQS'in oluşturduğu ağı, katılım alanlarını ve odak şehirlerini tek bölümde incelemek için bu alanı aç.
                  </p>
                </div>
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-background/80 text-primary transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown className="h-5 w-5" />
                </span>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden border-t border-white/50">
              <div className="space-y-6 p-5 md:p-6">
                <div className="rounded-2xl border border-white/60 bg-background/60 p-5 md:p-6">
                  <p className="max-w-4xl text-sm leading-7 text-muted-foreground md:text-[15px]">
                    CorteQS; profesyonelleri, girişimleri, işletmeleri, kuruluşları ve içerik üreticilerini aynı
                    diaspora çatısı altında buluşturur. Amacı, yerel toplulukları daha görünür hale getirmek, güven
                    temelli bağlantılar kurmak ve farklı ülkelerdeki Türklerin bilgiye, fırsata ve doğru insanlara daha
                    hızlı ulaşmasını sağlamaktır.
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {stats.map(({ label, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm">
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/60 bg-background/60 p-5 md:p-6">
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-foreground md:text-2xl">Türk Diasporasının Olduğu Şehirler</h3>
                    </div>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      Odak şehirlerdeki topluluklarla bağ kurmak ve ilgi bırakmak için şehir kartlarını kullanın.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {cities.map((city) => (
                      <div
                        key={city.name}
                        className="grid gap-4 rounded-2xl border border-white/60 bg-white/78 px-4 py-4 shadow-sm lg:grid-cols-[180px_130px_120px_minmax(0,1fr)_130px] lg:items-center"
                      >
                        <div>
                          <h4 className="text-lg font-bold text-foreground">{city.name}</h4>
                          <p className="text-sm text-muted-foreground">{city.country}</p>
                        </div>
                        <div className="text-sm font-medium text-foreground">{city.country}</div>
                        <div className="text-sm">
                          <span className="font-semibold text-foreground">{city.population}</span>
                          <span className="ml-1 text-muted-foreground">Türk</span>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{city.desc}</p>
                        <div className="flex lg:justify-end">
                          <button
                            type="button"
                            onClick={() => triggerCitySelect(city.name, "ai")}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                          >
                            AI Sohbet
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </section>
  );
};

export default NetworkOverviewSection;
