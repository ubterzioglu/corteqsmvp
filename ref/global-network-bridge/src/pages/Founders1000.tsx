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
  Briefcase,
  BadgeCheck,
  MapPin,
  Sparkles,
  Eye,
  Rocket,
  Network,
  Building2,
  Check,
  ArrowRight,
  UserPlus,
  Star,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InterestForm from "@/components/InterestForm";
import landmarksImage from "@/assets/landmarks-collage.png";

const stats = [
  { icon: Globe2, value: "5", label: "Kıta" },
  { icon: Users, value: "1000", label: "Founding User" },
  { icon: Trophy, value: "200", label: "Her Kıtadan İlk" },
  { icon: Calendar, value: "29 Ekim", label: "Full Açılış" },
];

// 8 categories → symmetric on lg:grid-cols-4 (2x4)
const eligibleCategories = [
  { icon: Stethoscope, title: "Sağlık", desc: "Doktorlar, klinikler, diş hekimleri, psikologlar, sağlık merkezleri" },
  { icon: Scale, title: "Hukuk & Finans", desc: "Avukatlar, hukuk danışmanları, muhasebeciler, vergi & finansal danışmanlar" },
  { icon: Home, title: "Emlak & Relocation", desc: "Emlak danışmanları, relocation, taşınma, vize ve göçmenlik danışmanları" },
  { icon: GraduationCap, title: "Eğitim & Kariyer", desc: "Okullar, eğitim & kariyer danışmanları, dil okulları, öğrenci danışmanları" },
  { icon: Store, title: "İşletmeler & Hizmetler", desc: "Restoranlar, marketler, ajanslar, turizm, hizmet & yerel işletmeler" },
  { icon: Landmark, title: "Kuruluşlar & Topluluklar", desc: "Dernekler, vakıflar, kültür merkezleri, medya kuruluşları, topluluk yapıları" },
  { icon: Mic, title: "İçerik Üreticileri", desc: "Diaspora, şehir, kültür, iş, yaşam ve deneyim odaklı içerik üreticileri" },
  { icon: Briefcase, title: "Profesyoneller & Girişimciler", desc: "Bağımsız profesyoneller, girişimciler, freelancer'lar ve uzmanlar" },
];

// 8 benefits → symmetric on lg:grid-cols-4 (2x4)
const benefits = [
  { icon: BadgeCheck, text: "CorteQS Founding Verified User Badge" },
  { icon: MapPin, text: "Ülke, şehir ve kategori bazlı erken görünürlük" },
  { icon: Eye, text: "CorteQS kategori vitrininde yer alma hakkı" },
  { icon: Sparkles, text: "Ana sayfa carousel alanında 6 ay görünürlük" },
  { icon: Rocket, text: "Platform tam açıldığında ilk yayınlanan profiller arasında" },
  { icon: Globe2, text: "Global Türk diasporasının erken dönem dijital index'inde yer" },
  { icon: Network, text: "İşletmeni / uzmanlığını farklı şehirlerdeki Türklerle buluştur" },
  { icon: Star, text: "Founding üyelere özel topluluk buluşmaları ve erken erişim" },
];

// 8 example cities → symmetric on lg:grid-cols-4 (2x4)
const exampleCities = [
  "🇩🇪 Berlin'de bir doktor",
  "🇦🇪 Dubai'de bir emlak danışmanı",
  "🇬🇧 Londra'da bir hukuk ofisi",
  "🇨🇦 Toronto'da bir dernek",
  "🇶🇦 Doha'da bir restoran",
  "🇳🇱 Amsterdam'da bir içerik üreticisi",
  "🇺🇸 New York'ta bir Türk girişimci",
  "🇦🇺 Sydney'de bir Türk okulu",
];

const continents = [
  { name: "Avrupa", flag: "🇪🇺", quota: "İlk 200" },
  { name: "Asya", flag: "🌏", quota: "İlk 200" },
  { name: "Afrika", flag: "🌍", quota: "İlk 200" },
  { name: "Amerika", flag: "🌎", quota: "İlk 200" },
  { name: "Okyanusya", flag: "🇦🇺", quota: "İlk 200" },
];

const REFERRAL = "GGVBLA-M7SDSR";

