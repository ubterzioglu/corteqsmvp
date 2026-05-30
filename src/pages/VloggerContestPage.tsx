import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Video,
  Calendar,
  Trophy,
  Users,
  Award,
  BadgeCheck,
  ShieldCheck,
  Bot,
  Film,
  Globe2,
} from "lucide-react";
import RegisterInterestForm from "@/components/RegisterInterestForm";
import magicBallHero from "@/assets/corteqs-magic-ball-hero.jpg";

const themes = [
  { title: "Kültür", desc: "Yaşanılan ülkedeki kültürel deneyimler, Türk diasporasının izleri ve kültürler arası gözlemler." },
  { title: "Mücadele", desc: "Göç, kariyer, eğitim, iş kurma, yeniden başlama, dayanışma ve kolektif mücadele hikâyeleri." },
  { title: "Mizah", desc: "Yurtdışında yaşamdan komik olaylar, kültürel yanlış anlamalar ve eğlenceli gözlemler." },
  { title: "Gusto", desc: "Yaşam zevki, yemek, mekan, seyahat, şehir kültürü, lezzet ve diaspora mekanları." },
];

const evaluation = [
  { criterion: "Subscription / platform kayıt dönüşümü", weight: "%50" },
  { criterion: "CorteQS resmi kanallarındaki performans", weight: "%20" },
  { criterion: "Vlogger'ın kendi hesabındaki takipçi başına etkileşim oranı", weight: "%15" },
  { criterion: "En yüksek etkileşim sağlayan 3 destek hesabın performansı", weight: "%10" },
  { criterion: "Jüri değerlendirmesi", weight: "%5" },
];

const calendar = [
  { phase: "Başvuru başlangıcı", date: "10 Mayıs" },
  { phase: "Son içerik gönderim tarihi", date: "1 Eylül" },
  { phase: "Performans ölçümü", date: "Her içerik için yayın tarihinden itibaren 45 gün" },
  { phase: "Kazananların ilanı", date: "29 Ekim CorteQS Lansmanı" },
  { phase: "Ödül ve online toplantılar", date: "29 Ekim'i takip eden hafta içinde" },
];

const participationDetails = [
  "Her yarışmacı en fazla 5 içerikle yarışmaya katılabilir.",
  "Her video ayrı başvuru olarak değerlendirilir.",
  "Her içerik için ayrı kayıt formu, ayrı içerik yüklemesi, ayrı referral kodu ve ayrı değerlendirme süreci oluşturulur.",
  "Katılım bedeli her bir içerik başvurusu için €25'tir.",
  "Katılımcı tüm başvurularını CorteQS dashboard'u üzerinden takip edebilir.",
];

const statCards = [
  { icon: Trophy, value: "€1.500", label: "Birincilik Ödülü" },
  { icon: Film, value: "5", label: "Maks. Video" },
  { icon: Calendar, value: "1 Eylül", label: "Son Gönderim" },
  { icon: Award, value: "29 Ekim", label: "Kazanan İlanı" },
];

const sectionTitleClass = "text-3xl md:text-4xl font-bold text-foreground mb-4";
const softCardClass =
  "rounded-xl border border-white/60 bg-card/85 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-primary/35 hover:shadow-lg";
const iconBoxClass =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10";
const primaryButtonClass =
  "group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90";

const VloggerContestPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const openForm = () => setFormOpen(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <div className="container mx-auto px-4 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Ana sayfaya dön
        </Link>
      </div>

      <section className="relative overflow-hidden bg-gradient-to-br from-background via-card to-secondary/40">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--accent)/0.08),hsl(var(--primary)/0.07),hsl(var(--background)))]" aria-hidden />

        <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
          {/* HERO */}
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center mb-16">
            {/* Hero text column */}
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Video className="w-4 h-4 text-primary" />
                <span className="text-primary text-sm font-semibold tracking-wider uppercase">
                  🎥 CorteQS Vlogger İçerik Yarışması
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight">
                Hikâyeni ya da Global Türklerin hikâyesini{" "}
                <span className="text-accent">video ile anlat</span>
                . Dünyaya duyur.
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Diaspora deneyimlerini, kültürel gözlemlerini, mücadeleni, mizahını ve gustonu video
                formatında bir araya getir. CorteQS sosyal medya kanallarında ve dijital yayın
                akışlarında global görünürlük kazan.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-10">
                <button onClick={openForm} className={primaryButtonClass}>
                  Videonu Gönder
                </button>
              </div>
            </div>

            {/* Hero visual column — CorteQS Magic Ball */}
            <div className="relative flex items-center justify-center">
              {/* Glow halo behind ball */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                <div className="w-[80%] h-[80%] rounded-full bg-accent/15 blur-3xl" />
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                <div className="w-[55%] h-[55%] rounded-full bg-primary/15 blur-3xl" />
              </div>
              <img
                src={magicBallHero}
                alt="CorteQS Magic Ball — Global Türk diasporası maskotu"
                className="relative z-10 w-full max-w-md lg:max-w-lg object-contain drop-shadow-[0_25px_60px_rgba(31,154,137,0.18)] animate-float"
                width={1024}
                height={1024}
                loading="eager"
              />
              {/* Subtle reflection plate */}
              <div
                className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 w-[60%] h-3 rounded-[100%] bg-primary/25 blur-md"
                aria-hidden
              />
            </div>
          </div>

          {/* Stats — full width below hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-20">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="text-center rounded-xl bg-card/85 border border-white/60 shadow-sm backdrop-blur-sm p-5 hover:border-primary/35 hover:shadow-lg transition-all"
              >
                <s.icon className="w-6 h-6 text-primary mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-extrabold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* INTRO */}
          <div className="max-w-4xl mx-auto mb-20 space-y-5 rounded-2xl border border-white/60 bg-card/80 p-6 text-lg leading-relaxed text-muted-foreground shadow-sm backdrop-blur-sm md:p-8">
            <p>
              CorteQS Vlogger İçerik Yarışması, dünyanın farklı ülkelerinde yaşayan{" "}
              <span className="text-primary font-semibold">Global Türklerin</span> hikâyelerini,
              diaspora deneyimlerini, kültürel gözlemlerini, mücadelelerini, mizahını ve gusto anlayışını
              video formatında bir araya getiriyor.
            </p>
            <p>
              Kendi yaşam hikâyeni anlatabileceğin gibi, yaşadığın ülkedeki Türk diasporasının ortak
              deneyimlerini, topluluk başarılarını, kültürel karşılaşmaları, iş hayatını, sosyal yaşamı
              veya yeni nesil göç hikâyelerini de konu edinebilirsin.
            </p>
            <p>
              Yarışmaya gönderilen uygun video içerikler{" "}
              <span className="text-foreground font-semibold">
                CorteQS sosyal medya kanallarında ve dijital yayın akışlarında
              </span>{" "}
              kullanıma alınır. Bu süreç içerik sahibine global görünürlük, kendini tanıtma ve CorteQS
              topluluğu içinde öne çıkma fırsatı sağlar.
            </p>
          </div>

          {/* PARTICIPATION */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="rounded-2xl bg-gradient-to-br from-accent/10 via-card to-primary/10 border border-accent/20 p-8 shadow-sm md:p-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Katılım Limiti ve Ücret
              </h2>
              <ul className="space-y-3">
                {participationDetails.map((d) => (
                  <li key={d} className="flex items-start gap-3">
                    <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <span className="text-foreground leading-relaxed">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CATEGORIES */}
          <div className="mb-20">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className={sectionTitleClass}>Kategoriler</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div className={softCardClass}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={iconBoxClass}>
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-xl">Otantik İçerik</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Tamamen katılımcının kendi üretimi olan, yapay zekâ izi taşımayan özgün video
                  içeriklerdir. AI kullanımı tespit edilirse başvuru diskalifiye edilebilir.
                </p>
              </div>
              <div className={softCardClass}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={iconBoxClass}>
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-xl">AI Serbest İçerik</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Teknoloji kullanımı serbesttir. Hibrit, kısmi veya tamamen AI destekli video üretimleri
                  kabul edilir. Yaratıcılık, anlatım gücü ve içerik etkisi değerlendirilir.
                </p>
              </div>
            </div>
          </div>

          {/* THEMES */}
          <div className="mb-20">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className={sectionTitleClass}>Temalar</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 max-w-5xl mx-auto">
              {themes.map((t) => (
                <div key={t.title} className={softCardClass}>
                  <h3 className="font-bold text-primary text-xl mb-2">{t.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PRIZES */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className={sectionTitleClass}>Ödüller</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5 mb-6">
              {[
                { rank: "1.", prize: "€1.500", desc: "Birincilik para ödülü", glow: true },
                { rank: "2.", prize: "Dubai Uçak Bileti", desc: "Dubai-İstanbul standardı; ülkeye göre eşdeğer ödül sunulabilir" },
                { rank: "3.", prize: "Big Chefs Akşam Yemeği", desc: "2 kişilik; erişim olmayan ülkelerde eşdeğer restoran/deneyim sunulabilir" },
              ].map((p) => (
                <div
                  key={p.rank}
                  className={`relative p-7 rounded-2xl border text-center ${
                    p.glow
                      ? "bg-gradient-to-br from-accent/15 to-primary/10 border-accent/35 shadow-lg shadow-accent/10"
                      : "bg-card/85 border-white/60 shadow-sm"
                  }`}
                >
                  <div className={`text-5xl font-extrabold mb-3 ${p.glow ? "text-accent" : "text-foreground"}`}>
                    {p.rank}
                  </div>
                  <div className="text-xl font-bold text-foreground mb-2">{p.prize}</div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-foreground text-sm leading-relaxed">
                Öne çıkan <span className="font-bold text-primary">ilk 20 içerik üreticisine</span>{" "}
                CorteQS'te <span className="font-semibold">1 yıl süreyle Onursal Blogger/Vlogger Badge'i</span>{" "}
                verilir ve platformda özel tanıtım yapılır.
              </p>
            </div>
          </div>

          {/* EVALUATION */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className={sectionTitleClass}>Değerlendirme Özeti</h2>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/60 bg-card/80 shadow-sm mb-6">
              {evaluation.map((e, i) => (
                <div
                  key={e.criterion}
                  className={`flex items-center justify-between gap-4 px-6 py-4 ${
                    i % 2 === 0 ? "bg-background/70" : "bg-card/70"
                  } ${i !== evaluation.length - 1 ? "border-b border-border/70" : ""}`}
                >
                  <span className="text-foreground text-sm md:text-base">{e.criterion}</span>
                  <span className="text-primary font-bold text-lg whitespace-nowrap">{e.weight}</span>
                </div>
              ))}
            </div>
            <div className={`${softCardClass} flex items-start gap-4`}>
              <Globe2 className="w-6 h-6 text-primary shrink-0 mt-1" />
              <p className="text-muted-foreground text-sm leading-relaxed">
                Her yarışmacıya veya her içeriğe özel <span className="text-foreground font-semibold">referral
                kodu / referral linki</span> tanımlanır. Bu kod üzerinden corteqs.net'e gelen ve platforma
                kayıt olan kullanıcılar, yarışmanın en yüksek ağırlıklı performans kriteri olan{" "}
                <span className="text-primary font-semibold">subscription conversion</span> puanını
                oluşturur.
              </p>
            </div>
          </div>

          {/* CALENDAR */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className={sectionTitleClass}>Takvim</h2>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/60 bg-card/80 shadow-sm">
              {calendar.map((c, i) => (
                <div
                  key={c.phase}
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-2 px-6 py-4 ${
                    i % 2 === 0 ? "bg-background/70" : "bg-card/70"
                  } ${i !== calendar.length - 1 ? "border-b border-border/70" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground font-medium text-sm md:text-base">{c.phase}</span>
                  </div>
                  <span className="text-primary text-sm md:text-base sm:text-right">{c.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* APPLICATION */}
          <div className="max-w-3xl mx-auto text-center rounded-2xl bg-gradient-to-br from-accent/12 via-card to-primary/12 border border-accent/25 p-10 shadow-lg shadow-accent/10 md:p-14">
            <Video className="w-12 h-12 text-accent mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight">
              Başvuru
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Formun tamamlanması, video bağlantısının yüklenmesi, gerekli onayların verilmesi ve her
              içerik için <span className="text-accent font-bold">€25 katılım bedelinin</span> ödenmesi
              gerekir.
            </p>
            <button onClick={openForm} className={primaryButtonClass}>
              Başvuruyu Tamamla ve Ödemeye Geç
            </button>
            <p className="text-xs text-muted-foreground mt-6">
              Ödeme akışı, başvuru tamamlandıktan sonra e-posta ile iletilecektir.
            </p>
          </div>
        </div>
      </section>

      <RegisterInterestForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultCategory="blogger-vlogger"
        defaultReferralCode="GGVBLA-M7SDSR"
      />
    </div>
  );
};

export default VloggerContestPage;
