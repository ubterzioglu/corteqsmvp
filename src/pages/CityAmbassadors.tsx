import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Globe, MapPin, Users, TrendingUp, Megaphone, Calendar,
  ArrowRight, Star, CheckCircle, Rocket, DollarSign,
  Network, Award, Handshake, Target, Clock, Send
} from "lucide-react";
import ConsentCheckboxes, { emptyConsent, isConsentValid, type ConsentState } from "@/components/ConsentCheckboxes";

const priorityCities: Record<string, string[]> = {
  "🇩🇪 Almanya": ["Berlin", "Köln", "Frankfurt"],
  "🇬🇧 İngiltere": ["Londra"],
  "🇺🇸 ABD": ["New York", "Los Angeles", "Washington DC"],
  "🇦🇺 Avustralya": ["Melbourne", "Sydney"],
  "🇦🇪 BAE": ["Dubai"],
  "🇫🇷 Fransa": ["Paris"],
  "🇦🇹 Avusturya": ["Viyana", "Salzburg"],
  "🇯🇵 Japonya": ["Tokyo"],
  "🇰🇿 Kazakistan": ["Almatı"],
  "🇧🇷 Güney Amerika": ["São Paulo", "Buenos Aires", "Santiago"],
};

const responsibilities = [
  { icon: Users, title: "Yerel Ağ Oluşturma", desc: "Kullanıcı, danışman ve işletmelerin platforma katılımını sağla" },
  { icon: Megaphone, title: "Topluluk Yönetimi", desc: "WhatsApp grupları, etkinlikler ve onboarding süreçlerini yönet" },
  { icon: Rocket, title: "Platform Aktivasyonu", desc: "İlk işlemleri ve platform kullanımını aktif hale getir" },
  { icon: Calendar, title: "Etkinlik Organizasyonu", desc: "Yerel buluşmalar ve networking etkinlikleri düzenle" },
  { icon: Target, title: "Strateji & Raporlama", desc: "Yerel içgörüleri ve gelişmeleri merkeze raporla" },
  { icon: Network, title: "İşbirlikleri Kurma", desc: "Yerel iş ortaklıkları ve sponsorluklar geliştir" },
];

const benefits = [
  { icon: DollarSign, title: "Gelir Paylaşımı", desc: "Platform aktivitesinden komisyon geliri" },
  { icon: Handshake, title: "Yerel İş Ortaklıkları", desc: "İşletme ve kurumlarla doğrudan bağlantı" },
  { icon: Award, title: "Kişisel Marka", desc: "Şehrinde tanınırlık ve liderlik pozisyonu" },
  { icon: Globe, title: "Global Ağ", desc: "Merkez ve diğer elçilerle sürekli destek" },
];