const Founders1000 = () => {
  const [formOpen, setFormOpen] = useState(false);
  const openForm = () => setFormOpen(true);

  const ctaLabel = (
    <>
      <UserPlus className="w-5 h-5" />
      Kaydol — Diaspora Pasaportun Çıksın 🪪
      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* HERO — light theme, 2-column */}
        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-turquoise/20 blur-3xl" />
            <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-primary/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />
          </div>

          <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: copy + CTA */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-turquoise/15 border border-turquoise/30 mb-6">
                  <Sparkles className="w-4 h-4 text-turquoise" />
                  <span className="text-turquoise text-sm font-semibold tracking-wider uppercase">
                    🌍 CorteQS Founding 1000
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-foreground">
                  Global Türk diasporasının dijital haritasında{" "}
                  <span className="text-gradient-primary">erken yerinizi alın</span>.
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-body mb-8">
                  CorteQS, dünyanın farklı şehirlerine yayılmış Türk işletmelerini, danışmanları, klinikleri,
                  doktorları, avukatları, emlak danışmanlarını, relocation uzmanlarını, marketleri,
                  restoranları, dernekleri, vakıfları, okullarını, medya kuruluşlarını, içerik üreticilerini ve
                  profesyonelleri şehir şehir görünür kılmak için kuruluyor.
                </p>

                <button onClick={openForm} className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-turquoise hover:bg-turquoise-light text-primary-foreground font-bold text-base md:text-lg transition-all shadow-xl shadow-turquoise/30">
                  {ctaLabel}
                </button>
              </div>

              {/* Right: landmarks card + stats */}
              <div className="relative">
                <div className="rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
                  <div className="aspect-[16/10] bg-gradient-to-br from-turquoise/10 via-background to-primary/10 flex items-center justify-center p-6">
                    <img
                      src={landmarksImage}
                      alt="CorteQS global diaspora şehir ağı"
                      className="w-full h-full object-contain"
                      loading="eager"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
                    {stats.map((s) => (
                      <div key={s.label} className="bg-card p-4 text-center">
                        <s.icon className="w-5 h-5 text-turquoise mx-auto mb-2" />
                        <div className="text-xl md:text-2xl font-extrabold text-foreground">{s.value}</div>
                        <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notices */}
            <div className="max-w-5xl mx-auto mt-12 space-y-4">
              <div className="rounded-2xl bg-gold/10 border border-gold/30 px-6 py-4 flex items-start gap-3">
                <span className="text-2xl">⏳</span>
                <p className="text-foreground text-sm md:text-base font-medium">
                  <span className="font-bold text-gold-foreground">Kontenjan sınırlı:</span> Her kıtadan yalnızca
                  ilk 200 katılımcı Founding Verified User avantajından yararlanabilecek.
                </p>
              </div>

              <div className="rounded-2xl bg-turquoise/10 border border-turquoise/30 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <span className="text-2xl">🎁</span>
                <p className="text-foreground text-sm md:text-base font-medium flex-1">
                  <span className="font-bold text-turquoise">Founding 1000 özel referral kodu:</span>{" "}
                  <code className="px-2 py-0.5 rounded bg-muted border border-border text-foreground font-mono text-sm tracking-wider">
                    {REFERRAL}
                  </code>{" "}
                  — Bu sayfadan kayıt olduğunuzda kod otomatik tanımlanır.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHO — 8 cards → 4 cols x 2 rows */}
        <section className="py-20 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Kimler Katılabilir?</h2>
              <p className="text-muted-foreground text-lg leading-relaxed font-body">
                CorteQS Founding 1000 programı, global Türk diasporasına hizmet veren veya diaspora içinde
                görünür olmak isteyen işletme, danışman, kurum, topluluk ve profesyoneller için tasarlandı.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {eligibleCategories.map((cat) => (
                <div key={cat.title} className="group p-6 rounded-2xl bg-background border border-border hover:border-turquoise/40 hover:shadow-card-hover transition-all h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-turquoise/10 border border-turquoise/20 flex items-center justify-center mb-4">
                    <cat.icon className="w-6 h-6 text-turquoise" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{cat.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed font-body">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFITS — 8 → 4 cols x 2 rows */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Founding Verified User Avantajları</h2>
              <p className="text-muted-foreground text-lg font-body">Erken katılan, erken konumlanır. İşte size özel ayrıcalıklar:</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map((b) => (
                <div key={b.text} className="flex items-start gap-3 p-5 rounded-xl bg-card border border-border hover:border-turquoise/40 hover:shadow-card-hover transition-all h-full">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-turquoise/10 border border-turquoise/30 flex items-center justify-center">
                    <b.icon className="w-5 h-5 text-turquoise" />
                  </div>
                  <p className="text-foreground text-sm leading-relaxed pt-1.5 font-body">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="py-20 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Erken Dönem Üyelik</h2>
              <p className="text-muted-foreground text-lg font-body">Founding 1000'e özel — sınırlı kontenjan.</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="relative rounded-3xl bg-background border border-turquoise/40 p-8 md:p-10 shadow-2xl shadow-turquoise/10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold tracking-wider uppercase shadow-lg">
                    ⭐ Founding 1000 Özel
                  </div>
                </div>
                <div className="text-center mb-6">
                  <p className="text-turquoise text-sm font-semibold uppercase tracking-wider mb-2">Founding 1000 Özel Yıllık Üyelik</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-6xl md:text-7xl font-extrabold text-gradient-primary">€99</span>
                    <span className="text-muted-foreground text-lg">/ yıl</span>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 border border-border p-4 mb-6 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Standart üyelik</span><span>Aylık €10</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Yıllık normal değer</span><span className="line-through">€120</span></div>
                  <div className="flex justify-between text-foreground font-bold pt-2 border-t border-border"><span>Founding 1000 özel</span><span className="text-turquoise">€99</span></div>
                </div>
                <div className="rounded-xl bg-gold/10 border border-gold/30 p-4 mb-6">
                  <p className="text-foreground text-sm leading-relaxed font-body">
                    <span className="font-bold text-gold">+ €399 değerinde</span> kategori vitrini ve
                    ana sayfa carousel görünürlüğü <span className="font-semibold">6 ay boyunca dahil</span>.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed text-center font-body">
                  <span className="font-semibold text-foreground">Önemli:</span> 6 aylık görünürlük periyodu,
                  CorteQS'in <span className="font-semibold text-foreground">29 Ekim full açılış</span> tarihinden itibaren başlar.
                </p>
                <button onClick={openForm} className="group w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-turquoise hover:bg-turquoise-light text-primary-foreground font-bold text-base md:text-lg transition-all shadow-xl shadow-turquoise/30">
                  {ctaLabel}
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-6 max-w-xl mx-auto leading-relaxed font-body">
                CorteQS, 29 Ekim full açılış öncesinde kısım kısım açılmaya başlayacaktır. Founding 1000
                üyelerine sunulan kategori vitrini ve ana sayfa carousel görünürlüğü, 29 Ekim full açılış
                tarihinden itibaren geçerli olacaktır.
              </p>
            </div>
          </div>
        </section>

        {/* WHY NOW — 8 cities → 4 cols x 2 rows */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Neden Şimdi Katılmalısınız?</h2>
              <p className="text-muted-foreground text-lg leading-relaxed font-body">
                Çünkü CorteQS henüz erken aşamada. Bugün katılanlar, platform büyüdüğünde sadece kullanıcı
                değil; ülkelerinde, şehirlerinde ve kategorilerinde{" "}
                <span className="text-turquoise font-semibold">ilk görünen, ilk tanınan ve ilk konumlanan</span>{" "}
                kişi ve kurumlar olacak.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {exampleCities.map((c) => (
                <div key={c} className="px-5 py-4 rounded-xl bg-card border border-border hover:border-turquoise/40 hover:shadow-card-hover transition-all flex items-center gap-3">
                  <Check className="w-4 h-4 text-turquoise shrink-0" />
                  <span className="text-foreground text-sm font-medium">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTINENTS — 5 cards on 5 cols (symmetric) */}
        <section className="py-20 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">5 Kıta, 1000 Kurucu Katılımcı</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {continents.map((c) => (
                <div key={c.name} className="text-center p-6 rounded-2xl bg-background border border-border hover:border-turquoise/40 hover:shadow-card-hover transition-all">
                  <div className="text-4xl mb-3">{c.flag}</div>
                  <div className="font-bold text-foreground text-lg mb-1">{c.name}</div>
                  <div className="text-turquoise text-sm font-semibold">{c.quota}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6 font-body">Amerika bölgesi, Kuzey ve Güney Amerika'yı kapsar.</p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center rounded-3xl bg-gradient-to-br from-turquoise/10 via-background to-primary/10 border border-turquoise/30 p-10 md:p-14">
              <Building2 className="w-12 h-12 text-turquoise mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight">
                Ülkenizde, şehrinizde ve kategorinizde{" "}
                <span className="text-gradient-primary">ilk görünenlerden</span>{" "}
                biri olun.
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed font-body">
                CorteQS Founding 1000'e katılın ve global Türk diasporasının dijital haritasında erken pozisyon alın.
              </p>
              <button onClick={openForm} className="group inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-turquoise hover:bg-turquoise-light text-primary-foreground font-bold text-base md:text-lg transition-all shadow-xl shadow-turquoise/30">
                {ctaLabel}
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <InterestForm
        open={formOpen}
        onOpenChange={setFormOpen}
        context="founders_1000" defaultCategory="founders_1000" lockCategory
        title="Founding 1000'e Katıl"
        description="Bilgilerinizi bırakın, sizinle iletişime geçelim ve referral kodunuzu tanımlayalım."
        source="founders-1000-page"
        referralCode={REFERRAL}
      />
    </div>
  );
};

export default Founders1000;
