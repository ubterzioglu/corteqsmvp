import { useState } from "react";
import { ChevronDown, MapPin, Users } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface City {
  name: string;
  country: string;
  flag: string;
  population: string;
  desc: string;
}

const cities: City[] = [
  { name: "Berlin", country: "Almanya", flag: "🇩🇪", population: "200.000+", desc: "Avrupa'nın en büyük Türk diaspora topluluğunun kalbi. Kültürel çeşitlilik ve girişimcilik merkezi." },
  { name: "Londra", country: "Birleşik Krallık", flag: "🇬🇧", population: "150.000+", desc: "Finans ve yaratıcı endüstrilerin merkezinde güçlü bir Türk profesyonel ağı." },
  { name: "New York", country: "ABD", flag: "🇺🇸", population: "120.000+", desc: "Manhattan'dan Brooklyn'e uzanan dinamik Türk-Amerikan iş ve sanat topluluğu." },
  { name: "Paris", country: "Fransa", flag: "🇫🇷", population: "90.000+", desc: "Sanat, moda ve gastronomide etkin Türk diasporasının Avrupa'daki köprüsü." },
  { name: "Amsterdam", country: "Hollanda", flag: "🇳🇱", population: "80.000+", desc: "Uluslararası iş dünyası ve teknoloji ekosisteminde aktif Türk merkezi." },
  { name: "Dubai", country: "BAE", flag: "🇦🇪", population: "70.000+", desc: "Ortadoğu'nun iş başkentinde hızla büyüyen Türk girişimci ve profesyonel topluluğu." },
  { name: "Toronto", country: "Kanada", flag: "🇨🇦", population: "60.000+", desc: "Kuzey Amerika'nın çok kültürlü merkezinde güçlü Türk-Kanadalı ağı." },
  { name: "Sydney", country: "Avustralya", flag: "🇦🇺", population: "50.000+", desc: "Pasifik'teki en büyük Türk diasporası. İş, eğitim ve topluluk hayatının merkezi." },
  { name: "İstanbul", country: "Türkiye", flag: "🇹🇷", population: "Köprü Şehir", desc: "Dünya diasporasını anavatana bağlayan stratejik buluşma noktası." },
];

const radarCities = [
  "Dortmund",
  "Münih",
  "Hamburg",
  "Frankfurt",
  "Köln",
  "Lyon",
  "Brüksel",
  "Viyana",
  "Zürih",
  "Rotterdam",
  "Stockholm",
  "Kopenhag",
  "Madrid",
  "Stuttgart",
  "Düsseldorf",
  "Manchester",
  "Milano",
  "Los Angeles",
  "Chicago",
  "Miami",
  "Montreal",
  "Vancouver",
  "São Paulo",
  "Tokyo",
  "Singapur",
  "Abu Dabi",
  "Doha",
  "Melbourne",
  "Essen",
  "Nürnberg",
];

const triggerCitySelect = (city: string, mode: "ai" | "form") => {
  window.dispatchEvent(new CustomEvent("corteqs:select-city", { detail: { city, mode } }));
  const target = document.getElementById("kaydol");
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
};

const CitiesSection = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      id="sehirler"
      className="relative overflow-hidden py-20"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--primary) / 0.07) 0%, hsl(var(--accent) / 0.07) 48%, hsl(var(--background)) 100%)",
      }}
    >
      <div className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 bottom-16 h-96 w-96 rounded-full bg-accent/15 blur-3xl" aria-hidden />

      <div className="container relative z-10 mx-auto px-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/50 bg-card/85 shadow-2xl shadow-primary/10 backdrop-blur-sm">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-6 py-6 text-left transition hover:bg-white/20 md:px-8 md:py-8"
                aria-expanded={isOpen}
              >
                <div className="min-w-0">
                  <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Küresel Ağ</p>
                  <h2 className="mb-3 text-2xl font-extrabold text-foreground md:text-4xl">
                    Türk Diasporasının Olduğu <span className="text-accent">Her Şehirde</span>
                  </h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    Berlin'den Sydney'e, New York'tan Dubai'ye. Dünyanın dört bir yanındaki Türk topluluğuyla bağlantı kurmak için bu bölümü aç.
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

            <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden border-t border-border/60">
              <div className="px-4 py-5 md:px-8 md:py-8">
                <div className="mb-4 hidden items-center gap-4 rounded-2xl border border-border/50 bg-background/60 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-[220px_150px_140px_minmax(0,1fr)_150px]">
                  <span>Şehir</span>
                  <span>Ülke</span>
                  <span>Diaspora</span>
                  <span>Kısa Bilgi</span>
                  <span className="text-right">Aksiyon</span>
                </div>

                <div className="space-y-3">
                  {cities.map((city) => (
                    <div
                      key={city.name}
                      className="grid gap-4 rounded-2xl border border-border/60 bg-background/70 px-4 py-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 lg:grid-cols-[220px_150px_140px_minmax(0,1fr)_150px] lg:items-center lg:px-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl ring-1 ring-primary/15">
                          {city.flag}
                        </div>
                        <div>
                          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                            <MapPin className="h-4 w-4 text-primary" />
                            {city.name}
                          </h3>
                          <p className="text-sm text-muted-foreground lg:hidden">{city.country}</p>
                        </div>
                      </div>

                      <div className="hidden text-sm font-medium text-foreground lg:block">{city.country}</div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">{city.population}</span>
                        <span className="text-muted-foreground">Türk</span>
                      </div>

                      <p className="text-sm leading-relaxed text-muted-foreground">{city.desc}</p>

                      <div className="flex lg:justify-end">
                        <button
                          type="button"
                          onClick={() => triggerCitySelect(city.name, "ai")}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
                        >
                          AI Sohbet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <p className="mx-auto max-w-4xl text-xs leading-6 text-muted-foreground md:text-sm">
                    <span className="mr-1 font-bold uppercase tracking-widest text-primary">Radarımızdaki Şehirler:</span>
                    {radarCities.join(", ")}. Bu şehirler için de topluluk ilgisini topluyoruz. Şehrin listede yoksa{" "}
                    <a href="#kaydol" className="font-semibold text-primary underline-offset-4 transition-colors hover:text-accent hover:underline">
                      asistana sor
                    </a>{" "}
                    ve şehrini radarımıza birlikte değerlendirelim.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </section>
  );
};

export default CitiesSection;
