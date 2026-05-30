import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, MapPin, Users, Clock, Star, PlusCircle,
  Search, Ticket, Globe, Filter, ChevronLeft, ChevronRight,
  Radio
} from "lucide-react";
import MapShareButtons from "@/components/MapShareButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import CountryCitySelector from "@/components/CountryCitySelector";
import CreateEventForm from "@/components/CreateEventForm";
import { useDiaspora } from "@/contexts/DiasporaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { events, countries } from "@/data/mock";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import eventDashboardImg from "@/assets/event-dashboard.jpg";

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  country: string | null;
  city: string | null;
  location: string | null;
  price: number | null;
  max_attendees: number | null;
  cover_image: string | null;
  organizer_name: string | null;
  organizer_type?: string | null;
  featured: boolean;
}

const categoryLabels: Record<string, string> = {
  networking: "Networking",
  eğitim: "Eğitim",
  kültür: "Kültür",
  iş: "İş & Kariyer",
  sosyal: "Sosyal",
  spor: "Spor",
};

const categoryColors: Record<string, string> = {
  networking: "bg-turquoise/10 text-turquoise",
  eğitim: "bg-primary/10 text-primary",
  kültür: "bg-purple-500/10 text-purple-600",
  iş: "bg-gold/10 text-gold",
  sosyal: "bg-pink-500/10 text-pink-600",
  spor: "bg-success/10 text-success",
};

const typeLabels: Record<string, string> = {
  online: "🌐 Online",
  "yüz yüze": "📍 Yüz yüze",
  hybrid: "🔄 Hybrid",
};

