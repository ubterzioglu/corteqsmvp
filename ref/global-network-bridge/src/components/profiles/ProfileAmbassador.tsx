import {
  Users, Calendar, TrendingUp, DollarSign, MapPin,
  Wallet, ArrowUpRight, ArrowDownRight, Clock, CreditCard,
  MessageSquare, Bell, Target, Star, Globe, Plus,
  Send, CheckCircle, XCircle, Eye, Settings, ExternalLink, Video, ArrowLeft,
  Coffee, Heart
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateCafeForm from "@/components/feed/CreateCafeForm";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import { supabase } from "@/integrations/supabase/client";
import MessagesInbox from "@/components/messaging/MessagesInbox";
import MyFollowsSection from "@/components/profiles/MyFollowsSection";
import { ProfileSetupBanner, useProfileGate } from "@/components/profiles/ProfileSetupBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import CreateEventForm from "@/components/CreateEventForm";
import EventManagePanel from "@/components/EventManagePanel";
import StripeTransactionsPanel, { type StripeTxn } from "@/components/StripeTransactionsPanel";
import NotificationsList from "@/components/NotificationsList";
import CorBotPromoBanner from "@/components/CorBotPromoBanner";
import EmptyDashboardState from "@/components/EmptyDashboardState";
import NotificationsTabTrigger from "@/components/NotificationsTabTrigger";
import MyOpenCafesAsEvents from "@/components/profiles/MyOpenCafesAsEvents";
import ProfileLocationPhoneSettings from "@/components/profiles/ProfileLocationPhoneSettings";
import ProfileCommonSettings from "@/components/profiles/ProfileCommonSettings";
import ConsultantFeatureToggles from "@/components/profiles/ConsultantFeatureToggles";
import AppointmentManagePanel from "@/components/booking/AppointmentManagePanel";
import AmbassadorReferralCard from "@/components/AmbassadorReferralCard";

type AmbassadorEvent = {
  id: number;
  title: string;
  date: string;
  attendees: number;
  maxCapacity: number;
  status: "upcoming" | "completed";
};

const ProfileAmbassador = () => {
  const { user } = useAuth();
  const { locked: gateLocked } = useProfileGate();
  const [activeTab, setActiveTab] = useState<string>("transactions");
  const [messageText, setMessageText] = useState("");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [managingEvent, setManagingEvent] = useState<AmbassadorEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<AmbassadorEvent | null>(null);
  const [profileSettings, setProfileSettings] = useState({
    whatsappCtaEnabled: true,
    profilePublic: true,
  });
  const [myCafes, setMyCafes] = useState<Array<{ id: string; name: string; theme: string; city: string | null; member_count: number; opens_at: string; closes_at: string }>>([]);

  const loadCafes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("cafes" as any)
      .select("id,name,theme,city,member_count,opens_at,closes_at")
      .eq("created_by", user.id)
      .order("opens_at", { ascending: false });
    if (data) setMyCafes(data as any);
  };
  useEffect(() => { loadCafes(); }, [user]);
  const totalCafeVisitors = myCafes.reduce((s, c) => s + (c.member_count || 0), 0);

  // KPIs and lists are reset to zero/empty for launch — real values will be
  // populated from Stripe (transactions/payouts), events, profiles (onboarded users),
  // and platform messages tables as activity comes in.
  const onboardingBreakdown = {
    individuals: 0,
    consultants: 0,
    businesses: 0,
    organizations: 0,
    bloggers: 0,
  };
  const usersOnboardedTotal =
    onboardingBreakdown.individuals + onboardingBreakdown.consultants +
    onboardingBreakdown.businesses + onboardingBreakdown.organizations +
    onboardingBreakdown.bloggers;

  const kpis = {
    usersOnboarded: usersOnboardedTotal,
    usersTarget: 100,
    activeAdvisors: 0,
    advisorsTarget: 20,
    eventsOrganized: 0,
    eventsTarget: 5,
    revenueGenerated: 0,
    totalAttendees: 0,
  };

  const stripeTxns: StripeTxn[] = [];
  const events: Array<{ id: number; title: string; date: string; attendees: number; maxCapacity: number; status: "upcoming" | "completed" }> = [];
  const onboardedUsers: Array<{ name: string; type: string; date: string; status: string }> = [];
  const messages: Array<{ from: string; text: string; time: string; read: boolean }> = [];

  // Notifications loaded live via NotificationsList component.

  return (
    <>
      {/* City badge strip */}
      <div className="mb-8 flex items-center gap-2">
        <Badge className="bg-gold/15 text-gold border-gold/30 gap-1.5"><Star className="h-3.5 w-3.5" /> Berlin</Badge>
        <span className="text-xs text-muted-foreground">Topluluk, performans, etkinlik ve gelir yönetimi</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Onboard Edilen", value: kpis.usersOnboarded, target: kpis.usersTarget, icon: Users, color: "text-primary" },
          { label: "Aktif Danışman", value: kpis.activeAdvisors, target: kpis.advisorsTarget, icon: Target, color: "text-turquoise" },
          { label: "Etkinlik", value: kpis.eventsOrganized, target: kpis.eventsTarget, icon: Calendar, color: "text-gold" },
          { label: "Katılımcı", value: kpis.totalAttendees, target: null, icon: Eye, color: "text-accent-foreground" },
          { label: "Gelir (€)", value: kpis.revenueGenerated, target: null, icon: DollarSign, color: "text-success" },
        ].map((stat, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-4 text-center">
              <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              {stat.target && (
                <div className="mt-2">
                  <Progress value={(stat.value / stat.target) * 100} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground mt-1">Hedef: {stat.target}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onboarding Kırılımı */}
      <Card className="border-border mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Onboarding Kırılımı
            </h3>
            <Badge variant="outline" className="border-primary/30 text-primary">
              Toplam: {usersOnboardedTotal}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Bireysel Kullanıcı", value: onboardingBreakdown.individuals, color: "text-primary" },
              { label: "Danışman", value: onboardingBreakdown.consultants, color: "text-turquoise" },
              { label: "İşletme", value: onboardingBreakdown.businesses, color: "text-gold" },
              { label: "Kuruluş", value: onboardingBreakdown.organizations, color: "text-success" },
              { label: "Blogger / Vlogger", value: onboardingBreakdown.bloggers, color: "text-accent-foreground" },
            ].map((b) => (
              <div key={b.label} className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                <p className={`text-xl font-bold ${b.color}`}>{b.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{b.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AmbassadorReferralCard />

      <div className="mb-6"><CorBotPromoBanner /></div>

      {/* Tabs */}
      <ProfileSetupBanner />
      <Tabs
        value={gateLocked && !["messages","notifications"].includes(activeTab) ? "settings" : activeTab}
        onValueChange={(v) => { if (!gateLocked || v === "settings" || v === "messages" || v === "notifications") setActiveTab(v); }}
        className="w-full"
      >
        <TabsList className={`bg-gradient-to-r from-primary/10 via-turquoise/10 to-gold/10 border border-primary/20 w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1.5 shadow-sm ${gateLocked ? "[&>button:not([data-state=active])]:opacity-50" : ""}`}>
          <TabsTrigger value="transactions" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-foreground/80 hover:text-foreground"><CreditCard className="h-4 w-4" /> İşlemlerim</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5 data-[state=active]:bg-gold data-[state=active]:text-white data-[state=active]:shadow-md text-foreground/80 hover:text-foreground"><Calendar className="h-4 w-4" /> Etkinlikler</TabsTrigger>
          <TabsTrigger value="cadde" className="gap-1.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md text-foreground/80 hover:text-foreground"><Coffee className="h-4 w-4" /> Cadde'de Cafe</TabsTrigger>
          <TabsTrigger value="onboarding" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md text-foreground/80 hover:text-foreground"><Users className="h-4 w-4" /> Onboarding</TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-foreground/80 hover:text-foreground"><TrendingUp className="h-4 w-4" /> Performans</TabsTrigger>
          <TabsTrigger value="community" className="gap-1.5 data-[state=active]:bg-turquoise data-[state=active]:text-white data-[state=active]:shadow-md text-foreground/80 hover:text-foreground"><Globe className="h-4 w-4" /> Topluluk</TabsTrigger>
          <TabsTrigger value="follows" className="gap-1.5 data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md text-foreground/80 hover:text-foreground"><Heart className="h-4 w-4" /> Takip Ettiklerim</TabsTrigger>
          <NotificationsTabTrigger className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-foreground/80 hover:text-foreground" />
          <TabsTrigger value="messaging" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-foreground/80 hover:text-foreground"><MessageSquare className="h-4 w-4" /> Mesajlar</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-md text-foreground/80 hover:text-foreground"><Settings className="h-4 w-4" /> Profil Ayarları</TabsTrigger>
        </TabsList>

        {/* CADDE'DE CAFE */}
        <TabsContent value="cadde" className="mt-6 space-y-5">
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Coffee className="h-5 w-5 text-amber-600" /> Cadde'de Cafe Aç
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Şehir Elçisi olarak <strong>1–6 saat arası</strong> dilediğin süreyle cafe açabilir, topluluğunu canlı tutabilirsin.
                  </p>
                </div>
                <CreateCafeForm
                  ambassadorMode
                  onCreated={loadCafes}
                  trigger={
                    <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                      <Plus className="h-4 w-4" /> Cafe Aç (1–6 saat)
                    </Button>
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-card border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{myCafes.length}</p>
                  <p className="text-[11px] text-muted-foreground">Açtığın Cafe</p>
                </div>
                <div className="rounded-lg bg-card border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{totalCafeVisitors}</p>
                  <p className="text-[11px] text-muted-foreground">Toplam Ziyaretçi</p>
                </div>
                <div className="rounded-lg bg-card border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-success">6h</p>
                  <p className="text-[11px] text-muted-foreground">Süre Avantajı</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {myCafes.length === 0 ? (
            <EmptyDashboardState
              icon={Coffee}
              title="Henüz cafe açmadın"
              description="Yukarıdaki 'Cafe Aç (1–6 saat)' butonu ile şehrinde tematik bir cafe başlat. Açılan cafe'ler ve ziyaretçi sayıları burada listelenir."
            />
          ) : (
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-border">
                  <h4 className="font-semibold text-foreground text-sm">Açtığın Cafeler</h4>
                </div>
                <div className="divide-y divide-border">
                  {myCafes.map((c) => {
                    const isLive = new Date(c.closes_at) > new Date();
                    return (
                      <Link key={c.id} to={`/cadde/${c.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Coffee className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {c.theme} {c.city ? `· ${c.city}` : ""} · {new Date(c.opens_at).toLocaleDateString("tr-TR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-success text-white" : ""}>
                            {isLive ? "Canlı" : "Bitti"}
                          </Badge>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{c.member_count}</p>
                            <p className="text-[10px] text-muted-foreground">ziyaretçi</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TRANSACTIONS (Stripe) */}
        <TabsContent value="transactions" className="mt-6">
          <StripeTransactionsPanel transactions={stripeTxns} stripeConnected={false} />
        </TabsContent>

        {/* EVENTS */}
        <TabsContent value="events" className="mt-6">
          <div className="mb-4"><MyOpenCafesAsEvents /></div>
          {managingEvent ? (
            <EventManagePanel event={managingEvent} onBack={() => setManagingEvent(null)} />
          ) : viewingEvent ? (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <Button variant="ghost" size="sm" className="gap-1 mb-4" onClick={() => setViewingEvent(null)}>
                <ArrowLeft className="h-4 w-4" /> Etkinliklere Dön
              </Button>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-foreground">{viewingEvent.title}</h3>
                <Badge variant={viewingEvent.status === "upcoming" ? "default" : "secondary"}>
                  {viewingEvent.status === "upcoming" ? "Yaklaşan" : "Tamamlandı"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {viewingEvent.date}
              </p>
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{viewingEvent.attendees}</p>
                  <p className="text-[11px] text-muted-foreground">Kayıtlı</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{viewingEvent.maxCapacity}</p>
                  <p className="text-[11px] text-muted-foreground">Kapasite</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">
                    {Math.round((viewingEvent.attendees / viewingEvent.maxCapacity) * 100)}%
                  </p>
                  <p className="text-[11px] text-muted-foreground">Doluluk</p>
                </div>
              </div>
              <Progress value={(viewingEvent.attendees / viewingEvent.maxCapacity) * 100} className="h-2 mb-6" />
              {viewingEvent.status === "upcoming" && (
                <Button onClick={() => { setManagingEvent(viewingEvent); setViewingEvent(null); }} className="gap-1.5">
                  <Settings className="h-4 w-4" /> Etkinliği Yönet
                </Button>
              )}
            </div>
          ) : showCreateEvent ? (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <Button variant="ghost" size="sm" className="gap-1 mb-4" onClick={() => setShowCreateEvent(false)}>
                <ArrowLeft className="h-4 w-4" /> Etkinliklere Dön
              </Button>
              <CreateEventForm onClose={() => setShowCreateEvent(false)} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gold" /> Etkinlik Yönetimi
                </h3>
                <Button size="sm" className="gap-1.5" onClick={() => setShowCreateEvent(true)}>
                  <Plus className="h-4 w-4" /> Yeni Etkinlik
                </Button>
              </div>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <EmptyDashboardState
                    icon={Calendar}
                    title="Henüz etkinlik yok"
                    description="'Yeni Etkinlik' ile şehir buluşması veya networking etkinliği oluşturun. Açtıklarınız ve katılımcı sayıları burada listelenir."
                  />
                ) : events.map((ev) => (
                  <Card key={ev.id} className="border-border">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-foreground">{ev.title}</h4>
                            <Badge variant={ev.status === "upcoming" ? "default" : "secondary"}>
                              {ev.status === "upcoming" ? "Yaklaşan" : "Tamamlandı"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{ev.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground">{ev.attendees}</p>
                            <p className="text-[10px] text-muted-foreground">/ {ev.maxCapacity} katılımcı</p>
                            <Progress value={(ev.attendees / ev.maxCapacity) * 100} className="h-1.5 mt-1 w-20" />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setViewingEvent(ev)}>Detay</Button>
                            {ev.status === "upcoming" && (
                              <Button size="sm" variant="default" onClick={() => setManagingEvent(ev)}>Yönet</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Toplam <span className="font-bold text-foreground">{kpis.totalAttendees}</span> katılımcı · <span className="font-bold text-foreground">{kpis.eventsOrganized}</span> etkinlik düzenlendi</p>
              </div>
            </>
          )}
        </TabsContent>

        {/* ONBOARDING — detailed referral & revenue report */}
        <TabsContent value="onboarding" className="mt-6">
          {(() => {
            const ranges = [
              { id: "7d", label: "Son 7 gün" },
              { id: "30d", label: "Son 30 gün" },
              { id: "90d", label: "Son 90 gün" },
              { id: "all", label: "Tüm zamanlar" },
            ];
            const detailedOnboarded: Array<{ name: string; type: string; date: string; status: string; revenue: number; commission: number }> = [];
            const totalRevenue = detailedOnboarded.reduce((s, u) => s + u.revenue, 0);
            const totalCommission = detailedOnboarded.reduce((s, u) => s + u.commission, 0);
            const businessRevenue = detailedOnboarded.filter(u => u.type === "İşletme").reduce((s, u) => s + u.revenue, 0);

            return (
              <div className="space-y-5">
                {/* Header + date range filter */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" /> Onboarding & Referral Raporu
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Onboard ettiğin kullanıcılar, ürettikleri ciro ve sana düşen referral ödemesi
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg p-1">
                    {ranges.map(r => (
                      <button
                        key={r.id}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${r.id === "30d" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI mini cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <Users className="h-4 w-4 text-primary mb-1" />
                      <p className="text-xl font-bold text-foreground">{detailedOnboarded.length}</p>
                      <p className="text-[11px] text-muted-foreground">Onboard Edilen</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <DollarSign className="h-4 w-4 text-turquoise mb-1" />
                      <p className="text-xl font-bold text-foreground">€{totalRevenue.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">Toplam Ciro Üretildi</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <Wallet className="h-4 w-4 text-success mb-1" />
                      <p className="text-xl font-bold text-foreground">€{totalCommission.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">Sana Referral Ödeme</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <TrendingUp className="h-4 w-4 text-gold mb-1" />
                      <p className="text-xl font-bold text-foreground">€{businessRevenue.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">İşletme Cirosu</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Hedef Progress */}
                <div className="bg-muted/40 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">Aylık Onboarding Hedefi</span>
                    <Badge variant="outline">{kpis.usersOnboarded} / {kpis.usersTarget}</Badge>
                  </div>
                  <Progress value={(kpis.usersOnboarded / kpis.usersTarget) * 100} className="h-2" />
                </div>

                {/* Detailed table */}
                <Card className="border-border">
                  <CardContent className="p-0">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <h4 className="font-semibold text-foreground text-sm">Detaylı Liste</h4>
                      <button className="text-xs font-semibold text-primary hover:underline">CSV indir</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                          <tr className="text-left text-[11px] uppercase text-muted-foreground">
                            <th className="px-4 py-2.5 font-semibold">Kullanıcı</th>
                            <th className="px-4 py-2.5 font-semibold">Tür</th>
                            <th className="px-4 py-2.5 font-semibold">Tarih</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Üretilen Ciro</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Senin Payın</th>
                            <th className="px-4 py-2.5 font-semibold text-center">Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedOnboarded.map((u, i) => (
                            <tr key={i} className="border-t border-border/60">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                  <span className="font-medium text-foreground text-sm">{u.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="text-[10px]">{u.type}</Badge>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{u.date}</td>
                              <td className="px-4 py-3 text-right font-semibold text-foreground">
                                {u.revenue > 0 ? `€${u.revenue.toLocaleString()}` : "—"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {u.commission > 0 ? (
                                  <span className="font-bold text-success">€{u.commission.toLocaleString()}</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {u.status === "active" && <CheckCircle className="h-4 w-4 text-success inline" />}
                                {u.status === "pending" && <Clock className="h-4 w-4 text-gold inline" />}
                                {u.status === "inactive" && <XCircle className="h-4 w-4 text-destructive inline" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-border bg-muted/30">
                            <td colSpan={3} className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Toplam</td>
                            <td className="px-4 py-3 text-right font-bold text-foreground">€{totalRevenue.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-extrabold text-success">€{totalCommission.toLocaleString()}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-[11px] text-muted-foreground text-center font-body">
                  💡 Referral payı: Bireysel kayıt €5 sabit · Danışman/V-Blogger seans gelirinin %10'u · İşletme cirosunun %5'i
                </p>
              </div>
            );
          })()}
        </TabsContent>

        {/* MESSAGING */}
        <TabsContent value="messaging" className="mt-6 space-y-4">
          <MessagesInbox />
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Haftalık Performans</h3>
                <EmptyDashboardState
                  icon={TrendingUp}
                  title="Henüz veri yok"
                  description="Yeni kullanıcı kayıtları, danışman eşleşmeleri ve etkinlik katılımları geldikçe haftalık performans grafiği burada görünür."
                />
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-gold" /> Aylık Gelir Özeti</h3>
                <EmptyDashboardState
                  icon={DollarSign}
                  title="Henüz gelir yok"
                  description="Davet kodun ile gelen işletme/danışman ödemeleri burada aylık olarak listelenir."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* COMMUNITY */}
        <TabsContent value="community" className="mt-6">
          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-turquoise" /> WhatsApp & Topluluk
              </h3>
              <EmptyDashboardState
                icon={Globe}
                title="Topluluk grupları henüz yapılandırılmadı"
                description="Şehir WhatsApp grubunu ve elçiler koordinasyon grubunu Profil Ayarları sekmesinden ekleyebilirsiniz; bağlandığında burada listelenir."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="follows" className="mt-6">
          <MyFollowsSection />
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          <ProfileLocationPhoneSettings />
          <ProfileCommonSettings role="ambassador" />
          <AmbassadorReferralCard />

          {user && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Profil Özellik Toggle'ları
              </h3>
              <ConsultantFeatureToggles consultantId={user.id} />
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Takvim Yönetimi
            </h3>
            <AppointmentManagePanel />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-border lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" /> Profil Görünüm Yönetimi
                </h3>

                <div className="space-y-5">
                  <div className="rounded-xl border border-border p-4 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground mb-3">CTA Yönetimi (Mock)</p>
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-link">WhatsApp numarası (telefon doğrulamandan otomatik gelir)</Label>
                        <Input id="whatsapp-link" defaultValue="+49 1234 567890" />
                        <p className="text-[11px] text-muted-foreground">
                          Profilindeki "WhatsApp'la Görüş" butonu doğruladığın telefon numarasını kullanır.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 flex-1">
                        <Label className="text-sm text-foreground">WhatsApp CTA aktif</Label>
                        <Switch
                          checked={profileSettings.whatsappCtaEnabled}
                          onCheckedChange={(checked) => setProfileSettings((prev) => ({ ...prev, whatsappCtaEnabled: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground mb-3">Sosyal Medya Hesapları (Mock)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <Input defaultValue="instagram.com/berlinelcisi" aria-label="Instagram" />
                      <Input defaultValue="linkedin.com/in/berlinelcisi" aria-label="LinkedIn" />
                      <Input defaultValue="youtube.com/@berlinelcisi" aria-label="YouTube" />
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                      <Label className="text-sm text-foreground">Profil herkese açık</Label>
                      <Switch
                        checked={profileSettings.profilePublic}
                        onCheckedChange={(checked) => setProfileSettings((prev) => ({ ...prev, profilePublic: checked }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="gap-1.5">Mock Ayarları Kaydet</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <h4 className="font-bold text-foreground mb-4">Profil Önizleme</h4>
                <div className="space-y-3 text-sm">
                  <div className="rounded-lg bg-muted/50 p-3 border border-border">
                    <p className="text-muted-foreground">Durum</p>
                    <p className="font-semibold text-foreground">
                      {profileSettings.profilePublic ? "Herkese Açık" : "Sadece Platform İçi"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 border border-border">
                    <p className="text-muted-foreground mb-1">Aktif CTA'lar</p>
                    <div className="flex flex-wrap gap-2">
                      {profileSettings.whatsappCtaEnabled && <Badge variant="secondary">WhatsApp</Badge>}
                      
                      <Badge variant="outline">Profili Aç</Badge>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 border border-border">
                    <p className="text-muted-foreground mb-1">Hızlı Eylemler</p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" /> Public Profili Aç
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" /> WhatsApp CTA Test Et
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-gold" /> Bildirimler
              </h3>
              <NotificationsList accent="gold" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ProfileAmbassador;
