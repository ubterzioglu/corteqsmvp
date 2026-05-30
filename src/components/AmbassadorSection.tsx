import { useState } from "react";
import cityAmbassador from "@/assets/city-ambassador.jpg";
import { Sparkles, TrendingUp, Users, Globe2, Zap, Crown } from "lucide-react";
import RegisterInterestForm from "./RegisterInterestForm";

const perks = [
  { icon: Crown, title: "VIP — Sabit Gelir", desc: "VIP olduğunda sabit gelir: şehrinin, ülkenin iş partneri ol." },
  { icon: TrendingUp, title: "Influencer Büyüme", desc: "Sosyal medyanı CorteQS ağı ile patlat." },
  { icon: Users, title: "Etkinlik Lideri", desc: "Parti ve etkinlik düzenle, sorunsuz ödeme al, topluluğu aktif tut." },
  { icon: Globe2, title: "Global Ağ", desc: "Berlin'den Sydney'e, New York'tan Dubai'ye. Dünyanın dört bir yanındaki Türk topluluğuyla bağlantı kurun." },
  { icon: Zap, title: "Erken Avantajlar", desc: "Yeni özelliklere ilk sen eriş, gelir paylaşımına erkenden dahil ol." },
  { icon: Sparkles, title: "İçerik Desteği", desc: "Profesyonel medya kiti ve kampanya desteği." },
];

const AmbassadorSection = () => {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section
      id="elciler"
      className="relative overflow-hidden py-20 lg:py-28"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--accent) / 0.12) 0%, hsl(var(--primary) / 0.08) 50%, hsl(var(--background)) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute left-10 top-10 h-72 w-72 rounded-full blur-3xl opacity-30"
        style={{ background: "hsl(var(--accent))" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-10 right-10 h-96 w-96 rounded-full blur-3xl opacity-25"
        style={{ background: "hsl(var(--primary))" }}
        aria-hidden
      />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/60 bg-card/90 p-6 shadow-2xl shadow-accent/10 backdrop-blur-sm md:p-8 lg:p-10">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-4 py-1.5">
              <Crown className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Şehir Elçisi / City Business Partner Programı</span>
            </div>
            <h2 className="mb-4 text-2xl font-extrabold leading-tight text-foreground md:text-4xl">
              Şehrinin <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">İş Partneri</span> Ol
            </h2>
            <p className="mx-auto max-w-4xl text-base text-muted-foreground md:text-xl">
              Takipçi değil, topluluk ve iş inşa et. CorteQS Şehir Elçisi olarak diasporanın merkezi sen ol.
            </p>
          </div>

          <div className="mb-8 rounded-3xl border border-border bg-background/55 p-6 shadow-xl shadow-accent/5 md:p-7">
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-md"
                    style={{ background: "linear-gradient(135deg, hsl(var(--accent) / 0.22), hsl(var(--primary) / 0.18))" }}
                  >
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">Elçi Programı Avantajları</p>
                    <p className="text-sm text-muted-foreground">Topluluk, görünürlük ve gelir fırsatlarını tek programda birleştir.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {perks.map((perk) => (
                    <div key={perk.title} className="flex items-start gap-4">
                      <div
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
                        style={{ background: "linear-gradient(135deg, hsl(var(--accent) / 0.18), hsl(var(--primary) / 0.14))" }}
                      >
                        <perk.icon className="h-4.5 w-4.5 text-accent" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-bold text-foreground">{perk.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{perk.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="group relative mx-auto w-full max-w-[360px] overflow-hidden rounded-3xl shadow-2xl">
                <img
                  src={cityAmbassador}
                  alt="CorteQS Şehir Elçisi"
                  className="aspect-[4/5] h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  width={800}
                  height={1000}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" aria-hidden />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">Şehir Elçisi · Berlin</p>
                  <p className="text-base font-bold leading-tight text-foreground">
                    "CorteQS ile topluluğumu büyüttüm ve iş görünürlüğümü artırdım."
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl border-2 p-6 shadow-xl"
            style={{
              background: "linear-gradient(135deg, hsl(var(--accent) / 0.1) 0%, hsl(var(--primary) / 0.1) 100%)",
              borderColor: "hsl(var(--accent) / 0.3)",
            }}
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="mb-1 text-lg font-bold text-foreground">Elçi olmak 1 dakika sürer.</p>
                <p className="text-sm text-muted-foreground">
                  Kayıt bırak, seni değerlendirelim. Seçilirsen özel onboarding paketin hazır.
                </p>
              </div>
              <button
                onClick={() => setFormOpen(true)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-primary px-6 py-3.5 text-base font-bold text-accent-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-accent/30"
              >
                <Crown className="h-5 w-5" />
                Elçi Olmak İstiyorum
              </button>
            </div>
          </div>
        </div>
      </div>

      <RegisterInterestForm open={formOpen} onOpenChange={setFormOpen} defaultCategory="sehir-elcisi" />
    </section>
  );
};

export default AmbassadorSection;
