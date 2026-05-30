import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EventManagePanel from "@/components/EventManagePanel";
import CreateEventForm from "@/components/CreateEventForm";
import CorBotPromoBanner from "@/components/CorBotPromoBanner";
import EmptyDashboardState from "@/components/EmptyDashboardState";
import AppointmentManagePanel from "@/components/booking/AppointmentManagePanel";
import CategoryPerformance from "@/components/booking/CategoryPerformance";
import { Lock } from "lucide-react";
import {
  User, MapPin, Globe, Star, Calendar, Users, Clock, Eye,
  TrendingUp, Settings, BarChart3, CreditCard, Plus, ChevronRight, Crown,
  Video, Bot, Edit3, MessageSquare, ArrowLeft, Award, Heart, Home,
  Phone, Mail, CheckCircle, Briefcase, BookOpen, Megaphone, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessagesInbox from "@/components/messaging/MessagesInbox";
import MyFollowsSection from "@/components/profiles/MyFollowsSection";
import { ProfileSetupBanner, useProfileGate } from "@/components/profiles/ProfileSetupBanner";
import JobListingsManager from "@/components/JobListingsManager";
import { Inbox as InboxIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ConsultantServiceRequests from "@/components/ConsultantServiceRequests";
import ConsultantCategoryManager from "@/components/ConsultantCategoryManager";
import WhatsAppGroupsTab from "@/components/profiles/WhatsAppGroupsTab";
import MapAddressBanner from "@/components/MapAddressBanner";
import NotificationsTabTrigger from "@/components/NotificationsTabTrigger";
import MyOpenCafesAsEvents from "@/components/profiles/MyOpenCafesAsEvents";
import NotificationsList from "@/components/NotificationsList";
import SocialMediaInputs from "@/components/SocialMediaInputs";
import ConsultantFeatureToggles from "@/components/profiles/ConsultantFeatureToggles";
import { Sliders } from "lucide-react";
import ProfileLocationPhoneSettings from "@/components/profiles/ProfileLocationPhoneSettings";
import BusinessLicenseUpload from "@/components/profiles/BusinessLicenseUpload";
import ProfileCommonSettings from "@/components/profiles/ProfileCommonSettings";
import ProfileSubcategoriesSettings from "@/components/profiles/ProfileSubcategoriesSettings";
import RealEstateListingsPanel from "@/components/profiles/RealEstateListingsPanel";
import AdCampaignPanel from "@/components/promotion/AdCampaignPanel";

const ProfileConsultant = () => {
  const { user } = useAuth();
  const { locked: gateLocked } = useProfileGate();
  const [activeTab, setActiveTab] = useState<string>("incoming-requests");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [myEvents, setMyEvents] = useState<Array<{ id: string; title: string; event_date: string; max_attendees: number | null; status: string }>>([]);
  const [managingEvent, setManagingEvent] = useState<null | (typeof myEvents)[0]>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("events")
      .select("id,title,event_date,max_attendees,status")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true })
      .then(({ data }) => setMyEvents(data || []));
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  // Profile values come from Supabase; fall back to safe defaults until data loads
  const consultant = {
    name: profile?.full_name || "Danışman",
    title: profile?.profession || "Danışman",
    category: profile?.business_sector || "—",
    email: user?.email || "",
    phone: profile?.phone || "",
    website: profile?.business_website || "",
    country: profile?.country || "",
    city: profile?.city || "",
    avatar: (profile?.full_name || "D").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase(),
    rating: 0,
    reviewCount: 0,
    followers: 0,
    experience: "—",
    languages: [] as string[],
    description: profile?.business_description || "Hakkında bilginizi Profil Ayarları'ndan ekleyebilirsiniz.",
    balance: 0,
    aiTwinEnabled: false,
  };

  const isRealEstate = /gayrimenkul|emlak|real ?estate/i.test(profile?.business_sector || "");

  // Real session/review/earnings data will be wired to Supabase tables
  // (live_sessions, ai_twin_sessions, reviews, payouts) when those tables ship.
  const sessions = { live: [] as any[], aiTwin: [] as any[] };
  const stats = {
    totalSessions: 0,
    thisMonthSessions: 0,
    thisMonthRevenue: 0,
    aiTwinSessions: 0,
    avgRating: 0,
    repeatClients: 0,
  };
  const reviews: Array<{ name: string; rating: number; text: string; date: string }> = [];
  const weeklyEarnings = [
    { day: "Pzt", live: 0, ai: 0 },
    { day: "Sal", live: 0, ai: 0 },
    { day: "Çar", live: 0, ai: 0 },
    { day: "Per", live: 0, ai: 0 },
    { day: "Cum", live: 0, ai: 0 },
    { day: "Cmt", live: 0, ai: 0 },
    { day: "Paz", live: 0, ai: 0 },
  ];
  const maxEarning = Math.max(1, ...weeklyEarnings.map(d => d.live + d.ai));

  return (
    <>
      <MapAddressBanner />
      {/* Consultant header */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
            {consultant.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{consultant.name}</h1>
              <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30 gap-1">
                <Award className="h-3 w-3" /> Onaylı Danışman
              </Badge>
              {consultant.aiTwinEnabled && (
                <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
                  <Bot className="h-3 w-3" /> AI Twin Aktif
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground font-medium mt-0.5">{consultant.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{consultant.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {consultant.city}, {consultant.country}</span>
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {consultant.experience}</span>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 text-gold" /> {consultant.rating} ({consultant.reviewCount} değerlendirme)</span>
              <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {consultant.followers} takipçi</span>
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {consultant.languages.join(", ")}</span>
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-4 text-center shrink-0 min-w-[140px]">
            <CreditCard className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">€{consultant.balance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Danışman Bakiyesi</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        {[
          { label: "Toplam Seans", value: stats.totalSessions, icon: Video, color: "text-primary" },
          { label: "Bu Ay", value: stats.thisMonthSessions, icon: Calendar, color: "text-turquoise" },
          { label: "Bu Ay Gelir", value: `€${stats.thisMonthRevenue}`, icon: CreditCard, color: "text-success" },
          { label: "AI Twin Seans", value: stats.aiTwinSessions, icon: Bot, color: "text-primary" },
          { label: "Ort. Puan", value: stats.avgRating, icon: Star, color: "text-gold" },
          { label: "Tekrar Müşteri", value: `%${stats.repeatClients}`, icon: Users, color: "text-turquoise" },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 shadow-card text-center">
            <stat.icon className={`h-4 w-4 ${stat.color} mx-auto mb-1`} />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* CorBot promo */}
      <div className="mb-6"><CorBotPromoBanner /></div>

      {/* Tabs */}
      <ProfileSetupBanner />
      <Tabs
        value={gateLocked && !["messages","notifications","campaign"].includes(activeTab) ? "settings" : activeTab}
        onValueChange={(v) => { if (!gateLocked || v === "settings" || v === "messages" || v === "notifications" || v === "campaign") setActiveTab(v); }}
        className="w-full"
      >
        <TabsList className={`bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1 ${gateLocked ? "[&>button:not([data-state=active])]:opacity-50" : ""}`}>
          <TabsTrigger value="incoming-requests" className="gap-1.5"><ClipboardList className="h-4 w-4" /> Gelen Talepler</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5"><Calendar className="h-4 w-4" /> Takvim/Etkinlikler</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5"><Star className="h-4 w-4" /> Değerlendirmeler</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analitik</TabsTrigger>
          <TabsTrigger value="campaign" className="gap-1.5"><Megaphone className="h-4 w-4" /> Tanıtım</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="job-listings" className="gap-1.5"><Briefcase className="h-4 w-4" /> İş İlanları</TabsTrigger>
          {isRealEstate && (
            <TabsTrigger value="real-estate" className="gap-1.5"><Home className="h-4 w-4" /> Emlak İlanları</TabsTrigger>
          )}
          <TabsTrigger value="ai-twin" className="gap-1.5"><Bot className="h-4 w-4" /> AI Twin</TabsTrigger>
          <TabsTrigger value="follows" className="gap-1.5"><Heart className="h-4 w-4" /> Takip Ettiklerim</TabsTrigger>
          <NotificationsTabTrigger className="text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" />
          <TabsTrigger value="messages" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><InboxIcon className="h-4 w-4" /> Mesaj Kutusu</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Settings className="h-4 w-4" /> Profil Ayarları</TabsTrigger>
        </TabsList>

        {/* AI TWIN */}
        <TabsContent value="ai-twin" className="mt-6">
          <div className="space-y-6">
            {/* AI Twin status card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" /> AI Twin Yönetimi
                </h2>
                <Badge className="bg-gold/15 text-gold border-gold/30 gap-1">
                  <Lock className="h-3 w-3" /> Yakında
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                AI Twin'iniz 7/24 müşterilerinize hizmet verecek. Tüm AI Twin görüşmeleri ücretsiz olacak.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Toplam AI Seans", color: "text-primary" },
                  { label: "Bu Hafta", color: "text-turquoise" },
                  { label: "Ort. Süre", color: "text-gold" },
                  { label: "Erişim", color: "text-success" },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold text-muted-foreground">—</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* AI Twin config — locked */}
              <div className="relative p-4 rounded-xl border border-border space-y-3 overflow-hidden">
                <div className="opacity-60 pointer-events-none space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">AI Twin Ayarları</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">AI Twin Aktif</p>
                      <p className="text-xs text-muted-foreground">Devre dışı bırakarak seansları durdurabilirsiniz</p>
                    </div>
                    <Switch disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Otomatik Canlı Yönlendirme</p>
                      <p className="text-xs text-muted-foreground">Karmaşık sorularda canlı seans önersin</p>
                    </div>
                    <Switch disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Mesai Dışı Modu</p>
                      <p className="text-xs text-muted-foreground">Sadece mesai dışında AI Twin aktif olsun</p>
                    </div>
                    <Switch disabled />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
                  <Badge className="bg-gold/15 text-gold border-gold/30 gap-1">
                    <Lock className="h-3 w-3" /> Yakında
                  </Badge>
                </div>
              </div>
            </div>

            {/* Recent AI sessions */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" /> Son AI Twin Seansları
              </h3>
              <div className="space-y-2">
                {sessions.aiTwin.length === 0 ? (
                  <EmptyDashboardState
                    icon={Bot}
                    title="AI Twin seansı yok"
                    description="AI Twin'i aktive ettikten sonra kullanıcılarla yapılan otomatik görüşmelerin transkript ve istatistikleri burada listelenir."
                  />
                ) : sessions.aiTwin.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{s.client}</p>
                      <p className="text-xs text-muted-foreground">{s.date} · {s.time} · {s.duration}</p>
                    </div>
                    <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30 text-[10px]">Tamamlandı</Badge>
                    <span className="text-sm font-semibold text-success">+€{s.amount}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs">Transkript</Button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Twin Activation flow — locked teaser, sits below the AI Twin button area */}
            <div className="relative rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-turquoise/5 to-primary/5 p-6 shadow-card overflow-hidden">
              <div className="blur-sm select-none pointer-events-none">
                <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">AI Twin Aktivasyon Süreci</h3>
                      <p className="text-xs text-muted-foreground">Premium Pro paketi + admin onayı gereklidir</p>
                    </div>
                  </div>
                  <Badge className="bg-success/15 text-success border-success/30 gap-1">
                    <CheckCircle className="h-3 w-3" /> Aktivasyon Tamamlandı
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-xs font-bold text-foreground">1. Premium Pro</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Paket aktif</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-xs font-bold text-foreground">2. Veri Yükleme</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">— sayfa · — ses · — video</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-xs font-bold text-foreground">3. RAG Eğitim</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">v— · —</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
                  AI Twin görüşmeleri tamamen ücretsizdir — platformda komisyon alınmaz.
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40 backdrop-blur-[2px]">
                <div className="bg-background/90 border border-border rounded-full px-4 py-1.5 flex items-center gap-2 shadow-card">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Yakında — AI Twin aktivasyonu kilitli</span>
                </div>
                <p className="text-xs text-muted-foreground bg-background/80 rounded-md px-3 py-1">
                  Premium Pro paketi açıldığında bu akış aktive edilebilir.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="events" className="mt-6">
          <div className="mb-4"><MyOpenCafesAsEvents /></div>
          {managingEvent ? (
            <EventManagePanel event={{ id: 0, title: managingEvent.title, date: managingEvent.event_date, attendees: managingEvent.max_attendees ?? 0, status: managingEvent.status }} onBack={() => setManagingEvent(null)} />
          ) : showCreateEvent ? (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <Button variant="ghost" size="sm" className="gap-1 mb-4" onClick={() => setShowCreateEvent(false)}>
                <ArrowLeft className="h-4 w-4" /> Etkinliklere Dön
              </Button>
              <CreateEventForm onClose={() => setShowCreateEvent(false)} />
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-turquoise" /> Takvim / Etkinlikler
                </h2>
                <Button className="gap-2" onClick={() => setShowCreateEvent(true)}><Plus className="h-4 w-4" /> Etkinlik Oluştur</Button>
              </div>

              {/* Katılacağı Etkinlikler */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Katılacağım Etkinlikler
                </h3>
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  Henüz katılacağınız etkinlik yok. Etkinlikler sayfasından kayıt olduğunuz etkinlikler burada listelenecek.
                </div>
              </div>

              {/* Randevular */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" /> Randevularım
                </h3>
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  Onaylanan randevularınız burada gözükecek.
                </div>
              </div>

              {/* Düzenlediği Etkinlikler */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-turquoise" /> Düzenlediğim Etkinlikler ({myEvents.length})
                </h3>
                <div className="space-y-3">
                  {myEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="text-center shrink-0 w-14">
                        <div className="text-xl font-bold text-primary">
                          {new Date(event.event_date).getDate()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.event_date).toLocaleDateString("tr-TR", { month: "short" })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{event.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          {event.max_attendees && (
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {event.max_attendees} kişi</span>
                          )}
                          <Badge variant="outline" className="text-xs">{event.status}</Badge>
                        </p>
                      </div>
                    </div>
                  ))}
                  {myEvents.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                      Düzenlediğiniz etkinlikler burada gözükecek. "Etkinlik Oluştur" butonu ile yeni bir etkinlik açın.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* REVIEWS */}
        <TabsContent value="reviews" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Star className="h-5 w-5 text-gold" /> Değerlendirmeler ({consultant.reviewCount})
            </h2>

            {/* Rating summary — only shows when real reviews exist */}
            {consultant.reviewCount > 0 && (
              <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/50 mb-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-foreground">{consultant.rating}</p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= Math.round(consultant.rating) ? "text-gold fill-gold" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{consultant.reviewCount} değerlendirme</p>
                </div>
              </div>
            )}

            {/* Recent reviews */}
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <EmptyDashboardState
                  icon={Star}
                  title="Henüz değerlendirme yok"
                  description="Tamamlanan seansların ardından kullanıcılar profilini değerlendirebilir. Yıldız puanları ve yorumlar burada listelenir."
                />
              ) : reviews.map((review, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {review.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="font-semibold text-foreground text-sm">{review.name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "text-gold fill-gold" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" /> Haftalık Kazanç
              </h2>
              <div className="space-y-2">
                {weeklyEarnings.map((d) => (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-8">{d.day}</span>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden flex">
                      <div className="bg-primary rounded-l-full h-3" style={{ width: `${(d.live / maxEarning) * 100}%` }} />
                      <div className="bg-turquoise h-3" style={{ width: `${(d.ai / maxEarning) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground w-10 text-right">€{d.live + d.ai}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-primary" /> Canlı</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-turquoise" /> AI Twin</span>
              </div>
            </div>

            <CategoryPerformance />
          </div>
        </TabsContent>

        {/* CAMPAIGN / TANITIM */}
        <TabsContent value="campaign" className="mt-6">
          <AdCampaignPanel />
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppGroupsTab />
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="mt-6">
          <NotificationsList />
        </TabsContent>

        {/* PROFILE EDIT / SETTINGS */}
        <TabsContent value="messages" className="space-y-4">
          <MessagesInbox />
        </TabsContent>

        <TabsContent value="job-listings" className="mt-6">
          <JobListingsManager />
        </TabsContent>

        {isRealEstate && (
          <TabsContent value="real-estate" className="mt-6">
            <RealEstateListingsPanel city={consultant.city} country={consultant.country} />
          </TabsContent>
        )}

        <TabsContent value="follows" className="mt-6">
          <MyFollowsSection />
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <BusinessLicenseUpload contextLabel="Danışman hesabınız" />
          <ProfileLocationPhoneSettings />
          <ProfileCommonSettings role="consultant" />
          <ProfileSubcategoriesSettings accountTypeOverride="consultant" />
          {/* Profile Feature Toggles */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6">
            <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" /> Profil Özellikleri
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Profilinizdeki her bloğu (mesaj, randevu, canlı görüşme, konum vb.) buradan yönetin. Pasif olanlar gizlenir, "Yakında" olanlar aktif edildiğinde otomatik çalışır.
            </p>
            <ConsultantFeatureToggles consultantId="__demo__" />
          </div>

          {/* Calendar / Appointment Management */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-turquoise" /> Takvim Yönetimi
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Müsait saatlerinizi belirleyin, gelen randevu taleplerini onaylayın veya reddedin.
            </p>
            <AppointmentManagePanel />
          </div>

          {/* Category Manager */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Hizmet Kategorilerim
            </h2>
            <ConsultantCategoryManager />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" /> Profil Bilgileri
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Ad Soyad</Label>
                  <Input defaultValue={consultant.name} />
                </div>
                <div>
                  <Label>Ünvan / Uzmanlık</Label>
                  <Input defaultValue={consultant.title} />
                </div>
                <div>
                  <Label>Bio / Hakkında</Label>
                  <Textarea defaultValue={consultant.description} rows={4} />
                </div>
                <div>
                  <Label>Diller</Label>
                  <Input defaultValue={consultant.languages.join(", ")} />
                </div>
                <Button className="w-full mt-2">Profili Güncelle</Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" /> İletişim
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label>E-posta</Label>
                    <Input defaultValue={consultant.email} />
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <Input defaultValue={consultant.phone} />
                  </div>
                  <div>
                    <Label>Web Sitesi</Label>
                    <Input defaultValue={consultant.website} />
                  </div>
                  <div>
                    <Label>Adres</Label>
                    <Input placeholder="Sokak, No, Mahalle, İlçe, Şehir, Ülke" />
                  </div>
                  <div className="flex items-start justify-between gap-3 rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">Haritada yer almak istiyorum</p>
                      <p className="text-xs text-muted-foreground">Adresin Diaspora Haritası'nda gösterilsin</p>
                    </div>
                    <Switch />
                  </div>
                  <Button variant="outline" className="w-full">Kaydet</Button>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" /> Seans Ayarları
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">Yeni Seans Kabul Et</p>
                      <p className="text-xs text-muted-foreground">Müşteriler randevu alabilsin</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">Profilimde Göster</p>
                      <p className="text-xs text-muted-foreground">Danışman aramasında görünür ol</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">E-posta Bildirimleri</p>
                      <p className="text-xs text-muted-foreground">Yeni seans ve mesajlarda bildirim al</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <SocialMediaInputs />
          </div>
        </TabsContent>
        {/* INCOMING REQUESTS */}
        <TabsContent value="incoming-requests" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
              <ClipboardList className="h-5 w-5 text-primary" /> Gelen Hizmet Talepleri
            </h2>
            <ConsultantServiceRequests />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ProfileConsultant;
