import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Star, PenLine, Video, Instagram, Users, Handshake, Eye,
  Megaphone, Globe2, Bot, Phone, Briefcase, Database, Sparkles, BookOpen, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import DemoBadge from "@/components/DemoBadge";
import InterestForm from "@/components/InterestForm";
import { bloggers } from "@/data/mock";

type MediaFilter = "all" | "blogger" | "influencer" | "youtuber";

const Bloggers = () => {
  const [filter, setFilter] = useState<MediaFilter>("all");

  const demoBlogger = bloggers.find((b) => b.type === "blogger");
  const demoVlogger = bloggers.find((b) => b.type === "influencer");
  const demoYoutuber = bloggers.find((b) => b.type === "youtuber");
  const baseDemo = [demoBlogger, demoVlogger, demoYoutuber].filter(Boolean) as typeof bloggers;

  const visible = useMemo(() => {
    if (filter === "all") return baseDemo;
    return bloggers.filter((b) => b.type === filter);
  }, [filter, baseDemo]);

  const demoList = visible;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">

          {/* Hero */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-turquoise/5 to-gold/10 p-6 md:p-10 mb-8 text-center">
            <Badge className="mb-4 bg-turquoise/15 text-turquoise border-0">🎬 Blogger · Vlogger · YouTuber Programı</Badge>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
              Global Türklerin Hikayelerini <span className="text-gradient-primary">Gelin Birlikte Oluşturalım</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-body max-w-3xl mx-auto mb-4">
              Yazılı içerik üreten <strong>blogger</strong>'lar, sosyal medya <strong>vlogger</strong>'ları ve diaspora <strong>YouTuber</strong>'ları — hepsi aynı çatı altında. CorteQS Diaspora Kütüphanesinde yerinizi alın; markaların kolayca ulaştığı, taleplerinin AI ile eşleştirildiği bir sistemin parçası olun.
            </p>
            <Badge className="bg-success/15 text-success border-0 text-sm px-3 py-1">
              <Gift className="h-3.5 w-3.5 mr-1.5" /> Blogger, Vlogger ve YouTuber kayıtlarımız tamamen ücretsizdir
            </Badge>
          </section>

          {/* Info strip (replaces Founders banner) */}
          <div className="rounded-2xl border border-turquoise/30 bg-gradient-to-br from-turquoise/5 via-card to-orange-50/40 p-5 md:p-6 mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-turquoise" />
              <h2 className="text-lg md:text-xl font-bold">CorteQS Diaspora Kütüphanesi</h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Aşağıda gördüğünüz kartlar örnek (DEMO) içeriklerdir. Gerçek profiller başvurular değerlendirildikçe yayına alınacaktır.
            </p>
          </div>

          <h2 className="text-xl font-bold mb-4 flex items-center justify-center gap-2 text-center">
            <Sparkles className="h-5 w-5 text-turquoise" /> Demo İçerik Üreticiler
          </h2>

          {/* Kategori Filtresi */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {([
              { key: "all", label: "Tümü", icon: Sparkles },
              { key: "blogger", label: "Blogger", icon: PenLine },
              { key: "influencer", label: "Vlogger", icon: Video },
              { key: "youtuber", label: "YouTuber", icon: Video },
            ] as { key: MediaFilter; label: string; icon: typeof Sparkles }[]).map((f) => {
              const active = filter === f.key;
              return (
                <Button
                  key={f.key}
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => setFilter(f.key)}
                  className="text-xs gap-1.5"
                >
                  <f.icon className="h-3.5 w-3.5" />
                  {f.label}
                </Button>
              );
            })}
          </div>

          {/* 3 Demo Cards — centered: 1 Blogger + 1 Vlogger + 1 YouTuber */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto items-stretch">
            {demoList.map((b) => (
              <Link
                to={`/blogger/${b.id}`}
                key={b.id}
                className="group relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border flex flex-col h-full"
              >
                <DemoBadge />
                <div className="flex items-center gap-3 mb-4">
                  <img src={b.photo} alt={b.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground truncate">{b.name}</h3>
                    <Badge variant={b.type === "blogger" ? "secondary" : "default"} className="text-[10px] mt-0.5">
                      {b.type === "youtuber" ? "YouTuber" : b.type === "influencer" ? "Vlogger" : "Blogger"}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground font-body mb-2">📍 {b.city}, {b.country}</p>
                <p className="text-sm text-muted-foreground font-body mb-3">🌍 {b.region}</p>

                <div className="flex items-center gap-3 mb-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-gold fill-gold" />
                    <span className="font-semibold">{b.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{(b.followers / 1000).toFixed(0)}K</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4 min-h-[24px]">
                  {b.specialties.slice(0, 2).map((s) => (
                    <span key={s} className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{s}</span>
                  ))}
                </div>

                {/* Sabit yükseklikli ad-collab slot — kartların eşit hizalanması için */}
                <div className="mb-4 min-h-[36px]">
                  {b.adCollaboration && (
                    <div className="flex items-center gap-1.5 bg-gold/10 text-gold rounded-lg px-3 py-1.5 text-xs font-semibold">
                      <Handshake className="h-3.5 w-3.5" />
                      Reklam İşbirliği Açık
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 min-h-[18px]">
                  {b.blogPosts.length > 0 && (
                    <span className="flex items-center gap-1">
                      <PenLine className="h-3 w-3" /> {b.blogPosts.length} Blog
                    </span>
                  )}
                  {b.vlogs.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Video className="h-3 w-3" /> {b.vlogs.length} Vlog
                    </span>
                  )}
                  {b.instagram && (
                    <span className="flex items-center gap-1">
                      <Instagram className="h-3 w-3" /> {b.instagram}
                    </span>
                  )}
                </div>

                <Button variant="default" size="sm" className="w-full gap-1 text-xs mt-auto">
                  <Eye className="h-3 w-3" /> Profili Gör
                </Button>
              </Link>
            ))}
          </div>

          {/* Value Proposition Grid — compact (≥50% smaller) */}
          <section className="mb-12">
            <h2 className="text-xl md:text-2xl font-extrabold mb-1 text-center">
              CorteQS Blogger & Vlogger <span className="text-gradient-primary">Avantajları</span>
            </h2>
            <p className="text-sm text-muted-foreground font-body mb-5 max-w-2xl mx-auto text-center">
              Sadece bir yayıncı değil, global bir topluluk lideri ol.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
              {[
                { icon: Megaphone, title: "Sponsor & Marka Talepleri", desc: "AI eşleştirmeli marka talepleri tek panelde.", color: "text-gold bg-gold/10 border-gold/20" },
                { icon: Globe2, title: "Global Görünürlük", desc: "Ülke-şehir-konu bazlı keşfedilebilirlik.", color: "text-turquoise bg-turquoise/10 border-turquoise/20" },
                { icon: Users, title: "Topluluk Liderleri", desc: "Ortak etkinlikler ve networking.", color: "text-primary bg-primary/10 border-primary/20" },
                { icon: Bot, title: "AI Clone 7/24", desc: "Hayran kitlenle sürekli temas.", color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
                { icon: Phone, title: "Ücretli Görüşme", desc: "Canlı & Clone 1:1 dakika ücreti.", color: "text-success bg-success/10 border-success/20" },
                { icon: Briefcase, title: "BOS Sistemi", desc: "Sözleşme, fatura, takvim, gelir.", color: "text-pink-600 bg-pink-500/10 border-pink-500/20" },
                { icon: Database, title: "Data Evreni", desc: "Diaspora trend & insight raporları.", color: "text-orange-600 bg-orange-500/10 border-orange-500/20" },
                { icon: Handshake, title: "Cross-Promo", desc: "Diğer üreticilerle ortak büyüme.", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-3 hover:shadow-card-hover transition-all"
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center mb-2 border ${f.color}`}>
                    <f.icon className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="font-semibold text-xs mb-0.5 leading-tight">{f.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-body leading-snug">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA strip */}
          <section className="rounded-3xl bg-gradient-to-r from-primary/15 via-turquoise/10 to-gold/15 border border-border p-6 md:p-10 mb-12 text-center">
            <h3 className="text-2xl md:text-3xl font-extrabold mb-2">
              Diaspora Arşivlerine Girin — Kütüphanemizi Birlikte Oluşturalım
            </h3>
            <p className="text-muted-foreground font-body mb-3 max-w-2xl mx-auto">
              Ürettiğiniz yazılar, vloglar ve YouTube videoları diaspora kültürünün bir parçası olsun. Blogger, Vlogger ve YouTuber kayıtlarımızdan ve panellerimizden ücret alınmaz.
            </p>
            <Badge className="bg-success/15 text-success border-0 mb-5">
              <Gift className="h-3.5 w-3.5 mr-1.5" /> Kayıt tamamen ücretsizdir
            </Badge>
            <div>
              <a href="#kayit-form">
                <Button size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" /> Hemen Ücretsiz Başvur
                </Button>
              </a>
            </div>
          </section>

          {/* Inline Form */}
          <div className="mt-10 max-w-2xl mx-auto" id="kayit-form">
            <InterestForm
              modal={false}
              context="genel"
              defaultCategory="blogger"
              title="Blogger / Vlogger / YouTuber Olarak Ücretsiz Kayıt Ol"
              description="Yazı, vlog, YouTube kanalı — hangi formatta üretiyor olursanız olun başvurabilirsiniz. Sunum / CV / One-Pager / kanal istatistikleri vb. tüm dökümanlarınızı yükleyebilirsiniz. Kayıtlarımız tamamen ücretsizdir."
              source="bloggers-listing"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Bloggers;
