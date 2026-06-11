import logo from "@/assets/corteqs-logo.png";
import {
  Users, Megaphone, Briefcase, HandHeart, MapPin,
  Shield, Network, Eye, TrendingUp, Radio, Play, BarChart3,
  Sparkles, Heart, Globe2,
} from "lucide-react";

export type TemplateType =
  | "consultant"
  | "media"
  | "business"
  | "association"
  | "ambassador";

export type TemplateConfig = {
  id: TemplateType;
  label: string;
  title: string;
  subtitle: string;
  intro: string;
  quote: string;
  pillars: { icon: any; label: string; desc: string }[];
  topIcon: any;
  // Tailwind classes
  bg: string;          // page background
  accent: string;      // accent color (text)
  ringClass: string;   // logo ring
  badgeBg: string;
  quoteBg: string;
  ctaBg: string;
};

const TEMPLATES: Record<TemplateType, TemplateConfig> = {
  consultant: {
    id: "consultant",
    label: "Danışman",
    title: "DANIŞMAN AĞIMIZA",
    subtitle: "Katıldı!",
    intro: "Uzmanlık, deneyim ve vizyonuyla ekosistemimize değer katıyor.",
    quote: "Diaspora toplulukları, girişimciler ve kurumlar için uzmanlık odaklı değer üretmeye başlıyoruz.",
    topIcon: Users,
    pillars: [
      { icon: Users, label: "UZMANLIK", desc: "Doğru bilgi, doğru yönlendirme." },
      { icon: Shield, label: "GÜVEN", desc: "Güvenilir iş birlikleri, sürdürülebilir değer." },
      { icon: Network, label: "BAĞLANTI", desc: "Güçlü ağ, geniş etki alanı." },
    ],
    bg: "bg-gradient-to-b from-[#f0fbfa] via-white to-[#e6f7f5]",
    accent: "text-teal-600",
    ringClass: "ring-teal-400",
    badgeBg: "bg-teal-100 text-teal-700",
    quoteBg: "bg-teal-50",
    ctaBg: "bg-teal-500",
  },
  media: {
    id: "media",
    label: "Medya & Dijital",
    title: "MEDYA VE DİJİTAL AĞIMIZA",
    subtitle: "Katıldı!",
    intro: "İçerik, iletişim ve topluluk erişimini birlikte güçlendiriyoruz.",
    quote: "Diaspora odaklı içerik, iletişim ve dijital etkiyi birlikte büyütüyoruz.",
    topIcon: Megaphone,
    pillars: [
      { icon: Radio, label: "ERİŞİM", desc: "Daha geniş kitle, daha güçlü etki." },
      { icon: Play, label: "İÇERİK", desc: "Doğru içerik, doğru kanalda." },
      { icon: Users, label: "TOPLULUK", desc: "Bağlantı kuran, birleştiren ağ." },
      { icon: BarChart3, label: "GÖRÜNÜRLÜK", desc: "Marka ve içerik görünürlüğünü artırır." },
    ],
    bg: "bg-gradient-to-b from-[#f5f0ff] via-white to-[#ede4ff]",
    accent: "text-purple-600",
    ringClass: "ring-purple-400",
    badgeBg: "bg-purple-100 text-purple-700",
    quoteBg: "bg-purple-50",
    ctaBg: "bg-purple-500",
  },
  business: {
    id: "business",
    label: "İşletme",
    title: "İŞLETMELER AĞIMIZA",
    subtitle: "Katıldı!",
    intro: "İş birlikleri, görünürlük ve büyüme yolculuğunu birlikte güçlendiriyoruz.",
    quote: "Diaspora odaklı işletmeleri güçlü bağlantılar ve yeni fırsatlarla buluşturuyoruz.",
    topIcon: Briefcase,
    pillars: [
      { icon: Network, label: "AĞ", desc: "Doğru bağlantılar, güçlü çevre." },
      { icon: Eye, label: "GÖRÜNÜRLÜK", desc: "Hedef pazarlarda daha güçlü konum." },
      { icon: HandHeart, label: "FIRSATLAR", desc: "Yeni iş birlikleri ve erişim." },
      { icon: TrendingUp, label: "BÜYÜME", desc: "Sürdürülebilir etki ve gelişim." },
    ],
    bg: "bg-gradient-to-b from-[#fff5f0] via-white to-[#ffe8de]",
    accent: "text-orange-600",
    ringClass: "ring-orange-400",
    badgeBg: "bg-orange-100 text-orange-700",
    quoteBg: "bg-orange-50",
    ctaBg: "bg-orange-500",
  },
  association: {
    id: "association",
    label: "Dernek / STK",
    title: "DERNEKLER AĞIMIZA",
    subtitle: "Katıldı!",
    intro: "Topluluk, dayanışma ve sosyal etkiyi birlikte büyütüyoruz.",
    quote: "Diaspora derneklerini ve toplulukları aynı çatı altında buluşturuyoruz.",
    topIcon: HandHeart,
    pillars: [
      { icon: Heart, label: "DAYANIŞMA", desc: "Topluluk için güçlü duruş." },
      { icon: Users, label: "TOPLULUK", desc: "Birlikte daha güçlü bağlar." },
      { icon: Sparkles, label: "ETKİ", desc: "Anlamlı sosyal değer üretimi." },
    ],
    bg: "bg-gradient-to-b from-[#f0f7ff] via-white to-[#e0eeff]",
    accent: "text-blue-600",
    ringClass: "ring-blue-400",
    badgeBg: "bg-blue-100 text-blue-700",
    quoteBg: "bg-blue-50",
    ctaBg: "bg-blue-500",
  },
  ambassador: {
    id: "ambassador",
    label: "Şehir Elçisi",
    title: "ŞEHİR ELÇİMİZ",
    subtitle: "Aramıza Katıldı!",
    intro: "Yerel topluluk, etkinlik ve bağlantıların öncüsü olarak yanımızda.",
    quote: "Şehirlerimizi diaspora ekosistemine bağlayan elçilerimizle büyüyoruz.",
    topIcon: MapPin,
    pillars: [
      { icon: MapPin, label: "YEREL", desc: "Şehir bilgisi ve yakın temas." },
      { icon: Globe2, label: "BAĞLANTI", desc: "Diasporayı yerelde buluşturur." },
      { icon: Sparkles, label: "ÖNCÜ", desc: "Topluluğun yerel temsilcisi." },
    ],
    bg: "bg-gradient-to-b from-[#fffaf0] via-white to-[#fff1d6]",
    accent: "text-amber-600",
    ringClass: "ring-amber-400",
    badgeBg: "bg-amber-100 text-amber-700",
    quoteBg: "bg-amber-50",
    ctaBg: "bg-amber-500",
  },
};

