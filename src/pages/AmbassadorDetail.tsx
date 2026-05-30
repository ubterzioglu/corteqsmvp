import { useParams, Link } from "react-router-dom";
import { Star, MapPin, MessageCircle, Users, Calendar, Target, ArrowLeft, Video, Instagram, Linkedin, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { cityAmbassadors } from "@/data/mock";

const AmbassadorDetail = () => {
  const { id } = useParams();
  const ambassador = cityAmbassadors.find((a) => a.id === id);

  if (!ambassador) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <p className="text-muted-foreground">Elçi bulunamadı.</p>
          <Link to="/consultants" className="text-primary underline mt-4 inline-block">Danışmanlara dön</Link>
        </div>
      </div>
    );
  }

  const mockEvents = [
    { title: `${ambassador.city} Networking Buluşması`, date: "15 Nisan 2026", attendees: 45, status: "upcoming" },
    { title: `${ambassador.city} Türk Girişimciler`, date: "28 Mart 2026", attendees: 32, status: "completed" },
    { title: "CorteQS Tanıtım Etkinliği", date: "10 Mart 2026", attendees: 67, status: "completed" },
  ];

  const mockOnboardedUsers = [
    { name: "Ahmet Y.", type: "Bireysel", date: "27 Mar" },
    { name: "Selin K.", type: "Danışman", date: "25 Mar" },
    { name: "Oğuz T.", type: "İşletme", date: "22 Mar" },
    { name: "Deniz A.", type: "Bireysel", date: "20 Mar" },
    { name: "Fatma B.", type: "V/Blogger", date: "18 Mar" },
  ];

  const mockSocialAccounts = [
    { platform: "Instagram", icon: Instagram, handle: "@berlinelcisi", url: "https://instagram.com" },
    { platform: "LinkedIn", icon: Linkedin, handle: "linkedin.com/in/berlinelcisi", url: "https://linkedin.com" },
    { platform: "YouTube", icon: Youtube, handle: "Berlin Diaspora Hub", url: "https://youtube.com" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/consultants" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Danışmanlara Dön
          </Link>

          {/* Hero */}
          <div className="bg-card rounded-2xl border border-gold/30 p-8 shadow-card mb-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <img src={ambassador.photo} alt={ambassador.name} className="w-24 h-24 rounded-2xl object-cover" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">{ambassador.name}</h1>
                  <Badge className="bg-gold/15 text-gold border-gold/30">🏅 Şehir Elçisi</Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="h-4 w-4" /> {ambassador.city}, {ambassador.country}
                </p>
                <p className="text-sm text-muted-foreground font-body mb-4">{ambassador.bio}</p>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-4 w-4 text-gold fill-gold" />
                  <span className="font-bold">{ambassador.rating}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ambassador.specialties.map((s) => (
                    <span key={s} className="text-xs bg-gold/10 text-gold rounded-full px-2.5 py-1">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                <Button asChild className="bg-gold hover:bg-gold/90 text-primary-foreground gap-1.5">
                  <a href="https://wa.me/491234567890" target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" /> WhatsApp'la Görüş
                  </a>
                </Button>
                <Button asChild variant="outline" className="gap-1.5">
                  <a href="https://meet.google.com" target="_blank" rel="noreferrer">
                    <Video className="h-4 w-4" /> Canlı Görüş
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Social media */}
          <Card className="border-border mb-8">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" /> Sosyal Hesaplar
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {mockSocialAccounts.map((account) => (
                  <a
                    key={account.platform}
                    href={account.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-border bg-muted/40 p-4 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <account.icon className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">{account.platform}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{account.handle}</p>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* KPI Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="border-border">
              <CardContent className="p-5 text-center">
                <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{ambassador.usersOnboarded}</p>
                <p className="text-xs text-muted-foreground">Onboard Edilen Kullanıcı</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-5 text-center">
                <Calendar className="h-6 w-6 text-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{ambassador.eventsOrganized}</p>
                <p className="text-xs text-muted-foreground">Düzenlenen Etkinlik</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-5 text-center">
                <Target className="h-6 w-6 text-turquoise mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{ambassador.activeAdvisors}</p>
                <p className="text-xs text-muted-foreground">Aktif Danışman</p>
              </CardContent>
            </Card>
          </div>

          {/* Events */}
          <Card className="border-border mb-8">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" /> Etkinlikler
              </h3>
              <div className="space-y-3">
                {mockEvents.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{ev.date} · {ev.attendees} katılımcı</p>
                    </div>
                    <Badge variant={ev.status === "upcoming" ? "default" : "secondary"}>
                      {ev.status === "upcoming" ? "Yaklaşan" : "Tamamlandı"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Other ambassadors in this country */}
          {(() => {
            const otherAmbassadors = cityAmbassadors.filter(
              (a) => a.country === ambassador.country && a.id !== ambassador.id
            );
            if (otherAmbassadors.length === 0) return null;
            return (
              <Card className="border-gold/20 mb-8">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gold" /> {ambassador.country} — Diğer Şehir/Bölge Elçileri
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {otherAmbassadors.map((a) => (
                      <Link
                        key={a.id}
                        to={`/ambassador/${a.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <img src={a.photo} alt={a.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{a.name}</p>
                          <p className="text-xs text-muted-foreground">📍 {a.city}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                          <Star className="h-3 w-3 text-gold fill-gold" />
                          <span className="text-xs font-medium">{a.rating}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Recent onboarded users */}
          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Son Onboard Edilen Kullanıcılar
              </h3>
              <div className="space-y-2">
                {mockOnboardedUsers.map((u, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{u.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AmbassadorDetail;
