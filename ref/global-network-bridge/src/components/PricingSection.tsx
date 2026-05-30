import { Check, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Bireysel",
    price: "Ücretsiz",
    period: "",
    desc: "Diaspora ağına erişim",
    features: ["Danışman arama", "Dernek profilleri görüntüleme", "Etkinlik takibi", "AI Twin ön görüşme (1/yıl)"],
    cta: "Ücretsiz Başla",
    featured: false,
  },
  {
    name: "Danışman Pro",
    price: "€25",
    period: "/ay",
    desc: "Danışmanlar için tam paket",
    features: ["Sınırsız AI Twin görüşme", "Canlı görüşme (video/ses)", "WhatsApp CTA", "Sınırsız etkinlik düzenleme", "Öncelikli listeleme", "Analitik dashboard"],
    cta: "Pro'ya Geç",
    featured: true,
  },
  {
    name: "İşletme Pro",
    price: "€75",
    period: "/ay",
    desc: "İşletmeler ve kurumlar için",
    features: ["Sınırsız iş ilanı", "Sınırsız kupon oluşturma", "Kampanya yönetimi", "Franchise vitrin sayfası", "API erişimi", "Özel destek"],
    cta: "Tüm Paketleri Gör",
    featured: false,
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="paketler" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Paketler</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            İhtiyacına uygun plan seç
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto font-body">
            Bireysel kullanıcıdan kurumsal çözümlere
          </p>
        </div>

        {/* Early Bird Banner */}
        <div className="max-w-5xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-foreground">İlk 1.000 işletme için tüm fiyatlar %50 indirimli!</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? "bg-secondary text-secondary-foreground shadow-elevated scale-105 border-2 border-primary"
                  : "bg-card text-card-foreground shadow-card border border-border"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-primary text-primary-foreground text-xs font-bold rounded-full">
                  Popüler
                </div>
              )}

              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className={`text-sm mb-6 font-body ${plan.featured ? "text-secondary-foreground/70" : "text-muted-foreground"}`}>
                {plan.desc}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                {plan.period && <span className={`text-sm ${plan.featured ? "text-secondary-foreground/60" : "text-muted-foreground"}`}>{plan.period}</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2 text-sm font-body">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.featured ? "hero" : "outline"}
                className="w-full"
                size="lg"
                onClick={() => navigate("/pricing")}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
