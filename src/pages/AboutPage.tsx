import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Globe,
  GraduationCap,
  HandCoins,
  Handshake,
  Heart,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  UserRoundPlus,
  Zap,
} from "lucide-react";
import corteqsLogo from "../../newlogo.png";
import heroNetworkLight from "@/assets/hero-network-light.jpg";

const audienceNetworkPeople = [
  "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300",
  "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300",
  "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300",
  "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=300",
  "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300",
] as const;

const impactItems = [
  "Global Türk diasporasını tek platformda toplar",
  "Şehir bazlı network sunar: Berlin, Londra, Dubai ve daha fazlası",
  "İnsanları, işletmeleri ve toplulukları buluşturur",
  "Yeni şehirde nereden başlayacağını netleştirir",
  "Relocation sürecini daha kolay ve yönetilebilir hale getirir",
  "İş, proje ve iş birliği fırsatlarını görünür kılar",
  "Güven temelli bağlantılar kurmanı sağlar",
  "Bilgi paylaşımını ve deneyim aktarımını hızlandırır",
  "Profesyonel network oluşturmayı destekler",
  "Global ama lokal odaklı topluluklar yaratır",
];

const pillars = [
  {
    title: "Bağlantı Kur",
    description:
      "Bulunduğun şehirde ya da hedeflediğin ülkede doğru insanlara, güvenilir topluluklara ve seni hızlandıracak ilişkilere daha kısa sürede ulaş.",
    icon: Users,
  },
  {
    title: "Görünür Ol",
    description:
      "Uzmanlığını, girişimini, üretimini veya topluluk katkını dijital vitrine taşı. Profilin yalnızca görünmesin, anlamlı fırsatlara da dönüşsün.",
    icon: Sparkles,
  },
  {
    title: "Fırsat Yarat",
    description:
      "İş ortaklığı, müşteri, kariyer, danışmanlık, freelance ve remote fırsatlarını tek tek kovalamak yerine doğru ağ içinde doğal olarak üret.",
    icon: Zap,
  },
];

const statCards = [
  { label: "Kapsam", value: "164 ülke", icon: Globe },
  { label: "Potansiyel ağ", value: "8.8 milyon Türk", icon: Users },
  { label: "Odak", value: "Şehir + kategori", icon: MapPin },
  { label: "Yaklaşım", value: "AI destekli eşleşme", icon: Target },
];

const audienceSections = [
  {
    title: "Profesyoneller İçin",
    accent: "text-[#2878f2]",
    accentSoft: "bg-[#2878f2]",
    border: "border-[#d9e7ff]",
    shell:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.99),rgba(245,249,255,0.97),rgba(238,246,255,0.95))]",
    glow: "shadow-[0_22px_54px_rgba(40,120,242,0.08)]",
    icon: BriefcaseBusiness,
    points: [
      "Uzmanlığını doğru topluluğa gösterme",
      "Doğru müşteri ve iş ortaklarına ulaşma",
      "Kariyer ve danışmanlık fırsatlarını artırma",
      "Güven temelli görünürlük kazanma",
    ],
    features: [
      { label: "Networking\nFırsatları", icon: Network },
      { label: "İş & Proje\nBağlantıları", icon: BriefcaseBusiness },
      { label: "Mentorluk &\nDanışmanlık", icon: GraduationCap },
      { label: "Kariyer\nGelişimi", icon: Zap },
    ],
  },
  {
    title: "Girişimler ve İşletmeler İçin",
    accent: "text-[#22a76b]",
    accentSoft: "bg-[#22a76b]",
    border: "border-[#dcefe4]",
    shell:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.99),rgba(244,252,248,0.97),rgba(237,249,243,0.95))]",
    glow: "shadow-[0_22px_54px_rgba(34,167,107,0.08)]",
    icon: Building2,
    points: [
      "Diaspora içinde daha hızlı keşfedilme",
      "Ülke ve şehir bazlı büyüme alanları bulma",
      "Yeni iş birlikleri ve dağıtım kanalları açma",
      "Topluluk içinden güvenli talep yakalama",
    ],
    features: [
      { label: "Global\nGörünürlük", icon: Globe },
      { label: "Hedef Kitleye\nUlaşım", icon: Target },
      { label: "İş Birlikleri &\nOrtaklıklar", icon: Handshake },
      { label: "Tanıtım &\nDuyurular", icon: Sparkles },
    ],
  },
  {
    title: "Topluluk ve Bireyler İçin",
    accent: "text-[#7c3aed]",
    accentSoft: "bg-[#7c3aed]",
    border: "border-[#e7dcff]",
    shell:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.99),rgba(250,246,255,0.97),rgba(244,238,255,0.95))]",
    glow: "shadow-[0_22px_54px_rgba(124,58,237,0.08)]",
    icon: Users,
    points: [
      "Bilgiye daha hızlı ve düzenli erişme",
      "Yeni şehirlerde daha kolay yön bulma",
      "Güvenilir çevre ve dayanışma ağı kurma",
      "Sosyal ve profesyonel hayatı aynı zeminde büyütme",
    ],
    features: [
      { label: "Topluluklara\nKatıl", icon: UserRoundPlus },
      { label: "Bilgi & Deneyim\nPaylaşımı", icon: MessagesSquare },
      { label: "Etkinliklere\nKatılım", icon: Sparkles },
      { label: "Yeni Şehirlerde\nDestek Ağı", icon: Globe },
    ],
  },
];

