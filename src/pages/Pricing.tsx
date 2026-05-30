import { useState } from "react";
import { Check, X, Zap, Crown, Building2, Users, Sparkles, Landmark, Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";

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
      { text: "Danışman dizininde listeleme", included: true },
      { text: "WhatsApp CTA butonu", included: true },
      { text: "AI Twin ön görüşme (1 adet/yıl)", included: true },
      { text: "Etkinlik düzenleme (1 adet/yıl)", included: true },
      { text: "Sınırsız AI Twin görüşme", included: false },
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
    monthlyPrice: 25,
    yearlyPrice: 20,
    desc: "Tüm araçlarla büyü, öne çık",
    badge: "En Popüler",
    features: [
      { text: "Temel profil sayfası", included: true },
      { text: "Danışman dizininde listeleme", included: true },
      { text: "WhatsApp CTA butonu", included: true },
      { text: "Sınırsız AI Twin görüşme", included: true },
      { text: "Sınırsız etkinlik düzenleme", included: true },
      { text: "Canlı görüşme (video/ses)", included: true },
      { text: "AI Twin / Canlı seans satışı ile gelir", included: true },
      { text: "3 tanıtım alanı (ürün, gayrimenkul, kampanya)", included: true },
      { text: "Kampanya & pazarlama araçları", included: true },
      { text: "Öncelikli listeleme", included: true },
      { text: "Analitik dashboard", included: true },
      { text: "Sosyal medya AI içerik üretimi", included: true },
      { text: "Etkinlik bilet satışı", included: true },
      { text: "Boost paketleri erişimi", included: true },
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
    name: "Kuruluş Pro",
    icon: Crown,
    monthlyPrice: 50,
    yearlyPrice: 40,
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
    name: "İşletme Pro",
    icon: Crown,
    monthlyPrice: 75,
    yearlyPrice: 60,
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

          {/* Early Bird Banner - Business */}
          {(userType === "business" || userType === "consultant" || userType === "association") && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="space-y-3">
                {/* Early Bird %50 Discount Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Flame className="h-5 w-5 text-primary" />
                    <span className="text-lg font-extrabold text-foreground">
                      {userType === "business" 
                        ? "İlk 1.000 İşletme İçin %50 İndirim!" 
                        : userType === "consultant" 
                          ? "İlk 1.000 Danışman İçin %50 İndirim!" 
                          : "İlk 1.000 Kuruluş İçin %50 İndirim!"}
                    </span>
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground font-body">
                    3 ay süreyle Premium Pro fiyatlarda %50 indirim — erken kayıt avantajından yararlanın.
                  </p>
                </div>

                {/* Free Trial Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="h-5 w-5 text-emerald-600" />
                    <span className="text-base font-bold text-foreground">1 Ay Ücretsiz Premium Pro Deneme!</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Herkese açık — kredi kartı gerekmez, dilediğiniz zaman iptal edin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PlanCard plan={plans.freemium} isYearly={isYearly} featured={false} />
            <PlanCard plan={plans.premium} isYearly={isYearly} featured={true} />
          </div>

          {/* FAQ hint */}
          <p className="text-center text-sm text-muted-foreground mt-12 font-body">
            Bireysel kullanıcılar için platform tamamen <span className="font-semibold text-foreground">ücretsizdir</span>.{" "}
            Sorularınız mı var?{" "}
            <a href="mailto:info@corteqs.net" className="text-primary hover:underline font-semibold">
              Bize yazın
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

interface PlanCardProps {
  plan: {
    name: string;
    icon: React.ElementType;
    monthlyPrice: number;
    yearlyPrice: number;
    desc: string;
    badge?: string;
    features: { text: string; included: boolean }[];
  };
  isYearly: boolean;
  featured: boolean;
}

const PlanCard = ({ plan, isYearly, featured }: PlanCardProps) => {
  const Icon = plan.icon;
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const isFree = price === 0;

  return (
    <div
      className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 flex flex-col ${
        featured
          ? "bg-secondary text-secondary-foreground shadow-elevated border-2 border-primary scale-[1.02]"
          : "bg-card text-card-foreground shadow-card border border-border"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-primary text-primary-foreground text-xs font-bold rounded-full whitespace-nowrap">
          {plan.badge}
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          featured ? "bg-primary/20" : "bg-muted"
        }`}>
          <Icon className={`h-5 w-5 ${featured ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <h3 className="text-xl font-bold">{plan.name}</h3>
      </div>

      <p className={`text-sm mb-6 font-body ${featured ? "text-secondary-foreground/70" : "text-muted-foreground"}`}>
        {plan.desc}
      </p>

      <div className="mb-6">
        {isFree ? (
          <span className="text-4xl font-extrabold">Ücretsiz</span>
        ) : (
          <>
            <span className="text-4xl font-extrabold">€{price}</span>
            <span className={`text-sm ${featured ? "text-secondary-foreground/60" : "text-muted-foreground"}`}>
              /ay
            </span>
            {isYearly && (
              <p className={`text-xs mt-1 ${featured ? "text-secondary-foreground/50" : "text-muted-foreground"}`}>
                Yıllık faturalandırma · €{price * 12}/yıl
              </p>
            )}
          </>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className={`flex items-center gap-2.5 text-sm font-body ${
            !f.included ? (featured ? "text-secondary-foreground/30" : "text-muted-foreground/50") : ""
          }`}>
            {f.included ? (
              <Check className="h-4 w-4 text-success flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
            )}
            {f.text}
          </li>
        ))}
      </ul>

      <Button
        variant={featured ? "hero" : "outline"}
        className="w-full"
        size="lg"
      >
        {isFree ? "Ücretsiz Başla" : "1 Ay Ücretsiz Dene"}
      </Button>
    </div>
  );
};

export default Pricing;
