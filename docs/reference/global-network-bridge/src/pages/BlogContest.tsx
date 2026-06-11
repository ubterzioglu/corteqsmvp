import { useState } from "react";
import { Trophy, PenLine, Calendar, BarChart3, Heart, CheckCircle2, ArrowRight, Star, Clock, Award, LinkIcon, AlertTriangle, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import bloggerHero from "@/assets/blogger-contest-hero.jpg";
import mascot from "@/assets/corteqs-mascot.png";

const REFERRAL_CODE = "GGBYLA-KFGJ5V";

const contestRules = [
  "Yarışmaya tüm CorteQS platformuna kayıtlı bloggerlar katılabilir.",
  "Blog yazıları Türkçe veya İngilizce yazılabilir.",
  "Yazılar ülke, şehir, kültür veya gusto temalı olmalıdır.",
  "Her katılımcı en fazla 5 yazı ile yarışmaya katılabilir.",
  "Yazılar 19 Mayıs 2026 - 1 Ekim 2026 tarihleri arasında yayınlanmış olmalıdır.",
  "Plagiarism toleransı sıfırdır. Orijinal içerik zorunludur.",
  "Sonuçlar 31 Aralık 2026'da analitik veriler + beğeni performansına göre açıklanacaktır.",
];

const prizes = [
  { place: "1.", prize: "$1.000", icon: Trophy, color: "text-gold" },
  { place: "2.", prize: "$500", icon: Award, color: "text-muted-foreground" },
  { place: "3.", prize: "$250", icon: Star, color: "text-primary" },
  { place: "Özel", prize: "Dubai-İstanbul Uçak Bileti", icon: Plane, color: "text-turquoise" },
];

const BlogContest = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    blogUrl: "",
    country: "",
    city: "",
    postTitle: "",
    postTheme: "",
    description: "",
    socialHandles: "",
    postLink: "",
    referral: REFERRAL_CODE,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Katılımınız için teşekkür ederiz! 🎉",
      description: "Platformdaki profilinizden ve e-postalarınızdan gelişmeleri takip edin. Gönderdiğiniz linkler kontrol edildikten sonra size bildirim yapılacaktır.",
    });
    setFormData({
      name: "", email: "", phone: "", blogUrl: "", country: "", city: "",
      postTitle: "", postTheme: "", description: "", socialHandles: "", postLink: "", referral: REFERRAL_CODE,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-primary/5 to-turquoise/10" />
          <div className="absolute top-10 right-20 w-80 h-80 bg-gold/15 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/15 border border-gold/30 mb-6">
                  <Trophy className="h-4 w-4 text-gold" />
                  <span className="text-sm font-semibold text-gold">2026 Blogger Yarışması</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
                  En İyi Diaspora<br />
                  <span className="text-gradient-primary">Blog Yazısı Yarışması</span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 font-body">
                  Diasporadaki yaşamını, kültürünü ve deneyimlerini anlatan en iyi blog yazısını yaz,
                  <span className="text-gold font-bold"> $1.000 büyük ödülü</span> kazan!
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  {prizes.map((p) => (
                    <div key={p.place} className="bg-card border border-border rounded-2xl p-4 shadow-card min-w-[120px]">
                      <p.icon className={`h-7 w-7 mb-1.5 ${p.color}`} />
                      <p className="text-base font-bold text-foreground">{p.prize}</p>
                      <p className="text-xs text-muted-foreground">{p.place} Ödül</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" /> Başvuru: 19 Mayıs - 1 Ekim 2026</span>
                  <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-turquoise" /> Analitik + Beğeni Bazlı</span>
                  <span className="flex items-center gap-1.5"><PenLine className="h-4 w-4 text-gold" /> Orijinal İçerik</span>
                </div>
              </div>

              <div className="relative">
                <img
                  src={bloggerHero}
                  alt="Diaspora blogger writing stories"
                  width={1280}
                  height={960}
                  className="rounded-3xl shadow-2xl w-full object-cover"
                />
                <img
                  src={mascot}
                  alt="CorteQS mascot"
                  loading="lazy"
                  className="absolute -bottom-6 -left-6 w-20 h-20 md:w-24 md:h-24 drop-shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Nasıl Çalışır?</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: "1", title: "Kayıt Ol", desc: "CorteQS'e blogger olarak kayıt olun ve yarışma başvurusunu yapın.", icon: PenLine },
                { step: "2", title: "Blog Yaz", desc: "Diaspora yaşamı, kültür, gusto veya şehir rehberi temalı yazılarınızı paylaşın.", icon: PenLine },
                { step: "3", title: "Paylaş & Etkileşim", desc: "Yazılarınızı paylaşın, okuyucu kitlenizi büyütün ve beğeni toplayın.", icon: Heart },
                { step: "4", title: "Kazan!", desc: "31 Aralık'ta en iyi analitik + beğeni performansını gösteren yazı 1. olacak.", icon: Trophy },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rules & Application */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-8">Katılım Şartları</h2>
                <div className="space-y-4">
                  {contestRules.map((rule, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-muted-foreground font-body">{rule}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-gold/10 border border-gold/20 rounded-2xl p-6">
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-gold" /> Değerlendirme Kriterleri
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground font-body">
                    <p>• <strong>Analitik Performans (50%)</strong>: Sayfa görüntüleme, okuma süresi, paylaşım sayısı</p>
                    <p>• <strong>Beğeni Performansı (30%)</strong>: Toplam beğeni sayısı ve etkileşim oranı</p>
                    <p>• <strong>İçerik Kalitesi (20%)</strong>: Jüri değerlendirmesi, orijinallik ve anlatım gücü</p>
                  </div>
                </div>

                <div className="mt-6 bg-muted/50 border border-border rounded-2xl p-6">
                  <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> Önemli Tarihler
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground font-body">
                    <p>📅 Başvuru Başlangıcı: <strong>19 Mayıs 2026</strong></p>
                    <p>📅 Son Başvuru / Yazı Yayınlama: <strong>1 Ekim 2026</strong></p>
                    <p>🏆 Sonuç Açıklaması: <strong>31 Aralık 2026</strong></p>
                  </div>
                </div>
              </div>

              {/* Application Form */}
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-8">Başvuru Formu</h2>
                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Ad Soyad</label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Adınız ve soyadınız" required />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Telefon</label>
                      <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+90 5xx xxx xx xx" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">E-posta</label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" required />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Blog / Website URL</label>
                    <Input type="url" value={formData.blogUrl} onChange={(e) => setFormData({ ...formData, blogUrl: e.target.value })} placeholder="https://myblog.com" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Sosyal Medya Hesapları</label>
                    <Input value={formData.socialHandles} onChange={(e) => setFormData({ ...formData, socialHandles: e.target.value })} placeholder="@instagram, @x, @medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Ülke</label>
                      <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Almanya" required />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Şehir</label>
                      <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Berlin" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Yazı Başlığı</label>
                      <Input value={formData.postTitle} onChange={(e) => setFormData({ ...formData, postTitle: e.target.value })} placeholder="Berlin'de Bir Türk Hikâyesi" required />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Tema / Kategori</label>
                      <Input value={formData.postTheme} onChange={(e) => setFormData({ ...formData, postTheme: e.target.value })} placeholder="Kültür / Gusto / Şehir Rehberi" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Kısa Açıklama</label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Yazınız hakkında kısa bilgi (2-3 cümle)" rows={3} />
                  </div>

                  {/* Yazı linki */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Yazı Linki *</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="url"
                        value={formData.postLink}
                        onChange={(e) => setFormData({ ...formData, postLink: e.target.value })}
                        placeholder="https://myblog.com/yazi  veya  Google Drive / Medium linki"
                        className="pl-9"
                        required
                      />
                    </div>
                    <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground/90 font-body">
                        Lütfen gönderdiğiniz linkin <strong>herkese açık</strong>, görüntülenebilir ve
                        indirilebilir ayarda olduğundan emin olun. Erişilemeyen linkler değerlendirmeye alınmaz.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Referans Kodu</label>
                    <Input value={formData.referral} onChange={(e) => setFormData({ ...formData, referral: e.target.value })} readOnly className="bg-muted/40 font-mono" />
                    <p className="text-[11px] text-muted-foreground mt-1">Bu kod başvurunuza otomatik olarak eklenmiştir.</p>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">📋 Başvuru ile kabul edilen şartlar:</p>
                    <p>• Yarışma kurallarını okudum ve kabul ediyorum</p>
                    <p>• Blog yazılarımın CorteQS platformunda yayınlanmasını onaylıyorum</p>
                    <p>• İçeriklerimin orijinal olduğunu beyan ederim</p>
                  </div>

                  <Button type="submit" size="lg" className="w-full gap-2 text-base">
                    Yarışmaya Başvur <ArrowRight className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BlogContest;
