import { useState } from "react";
import {
  Globe2,
  Users,
  Trophy,
  Calendar,
  Stethoscope,
  Scale,
  Home,
  GraduationCap,
  Store,
  Landmark,
  Mic,
  BadgeCheck,
  MapPin,
  Sparkles,
  Eye,
  Rocket,
  Network,
  Building2,
  Check,
} from "lucide-react";
import RegisterInterestForm from "./RegisterInterestForm";
import heroLandmarks from "@/assets/hero-landmarks-watercolor.png";

const stats = [
  { icon: Globe2, value: "5", label: "Kıta" },
  { icon: Users, value: "1000", label: "Founding User" },
  { icon: Trophy, value: "200", label: "Her Kıtadan İlk" },
  { icon: Calendar, value: "29 Ekim", label: "Full Açılış" },
];

const eligibleCategories = [
  {
    icon: Stethoscope,
    title: "Sağlık",
    desc: "Doktorlar, klinikler, diş hekimleri, psikologlar, sağlık merkezleri",
  },
  {
    icon: Scale,
    title: "Hukuk & Finans",
    desc: "Avukatlar, hukuk danışmanları, muhasebeciler, vergi & finansal danışmanlar",
  },
  {
    icon: Home,
    title: "Emlak & Relocation",
    desc: "Emlak danışmanları, relocation, taşınma, vize ve göçmenlik danışmanları",
  },
  {
    icon: GraduationCap,
    title: "Eğitim & Kariyer",
    desc: "Okullar, eğitim & kariyer danışmanları, dil okulları, öğrenci danışmanları",
  },
  {
    icon: Store,
    title: "İşletmeler & Hizmetler",
    desc: "Restoranlar, marketler, ajanslar, turizm, hizmet & yerel işletmeler",
  },
  {
    icon: Landmark,
    title: "Kuruluşlar & Topluluklar",
    desc: "Dernekler, vakıflar, kültür merkezleri, medya kuruluşları, topluluk yapıları",
  },
  {
    icon: Mic,
    title: "İçerik Üreticileri",
    desc: "Diaspora, şehir, kültür, iş, yaşam ve deneyim odaklı içerik üreticileri",
  },
];

const benefits = [
  { icon: BadgeCheck, text: "CorteQS Founding Verified User Badge" },
  { icon: MapPin, text: "Ülke, şehir ve kategori bazlı erken görünürlük" },
  { icon: Eye, text: "CorteQS kategori vitrininde yer alma hakkı" },
  { icon: Sparkles, text: "Ana sayfa carousel alanında 6 ay görünürlük" },
  { icon: Rocket, text: "Platform tam açıldığında ilk yayınlanan profiller arasında" },
  { icon: Globe2, text: "Global Türk diasporasının erken dönem dijital index'inde yer" },
  { icon: Network, text: "İşletmeni / uzmanlığını farklı şehirlerdeki Türklerle buluştur" },
];

const exampleCities = [
  "🇩🇪 Berlin'de bir doktor",
  "🇦🇪 Dubai'de bir emlak danışmanı",
  "🇬🇧 Londra'da bir hukuk ofisi",
  "🇨🇦 Toronto'da bir dernek",
  "🇶🇦 Doha'da bir restoran",
  "🇳🇱 Amsterdam'da bir içerik üreticisi",
  "🇺🇸 New York'ta bir Türk girişimci",
];

const continents = [
  { name: "Avrupa", flag: "🇪🇺", quota: "İlk 200" },
  { name: "Asya", flag: "🌏", quota: "İlk 200" },
  { name: "Afrika", flag: "🌍", quota: "İlk 200" },
  { name: "Amerika", flag: "🌎", quota: "İlk 200" },
  { name: "Okyanusya", flag: "🇦🇺", quota: "İlk 200" },
];

const sectionTitleClass = "text-3xl md:text-4xl font-bold text-foreground mb-4";
const softCardClass =
  "rounded-xl border border-white/60 bg-card/85 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-primary/35 hover:shadow-lg";
const iconBoxClass =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10";
const primaryButtonClass =
  "group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90";

