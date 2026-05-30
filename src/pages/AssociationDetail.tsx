import { useFollow } from "@/hooks/useFollow";
import { useParams, Link } from "react-router-dom";
import { Users, MapPin, Calendar as CalendarIcon, Globe as GlobeIcon, ArrowLeft, ExternalLink, MessageSquare, Share2, UserPlus, UserCheck, Heart, CreditCard, Ticket, Music, Radio, Landmark, Clock, FileText, Stethoscope, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { associations } from "@/data/mock";
import { useToast } from "@/hooks/use-toast";
import DemoPageBanner from "@/components/DemoPageBanner";

const AssociationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const assoc = associations.find((a) => a.id === id);
  const { isFollowed, toggle } = useFollow();
  const isFollowing = assoc ? isFollowed("association", assoc.id) : false;

  if (!assoc) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center py-20">
          <h1 className="text-2xl font-bold text-foreground mb-4">Kuruluş bulunamadı</h1>
          <Link to="/associations" className="text-primary hover:underline">← Kuruluşlara dön</Link>
        </div>
      </div>
    );
  }

  const toggleFollow = () => {
    toggle("association", assoc.id, assoc.name);
  };

  const sampleAnnouncements = [
    { id: 1, category: "eğitim" as const, title: "Türkçe Dil Kursu Kayıtları Açıldı", content: "Yetişkinler için A1-B2 seviye Türkçe kurslarımıza kayıt olabilirsiniz. Kurslar Mart ayında başlıyor.", link: assoc.website, date: "03 Mar 2026", author: assoc.name },
    { id: 2, category: "gönüllü" as const, title: "Gönüllü Arayışı — Bahar Festivali", content: "23 Nisan etkinliğimizde gönüllü olarak yer almak ister misiniz? Organizasyon, sahne ve ikram ekiplerine ihtiyacımız var.", date: "01 Mar 2026", author: assoc.name },
    { id: 3, category: "kampanya" as const, title: "Burs Fonu Kampanyası", content: "Diaspora gençlerine yönelik burs fonumuza destek olun. Hedefimiz 50 öğrenciye eğitim bursu sağlamak.", image: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400&h=200&fit=crop", date: "25 Şub 2026", author: assoc.name },
    { id: 4, category: "indirim" as const, title: "Üyelere Özel Etkinlik İndirimi", content: "Dernek üyelerine tüm etkinliklerde %20 indirim. Üyelik kartınızı göstermeniz yeterli.", date: "20 Şub 2026", author: assoc.name },
  ];

  const isDiplomatic = ["Büyükelçilik", "Konsolosluk"].includes(assoc.type);
  const isHospital = assoc.type === "Hastane";

  const consulateServices = [
    { title: "Pasaport İşlemleri", desc: "Yeni pasaport, yenileme ve kayıp pasaport", icon: FileText },
    { title: "Nüfus İşlemleri", desc: "Doğum, evlilik, vefat ve adres kaydı", icon: Users },
    { title: "Noter / Tasdik", desc: "Belge onayı, vekâletname ve apostil", icon: FileText },
    { title: "Askerlik İşlemleri", desc: "Tecil, dövizle askerlik ve bilgi", icon: Landmark },
    { title: "Vize Başvuruları", desc: "Türkiye vizesi ve konsolosluk onayı", icon: GlobeIcon },
    { title: "Seçim / Oy Kullanma", desc: "Yurtdışı seçmen kaydı ve bilgi", icon: CalendarIcon },
  ];

  const consulateEvents = [
    { title: "29 Ekim Cumhuriyet Bayramı Resepsiyonu", date: "29 Eki 2026", type: "Resmi Davet" },
    { title: "23 Nisan Çocuk Bayramı Kutlaması", date: "23 Nis 2026", type: "Etkinlik" },
    { title: "Konsolosluk Günleri - Gezici Hizmet", date: "15 Mar 2026", type: "Hizmet" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <DemoPageBanner categoryLabel="Kuruluşlar" listingHref="/associations" />
      </div>
      <main className="pt-8 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/associations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Kuruluşlara dön
          </Link>

          {/* Header */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-2xl md:text-3xl shrink-0">
                {assoc.logo}
              </div>
              <div className="flex-1 min-w-0">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                  {assoc.type}
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{assoc.name}</h1>
                  <Button
                    variant={isFollowing ? "secondary" : "outline"}
                    size="sm"
                    className="gap-1"
                    onClick={toggleFollow}
                  >
                    {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                    {isFollowing ? "Takipte" : "Takip Et"}
                  </Button>
                </div>
                <p className="text-muted-foreground font-body mt-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {assoc.city}, {assoc.country}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 bg-muted/60 rounded-full px-2.5 py-1 w-fit">
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="h-3.5 w-3.5" />
                  <span className="text-sm font-semibold text-foreground">4.{Math.floor(Math.random() * 3) + 5}</span>
                  <span className="text-xs text-muted-foreground">Google Rating</span>
                </div>
                <div className="flex items-center gap-6 mt-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{assoc.members.toLocaleString()}</span>
                    <span className="text-muted-foreground">üye</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{assoc.events}</span>
                    <span className="text-muted-foreground">etkinlik</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Kuruluş: {assoc.founded}</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                {isHospital ? (
                  <>
                    <Link to={`/hospital-appointment/${assoc.id}`}>
                      <Button variant="default" className="gap-2 w-full bg-turquoise hover:bg-turquoise/90 text-primary-foreground">
                        <Stethoscope className="h-4 w-4" /> Randevu Al
                      </Button>
                    </Link>
                    <a href={assoc.website} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="gap-2 w-full">
                        <GlobeIcon className="h-4 w-4" /> Web Sitesi
                      </Button>
                    </a>
                    <Button variant="outline" className="gap-2 w-full">
                      <MessageSquare className="h-4 w-4" /> İletişim
                    </Button>
                  </>
                ) : isDiplomatic ? (
                  <>
                    <Button variant="default" className="gap-2 w-full">
                      <CalendarIcon className="h-4 w-4" /> Randevu Al
                    </Button>
                    <Button variant="outline" className="gap-2 w-full">
                      <FileText className="h-4 w-4" /> E-Konsolosluk
                    </Button>
                    <Button variant="outline" className="gap-2 w-full">
                      <MessageSquare className="h-4 w-4" /> İletişim
                    </Button>
                  </>
                ) : (
                  <>
                    {assoc.type === "Radyo" && (
                      <Link to={`/radio/${assoc.id}/song-request`}>
                        <Button variant="default" className="gap-2 w-full bg-purple-600 hover:bg-purple-700">
                          <Music className="h-4 w-4" /> İstek Parça Gönder
                        </Button>
                      </Link>
                    )}
                    <Button variant={assoc.type === "Radyo" ? "outline" : "default"} className="gap-2 w-full">
                      <Users className="h-4 w-4" /> {assoc.type === "Radyo" ? "Dinle" : "Üye Ol"}
                    </Button>
                    {assoc.type !== "Radyo" && assoc.type !== "TV Kanalı" && (
                      <>
                        <Button variant="outline" className="gap-2 w-full">
                          <CreditCard className="h-4 w-4" /> Aidat Öde
                        </Button>
                        <Button variant="outline" className="gap-2 w-full">
                          <Heart className="h-4 w-4" /> Bağış Yap
                        </Button>
                      </>
                    )}
                    <Button variant="outline" className="gap-2 w-full">
                      <MessageSquare className="h-4 w-4" /> Mesaj Gönder
                    </Button>
                  </>
                )}
                <Button variant="outline" className="gap-2 w-full">
                  <Share2 className="h-4 w-4" /> Paylaş
                </Button>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(assoc.name + ', ' + assoc.city + ', ' + assoc.country)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2 w-full">
                    <MapPin className="h-4 w-4" /> Konum
                  </Button>
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(assoc.name + ', ' + assoc.city + ', ' + assoc.country)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2 w-full">
                    <Navigation className="h-4 w-4" /> Yol Tarifi
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto">
              <TabsTrigger value="about">Hakkında</TabsTrigger>
              <TabsTrigger value="events">Etkinlikler</TabsTrigger>
              <TabsTrigger value="members">Üyeler</TabsTrigger>
              <TabsTrigger value="contact">İletişim</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6 space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-4">Hakkında</h2>
                <p className="text-muted-foreground font-body leading-relaxed">{assoc.description}</p>
              </div>

              {/* Hospital departments & appointment */}
              {isHospital && (
                <div className="bg-gradient-to-r from-turquoise/10 to-turquoise/5 rounded-2xl border border-turquoise/20 p-6 shadow-card">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-turquoise" /> Bölümler & Randevu
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {[
                      { name: "Kardiyoloji", icon: "❤️" },
                      { name: "Dahiliye", icon: "🩺" },
                      { name: "Ortopedi", icon: "🦴" },
                      { name: "Göz Hastalıkları", icon: "👁️" },
                      { name: "Diş Hekimliği", icon: "🦷" },
                      { name: "Genel Cerrahi", icon: "🏥" },
                    ].map((dept, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-card/60 border border-turquoise/10 hover:bg-card transition-colors">
                        <span className="text-2xl">{dept.icon}</span>
                        <p className="font-semibold text-foreground text-sm">{dept.name}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-card/60 rounded-xl p-4 border border-turquoise/10 mb-4">
                    <p className="text-sm text-muted-foreground font-body">
                      🗣️ Türkçe konuşan personel · 💳 Komisyon: €12-€25 · ⏰ Online randevu sistemi
                    </p>
                  </div>
                  <Link to={`/hospital-appointment/${assoc.id}`}>
                    <Button className="gap-2 bg-turquoise hover:bg-turquoise/90 text-primary-foreground">
                      <Stethoscope className="h-4 w-4" /> Online Randevu Al
                    </Button>
                  </Link>
                </div>
              )}


              {isDiplomatic && (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-primary" /> Konsolosluk Hizmetleri
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {consulateServices.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <s.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-4 gap-2">
                    <CalendarIcon className="h-4 w-4" /> Online Randevu Al
                  </Button>
                </div>
              )}

              {/* Consulate events */}
              {isDiplomatic && (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gold" /> Etkinlikler & Duyurular
                  </h2>
                  <div className="space-y-3">
                    {consulateEvents.map((e, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                        <div className="text-center shrink-0 w-14">
                          <div className="text-xl font-bold text-primary">{e.date.split(" ")[0]}</div>
                          <div className="text-xs text-muted-foreground">{e.date.split(" ")[1]}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{e.title}</h3>
                          <Badge variant="outline" className="text-xs mt-1">{e.type}</Badge>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0 gap-1">
                          <CalendarIcon className="h-3 w-3" /> Katıl
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline announcements - max 2 (non-diplomatic) */}
              {!isDiplomatic && sampleAnnouncements.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sampleAnnouncements.slice(0, 2).map(a => (
                    <div key={a.id} className="border border-border rounded-xl p-5 bg-card shadow-card">
                      <Badge variant="outline" className="text-xs mb-2">
                        {a.category === "indirim" ? "🏷️ İndirim" : a.category === "eğitim" ? "🎓 Eğitim" : a.category === "gönüllü" ? "❤️ Gönüllü" : "📢 Kampanya"}
                      </Badge>
                      <h3 className="font-bold text-foreground mb-1">{a.title}</h3>
                      <p className="text-sm text-muted-foreground font-body line-clamp-2">{a.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{a.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="events" className="mt-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-4">Yaklaşan Etkinlikler</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="text-center shrink-0">
                      <div className="text-2xl font-bold text-primary">08</div>
                      <div className="text-xs text-muted-foreground">Mar</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">Networking Akşam Yemeği</h3>
                      <p className="text-sm text-muted-foreground font-body">{assoc.city} · 19:00</p>
                    </div>
                    <Button variant="default" size="sm" className="shrink-0 gap-1">
                      <Ticket className="h-3 w-3" /> Bilet Al
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-gold/5 border border-gold/20">
                    <div className="text-center shrink-0">
                      <div className="text-2xl font-bold text-gold">15</div>
                      <div className="text-xs text-muted-foreground">Mar</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">Burs ve Bağış Yemeği</h3>
                        <span className="text-[10px] bg-gold/10 text-gold rounded-full px-2 py-0.5 font-semibold">Hayırseverlik</span>
                      </div>
                      <p className="text-sm text-muted-foreground font-body">{assoc.city} · 18:30 · Gala etkinliği — Gelirler burs fonuna aktarılır</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="default" size="sm" className="gap-1">
                        <Ticket className="h-3 w-3" /> Bilet Al
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 border-gold/30 text-gold hover:bg-gold/10">
                        <Heart className="h-3 w-3" /> Bağış Yap
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="text-center shrink-0">
                      <div className="text-2xl font-bold text-primary">20</div>
                      <div className="text-xs text-muted-foreground">Mar</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">Kültür & Sanat Festivali</h3>
                      <p className="text-sm text-muted-foreground font-body">{assoc.city} · Tüm gün</p>
                    </div>
                    <Button variant="default" size="sm" className="shrink-0 gap-1">
                      <Ticket className="h-3 w-3" /> Bilet Al
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="text-center shrink-0">
                      <div className="text-2xl font-bold text-primary">05</div>
                      <div className="text-xs text-muted-foreground">Nis</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">Girişimcilik Paneli</h3>
                      <p className="text-sm text-muted-foreground font-body">Online · 18:00 CET</p>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0">Katıl</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-4">Üyeler</h2>
                <p className="text-muted-foreground font-body">
                  {assoc.members.toLocaleString()} aktif üye ile {assoc.country}'daki en büyük Türk topluluklarından biri.
                </p>
                <Button variant="default" className="mt-4 gap-2">
                  <Users className="h-4 w-4" /> Üye Ol
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="mt-6 space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-4">İletişim</h2>
                <a
                  href={assoc.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <GlobeIcon className="h-5 w-5 text-primary" />
                  <span className="text-foreground font-body">{assoc.website}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </a>
              </div>

            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AssociationDetail;