const Events = () => {
  const { selectedCountry: country } = useDiaspora();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [city, setCity] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const { toast } = useToast();

  useEffect(() => { setCity("all"); }, [country]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    const { data, error } = await supabase
      .from("events")
      .select("id,title,description,category,type,event_date,start_time,end_time,country,city,location,price,max_attendees,cover_image,organizer_name,organizer_type,featured")
      .eq("status", "published")
      .order("event_date", { ascending: true });
    if (!error && data) setLiveEvents(data as LiveEvent[]);
    setLoadingEvents(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const requireAuth = (cb: () => void) => {
    if (!user) {
      toast({ title: "Giriş gerekli", description: "Etkinlik oluşturmak için lütfen giriş yapın." });
      navigate("/auth?redirect=/events");
      return;
    }
    cb();
  };

  // Demo featured cards (mock) — clearly labeled, non-clickable
  const featured = events.filter((e) => e.featured).slice(0, 3);

  // Live events from DB filtered by user selection
  const filteredLive = liveEvents.filter((e) => {
    const matchesCountry = country === "all" || e.country === country;
    const matchesCity = city === "all" || e.city === city;
    const matchesSearch = search === "" ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
    return matchesCountry && matchesCity && matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">

          {/* Tagline Hero */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-turquoise/5 to-gold/10 p-6 md:p-10 mb-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-turquoise/15 text-turquoise border-0">🎟️ Diaspora Etkinlik Merkezi</Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
                Yakında <span className="text-gradient-primary">Ülke · Şehir · Konu Bazlı</span> Tüm Diaspora Etkinlikleri Elinizin Altında
              </h1>
              <p className="text-base md:text-lg text-muted-foreground font-body mb-2">
                İnternette gruplarda etkinlikleri kaçırma dönemi bitti.
              </p>
              <p className="text-lg md:text-xl font-semibold text-foreground mb-6">
                👉 Yer ayırt — Bilet/Ödeme al — Canlı Katıl — Kendi Etkinliğini Yap
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button size="lg" className="gap-2">
                  <Ticket className="h-4 w-4" /> Yerimi Ayırt
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Search className="h-4 w-4" /> Etkinlik Keşfet
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4 max-w-2xl mx-auto">
                Diasporanda herkesin etkinliklerini takip et, kendi etkinliğini burada listele — tek bir platformdan.
              </p>
            </div>
          </section>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                <Calendar className="h-7 w-7 text-primary" /> Etkinlikler
              </h2>
              <p className="text-muted-foreground font-body mt-1">
                {loadingEvents ? "Yükleniyor..." : `${filteredLive.length} canlı etkinlik`}
              </p>
            </div>
            <div className="flex items-start gap-3 flex-wrap">
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <Button className="gap-2 h-10" onClick={() => requireAuth(() => setCreateOpen(true))}>
                  <PlusCircle className="h-4 w-4" /> Etkinlik Oluştur
                </Button>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Yeni Etkinlik Oluştur</DialogTitle>
                  </DialogHeader>
                  <CreateEventForm
                    onClose={() => setCreateOpen(false)}
                    onCreated={fetchEvents}
                  />
                </DialogContent>
              </Dialog>
              <CountryCitySelector city={city} onCityChange={setCity} />
            </div>
          </div>

          {/* Search & Category Filters — directly under title */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Etkinlik ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={categoryFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter("all")} className="text-xs">Tümü</Button>
              {Object.entries(categoryLabels).map(([k, v]) => (
                <Button key={k} variant={categoryFilter === k ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter(k)} className="text-xs">{v}</Button>
              ))}
            </div>
          </div>

          {/* 🌟 CorteQS Etkinlikleri — admin tarafından oluşturulduğunda görünür */}
          {(() => {
            const corteqsEvents = filteredLive.filter((e) => e.organizer_type === "corteqs");
            if (corteqsEvents.length === 0) return null;
            return (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-primary/15 text-primary border-primary/30 gap-1.5 px-3 py-1">
                    <Star className="h-3.5 w-3.5 fill-primary" /> Resmi
                  </Badge>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    CorteQS Etkinlikleri
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {corteqsEvents.map((evt) => (
                    <Link
                      key={evt.id}
                      to={`/events/${evt.id}`}
                      className="group rounded-2xl overflow-hidden border-2 border-primary/40 bg-card shadow-card hover:shadow-card-hover transition-all"
                    >
                      <div className="relative h-36 bg-gradient-to-br from-primary/20 via-turquoise/15 to-gold/20">
                        {evt.cover_image && (
                          <img src={evt.cover_image} alt={evt.title} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className="bg-primary text-primary-foreground border-0 font-bold gap-1">
                            <Star className="h-3 w-3 fill-current" /> CorteQS
                          </Badge>
                          {categoryLabels[evt.category] && (
                            <Badge className={`border-0 ${categoryColors[evt.category]}`}>
                              {categoryLabels[evt.category]}
                            </Badge>
                          )}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h3 className="text-lg font-bold mb-1 line-clamp-1">{evt.title}</h3>
                          <div className="flex items-center gap-3 text-xs opacity-90">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {evt.event_date}
                            </span>
                            {evt.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {evt.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground font-body line-clamp-2">{evt.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Featured Events */}
          <div className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Star className="h-5 w-5 text-gold fill-gold" /> Öne Çıkan Etkinlikler
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="text-xs"
                >
                  Kart Görünümü
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className="text-xs gap-1"
                >
                  <Calendar className="h-3.5 w-3.5" /> Takvim
                </Button>
              </div>
            </div>
            {categoryFilter === "all" && country === "all" && search === "" && (
              <>
                <p className="text-xs text-muted-foreground mb-3 italic">
                  Aşağıdaki kartlar tanıtım amaçlı demo örnekleridir. Gerçek etkinlikler dashboard'lardan oluşturulduğunda canlı listede yer alır.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map((evt) => (
                    <div
                      key={evt.id}
                      className="group relative rounded-2xl overflow-hidden border border-border shadow-card opacity-90 cursor-default"
                      aria-label="Demo etkinlik kartı"
                    >
                      <div className="relative h-32 md:h-36">
                        <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className="bg-destructive text-destructive-foreground border-0 font-bold">DEMO</Badge>
                          <Badge className={`border-0 ${categoryColors[evt.category]}`}>{categoryLabels[evt.category]}</Badge>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-lg font-bold text-white mb-1">{evt.title}</h3>
                          <div className="flex items-center gap-3 text-white/80 text-sm">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {evt.date}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {evt.time}</span>
                            <span>{typeLabels[evt.type]}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-card">
                        <p className="text-sm text-muted-foreground font-body line-clamp-2 mb-3">{evt.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{evt.attendees}/{evt.maxAttendees} katılımcı</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {evt.price === 0 ? (
                              <Badge variant="outline" className="text-success border-success/30">Ücretsiz</Badge>
                            ) : (
                              <Badge variant="outline">€{evt.price}</Badge>
                            )}
                            <Button size="sm" disabled variant="outline">Demo</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Topluluğun İçin Etkinlik Düzenle */}
          <section className="mb-12 rounded-3xl border border-border bg-card overflow-hidden shadow-card">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-6 md:p-10 flex flex-col justify-center">
                <Badge className="mb-3 w-fit bg-gold/15 text-gold border-0">📣 Topluluk Liderleri İçin</Badge>
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight mb-3">
                  Topluluğun İçin <span className="text-gradient-primary">Etkinlik Düzenle</span>
                </h2>
                <p className="text-muted-foreground font-body mb-4">
                  Dashboard'undan tüm davetli sistemini, bilet satışını ve sosyal medya erişimini tek yerden yönet.
                  Diasporandaki herkese ulaş, etkinliğini burada listele.
                </p>
                <ul className="space-y-2 text-sm text-foreground mb-6">
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-turquoise" /> Davetli ve katılımcı yönetimi</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-turquoise" /> Bilet satışı ve gelir takibi</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-turquoise" /> Sosyal medya erişim ve paylaşım araçları</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-turquoise" /> Şehir ve ülke bazlı hedefli duyuru</li>
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="gap-2" onClick={() => requireAuth(() => setCreateOpen(true))}>
                    <PlusCircle className="h-4 w-4" /> Etkinlik Oluştur
                  </Button>
                  <Link to="/profile">
                    <Button size="lg" variant="outline" className="gap-2">
                      Dashboard'a Git
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative bg-gradient-to-br from-primary/10 via-turquoise/10 to-gold/10 p-6 md:p-10 flex items-center justify-center">
                <img
                  src={eventDashboardImg}
                  alt="Etkinlik yönetim dashboard önizleme"
                  width={1280}
                  height={896}
                  loading="lazy"
                  className="w-full h-auto rounded-xl shadow-card-hover border border-border"
                />
              </div>
            </div>
          </section>

          {/* 🔴 Şu an Canlı (gerçek etkinlikler için yer tutucu) */}
          {categoryFilter === "all" && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                </span>
                Şu an Canlı
              </h2>
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
                <Radio className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-semibold mb-1">Şu an canlı yayında etkinlik yok</p>
                <p className="text-sm text-muted-foreground font-body mb-4">
                  Canlı etkinlikler dashboard üzerinden başlatıldığında burada görünür.
                </p>
                <Button size="sm" className="gap-2" onClick={() => requireAuth(() => setCreateOpen(true))}>
                  <PlusCircle className="h-4 w-4" /> Etkinlik Oluştur
                </Button>
              </div>
            </div>
          )}

          {/* Tüm Etkinlikler — gerçek verilerden */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Tüm Etkinlikler
            </h2>

            {loadingEvents ? (
              <div className="text-center py-12 text-muted-foreground font-body">Etkinlikler yükleniyor...</div>
            ) : filteredLive.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-semibold mb-1">Henüz yayınlanmış etkinlik yok</p>
                <p className="text-sm text-muted-foreground font-body mb-4">
                  Bu filtrelerde gerçek bir etkinlik bulunamadı. Sen de dashboard'undan ilk etkinliği oluşturabilirsin.
                </p>
                <Button size="sm" className="gap-2" onClick={() => requireAuth(() => setCreateOpen(true))}>
                  <PlusCircle className="h-4 w-4" /> Etkinlik Oluştur
                </Button>
              </div>
            ) : viewMode === "calendar" ? (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
                {filteredLive.map((evt) => (
                  <div key={evt.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/40">
                    <div className="w-16 text-center shrink-0">
                      <div className="text-2xl font-bold text-primary">
                        {new Date(evt.event_date).getDate()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(evt.event_date).toLocaleDateString("tr-TR", { month: "short" })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{evt.title}</h3>
                      <p className="text-sm text-muted-foreground font-body flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {evt.start_time?.slice(0, 5) || "—"}
                        {evt.location && ` · ${evt.location}`}
                        {evt.city && `, ${evt.city}`}
                      </p>
                    </div>
                    <Badge className={`border-0 text-xs ${categoryColors[evt.category] || ""}`}>
                      {categoryLabels[evt.category] || evt.category}
                    </Badge>
                    {(evt.price ?? 0) === 0 ? (
                      <Badge variant="outline" className="text-success border-success/30 text-xs">Ücretsiz</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">€{evt.price}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLive.map((evt) => (
                  <div
                    key={evt.id}
                    className="group bg-card rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1"
                  >
                    <div className="relative h-28 bg-muted">
                      {evt.cover_image ? (
                        <img src={evt.cover_image} alt={evt.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Calendar className="h-8 w-8" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className={`border-0 text-xs ${categoryColors[evt.category] || ""}`}>
                          {categoryLabels[evt.category] || evt.category}
                        </Badge>
                      </div>
                      {evt.featured && (
                        <Badge className="absolute top-3 right-3 bg-gold/90 text-white border-0 text-xs">⭐</Badge>
                      )}
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-bold text-foreground mb-2 line-clamp-2">{evt.title}</h3>
                      <div className="space-y-1.5 mb-3 text-sm text-muted-foreground font-body">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(evt.event_date).toLocaleDateString("tr-TR")}
                          {evt.start_time && ` · ${evt.start_time.slice(0, 5)}`}
                        </p>
                        {(evt.location || evt.city) && (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {evt.location || ""} {evt.city ? `· ${evt.city}` : ""}
                          </p>
                        )}
                      </div>
                      {evt.type !== "online" && evt.city && evt.country && (
                        <MapShareButtons
                          name={evt.title}
                          city={evt.city}
                          country={evt.country}
                          address={evt.location || ""}
                          className="mb-3"
                        />
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{typeLabels[evt.type] || evt.type}</span>
                        {(evt.price ?? 0) === 0 ? (
                          <Badge variant="outline" className="text-success border-success/30 text-xs">Ücretsiz</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">€{evt.price}</Badge>
                        )}
                      </div>
                      {evt.organizer_name && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                          <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                            {evt.organizer_name[0]?.toUpperCase()}
                          </div>
                          <span className="text-xs text-muted-foreground font-body">{evt.organizer_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Events;
