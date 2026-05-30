import { useState } from "react";
import diasporaCommunity from "@/assets/diaspora-community.jpg";
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CalendarDays,
  GraduationCap,
  HandHeart,
  MapPin,
  Network,
  Radio,
  Users,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const AboutSection = () => {
  const [isOpen, setIsOpen] = useState(false);

  const stats = [
    { label: "164 Ülke", icon: MapPin },
    { label: "8.8 Milyon Türk", icon: Users },
    { label: "120.000+ Kuruluş", icon: Building2 },
    { label: "35.000+ Türk Girişimi", icon: BriefcaseBusiness },
    { label: "50.000+ Öğrenci", icon: GraduationCap },
    { label: "10.000+ Akademisyen", icon: BookOpen },
    { label: "5.000+ STK", icon: HandHeart },
    { label: "2.000+ Medya & Yayın Platformu", icon: Radio },
    { label: "1.000+ Kültürel Etkinlik (yıllık)", icon: CalendarDays },
    { label: "500+ Profesyonel Ağ & Topluluk", icon: Network },
  ];

  return (
    <section
      id="hakkinda"
      className="relative overflow-hidden py-14 lg:py-20"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--accent) / 0.08) 0%, hsl(var(--primary) / 0.06) 48%, hsl(var(--background)) 100%)",
      }}
    >
      <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" aria-hidden />

      <div className="container relative z-10 mx-auto max-w-6xl px-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <article className="overflow-hidden rounded-2xl border border-white/50 bg-card/80 shadow-xl shadow-primary/10 backdrop-blur-sm">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/20 md:px-8 md:py-6"
                aria-expanded={isOpen}
              >
                <div className="min-w-0">
                  <span className="mb-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Hakkımızda
                  </span>
                  <h2 className="mb-3 text-2xl font-bold text-foreground md:text-4xl">Diasporanın Gücünü Keşfedin</h2>
                  <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    Her kategoride uzmanlaşmış profesyonelleri, girişimleri, işletmeleri ve içerik üreticilerini tek çatı altında nasıl buluşturduğumuzu görmek için bu bölümü aç.
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
              <div className="grid lg:grid-cols-[0.58fr_0.42fr]">
                <div className="p-6 md:p-8 lg:p-10">
                  <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                    Her kategoride uzmanlaşmış <strong className="font-bold text-foreground">profesyonelleri, girişimleri, işletmeleri, kurumları ve içerik üreticilerini</strong> benzersiz bir çatı altında topluyoruz.
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {stats.map(({ label, icon: Icon }) => (
                      <div
                        key={label}
                        className="flex min-h-14 items-center gap-3 rounded-xl border border-white/50 bg-background/75 px-4 py-3 shadow-sm"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        <div className="text-sm font-semibold leading-snug text-foreground">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <figure className="relative min-h-72 border-t border-white/50 bg-background/60 lg:border-l lg:border-t-0">
                  <img
                    src={diasporaCommunity}
                    alt="Diaspora topluluğu buluşması"
                    className="h-full w-full object-cover [filter:brightness(0.95)_saturate(0.85)_contrast(0.95)]"
                    loading="lazy"
                    width={1024}
                    height={1024}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-card/40 via-card/10 to-primary/15 mix-blend-soft-light" aria-hidden />
                  <div className="pointer-events-none absolute inset-0 bg-card/15" aria-hidden />
                </figure>
              </div>
            </CollapsibleContent>
          </article>
        </Collapsible>
      </div>
    </section>
  );
};

export default AboutSection;