const CityAmbassadors = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", city: "", country: "",
    reach_count: "", reach_description: "", organized_events: "",
    known_professionals: "", first_week_plan: "", weekly_hours: "", motivation: "",
  });
  const [consent, setConsent] = useState<ConsentState>(emptyConsent);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Giriş yapmalısınız", description: "Başvuru için lütfen giriş yapın.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (!form.full_name || !form.email || !form.phone || !form.city || !form.country) {
      toast({ title: "Eksik bilgi", description: "Lütfen zorunlu alanları doldurun.", variant: "destructive" });
      return;
    }
    if (!isConsentValid(consent)) {
      toast({ title: "Onay gerekli", description: "KVKK / GDPR / CCPA onaylarını işaretleyin.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("city_ambassador_applications" as any).insert({
        user_id: user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        country: form.country,
        reach_count: form.reach_count ? parseInt(form.reach_count) : null,
        reach_description: form.reach_description || null,
        organized_events: form.organized_events || null,
        known_professionals: form.known_professionals || null,
        first_week_plan: form.first_week_plan || null,
        weekly_hours: form.weekly_hours || null,
        motivation: form.motivation || null,
      } as any);
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "Başvurunuz alındı! 🎉", description: "En kısa sürede sizinle iletişime geçeceğiz." });
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-turquoise/5 to-background" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?w=1920&q=30')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/15 border border-gold/30 mb-6">
            <Star className="h-4 w-4 text-gold" />
            <span className="text-sm font-semibold text-gold">Şehir Elçisi Programı</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
            Şehrindeki Türk Global Ağını<br />
            <span className="text-gradient-primary">Sen Şekillendir</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 font-body">
            CorteQS Şehir Elçisi Programı'nı dünyanın önde gelen şehirlerinde başlatıyoruz.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8 font-body">
            Güçlü bir yerel ağın varsa, insanları bir araya getirmeyi seviyorsan ve şehrinde etki ve gelir oluşturmak istiyorsan — bu senin fırsatın.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {["Berlin", "Londra", "Dubai", "New York", "Paris", "Tokyo"].map(city => (
              <span key={city} className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground shadow-sm flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {city}
              </span>
            ))}
          </div>
          <a href="#basvuru">
            <Button size="lg" className="text-base px-8 py-6 bg-gold hover:bg-gold/90 text-primary-foreground shadow-lg">
              Şehir Elçisi Başvurusu Yap <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-4 font-body">
            Öncelikli şehirler belirlendi, ancak tüm şehirlerden başvuru kabul ediyoruz.
          </p>
        </div>
      </section>

      {/* VISUAL STORYTELLING */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-turquoise/20 aspect-video flex items-center justify-center border border-border">
              <div className="text-center p-8">
                <Globe className="h-16 w-16 text-primary mx-auto mb-4 opacity-60" />
                <p className="text-sm text-muted-foreground font-body">Video içerik yakında eklenecek</p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-foreground mb-4">
                Şehrinin Ağ Merkezini <span className="text-gradient-primary">Sen Kur</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-4 font-body">
                Bu bir gönüllülük rolü değil.
              </p>
              <p className="text-muted-foreground font-body leading-relaxed">
                Bu, şehrindeki merkez düğüm olma fırsatın — insanların bağlandığı, işletmelerin büyüdüğü ve fırsatların senden geçtiği bir pozisyon. Kendi topluluğunu yönet, etkinlikler düzenle ve platform gelirinden pay al.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RESPONSIBILITIES */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-foreground mb-3">
              Şehir Elçisi Olarak <span className="text-gradient-primary">Görevlerin</span>
            </h2>
            <p className="text-muted-foreground font-body">Şehrindeki CorteQS ekosisteminin lideri sen olacaksın</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {responsibilities.map((r, i) => (
              <Card key={i} className="border-border hover:shadow-card-hover transition-all hover:-translate-y-1">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <r.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{r.title}</h3>
                    <p className="text-sm text-muted-foreground font-body">{r.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-foreground mb-3">
              Kazanımların <span className="text-gradient-primary">& Avantajların</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {benefits.map((b, i) => (
              <Card key={i} className="border-border text-center hover:shadow-card-hover transition-all">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-2xl bg-gold/15 flex items-center justify-center mx-auto mb-4">
                    <b.icon className="h-7 w-7 text-gold" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold/10 border border-gold/30">
              <TrendingUp className="h-5 w-5 text-gold" />
              <span className="font-bold text-foreground">Kazanç tavanı yok — büyümen gelirini belirler</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRIORITY CITIES */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-foreground mb-3">
              Öncelikli <span className="text-gradient-primary">Şehirler</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {Object.entries(priorityCities).map(([country, cities]) => (
              <Card key={country} className="border-border">
                <CardContent className="p-4">
                  <p className="font-bold text-foreground text-sm mb-2">{country}</p>
                  <div className="space-y-1">
                    {cities.map(c => (
                      <p key={c} className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-primary shrink-0" /> {c}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8 font-body">
            Dünya genelindeki tüm şehirlerden başvuru kabul ediyoruz.
          </p>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section id="basvuru" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-foreground mb-3">
              Hemen <span className="text-gradient-primary">Başvur</span>
            </h2>
            <p className="text-muted-foreground font-body">Elçilik yolculuğuna ilk adımını at</p>
          </div>

          {submitted ? (
            <Card className="border-border">
              <CardContent className="p-10 text-center">
                <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Başvurunuz Alındı!</h3>
                <p className="text-muted-foreground font-body">
                  Ekibimiz başvurunuzu inceleyecek ve en kısa sürede sizinle iletişime geçecektir.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Ad Soyad *</label>
                      <Input name="full_name" value={form.full_name} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">E-posta *</label>
                      <Input name="email" type="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Telefon (WhatsApp) *</label>
                      <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+49..." required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Şehir *</label>
                      <Input name="city" value={form.city} onChange={handleChange} required />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Ülke *</label>
                      <Input name="country" value={form.country} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="border-t border-border pt-5 space-y-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2"><Star className="h-4 w-4 text-gold" /> Sorular</h3>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Doğrudan kaç kişiye ulaşabilirsiniz?</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input name="reach_count" type="number" value={form.reach_count} onChange={handleChange} placeholder="Sayı" />
                        <div className="sm:col-span-2">
                          <Input name="reach_description" value={form.reach_description} onChange={handleChange} placeholder="Açıklama (ör: arkadaş çevresi, iş ağı...)" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Son 3 ayda etkinlik düzenlediniz mi?</label>
                      <Textarea name="organized_events" value={form.organized_events} onChange={handleChange} rows={2} placeholder="Evet ise detay verin..." />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Kişisel olarak tanıdığınız 3-5 danışman veya profesyonel</label>
                      <Textarea name="known_professionals" value={form.known_professionals} onChange={handleChange} rows={2} placeholder="İsim ve uzmanlık alanı..." />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">İlk 7 gününüzde ne yaparsınız?</label>
                      <Textarea name="first_week_plan" value={form.first_week_plan} onChange={handleChange} rows={3} />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Haftada kaç saat ayırabilirsiniz?</label>
                      <Input name="weekly_hours" value={form.weekly_hours} onChange={handleChange} placeholder="Ör: 10-15 saat" />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Bu rol sizin için neden önemli?</label>
                      <Textarea name="motivation" value={form.motivation} onChange={handleChange} rows={3} />
                    </div>
                  </div>

                  <ConsentCheckboxes value={consent} onChange={setConsent} />

                  <Button type="submit" size="lg" className="w-full bg-gold hover:bg-gold/90 text-primary-foreground gap-2" disabled={loading || !isConsentValid(consent)}>
                    {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {loading ? "Gönderiliyor..." : "Elçilik Yolculuğuma Başla"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default CityAmbassadors;
