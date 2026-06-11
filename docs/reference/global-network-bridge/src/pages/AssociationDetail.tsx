import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, Link, useNavigate } from "react-router-dom";
import PlatformMessageButton from "@/components/messaging/PlatformMessageButton";
import { Users, MapPin, Calendar as CalendarIcon, Globe as GlobeIcon, ArrowLeft, ExternalLink, MessageSquare, Share2, UserPlus, UserCheck, Heart, CreditCard, Ticket, Music, Radio, Landmark, Clock, FileText, Stethoscope, Navigation, Mail, Phone, Instagram, Facebook, Award, Target, Briefcase, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { associations } from "@/data/mock";
import { useToast } from "@/hooks/use-toast";
import DemoPageBanner from "@/components/DemoPageBanner";
import DetailAuthLock from "@/components/DetailAuthLock";
import DemoTabPlaceholder from "@/components/DemoTabPlaceholder";
import PublicEventsList from "@/components/PublicEventsList";
import { loadAssociationProfile } from "@/components/profiles/AssociationSettingsForm";

const AssociationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const assoc = associations.find((a) => a.id === id);
  const { isFollowed, toggle } = useFollow();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFollowing = assoc ? isFollowed("association", assoc.id) : false;
  const savedProfile = loadAssociationProfile();
  const matchesSaved = !!assoc && !!savedProfile.name &&
    savedProfile.name.trim().toLowerCase() === assoc.name.trim().toLowerCase();
  const customMission = matchesSaved ? savedProfile.mission?.trim() : "";
  const customVision = matchesSaved ? savedProfile.vision?.trim() : "";
  const customActivities = matchesSaved ? savedProfile.activityAreas?.trim() : "";
  const customBoard = matchesSaved && savedProfile.boardMembers?.length
    ? savedProfile.boardMembers.filter((m) => m.name?.trim() || m.role?.trim())
    : [];

  if (!assoc) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center py-20">
          <h1 className="text-2xl font-bold text-foreground mb-4">Kuruluş bulunamadı</h1>
          <Link to="/associations" className="text-primary hover:underline">← Kuruluşlara dön</Link>
        </div>
        <Footer />
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
      <main className="pt-24 pb-16">
        <DemoPageBanner categoryLabel="Kuruluşlar" listingHref="/associations" />
        <div className="container mx-auto px-4">
          <Link to="/associations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Kuruluşlara dön
          </Link>
          <DetailAuthLock category="kuruluş" />

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
                  <PlatformMessageButton
                    recipientKind="association"
                    recipientSlug={assoc.id}
                    recipientName={assoc.name}
                    size="sm"
                  />
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
                {!user ? (
                  <Button variant="default" className="gap-2 w-full" onClick={() => navigate("/auth")}>
                    <Lock className="h-4 w-4" /> Etkileşim için Giriş Yap
                  </Button>
                ) : isHospital ? (
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
                {user && (
                  <>
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
                  </>
                )}
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

            <TabsContent value="about" className="mt-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2"><FileText className="h-5 w-5 text-turquoise" /> Kuruluş Hakkında</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {assoc.name}, {assoc.founded} yılında {assoc.city} merkezli olarak kurulmuş, {assoc.country} genelinde diaspora topluluğuna hizmet veren bir {assoc.type.toLowerCase()}dir. Kültürel, sosyal ve eğitim faaliyetleriyle topluluğumuzu bir araya getirir.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2"><Target className="h-4 w-4 text-turquoise mt-0.5" /><div><div className="font-semibold">Misyon</div><div className="text-muted-foreground">{customMission || "Diaspora kimliğini güçlendirmek, üyeler arası dayanışmayı artırmak."}</div></div></div>
                    <div className="flex items-start gap-2"><Award className="h-4 w-4 text-turquoise mt-0.5" /><div><div className="font-semibold">Vizyon</div><div className="text-muted-foreground">{customVision || "Bölgenin en aktif ve referans alınan kuruluşu olmak."}</div></div></div>
                    <div className="flex items-start gap-2"><Briefcase className="h-4 w-4 text-turquoise mt-0.5" /><div><div className="font-semibold">Faaliyet Alanları</div><div className="text-muted-foreground">{customActivities || "Eğitim, kültür-sanat, sosyal yardım, gençlik programları."}</div></div></div>
                    <div className="flex items-start gap-2"><CalendarIcon className="h-4 w-4 text-turquoise mt-0.5" /><div><div className="font-semibold">Kuruluş Yılı</div><div className="text-muted-foreground">{assoc.founded}</div></div></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-bold mb-3">Yönetim Kurulu</h3>
                  <ul className="space-y-3 text-sm">
                    {(customBoard.length > 0 ? customBoard : [
                      { name: "Mehmet Yıldız", role: "Başkan" },
                      { name: "Ayşe Demir", role: "Başkan Yardımcısı" },
                      { name: "Ali Kaya", role: "Genel Sekreter" },
                      { name: "Zeynep Aksoy", role: "Sayman" },
                    ]).map((m, idx) => (
                      <li key={`${m.name}-${idx}`} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-turquoise/10 border border-turquoise/20 flex items-center justify-center text-xs font-bold text-turquoise">{(m.name || "?").split(" ").map(p=>p[0]).filter(Boolean).slice(0,2).join("")}</div>
                        <div><div className="font-semibold">{m.name || "—"}</div><div className="text-xs text-muted-foreground">{m.role || "—"}</div></div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-6">
              <PublicEventsList emptyLabel="Bu kuruluşun yaklaşan etkinliği yok." />
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-bold flex items-center gap-2"><Users className="h-5 w-5 text-turquoise" /> Üye İstatistikleri</h3>
                  <Badge variant="secondary">{assoc.members.toLocaleString()} kayıtlı üye</Badge>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 mb-6">
                  <div className="rounded-xl border border-border p-4 text-center"><div className="text-2xl font-extrabold text-turquoise">68%</div><div className="text-xs text-muted-foreground">Aktif Üye</div></div>
                  <div className="rounded-xl border border-border p-4 text-center"><div className="text-2xl font-extrabold text-turquoise">240+</div><div className="text-xs text-muted-foreground">Bu yıl yeni üye</div></div>
                  <div className="rounded-xl border border-border p-4 text-center"><div className="text-2xl font-extrabold text-turquoise">12</div><div className="text-xs text-muted-foreground">Aktif çalışma grubu</div></div>
                </div>
                <h4 className="font-semibold mb-3 text-sm">Çalışma Grupları</h4>
                <div className="flex flex-wrap gap-2">
                  {["Gençlik", "Kadın", "Eğitim", "Kültür-Sanat", "Spor", "Sosyal Yardım", "İş Geliştirme", "Hukuk Danışma"].map((g) => (
                    <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <h3 className="font-bold mb-2">İletişim Bilgileri</h3>
                  <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-turquoise" /> <a href={`mailto:info@${assoc.id}.org`} className="hover:underline">info@{assoc.id}.org</a></div>
                  <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-turquoise" /> +49 30 555 0{Math.abs(assoc.id.length * 137) % 1000}</div>
                  <div className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-turquoise" /> {assoc.city}, {assoc.country}</div>
                  <div className="flex items-center gap-3 text-sm"><Clock className="h-4 w-4 text-turquoise" /> Pzt–Cum 09:00–18:00</div>
                  {assoc.website && (
                    <div className="flex items-center gap-3 text-sm"><GlobeIcon className="h-4 w-4 text-turquoise" /> <a href={assoc.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{assoc.website.replace(/^https?:\/\//, "")}</a></div>
                  )}
                </div>
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-bold mb-3">Sosyal Medya</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button variant="outline" size="sm" className="gap-2"><Instagram className="h-4 w-4" /> @{assoc.id}</Button>
                    <Button variant="outline" size="sm" className="gap-2"><Facebook className="h-4 w-4" /> {assoc.name.split(" ")[0]}</Button>
                  </div>
                  <h3 className="font-bold mb-3 mt-4">Hızlı İletişim</h3>
                  <Button className="w-full gap-2 bg-turquoise hover:bg-turquoise/90"><MessageSquare className="h-4 w-4" /> Mesaj Gönder</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AssociationDetail;