const Founding1000Section = () => {
  const [formOpen, setFormOpen] = useState(false);

  const openForm = () => setFormOpen(true);

  return (
    <section
      id="founding-1000"
      className="relative overflow-hidden bg-gradient-to-br from-background via-card to-secondary/40 text-foreground"
    >
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--accent)/0.08),hsl(var(--primary)/0.07),hsl(var(--background)))]" aria-hidden />

      <div className="container mx-auto px-4 py-20 lg:py-28 relative z-10">
        {/* HERO */}
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 mb-16">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-semibold tracking-wider uppercase">
                🌍 CorteQS Founding 1000
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight">
              Global Türk diasporasının dijital haritasında{" "}
              <span className="text-accent">erken yerinizi alın</span>.
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              CorteQS, dünyanın farklı şehirlerine yayılmış Türk işletmelerini, danışmanları, klinikleri,
              doktorları, avukatları, emlak danışmanlarını, relocation uzmanlarını, marketleri, restoranları,
              dernekleri, vakıfları, okulları, medya kuruluşlarını, içerik üreticilerini ve profesyonelleri
              şehir şehir görünür kılmak için kuruluyor.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-10">
              <button onClick={openForm} className={primaryButtonClass}>
                Founding 1000'e Katıl
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="rounded-2xl border border-white/60 bg-card/80 p-4 shadow-2xl shadow-primary/10 backdrop-blur-sm">
              <img
                src={heroLandmarks}
                alt="CorteQS global diaspora şehir ağı"
                className="aspect-[4/3] w-full object-contain [filter:brightness(0.98)_saturate(1.02)_contrast(1)]"
                width={1480}
                height={860}
                loading="eager"
              />
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 md:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-center">
                    <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                    <div className="text-lg font-extrabold text-foreground">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scarcity band */}
        <div className="max-w-4xl mx-auto mb-6 rounded-xl bg-accent/10 border border-accent/25 px-6 py-4 flex items-center gap-3 shadow-sm">
          <span className="text-2xl">⏳</span>
          <p className="text-foreground text-sm md:text-base font-medium">
            <span className="font-bold text-accent">Kontenjan sınırlı:</span> Her kıtadan yalnızca
            ilk 200 katılımcı Founding Verified User avantajından yararlanabilecek.
          </p>
        </div>

        {/* Referral code band */}
        <div className="max-w-4xl mx-auto mb-20 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/25 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-sm">
          <span className="text-2xl">🎁</span>
          <p className="text-foreground text-sm md:text-base font-medium flex-1">
            <span className="font-bold text-primary">Founding 1000 özel referral kodu:</span>{" "}
            <code className="px-2 py-0.5 rounded bg-card border border-primary/30 text-primary font-mono text-sm tracking-wider">
              GGVBLA-M7SDSR
            </code>{" "}
            — Bu sayfadan kayıt olduğunuzda kod otomatik tanımlanır.
          </p>
        </div>

        {/* WHO CAN JOIN */}
        <div className="mb-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h3 className={sectionTitleClass}>Kimler Katılabilir?</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              CorteQS Founding 1000 programı, global Türk diasporasına hizmet veren veya diaspora içinde
              görünür olmak isteyen işletme, danışman, kurum, topluluk ve profesyoneller için tasarlandı.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {eligibleCategories.map((cat) => (
              <div
                key={cat.title}
                className={softCardClass}
              >
                <div className={`${iconBoxClass} mb-4`}>
                  <cat.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-foreground text-lg mb-2">{cat.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BENEFITS */}
        <div className="mb-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h3 className={sectionTitleClass}>
              Founding Verified User Avantajları
            </h3>
            <p className="text-muted-foreground text-lg">
              Erken katılan, erken konumlanır. İşte size özel ayrıcalıklar:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {benefits.map((b) => (
              <div
                key={b.text}
                className="flex items-start gap-4 p-5 rounded-xl bg-card/85 border border-white/60 shadow-sm transition-all hover:border-primary/35 hover:shadow-lg"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground text-sm leading-relaxed pt-1.5">{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PRICING */}
        <div className="mb-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h3 className={sectionTitleClass}>Erken Dönem Üyelik</h3>
            <p className="text-muted-foreground text-lg">Founding 1000'e özel — sınırlı kontenjan.</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative rounded-2xl bg-gradient-to-br from-card via-accent/10 to-primary/10 border border-accent/25 p-8 md:p-10 shadow-xl shadow-accent/10 backdrop-blur-sm">
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold tracking-wider uppercase shadow-lg">
                  ⭐ Founding 1000 Özel
                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">
                  Founding 1000 Özel Yıllık Üyelik
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl md:text-7xl font-extrabold text-accent">
                    €99
                  </span>
                  <span className="text-muted-foreground text-lg">/ yıl</span>
                </div>
              </div>

              <div className="rounded-xl bg-card/80 border border-white/60 p-4 mb-6 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Standart üyelik</span>
                  <span>Aylık €10</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Yıllık normal değer</span>
                  <span className="line-through text-muted-foreground/70">€120</span>
                </div>
                <div className="flex justify-between text-primary font-bold pt-2 border-t border-border">
                  <span>Founding 1000 özel</span>
                  <span>€99</span>
                </div>
              </div>

              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 mb-6">
                <p className="text-foreground text-sm leading-relaxed">
                  <span className="font-bold text-primary">+ €399 değerinde</span> kategori vitrini ve
                  ana sayfa carousel görünürlüğü <span className="font-semibold">6 ay boyunca dahil</span>.
                </p>
              </div>

              <p className="text-xs text-muted-foreground mb-6 leading-relaxed text-center">
                <span className="font-semibold text-foreground">Önemli:</span> 6 aylık görünürlük periyodu,
                CorteQS'in <span className="font-semibold text-foreground">29 Ekim full açılış</span>{" "}
                tarihinden itibaren başlar.
              </p>

              <button onClick={openForm} className={`${primaryButtonClass} w-full`}>
                Founding 1000'e Katıl
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6 max-w-xl mx-auto leading-relaxed">
              CorteQS, 29 Ekim full açılış öncesinde kısım kısım açılmaya başlayacaktır. Founding 1000
              üyelerine sunulan kategori vitrini ve ana sayfa carousel görünürlüğü, 29 Ekim full açılış
              tarihinden itibaren geçerli olacaktır.
            </p>
          </div>
        </div>

        {/* WHY NOW */}
        <div className="mb-20">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h3 className={sectionTitleClass}>
              Neden Şimdi Katılmalısınız?
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Çünkü CorteQS henüz erken aşamada. Bugün katılanlar, platform büyüdüğünde sadece kullanıcı
              değil; ülkelerinde, şehirlerinde ve kategorilerinde{" "}
              <span className="text-primary font-semibold">ilk görünen, ilk tanınan ve ilk konumlanan</span>{" "}
              kişi ve kurumlar olacak.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
            {exampleCities.map((c) => (
              <div
                key={c}
                className="px-5 py-4 rounded-xl bg-card/85 border border-white/60 shadow-sm hover:border-primary/35 transition-all flex items-center gap-3"
              >
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground text-sm font-medium">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CONTINENTS */}
        <div className="mb-20">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h3 className={sectionTitleClass}>
              5 Kıta, 1000 Kurucu Katılımcı
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {continents.map((c) => (
              <div
                key={c.name}
                className="text-center p-6 rounded-xl bg-card/85 border border-white/60 shadow-sm hover:border-primary/35 hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-3">{c.flag}</div>
                <div className="font-bold text-foreground text-lg mb-1">{c.name}</div>
                <div className="text-primary text-sm font-semibold">{c.quota}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Amerika bölgesi, Kuzey ve Güney Amerika'yı kapsar.
          </p>
        </div>

        {/* FINAL CTA */}
        <div className="max-w-3xl mx-auto text-center rounded-2xl bg-gradient-to-br from-accent/12 via-card to-primary/12 border border-accent/25 p-10 shadow-lg shadow-accent/10 md:p-14">
          <Building2 className="w-12 h-12 text-accent mx-auto mb-6" />
          <h3 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight">
            Ülkenizde, şehrinizde ve kategorinizde{" "}
            <span className="text-accent">ilk görünenlerden</span>{" "}
            biri olun.
          </h3>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            CorteQS Founding 1000'e katılın ve global Türk diasporasının dijital haritasında erken
            pozisyon alın.
          </p>
          <button onClick={openForm} className={primaryButtonClass}>
            Founding 1000'e Katıl
          </button>
        </div>

      </div>

      <RegisterInterestForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultCategory="isletme"
        defaultReferralCode="GGVBLA-M7SDSR"
      />
    </section>
  );
};

export default Founding1000Section;
