import { useParams, Link } from "react-router-dom";
import { useFollow } from "@/hooks/useFollow";
import { MapPin, Users, Briefcase, Globe, Mail, Building2, Calendar, UserPlus, UserCheck, ArrowLeft, Tag, Store, Stethoscope, ExternalLink, Navigation } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { businesses } from "@/data/mock";
import { useToast } from "@/hooks/use-toast";
import { markRealCouponPurchase, markRealTransaction } from "@/lib/demoFlags";
import DemoPageBanner from "@/components/DemoPageBanner";

const offeringColors: Record<string, string> = {
  "iş ilanı": "bg-turquoise/10 text-turquoise border-turquoise/20",
  "franchise": "bg-gold/10 text-gold border-gold/20",
  "iş fırsatı": "bg-primary/10 text-primary border-primary/20",
};

const BusinessDetail = () => {
  const { id } = useParams();
  const b = businesses.find((x) => x.id === id);
  const { isFollowed: isFollowedFn, toggle } = useFollow();
  const isFollowed = b ? isFollowedFn("business", b.id) : false;
  const { toast } = useToast();

  if (!b) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center py-20">
          <p className="text-muted-foreground">İşletme bulunamadı.</p>
          <Link to="/businesses">
            <Button variant="outline" className="mt-4">İşletmelere dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  const toggleFollow = () => {
    toggle("business", b.id, b.name);
  };

  const sampleJobs = [
    { title: "Şube Müdürü", location: b.city, type: "Tam Zamanlı" },
    { title: "Pazarlama Uzmanı", location: b.city, type: "Tam Zamanlı" },
    { title: "Muhasebe Sorumlusu", location: b.city, type: "Yarı Zamanlı" },
  ];

  const freeCoupon = {
    id: 1, title: "Hoşgeldin İndirimi", code: "HOSGELDIN15", type: "percent" as const, value: 15, description: "İlk alışverişe özel %15 indirim", expires: "30 Nis 2026", businessName: b.name, free: true,
  };

  const paidCoupons = [
    { id: 2, title: "Mega İndirim Kuponu", code: "MEGA25", type: "percent" as const, value: 25, description: "Tüm ürünlerde geçerli %25 indirim", expires: "15 May 2026", businessName: b.name, price: "€4.99" },
    { id: 3, title: "VIP Özel Kupon", code: "VIP40", type: "percent" as const, value: 40, description: "Seçili ürünlerde %40 indirim", expires: "30 Haz 2026", businessName: b.name, price: "€9.99" },
  ];

  const sampleAnnouncements = [
    { id: 1, category: "indirim" as const, title: "Bahar Kampanyası Başladı!", content: "Tüm ürünlerde %20'ye varan indirimler. Online ve mağazalarımızda geçerli.", date: "05 Mar 2026", author: b.name },
    { id: 2, category: "eğitim" as const, title: "Stajyer Eğitim Programı", content: "Üniversite öğrencilerine yönelik 3 aylık ücretli staj programımız başlıyor. Son başvuru: 20 Mart.", link: b.website, date: "01 Mar 2026", author: b.name },
    ...(b.offerings.includes("franchise") ? [{
      id: 3, category: "franchise" as const, title: `${b.name} Franchise Fırsatı`, content: `${b.name} franchise ağına katılarak kendi işinizi kurun. Avrupa genelinde yeni franchise lokasyonları için başvuru kabul ediyoruz.`, link: b.website, date: "28 Şub 2026", author: b.name,
    }] : []),
    { id: 4, category: "gönüllü" as const, title: "Topluluk Etkinliği Gönüllüleri", content: "Mart ayında düzenlenecek topluluk etkinliğinde gönüllü olmak ister misiniz? Kayıt olun!", date: "25 Şub 2026", author: b.name },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <DemoPageBanner categoryLabel="İşletmeler" listingHref="/businesses" />
      </div>
      <main className="pt-8 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/businesses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> İşletmelere dön
          </Link>

          {/* Header */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-card mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-lg shrink-0">
                  {b.logo}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{b.name}</h1>
                <p className="text-muted-foreground font-body flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" /> {b.city}, {b.country}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 bg-muted/60 rounded-full px-2.5 py-1 w-fit">
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="h-3.5 w-3.5" />
                    <span className="text-sm font-semibold text-foreground">4.{Math.floor(Math.random() * 3) + 6}</span>
                    <span className="text-xs text-muted-foreground">Google Rating</span>
                  </div>
                </div>
              </div>
              <Button
                variant={isFollowed ? "default" : "outline"}
                size="sm"
                onClick={toggleFollow}
                className="gap-1.5 shrink-0"
              >
                {isFollowed ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {isFollowed ? "Takip Ediliyor" : "Takip Et"}
              </Button>
            </div>

            <p className="text-muted-foreground font-body mt-6">{b.description}</p>

            <div className="flex flex-wrap gap-2 mt-4">
              {b.offerings.map((o) => (
                <Badge key={o} variant="outline" className={`${offeringColors[o] || ""}`}>
                  {o === "iş ilanı" ? "💼 İş İlanı" : o === "franchise" ? "🏪 Franchise" : "🤝 İş Fırsatı"}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-muted rounded-xl p-4 text-center">
                <Building2 className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-semibold text-foreground">{b.sector}</p>
                <p className="text-xs text-muted-foreground">Sektör</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-semibold text-foreground">{b.employees}</p>
                <p className="text-xs text-muted-foreground">Çalışan</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-semibold text-foreground">{b.founded}</p>
                <p className="text-xs text-muted-foreground">Kuruluş Yılı</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <Briefcase className="h-5 w-5 mx-auto text-turquoise mb-1" />
                <p className="text-sm font-semibold text-turquoise">{b.openPositions}</p>
                <p className="text-xs text-muted-foreground">Açık Pozisyon</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              {b.sector === "Sağlık" && (
                <Link to={`/hospital-appointment/${b.id}`}>
                  <Button variant="default" size="sm" className="gap-1.5 bg-turquoise hover:bg-turquoise/90 text-primary-foreground">
                    <Stethoscope className="h-4 w-4" /> Randevu Al
                  </Button>
                </Link>
              )}
              <a href={b.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Globe className="h-4 w-4" /> Web Sitesi
                </Button>
              </a>
              <a href={`mailto:${b.contactEmail}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Mail className="h-4 w-4" /> İletişim
                </Button>
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ', ' + b.city + ', ' + b.country)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1.5">
                  <MapPin className="h-4 w-4" /> Konum
                </Button>
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.name + ', ' + b.city + ', ' + b.country)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Navigation className="h-4 w-4" /> Yol Tarifi
                </Button>
              </a>
            </div>
          </div>

          {/* Coupons - Split: Free + Paid */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-card mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-gold" /> İndirim Kuponları
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Free First-Timer Coupon */}
              <div className="p-5 bg-turquoise/5 border-2 border-dashed border-turquoise/30 rounded-xl flex flex-col justify-between">
                <div>
                  <Badge variant="outline" className="text-xs mb-2 border-turquoise/30 text-turquoise">🎁 Ücretsiz</Badge>
                  <h3 className="font-bold text-foreground">{freeCoupon.title}</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1">{freeCoupon.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">Son: {freeCoupon.expires}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="bg-card rounded-lg px-4 py-2 border border-border">
                    <code className="text-sm font-bold text-turquoise tracking-wider">{freeCoupon.code}</code>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1 bg-turquoise hover:bg-turquoise/90 text-primary-foreground"
                    onClick={() => {
                      markRealCouponPurchase();
                      toast({ title: "Kupon eklendi 🎁", description: `${freeCoupon.title} kuponlarınıza eklendi.` });
                    }}
                  >
                    <Tag className="h-3.5 w-3.5" /> Kuponu Al
                  </Button>
                </div>
              </div>

              {/* Paid Coupons */}
              {paidCoupons.map(c => (
                <div key={c.id} className="p-5 bg-gold/5 border-2 border-dashed border-gold/20 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs border-gold/30 text-gold">💰 Satın Al</Badge>
                      <span className="text-lg font-bold text-gold">{c.price}</span>
                    </div>
                    <h3 className="font-bold text-foreground">{c.title}</h3>
                    <p className="text-sm text-muted-foreground font-body mt-1">{c.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">Son: {c.expires}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="bg-card rounded-lg px-4 py-2 border border-border">
                      <code className="text-sm font-bold text-primary tracking-wider">{c.code}</code>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1 bg-gold hover:bg-gold/90 text-primary-foreground"
                      onClick={() => {
                        markRealCouponPurchase();
                        markRealTransaction();
                        toast({ title: "Satın alındı ✅", description: `${c.title} — Stripe işlemi kaydedildi.` });
                      }}
                    >
                      <Tag className="h-3.5 w-3.5" /> Satın Al
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Listings */}
          {b.offerings.includes("iş ilanı") && (
            <div className="bg-card rounded-2xl p-8 border border-border shadow-card mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-turquoise" /> Açık Pozisyonlar
              </h2>
              <div className="space-y-3">
                {sampleJobs.map((job, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                    <div>
                      <h3 className="font-semibold text-foreground">{job.title}</h3>
                      <p className="text-sm text-muted-foreground font-body">{job.location} · {job.type}</p>
                    </div>
                    <Button size="sm">Başvur</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Franchise Detail */}
          {b.offerings.includes("franchise") && (
            <div className="bg-gradient-to-r from-gold/10 to-gold/5 rounded-2xl p-8 border border-gold/20 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Store className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">🏪 Franchise Fırsatı</h2>
                  <p className="text-sm text-muted-foreground">Kendi işinizin patronu olun</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-card/60 rounded-xl p-4 border border-gold/10">
                  <p className="text-sm font-semibold text-foreground mb-1">Yatırım Bedeli</p>
                  <p className="text-lg font-bold text-gold">€25.000 - €75.000</p>
                  <p className="text-xs text-muted-foreground">Bölgeye göre değişir</p>
                </div>
                <div className="bg-card/60 rounded-xl p-4 border border-gold/10">
                  <p className="text-sm font-semibold text-foreground mb-1">Mevcut Şube Sayısı</p>
                  <p className="text-lg font-bold text-gold">{Math.floor(b.employees / 12)}+</p>
                  <p className="text-xs text-muted-foreground">Avrupa genelinde</p>
                </div>
              </div>
              <div className="bg-card/60 rounded-xl p-4 border border-gold/10 mb-6">
                <p className="text-sm font-semibold text-foreground mb-2">Franchise Avantajları</p>
                <ul className="text-sm text-muted-foreground font-body space-y-1">
                  <li>✅ Anahtar teslim iş modeli & eğitim desteği</li>
                  <li>✅ Merkezi satın alma ve tedarik zinciri</li>
                  <li>✅ Marka bilinirliği & pazarlama desteği</li>
                  <li>✅ Bölgesel koruma garantisi</li>
                </ul>
              </div>
              <p className="text-muted-foreground font-body mb-4">
                {b.name} franchise ağına katılarak kendi işinizi kurun. Detaylı bilgi için bizimle iletişime geçin.
              </p>
              <a href={`mailto:${b.contactEmail}?subject=Franchise Başvurusu`}>
                <Button variant="default" className="gap-1.5 bg-gold hover:bg-gold/90 text-primary-foreground">
                  <Store className="h-4 w-4" /> Franchise Başvurusu Yap
                </Button>
              </a>
            </div>
          )}

          {/* Business Opportunities */}
          {b.offerings.includes("iş fırsatı") && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20 mb-8">
              <h2 className="text-xl font-bold text-foreground mb-2">🤝 İş Fırsatları & Ortaklık</h2>
              <p className="text-muted-foreground font-body mb-4">
                {b.name} ile iş birliği ve ortaklık fırsatları için iletişime geçin.
              </p>
              <a href={`mailto:${b.contactEmail}?subject=İş Fırsatı Başvurusu`}>
                <Button variant="default" className="gap-1.5">
                  <Mail className="h-4 w-4" /> İş Fırsatı Başvurusu
                </Button>
              </a>
            </div>
          )}


          {/* Announcements - max 2 */}
          {sampleAnnouncements.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {sampleAnnouncements.slice(0, 2).map(a => (
                <div key={a.id} className="border border-border rounded-xl p-5 bg-card shadow-card">
                  <Badge variant="outline" className="text-xs mb-2">
                    {a.category === "indirim" ? "🏷️ İndirim" : a.category === "eğitim" ? "🎓 Eğitim" : a.category === "franchise" ? "🏪 Franchise" : a.category === "gönüllü" ? "❤️ Gönüllü" : "📢 Kampanya"}
                  </Badge>
                  <h3 className="font-bold text-foreground mb-1">{a.title}</h3>
                  <p className="text-sm text-muted-foreground font-body line-clamp-2">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{a.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BusinessDetail;
