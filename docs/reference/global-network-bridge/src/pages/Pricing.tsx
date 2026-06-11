import { useState } from "react";
import { Check, X, Zap, Crown, Building2, Users, Sparkles, Landmark, Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type UserType = "consultant" | "association" | "business";

const consultantPlans = {
  freemium: {
    name: "Freemium",
    icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: "Diaspora ağına katıl, keşfet",
    features: [
      { text: "Temel profil sayfası", included: true },
      { text: "Kategori Dizininde Listelenme", included: true },
      { text: "WhatsApp CTA butonu", included: true },
      { text: "Etkinlik düzenleme (1 adet/yıl)", included: true },
      { text: "Sınırsız etkinlik düzenleme", included: false },
      { text: "Canlı görüşme (video/ses)", included: false },
      { text: "Kampanya & pazarlama araçları", included: false },
      { text: "Öncelikli listeleme", included: false },
      { text: "Analitik dashboard", included: false },
      { text: "Sosyal medya AI içerik üretimi", included: false },
      { text: "Etkinlik bilet satışı", included: false },
      { text: "Boost paketleri erişimi", included: false },
    ],
  },
  premium: {
    name: "Premium Pro",
    icon: Crown,
    monthlyPrice: 10,
    yearlyPrice: 8,
    desc: "Tüm araçlarla büyü, öne çık",
    features: [
      { text: "Temel profil sayfası", included: true },
      { text: "Kategori Dizininde Listelenme", included: true },
      { text: "WhatsApp CTA butonu", included: true },
      { text: "Sınırsız etkinlik düzenleme", included: true },
      { text: "Canlı görüşme (video/ses)", included: true },
      { text: "3 tanıtım alanı (ürün, gayrimenkul, kampanya)", included: true },
      { text: "Kampanya & pazarlama araçları", included: true },
      { text: "Öncelikli listeleme", included: true },
      { text: "Analitik dashboard", included: true },
      { text: "Sosyal medya AI içerik üretimi", included: true },
      { text: "Etkinlik bilet satışı", included: true },
      { text: "Boost paketleri erişimi", included: true },
    ],
  },
  founding: {
    name: "Founding 1000",
    icon: Sparkles,
    monthlyPrice: 99,
    yearlyPrice: 99,
    yearlyOnly: true,
    desc: "Erken dönem üyelik — sınırlı kontenjan",
    badge: "En Popüler",
    features: [
      { text: "Premium Pro'nun tüm özellikleri", included: true },
      { text: "Tek seferlik €99 ödeme · 1 yıl geçerli", included: true },
      { text: "€399 değerinde kategori vitrini · 6 ay", included: true },
      { text: "Ana sayfa carousel görünürlüğü · 6 ay", included: true },
      { text: "Founding üye rozeti", included: true },
      { text: "Öncelikli destek", included: true },
    ],
  },
};

const associationPlans = {
  freemium: {
    name: "Freemium",
    icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: "Kuruluşunuzu tanıtın",
    features: [
      { text: "Kuruluş profil sayfası", included: true },
      { text: "Kuruluş dizininde listeleme", included: true },
      { text: "Etkinlik düzenleme (1 adet/yıl)", included: true },
      { text: "WhatsApp CTA butonu", included: true },
      { text: "Temel üye yönetimi", included: true },
      { text: "Sınırsız etkinlik düzenleme", included: false },
      { text: "Etkinlik bilet satışı", included: false },
      { text: "Aidat tahsilatı", included: false },
      { text: "Üye yönetim paneli", included: false },
      { text: "Kampanya & duyuru araçları", included: false },
      { text: "Kurumsal analitik dashboard", included: false },
      { text: "Boost & duyuru paketleri", included: false },
    ],
  },
  premium: {
    name: "Premium Pro",
    icon: Crown,
    monthlyPrice: 10,
    yearlyPrice: 8,
    desc: "Tam güçle organize olun",
    badge: "Kurumsal",
    features: [
      { text: "Kuruluş profil sayfası", included: true },
      { text: "Kuruluş dizininde listeleme", included: true },
      { text: "Sınırsız etkinlik düzenleme", included: true },
      { text: "WhatsApp CTA butonu", included: true },
      { text: "Etkinlik bilet satışı", included: true },
      { text: "Aidat tahsilatı", included: true },
      { text: "Üye yönetim paneli", included: true },
      { text: "Kampanya & duyuru araçları", included: true },
      { text: "Kurumsal analitik dashboard", included: true },
      { text: "Boost & duyuru paketleri", included: true },
    ],
  },
  founding: {
    name: "Founding 1000",
    icon: Sparkles,
    monthlyPrice: 99,
    yearlyPrice: 99,
    yearlyOnly: true,
    desc: "Erken dönem üyelik — sınırlı kontenjan",
    badge: "En Popüler",
    features: [
      { text: "Premium Pro'nun tüm özellikleri", included: true },
      { text: "Tek seferlik €99 ödeme · 1 yıl geçerli", included: true },
      { text: "€399 değerinde kategori vitrini · 6 ay", included: true },
      { text: "Ana sayfa carousel görünürlüğü · 6 ay", included: true },
      { text: "Founding üye rozeti", included: true },
      { text: "Öncelikli destek", included: true },
    ],
  },
};

const businessPlans = {
  freemium: {
    name: "Freemium",
    icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: "İşletmenizi tanıtın",
    features: [
      { text: "İşletme profil sayfası", included: true },
      { text: "İşletme dizininde listeleme", included: true },
      { text: "Etkinlik düzenleme (1 adet/yıl)", included: true },
      { text: "Temel iş ilanı (1 adet)", included: true },
      { text: "Ücretsiz kupon oluşturma (1 adet)", included: true },
      { text: "Sınırsız iş ilanı", included: false },
      { text: "Sınırsız etkinlik düzenleme", included: false },
      { text: "Sınırsız kupon oluşturma", included: false },
      { text: "Premium & Spotlight ilanlar", included: false },
      { text: "Franchise vitrin sayfası", included: false },
      { text: "Kupon yönetim paneli", included: false },
      { text: "Kampanya yönetimi", included: false },
      { text: "Kurumsal analitik dashboard", included: false },
      { text: "API erişimi", included: false },
      { text: "Boost & duyuru paketleri", included: false },
      { text: "Özel destek hattı", included: false },
    ],
  },
  premium: {
    name: "Premium Pro",
    icon: Crown,
    monthlyPrice: 10,
    yearlyPrice: 8,
    desc: "Tam güçle büyüyün",
    badge: "İşletme",
    features: [
      { text: "İşletme profil sayfası", included: true },
      { text: "İşletme dizininde listeleme", included: true },
      { text: "Sınırsız etkinlik düzenleme", included: true },
      { text: "Sınırsız iş ilanı", included: true },
      { text: "Sınırsız kupon oluşturma", included: true },
      { text: "Premium & Spotlight ilanlar", included: true },
      { text: "Franchise vitrin sayfası", included: true },
      { text: "Kupon yönetim paneli", included: true },
      { text: "Kampanya yönetimi", included: true },
      { text: "Kurumsal analitik dashboard", included: true },
      { text: "API erişimi", included: true },
      { text: "Boost & duyuru paketleri", included: true },
      { text: "Özel destek hattı", included: true },
    ],
  },
  founding: {
    name: "Founding 1000",
    icon: Sparkles,
    monthlyPrice: 99,
    yearlyPrice: 99,
    yearlyOnly: true,
    desc: "Erken dönem üyelik — sınırlı kontenjan",
    badge: "En Popüler",
    features: [
      { text: "Premium Pro'nun tüm özellikleri", included: true },
      { text: "Tek seferlik €99 ödeme · 1 yıl geçerli", included: true },
      { text: "€399 değerinde kategori vitrini · 6 ay", included: true },
      { text: "Ana sayfa carousel görünürlüğü · 6 ay", included: true },
      { text: "Founding üye rozeti", included: true },
      { text: "Öncelikli destek", included: true },
    ],
  },
};

const Pricing = () => {
  const [userType, setUserType] = useState<UserType>("consultant");
  const [isYearly, setIsYearly] = useState(false);

  const plans = userType === "consultant" 
    ? consultantPlans 
    : userType === "association" 
      ? associationPlans 
      : businessPlans;
  const yearlyDiscount = 20;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              <Sparkles className="h-3 w-3 mr-1" /> Abonelik Paketleri
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
              İhtiyacına uygun planı seç
            </h1>
            <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">
              Freemium ile başla, Premium ile fark yarat
            </p>
          </div>

          {/* User Type Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-muted rounded-xl p-1 gap-1">
              <button
                onClick={() => setUserType("consultant")}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  userType === "consultant"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Danışmanlar
              </button>
              <button
                onClick={() => setUserType("association")}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  userType === "association"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Landmark className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Kuruluşlar
              </button>
              <button
                onClick={() => setUserType("business")}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  userType === "business"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                İşletmeler
              </button>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Aylık
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Yıllık
            </span>
            {isYearly && (
              <Badge className="bg-success/15 text-success border-success/20 ml-1">
                %{yearlyDiscount} indirim
              </Badge>
            )}
          </div>

          {/* Plans Grid */}
          <div className={`grid grid-cols-1 ${("founding" in plans) ? "md:grid-cols-3" : "md:grid-cols-2"} gap-5 max-w-5xl mx-auto items-stretch`}>
            <PlanCard plan={plans.freemium} isYearly={isYearly} featured={false} />
            {"founding" in plans && (
              <PlanCard plan={(plans as any).founding} isYearly={isYearly} featured={true} />
            )}
            <PlanCard plan={plans.premium} isYearly={isYearly} featured={false} />
          </div>

          {/* FAQ hint */}
          <p className="text-center text-sm text-muted-foreground mt-12 font-body">
            Bireysel kullanıcılar için platform tamamen <span className="font-semibold text-foreground">ücretsizdir</span>.{" "}
            Sorularınız mı var?{" "}
            <a href="mailto:info@diasporaconnect.com" className="text-primary hover:underline font-semibold">
              Bize yazın
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

interface PlanCardProps {
  plan: {
    name: string;
    icon: React.ElementType;
    monthlyPrice: number;
    yearlyPrice: number;
    yearlyOnly?: boolean;
    desc: string;
    badge?: string;
    features: { text: string; included: boolean }[];
  };
  isYearly: boolean;
  featured: boolean;
}

const PlanCard = ({ plan, isYearly, featured }: PlanCardProps) => {
  const Icon = plan.icon;
  const yearlyOnly = plan.yearlyOnly;
  const price = yearlyOnly ? plan.yearlyPrice : (isYearly ? plan.yearlyPrice : plan.monthlyPrice);
  const isFree = price === 0;

  return (
    <div
      className={`relative rounded-lg p-5 transition-all duration-300 hover:-translate-y-0.5 flex flex-col ${
        featured
          ? "bg-secondary text-secondary-foreground shadow-elevated border-2 border-primary"
          : "bg-card text-card-foreground shadow-card border border-border"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-primary text-primary-foreground text-[11px] font-bold rounded-md whitespace-nowrap">
          {plan.badge}
        </div>
      )}

      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${
          featured ? "bg-primary/20" : "bg-muted"
        }`}>
          <Icon className={`h-4.5 w-4.5 ${featured ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <h3 className="text-lg font-bold">{plan.name}</h3>
      </div>

      <p className={`text-xs mb-4 font-body ${featured ? "text-secondary-foreground/70" : "text-muted-foreground"}`}>
        {plan.desc}
      </p>

      <div className="mb-4">
        {isFree ? (
          <span className="text-3xl font-extrabold">Ücretsiz</span>
        ) : yearlyOnly ? (
          <>
            <span className="text-3xl font-extrabold">€{price}</span>
            <span className={`text-xs ${featured ? "text-secondary-foreground/60" : "text-muted-foreground"}`}>
              /yıl
            </span>
            <p className={`text-[11px] mt-0.5 ${featured ? "text-secondary-foreground/50" : "text-muted-foreground"}`}>
              Tek seferlik ödeme · 1 yıl geçerli
            </p>
          </>
        ) : (
          <>
            <span className="text-3xl font-extrabold">€{price}</span>
            <span className={`text-xs ${featured ? "text-secondary-foreground/60" : "text-muted-foreground"}`}>
              /ay
            </span>
            {isYearly && (
              <p className={`text-[11px] mt-0.5 ${featured ? "text-secondary-foreground/50" : "text-muted-foreground"}`}>
                Yıllık · €{price * 12}/yıl
              </p>
            )}
          </>
        )}
      </div>

      {yearlyOnly && (
        <div className="mb-3 px-2.5 py-2 rounded-md bg-primary/15 border border-primary/30">
          <p className="text-[11px] font-bold text-primary leading-snug">
            Founding 1000 için 1 yıllık süre 29 Ekim 2027'den itibaren başlayacaktır.
          </p>
        </div>
      )}

      <ul className="space-y-2 mb-5 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className={`flex items-start gap-2 text-xs font-body ${
            !f.included ? (featured ? "text-secondary-foreground/30" : "text-muted-foreground/50") : ""
          }`}>
            {f.included ? (
              <Check className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <X className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0 mt-0.5" />
            )}
            {f.text}
          </li>
        ))}
      </ul>

      <Button
        variant={featured ? "hero" : "outline"}
        className="w-full"
        size="default"
      >
        {isFree ? "Ücretsiz Başla" : yearlyOnly ? "Şimdi Satın Al" : "Premium'a Geç"}
      </Button>
    </div>
  );
};

export default Pricing;
