import { useState } from "react";
import EventManagePanel from "@/components/EventManagePanel";
import CreateEventForm from "@/components/CreateEventForm";
import SocialMediaCampaignDialog from "@/components/SocialMediaCampaignDialog";
import CategoryShowcasePurchase from "@/components/CategoryShowcasePurchase";
import {
  User, MapPin, Globe, Star, Calendar, Users, Clock, Eye,
  TrendingUp, Settings, BarChart3, CreditCard, Plus, ChevronRight, Crown,
  Video, Bot, Edit3, MessageSquare, ArrowLeft, Award, Heart,
  Phone, Mail, CheckCircle, Briefcase, BookOpen, Megaphone, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ConsultantServiceRequests from "@/components/ConsultantServiceRequests";
import ConsultantCategoryManager from "@/components/ConsultantCategoryManager";
import WhatsAppGroupsTab from "@/components/profiles/WhatsAppGroupsTab";

const ProfileConsultant = () => {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [managingEvent, setManagingEvent] = useState<null | typeof events[0]>(null);

  const consultant = {
    name: "Dr. Ayşe Kara",
    title: "Göçmenlik & Vize Danışmanı",
    category: "Vize / Göçmenlik",
    email: "info@corteqs.net",
    phone: "+49 176 1234567",
    website: "aysekara.de",
    country: "Almanya",
    city: "München",
    avatar: "AK",
    rating: 4.9,
    reviewCount: 128,
    followers: 342,
    experience: "12 yıl",
    languages: ["Türkçe", "Almanca", "İngilizce"],
    description: "Almanya, Hollanda ve Avusturya'da vize, oturma izni ve vatandaşlık süreçleri konusunda uzmanlaşmış göçmenlik danışmanı. Aile birleşimi, çalışma vizesi ve Mavi Kart başvurularında rehberlik.",
    balance: 4850.00,
    aiTwinEnabled: true,
  };

  const sessions = {
    live: [
      { id: 1, client: "Emre Aydın", date: "10 Mar 2026", time: "14:00", duration: "30dk", status: "Onaylı", type: "Canlı", amount: 30 },
      { id: 2, client: "Fatma Kaya", date: "10 Mar 2026", time: "16:30", duration: "30dk", status: "Onaylı", type: "Canlı", amount: 30 },
      { id: 3, client: "Zeynep Arslan", date: "11 Mar 2026", time: "10:00", duration: "30dk", status: "Beklemede", type: "Canlı", amount: 30 },
      { id: 4, client: "Can Özdemir", date: "12 Mar 2026", time: "11:00", duration: "30dk", status: "Onaylı", type: "Canlı", amount: 30 },
    ],
    aiTwin: [
      { id: 101, client: "Mehmet Demir", date: "08 Mar 2026", time: "09:15", duration: "28dk", status: "Tamamlandı", type: "AI Twin", amount: 10 },
      { id: 102, client: "Elif Yıldız", date: "08 Mar 2026", time: "13:42", duration: "30dk", status: "Tamamlandı", type: "AI Twin", amount: 10 },
      { id: 103, client: "Burak Çelik", date: "07 Mar 2026", time: "20:10", duration: "18dk", status: "Tamamlandı", type: "AI Twin", amount: 10 },
      { id: 104, client: "Seda Korkmaz", date: "07 Mar 2026", time: "15:30", duration: "30dk", status: "Tamamlandı", type: "AI Twin", amount: 10 },
      { id: 105, client: "Ali Öztürk", date: "06 Mar 2026", time: "11:00", duration: "25dk", status: "Tamamlandı", type: "AI Twin", amount: 10 },
    ],
  };

  const events = [
    { id: 1, title: "Mavi Kart Bilgilendirme Webinarı", date: "20 Mar 2026", attendees: 85, status: "Yaklaşan" },
    { id: 2, title: "Aile Birleşimi Soru-Cevap", date: "28 Mar 2026", attendees: 42, status: "Yaklaşan" },
  ];

  const stats = {
    totalSessions: 384,
    thisMonthSessions: 28,
    thisMonthRevenue: 1240,
    aiTwinSessions: 156,
    avgRating: 4.9,
    repeatClients: 67,
  };

  const reviews = [
    { name: "Emre A.", rating: 5, text: "Çok profesyonel ve bilgili. Mavi Kart sürecimi sorunsuz tamamladık.", date: "06 Mar" },
    { name: "Fatma K.", rating: 5, text: "AI Twin özelliği ile gece geç saatte bile sorularıma yanıt alabildim, harika!", date: "05 Mar" },
    { name: "Can Ö.", rating: 4, text: "Detaylı bilgilendirme yaptı. Tavsiye ederim.", date: "03 Mar" },
  ];

  const weeklyEarnings = [
    { day: "Pzt", live: 90, ai: 30 },
    { day: "Sal", live: 60, ai: 50 },
    { day: "Çar", live: 120, ai: 40 },
    { day: "Per", live: 90, ai: 20 },
    { day: "Cum", live: 60, ai: 60 },
    { day: "Cmt", live: 30, ai: 40 },
    { day: "Paz", live: 0, ai: 30 },
  ];

  const maxEarning = Math.max(...weeklyEarnings.map(d => d.live + d.ai));

  return (
    <>
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

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="sessions" className="gap-1.5"><Video className="h-4 w-4" /> Seanslar</TabsTrigger>
          <TabsTrigger value="incoming-requests" className="gap-1.5"><ClipboardList className="h-4 w-4" /> Gelen Talepler</TabsTrigger>
          <TabsTrigger value="ai-twin" className="gap-1.5"><Bot className="h-4 w-4" /> AI Twin</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5"><Calendar className="h-4 w-4" /> Etkinlikler</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5"><Star className="h-4 w-4" /> Değerlendirmeler</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analitik</TabsTrigger>
          <TabsTrigger value="campaign" className="gap-1.5"><Megaphone className="h-4 w-4" /> Tanıtım</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-4 w-4" /> Profil Düzenle</TabsTrigger>
        </TabsList>

        {/* LIVE SESSIONS */}
        <TabsContent value="sessions" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" /> Canlı Görüşmeler
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> 30dk = €30 · İlk 10dk ücretsiz
              </div>
            </div>

            {/* Upcoming sessions */}
            <h3 className="font-semibold text-foreground mb-3 text-sm">Yaklaşan Seanslar</h3>
            <div className="space-y-2 mb-6">
              {sessions.live.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{s.client}</p>
                    <p className="text-xs text-muted-foreground">{s.date} · {s.time} · {s.duration}</p>
                  </div>
                  <Badge
                    className={`text-[10px] shrink-0 ${
                      s.status === "Onaylı" ? "bg-turquoise/15 text-turquoise border-turquoise/30" :
                      "bg-gold/15 text-gold border-gold/30"
                    }`}
                  >
                    {s.status}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">€{s.amount}</span>
                  {s.status === "Beklemede" && (
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-7 text-xs gap-1"><CheckCircle className="h-3 w-3" /> Onayla</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-destructive">Reddet</Button>
                    </div>
                  )}
                  {s.status === "Onaylı" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <Video className="h-3 w-3" /> Başlat
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Session summary */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{sessions.live.filter(s => s.status === "Onaylı").length}</p>
                <p className="text-[11px] text-muted-foreground">Onaylı</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gold">{sessions.live.filter(s => s.status === "Beklemede").length}</p>
                <p className="text-[11px] text-muted-foreground">Beklemede</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-success">€{sessions.live.filter(s => s.status === "Onaylı").reduce((sum, s) => sum + s.amount, 0)}</p>
                <p className="text-[11px] text-muted-foreground">Planlanan Gelir</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* AI TWIN */}
        <TabsContent value="ai-twin" className="mt-6">
          <div className="space-y-6">
            {/* AI Twin Activation flow card */}
            <div className="bg-gradient-to-br from-primary/5 via-turquoise/5 to-primary/5 rounded-2xl border-2 border-primary/20 p-6 shadow-card">
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
                  <p className="text-[11px] text-muted-foreground">128 sayfa · 18dk ses · 2dk video</p>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-xs font-bold text-foreground">3. RAG Eğitim</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">v2.1 · 04 Mar 2026</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="text-xs text-muted-foreground">
                  💸 AI Twin gelirinden <span className="font-bold text-foreground">%10 platform kesintisi</span> uygulanır.
                </div>
                <a href="/ai-twin" className="text-xs font-semibold text-primary hover:underline shrink-0">
                  Yeni model talep et →
                </a>
              </div>
            </div>


            {/* AI Twin status card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" /> AI Twin Yönetimi
                </h2>
                <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30 gap-1">
                  <CheckCircle className="h-3 w-3" /> Aktif
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                AI Twin'iniz 7/24 müşterilerinize hizmet veriyor. Seans başına €10 · İlk 10dk ücretsiz.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Toplam AI Seans", value: stats.aiTwinSessions, color: "text-primary" },
                  { label: "Bu Hafta", value: sessions.aiTwin.length, color: "text-turquoise" },
                  { label: "Ort. Süre", value: "24dk", color: "text-gold" },
                  { label: "Bu Hafta Gelir", value: `€${sessions.aiTwin.length * 10}`, color: "text-success" },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* AI Twin config */}
              <div className="p-4 rounded-xl border border-border space-y-3">
                <h3 className="font-semibold text-foreground text-sm">AI Twin Ayarları</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">AI Twin Aktif</p>
                    <p className="text-xs text-muted-foreground">Devre dışı bırakarak seansları durdurabilirsiniz</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Otomatik Canlı Yönlendirme</p>
                    <p className="text-xs text-muted-foreground">Karmaşık sorularda canlı seans önersin</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Mesai Dışı Modu</p>
                    <p className="text-xs text-muted-foreground">Sadece mesai dışında AI Twin aktif olsun</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            {/* Recent AI sessions */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" /> Son AI Twin Seansları
              </h3>
              <div className="space-y-2">
                {sessions.aiTwin.map((s) => (
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
          </div>
        </TabsContent>

        {/* EVENTS */}
        <TabsContent value="events" className="mt-6">
          {managingEvent ? (
            <EventManagePanel event={managingEvent} onBack={() => setManagingEvent(null)} />
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
                  <Calendar className="h-5 w-5 text-turquoise" /> Danışman Etkinlikleri
                </h2>
                <Button className="gap-2" onClick={() => setShowCreateEvent(true)}><Plus className="h-4 w-4" /> Etkinlik Oluştur</Button>
              </div>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="text-center shrink-0 w-14">
                      <div className="text-xl font-bold text-primary">{event.date.split(" ")[0]}</div>
                      <div className="text-xs text-muted-foreground">{event.date.split(" ")[1]}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {event.attendees} katılımcı</span>
                        <Badge variant="outline" className="text-xs">{event.status}</Badge>
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setManagingEvent(event)}>Yönet</Button>
                  </div>
                ))}
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

            {/* Rating summary */}
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
              <div className="flex-1 space-y-1.5">
                {[
                  { stars: 5, pct: 82 },
                  { stars: 4, pct: 12 },
                  { stars: 3, pct: 4 },
                  { stars: 2, pct: 1 },
                  { stars: 1, pct: 1 },
                ].map((r) => (
                  <div key={r.stars} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-3">{r.stars}</span>
                    <Star className="h-3 w-3 text-gold" />
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-gold rounded-full h-2" style={{ width: `${r.pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent reviews */}
            <div className="space-y-3">
              {reviews.map((review, i) => (
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

            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Müşteri Kaynakları
              </h2>
              <div className="space-y-4">
                {[
                  { source: "Platform Araması", count: 142, pct: 52 },
                  { source: "Profil Ziyareti", count: 68, pct: 25 },
                  { source: "Etkinlik Katılımı", count: 38, pct: 14 },
                  { source: "Yönlendirme", count: 24, pct: 9 },
                ].map((s) => (
                  <div key={s.source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">{s.source}</span>
                      <span className="text-muted-foreground">{s.count} ({s.pct}%)</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-primary rounded-full h-2" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CAMPAIGN / TANITIM */}
        <TabsContent value="campaign" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> Tanıtım & Reklam
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: "Öne Çıkan Danışman", desc: "Ana sayfada ve arama sonuçlarında üst sıralarda görünün", price: "€29/hafta", icon: Star },
                { title: "WhatsApp Tanıtımı", desc: "CorteQS Kanalında Tanıtım", price: "€19/tanıtım", icon: Megaphone },
                { title: "Etkinlik Boost", desc: "Etkinliklerinizi platforma ve mail listelerine tanıtın", price: "€49/etkinlik", icon: TrendingUp },
              ].map((promo) => (
                <div key={promo.title} className="border border-border rounded-xl p-4 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <promo.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{promo.title}</h3>
                      <p className="text-xs font-semibold text-primary">{promo.price}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{promo.desc}</p>
                  <Button variant="outline" size="sm" className="w-full">Satın Al</Button>
                </div>
              ))}
              <div className="border border-primary/30 rounded-xl p-4 bg-primary/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Megaphone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Sosyal Medya Paketi</h3>
                    <p className="text-xs font-semibold text-primary">$25+/platform</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Sosyal medya hesaplarınızda profesyonel kampanya yönetimi</p>
                <SocialMediaCampaignDialog entityName={consultant.name} entityType="consultant" />
              </div>

              {/* Category Showcase */}
              <div className="bg-card rounded-2xl p-5 border border-gold/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gold/10 p-2.5 rounded-full">
                    <Crown className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Kategori Vitrini</h3>
                    <p className="text-xs font-semibold text-gold">€29+/hafta</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Kategorinizde ilk 6 sırada gösterilerek daha fazla müşteriye ulaşın</p>
                <CategoryShowcasePurchase entityName={consultant.name} category={consultant.category} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppGroupsTab />
        </TabsContent>

        {/* PROFILE EDIT / SETTINGS */}
        <TabsContent value="settings" className="mt-6">
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