const trustBadges = [
  { label: "Güvenli", icon: Users },
  { label: "Doğrulanmış", icon: BadgeCheck },
  { label: "Mahremiyet Odaklı", icon: Lock },
  { label: "Hızlı & Kolay", icon: Zap },
  { label: "Topluluk Odaklı", icon: Heart },
] as const;

const AboutPage = () => {
  useEffect(() => {
    document.dispatchEvent(new Event("render-complete"));
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--section-warm))_52%,hsl(var(--background))_100%)]">
      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-90"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 12% 18%, hsl(var(--primary) / 0.22), transparent 30%), radial-gradient(circle at 88% 14%, hsl(var(--accent) / 0.18), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0))",
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-32 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
          aria-hidden="true"
          style={{ background: "hsl(var(--primary) / 0.14)" }}
        />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-16">
          <section className="mb-14 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_30px_80px_rgba(16,24,40,0.08)] backdrop-blur-xl md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Hakkımızda
                </span>
                <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-foreground md:text-6xl">
                  Türk Diasporası artık dağınık değil.
                  <span className="block text-primary">Birleşiyor.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                  CorteQS ile hedef net: <span className="font-semibold text-foreground">bağlantı kur, görünür ol, fırsat yarat.</span>
                  Dünyanın dört bir yanındaki Türkleri daha organize, daha görünür ve daha güçlü bir topluluk yapısında buluşturuyoruz.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="https://chat.whatsapp.com/JDMyCOx0m2w3lqejP7vA6M"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#25D366]/25 transition-transform hover:-translate-y-0.5 hover:bg-[#1ebe5d]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Topluluğuna Katıl
                  </a>
                  <Link
                    to="/#kaydol"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-white px-6 py-3.5 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    Katıl ve Parçası Ol
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {statCards.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.75rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,243,239,0.88))] p-5 shadow-sm"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="mt-2 text-2xl font-black text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-14 grid gap-5 md:grid-cols-3">
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
              >
                <div
                  className="absolute right-0 top-0 h-24 w-24 rounded-full blur-2xl"
                  aria-hidden="true"
                  style={{ background: "hsl(var(--accent) / 0.12)" }}
                />
                <div className="relative">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{pillar.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{pillar.description}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="mb-14 rounded-[2rem] border border-border/70 bg-card p-6 shadow-[0_24px_60px_rgba(15,23,42,0.05)] md:p-10">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">CorteQS Ne Yapar?</span>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-4xl">
                  Görünürlüğü gerçek değere dönüştüren diaspora altyapısı
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                Bu yapı sadece bir rehber değil. İlişki, güven, fırsat ve bilgi akışını aynı platformda birleştiren büyüme zemini.
              </p>
            </div>

            <div className="grid gap-3">
              {impactItems.map((item, index) => (
                <div
                  key={item}
                  className="group rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,245,242,0.88))] px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm font-medium leading-6 text-foreground">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-14">
            <article className="overflow-hidden rounded-[2.2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,251,255,0.95))] p-6 shadow-[0_28px_75px_rgba(15,23,42,0.07)] md:p-8 xl:p-10">
              <div className="grid gap-10 xl:grid-cols-[1.04fr_0.96fr] xl:items-center">
                <div>
                  <span className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.34em] text-[#14b87a]">
                    Kimler İçin?
                    <span className="h-[3px] w-14 rounded-full bg-[linear-gradient(90deg,#14b87a_0%,#3b82f6_100%)]" />
                  </span>
                  <h2 className="mt-5 max-w-[12ch] text-[2.7rem] font-black leading-[0.96] tracking-tight text-[#142a56] md:text-[3.35rem] xl:text-[3.85rem]">
                    Tek bir kitleye değil,
                    <span className="mt-1 block bg-[linear-gradient(90deg,#1db36d_0%,#4b74ff_42%,#ff7a18_100%)] bg-clip-text text-transparent">
                      ekosistemin tamamına
                    </span>
                    hizmet eder
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-slate-500 md:text-[1.15rem]">
                    CorteQS, farklı ihtiyaçlara sahip tüm birey, kurum ve toplulukları tek bir
                    platformda buluşturarak daha güçlü bir diaspora ekosistemi oluşturur.
                  </p>
                </div>

                <div className="relative mx-auto flex w-full max-w-[36rem] items-center justify-center">
                  <div
                    className="absolute inset-[16%] rounded-full blur-3xl"
                    aria-hidden="true"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(82,142,255,0.14) 0%, rgba(255,255,255,0) 72%)",
                    }}
                  />
                  <div className="relative aspect-[1.22/0.82] w-full">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.12]">
                      <img
                        src={heroNetworkLight}
                        alt=""
                        className="h-[92%] w-[96%] object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="absolute left-[6%] top-[18%] h-[34%] w-[32%] rounded-full border border-dashed border-[#80b0ff]/55" />
                    <div className="absolute right-[6%] top-[14%] h-[42%] w-[38%] rounded-full border border-dashed border-[#b697ff]/55" />
                    <div className="absolute left-[24%] top-[8%] h-[76%] w-[52%] rounded-full border border-dashed border-[#f2c69d]/45" />

                    <div className="absolute left-[50%] top-[46%] z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_22px_50px_rgba(15,23,42,0.14),0_0_0_16px_rgba(255,255,255,0.72)]">
                      <img src={corteqsLogo} alt="CorteQS" className="h-16 w-16 object-contain" />
                    </div>

                    <div className="absolute left-[16%] top-[5%] z-20 h-14 w-14 overflow-hidden rounded-full border-4 border-[#ffcfad] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.16)]">
                      <img src={audienceNetworkPeople[0]} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute right-[14%] top-[2%] z-20 h-14 w-14 overflow-hidden rounded-full border-4 border-[#cab8ff] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.16)]">
                      <img src={audienceNetworkPeople[1]} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute left-[10%] top-[48%] z-20 h-14 w-14 overflow-hidden rounded-full border-4 border-[#acd1ff] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.16)]">
                      <img src={audienceNetworkPeople[2]} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute left-[34%] bottom-[8%] z-20 h-14 w-14 overflow-hidden rounded-full border-4 border-[#abf0d7] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.16)]">
                      <img src={audienceNetworkPeople[3]} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute right-[8%] bottom-[10%] z-20 h-14 w-14 overflow-hidden rounded-full border-4 border-[#ffbcc6] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.16)]">
                      <img src={audienceNetworkPeople[4]} alt="" className="h-full w-full object-cover" />
                    </div>

                    <div className="absolute left-[50%] top-[23%] h-3 w-3 rounded-full bg-[#ff9b35]" />
                    <div className="absolute left-[20%] top-[30%] h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
                    <div className="absolute left-[34%] top-[38%] h-2 w-2 rounded-full bg-[#3b82f6]" />
                    <div className="absolute right-[30%] top-[18%] h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
                    <div className="absolute right-[22%] top-[34%] h-2 w-2 rounded-full bg-[#8b5cf6]" />
                    <div className="absolute left-[52%] bottom-[18%] h-2.5 w-2.5 rounded-full bg-[#22c55e]" />

                    <div className="absolute left-[56%] top-[22%] flex h-11 w-11 items-center justify-center rounded-full border border-[#dce7ff] bg-white text-[#2878f2] shadow-[0_10px_24px_rgba(40,120,242,0.12)]">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </div>
                    <div className="absolute right-[22%] top-[34%] flex h-11 w-11 items-center justify-center rounded-full border border-[#dce7ff] bg-white text-[#2878f2] shadow-[0_10px_24px_rgba(40,120,242,0.12)]">
                      <HandCoins className="h-5 w-5" />
                    </div>
                    <div className="absolute right-[34%] bottom-[16%] flex h-10 w-10 items-center justify-center rounded-full border border-[#dcf3ea] bg-white text-[#20b26f] shadow-[0_10px_24px_rgba(32,178,111,0.12)]">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                    <div className="absolute right-[12%] bottom-[26%] flex h-11 w-11 items-center justify-center rounded-full border border-[#ffe0dc] bg-white text-[#ff6a5b] shadow-[0_10px_24px_rgba(255,106,91,0.12)]">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid gap-4">
                {audienceSections.map((section) => {
                  const SectionIcon = section.icon;

                  return (
                    <div
                      key={section.title}
                      className={`rounded-[2rem] border p-5 md:p-6 ${section.border} ${section.shell} ${section.glow}`}
                    >
                      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr_0.98fr] xl:items-center">
                        <div className="relative overflow-hidden rounded-[1.7rem] border border-white/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(243,247,255,0.88)_52%,rgba(236,241,251,0.82)_100%)] px-5 py-6">
                          <div
                            className="absolute -left-10 bottom-0 h-24 w-24 rounded-full blur-2xl"
                            aria-hidden="true"
                            style={{ background: "rgba(124, 58, 237, 0.10)" }}
                          />
                          <div className="absolute right-4 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/75 text-slate-300 shadow-sm">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_18px_34px_rgba(15,23,42,0.10)] ${section.accent}`}>
                            <SectionIcon className="h-7 w-7" />
                          </div>
                          <div className="flex min-h-[8.5rem] items-end justify-center">
                            <div className="relative w-full max-w-[16rem]">
                              <div className="absolute inset-x-0 bottom-0 h-10 rounded-[1rem] bg-[linear-gradient(180deg,rgba(194,212,255,0.10),rgba(177,198,255,0.18))]" />
                              <div className={`absolute left-[6%] top-[18%] h-20 w-20 rounded-[1.6rem] bg-white shadow-[0_20px_34px_rgba(15,23,42,0.10)] ${section.accent}`} />
                              <div className="absolute right-[8%] top-[8%] flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-300 shadow-sm">
                                <Users className="h-4 w-4" />
                              </div>
                              <div className="relative flex min-h-[7.4rem] items-end justify-center">
                                <SectionIcon className={`h-28 w-28 ${section.accent} opacity-95`} strokeWidth={1.5} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className={`text-2xl font-black tracking-tight md:text-[2rem] ${section.accent}`}>
                            {section.title}
                          </h3>
                          <div className={`mt-3 h-[3px] w-16 rounded-full ${section.accentSoft}`} />
                          <div className="mt-6 grid gap-4">
                            {section.points.map((point) => (
                              <div key={point} className="flex items-start gap-3">
                                <span className={`mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${section.accentSoft}`}>
                                  <BadgeCheck className="h-3.5 w-3.5 text-white" />
                                </span>
                                <p className="text-[1.02rem] leading-7 text-slate-700">{point}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-[1.7rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,251,255,0.86))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
                          {section.features.map((feature) => {
                            const FeatureIcon = feature.icon;

                            return (
                              <div
                                key={feature.label}
                                className="rounded-[1.2rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,255,0.9))] px-3 py-4 text-center shadow-[0_8px_18px_rgba(15,23,42,0.04)]"
                              >
                                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] ${section.accent}`}>
                                  <FeatureIcon className="h-7 w-7" strokeWidth={1.8} />
                                </div>
                                <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-5 text-[#142a56]">
                                  {feature.label}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[1.8rem] border border-[#f0e3d2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,250,244,0.94))] px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                      <img src={corteqsLogo} alt="CorteQS" className="h-10 w-10 object-contain" />
                    </div>
                    <div>
                      <p className="text-2xl font-black tracking-tight text-[#142a56]">Aynı amaç, tek ağ.</p>
                      <p className="text-lg font-semibold text-[#1d3569]">
                        Daha güçlü bir diaspora, birlikte mümkün.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                    {trustBadges.map((badge) => {
                      const BadgeIcon = badge.icon;

                      return (
                        <div key={badge.label} className="flex items-center gap-3 rounded-2xl px-2 py-1.5 text-slate-600">
                          <BadgeIcon className="h-5 w-5 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-600">{badge.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-white/80 p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.05)] backdrop-blur md:p-10">
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Katılım Çağrısı</span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-4xl">
              Global Türk gücünü birlikte organize edelim
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              Eğer sen de görünür olmak, doğru insanlara ulaşmak, topluluk içinde fırsat üretmek ve bu yapının bir parçası olmak istiyorsan şimdi katıl.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="https://chat.whatsapp.com/JDMyCOx0m2w3lqejP7vA6M"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#25D366]/25 transition-transform hover:-translate-y-0.5 hover:bg-[#1ebe5d]"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Topluluğuna Katıl
              </a>
              <a
                href="https://corteqs.net/form"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-2xl border border-[#d55d1f] bg-[linear-gradient(135deg,#f97316_0%,#f26522_48%,#ef5b1c_100%)] px-6 py-3.5 text-sm font-bold text-white shadow-[0_16px_34px_rgba(242,101,34,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(242,101,34,0.28)]"
              >
                Kategorine Kayıt ve Takip İçin
              </a>
              <a
                href="mailto:info@corteqs.net"
                className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-bold text-foreground transition-colors hover:border-accent/40 hover:bg-accent/5"
              >
                <Mail className="h-4 w-4 text-accent" />
                İletişime Geç
              </a>
            </div>
          </section>
        </div>
      </main>

    </div>
  );
};

export default AboutPage;