export const ALL_TEMPLATES = Object.values(TEMPLATES);
export const getTemplate = (t: TemplateType) => TEMPLATES[t];

type Props = {
  template: TemplateType;
  recipientName: string;
  expertise?: string;
  tagline?: string;
  logoUrl?: string;
};

const PostTemplate = ({ template, recipientName, expertise, tagline, logoUrl }: Props) => {
  const cfg = TEMPLATES[template];
  const TopIcon = cfg.topIcon;

  return (
    <div
      className={`${cfg.bg} relative overflow-hidden`}
      style={{ width: 1080, height: 1350, padding: "60px 70px", fontFamily: "Inter, sans-serif" }}
    >
      {/* Header logo */}
      <div className="flex justify-center mb-6">
        <img src={logo} alt="CorteQS" style={{ width: 280, height: "auto" }} crossOrigin="anonymous" />
      </div>

      {/* Top icon badge */}
      <div className="flex justify-center mb-4">
        <div className={`w-14 h-14 rounded-full ${cfg.badgeBg} flex items-center justify-center`}>
          <TopIcon className="w-7 h-7" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-center font-extrabold text-slate-800 leading-tight" style={{ fontSize: 56, letterSpacing: "0.02em" }}>
        {cfg.title}
      </h1>
      <p className={`text-center ${cfg.accent} mb-6`} style={{ fontFamily: "'Brush Script MT', cursive", fontSize: 64, lineHeight: 1 }}>
        {cfg.subtitle}
      </p>

      {/* Intro */}
      <p className="text-center text-slate-600 mb-8 mx-auto" style={{ fontSize: 24, maxWidth: 720 }}>
        {tagline || cfg.intro}
      </p>

      {/* Recipient card */}
      <div className="flex items-center gap-6 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
        <div className={`w-32 h-32 rounded-full ring-4 ${cfg.ringClass} ring-offset-2 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0`}>
          {logoUrl ? (
            <img src={logoUrl} alt={recipientName} className="w-full h-full object-cover" crossOrigin="anonymous" />
          ) : (
            <Users className="w-14 h-14 text-slate-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-800 mb-2" style={{ fontSize: 30 }}>{recipientName}</h2>
          {expertise && (
            <>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${cfg.badgeBg}`}>UZMANLIK ALANI</div>
              <p className="text-slate-600" style={{ fontSize: 18 }}>{expertise}</p>
            </>
          )}
        </div>
      </div>

      {/* Quote */}
      <div className={`${cfg.quoteBg} rounded-2xl p-5 mb-8 flex gap-3 items-start`}>
        <div className={`w-10 h-10 rounded-full ${cfg.ctaBg} text-white flex items-center justify-center shrink-0 font-bold`}>“</div>
        <p className="text-slate-700" style={{ fontSize: 18 }}>{cfg.quote}</p>
      </div>

      {/* Pillars */}
      <div className={`grid gap-4 mb-8`} style={{ gridTemplateColumns: `repeat(${cfg.pillars.length}, minmax(0, 1fr))` }}>
        {cfg.pillars.map((p) => {
          const I = p.icon;
          return (
            <div key={p.label} className="text-center">
              <div className={`w-12 h-12 rounded-full ${cfg.badgeBg} mx-auto mb-2 flex items-center justify-center`}>
                <I className="w-6 h-6" />
              </div>
              <div className={`font-bold text-xs mb-1 ${cfg.accent}`}>{p.label}</div>
              <p className="text-slate-500 text-xs leading-snug">{p.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Footer chips */}
      <div className="flex justify-center gap-3 mb-6 text-xs text-slate-600 font-medium">
        <span className="px-3 py-2 bg-white rounded-lg border border-slate-200">CorteQS Platform</span>
        <span className="px-3 py-2 bg-white rounded-lg border border-slate-200">Microsite</span>
        <span className="px-3 py-2 bg-white rounded-lg border border-slate-200">Listings</span>
        <span className="px-3 py-2 bg-white rounded-lg border border-slate-200">Marketplace</span>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <div className={`${cfg.ctaBg} text-white px-8 py-3 rounded-full font-semibold`} style={{ fontSize: 18 }}>
          🌐 corteqs.net
        </div>
      </div>
    </div>
  );
};

export default PostTemplate;
