import { Home, Plane, Briefcase, Scale, TrendingUp, Heart, Star, Baby, Brain, GraduationCap, Package, Camera, Rocket } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Link } from "react-router-dom";

const categories = [
  {
    icon: Home,
    title: "Gayrimenkul Danışmanları",
    desc: "Yurt dışında ev ve yatırım",
    subs: [
      "Türk emlakçılar, proje temsilleri",
      "Yatırım için gayrimenkul seçimi, alım-satım süreçleri",
    ],
  },
  {
    icon: Plane,
    title: "Vize & Göçmenlik Danışmanları",
    desc: "Vize, oturum ve vatandaşlık",
    subs: [
      "Oturum izni, yatırımcı vizesi, aile vizesi",
      "Yerel oturum & vatandaşlık süreçleri",
      "Golden Visa",
    ],
  },
  {
    icon: Briefcase,
    title: "Şirket Kuruluşu & İş Danışmanlığı",
    desc: "Şirket kurma ve iş geliştirme",
    subs: [
      "Free zone veya mainland şirket kuruluşu",
      "Lisans, vergi, muhasebe",
      "İş geliştirme, yerel network",
      "Banka hesap açılışları",
    ],
  },
  {
    icon: Rocket,
    title: "Girişim Ekolojisi & Mentörler",
    desc: "Start-up, VC ve fractional uzmanlar",
    subs: [
      "Start-up kurucu mentörleri",
      "VC & Angel yatırımcı bağlantıları",
      "Fractional CTO / CMO / CFO",
      "Inkübasyon & hızlandırıcı yönlendirmesi",
      "Pitch deck & fundraising danışmanlığı",
      "Go-to-market & ürün stratejisi",
    ],
  },
  {
    icon: Scale,
    title: "Hukuk & Vergi Danışmanları",
    desc: "Uluslararası hukuk ve vergi",
    subs: [
      "Sözleşmeler ve yatırım hukuku",
      "Yerel vergi yükümlülükleri ve vergi avantajları",
      "Mortgage & finans çözümleri",
    ],
  },
  {
    icon: TrendingUp,
    title: "Finansal Danışmanlık",
    desc: "Yatırım ve finansal planlama",
    subs: [
      "Yatırım çeşitlendirme",
      "Döviz ve vergi planlama",
    ],
  },
  {
    icon: Heart,
    title: "Yaşam & Relocation Danışmanlığı",
    desc: "Taşınma ve yaşam desteği",
    subs: [
      "Doktor ve Diş Hekimleri",
      "Lokal ve Uluslararası Taşımacılar",
      "Acil evrak ve ilaç gönderim hizmetleri",
      "Ev & okul seçimi",
      "Okul sonrası aktivite",
      "Yetişkin aktivite",
      "Sağlık sigortası",
      "Günlük yaşam rehberliği",
    ],
  },
  {
    icon: Baby,
    title: "Aile & Çocuk",
    desc: "Aile ve çocuk odaklı destek",
    subs: [
      "Okul seçimi",
      "Kreş / daycare",
      "Playdate & sosyal çevre",
      "Aile taşınma danışmanlığı",
    ],
  },
  {
    icon: Brain,
    title: "Wellbeing",
    desc: "Psikolojik ve sosyal destek",
    subs: [
      "Psikolog / terapi",
      "Koçluk",
      "Göçmen psikolojisi",
      "Stres & adaptasyon",
    ],
  },
  {
    icon: GraduationCap,
    title: "Eğitim",
    desc: "Akademik ve kariyer danışmanlığı",
    subs: [
      "Üniversite başvuruları",
      "Denklik işlemleri",
      "Burs danışmanlığı",
      "Kariyer yönlendirme",
      "Staj",
    ],
  },
  {
    icon: Package,
    title: "Pratik Hayat",
    desc: "Günlük yaşam çözümleri",
    subs: [
      "Araç alım / kiralama",
      "Ehliyet dönüşümü",
      "Telefon / internet setup",
      "Abonelik işlemleri",
    ],
  },
  {
    icon: Camera,
    title: "Medya & İçerik",
    desc: "Görsel üretim ve sosyal medya",
    subs: [
      "Fotoğraf çekimi",
      "Video çekimi & prodüksiyon",
      "Sosyal medya ajansı",
      "Sosyal medya danışmanlığı",
    ],
  },
];

const ConsultantCategories = () => {
  return (
    <section id="danismanlar" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Danışmanlık Alanları</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            İhtiyacına uygun danışmanı bul
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto font-body">
            Diasporadaki her ihtiyaç için uzman danışmanlarla bağlantı kur
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, i) => (
            <HoverCard key={i} openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button
                  className="group relative flex items-center gap-4 p-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary-deep transition-all duration-300 shadow-card hover:shadow-card-hover hover:-translate-y-1 w-full"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-base">{cat.title}</h3>
                    <p className="text-sm opacity-80 font-body">{cat.desc}</p>
                  </div>
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-72 p-0 border-border/50 bg-card" side="bottom" align="start">
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="text-sm font-semibold text-foreground">{cat.title}</p>
                </div>
                <ul className="py-2">
                  {cat.subs.map((sub, j) => (
                    <li
                      key={j}
                      className="px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                    >
                      {sub}
                    </li>
                  ))}
                </ul>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>

        {/* City Ambassador Card */}
        <div className="mt-8 text-center">
          <Link to="/city-ambassadors">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gold/10 border border-gold/30 hover:bg-gold/15 transition-colors cursor-pointer group">
              <Star className="h-6 w-6 text-gold" />
              <div className="text-left">
                <p className="font-bold text-foreground text-sm">🌍 Şehir Elçisi Ol</p>
                <p className="text-xs text-muted-foreground">Şehrinde CorteQS'in temsilcisi ol, gelir elde et</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ConsultantCategories;
