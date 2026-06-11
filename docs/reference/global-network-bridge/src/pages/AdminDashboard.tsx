import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Users, Briefcase, Building2, Flag, PenLine, Calendar, MapPin,
  TrendingUp, DollarSign, Eye, MessageSquare, Send, Shield,
  BarChart3, Activity, Globe, Radio, FileText, Bell, Search, Wallet, Gift, PlusCircle, Bot, CheckCircle2, XCircle, Crown
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import RevenueTracker from "@/components/admin/RevenueTracker";
import AmbassadorDashboard from "@/components/admin/AmbassadorDashboard";
import VBloggerDashboard from "@/components/admin/VBloggerDashboard";
import WelcomePackTracker from "@/components/admin/WelcomePackTracker";
import WhatsAppLandingsModeration from "@/components/admin/WhatsAppLandingsModeration";
import CreateEventForm from "@/components/CreateEventForm";

// ─── Mock Data ───────────────────────────────────────────
const monthlyUsers = [
  { month: "Oca", users: 320, active: 280 },
  { month: "Şub", users: 410, active: 350 },
  { month: "Mar", users: 520, active: 440 },
  { month: "Nis", users: 680, active: 560 },
  { month: "May", users: 790, active: 650 },
  { month: "Haz", users: 920, active: 780 },
];

const revenueData = [
  { month: "Oca", revenue: 4200, consultants: 2800, events: 900, premium: 500 },
  { month: "Şub", revenue: 5100, consultants: 3200, events: 1100, premium: 800 },
  { month: "Mar", revenue: 6300, consultants: 3800, events: 1400, premium: 1100 },
  { month: "Nis", revenue: 7800, consultants: 4500, events: 1800, premium: 1500 },
  { month: "May", revenue: 9200, consultants: 5200, events: 2200, premium: 1800 },
  { month: "Haz", revenue: 11500, consultants: 6500, events: 2700, premium: 2300 },
];

const userTypeDistribution = [
  { name: "Bireysel", value: 4200, color: "hsl(var(--primary))" },
  { name: "Danışman", value: 380, color: "hsl(var(--chart-2))" },
  { name: "İşletme", value: 290, color: "hsl(var(--chart-3))" },
  { name: "Kuruluş", value: 120, color: "hsl(var(--chart-4))" },
  { name: "V/Blogger", value: 85, color: "hsl(var(--chart-5))" },
  { name: "Elçi", value: 42, color: "hsl(var(--chart-1))" },
];


// Revenue by different dimensions for overview sorting
const overviewRevenueByFeature = [
  { name: "Üyelik Paketleri", revenue: 7200, change: "+18%" },
  { name: "AI Twin", revenue: 5100, change: "+42%" },
  { name: "Canlı Görüşme", revenue: 4800, change: "+12%" },
  { name: "Sosyal Kampanya", revenue: 3000, change: "+25%" },
  { name: "Etkinlik Bilet", revenue: 2700, change: "+22%" },
  { name: "Kategori Vitrini", revenue: 2010, change: "+30%" },
  { name: "Hastane Randevu", revenue: 1600, change: "+35%" },
  { name: "Etkinlik Boost", revenue: 1225, change: "+15%" },
];

const overviewRevenueByUserType = [
  { name: "Danışman", revenue: 14200, change: "+20%" },
  { name: "İşletme", revenue: 8100, change: "+15%" },
  { name: "Bireysel", revenue: 7800, change: "+28%" },
  { name: "Kuruluş", revenue: 5600, change: "+12%" },
  { name: "V/Blogger", revenue: 2400, change: "+32%" },
  { name: "Elçi", revenue: 2500, change: "+18%" },
];

const overviewRevenueByCountry = [
  { name: "Almanya", revenue: 12200, change: "+16%" },
  { name: "İngiltere", revenue: 7200, change: "+22%" },
  { name: "BAE", revenue: 6500, change: "+35%" },
  { name: "Hollanda", revenue: 4800, change: "+12%" },
  { name: "ABD", revenue: 3200, change: "+28%" },
  { name: "Fransa", revenue: 2800, change: "+10%" },
];

const overviewRevenueByCity = [
  { name: "Berlin", revenue: 5200, change: "+14%" },
  { name: "Londra", revenue: 4800, change: "+20%" },
  { name: "Dubai", revenue: 4200, change: "+38%" },
  { name: "Münih", revenue: 3100, change: "+12%" },
  { name: "Amsterdam", revenue: 2900, change: "+15%" },
  { name: "Paris", revenue: 2800, change: "+10%" },
  { name: "Frankfurt", revenue: 2400, change: "+8%" },
  { name: "New York", revenue: 2100, change: "+25%" },
];

const platformFeatures = [
  { name: "Danışman Aramaları", usage: 12400, trend: "+18%", status: "active" },
  { name: "AI Twin Seansları", usage: 3200, trend: "+42%", status: "active" },
  { name: "Canlı Görüşmeler", usage: 1850, trend: "+12%", status: "active" },
  { name: "Etkinlik Oluşturma", usage: 890, trend: "+8%", status: "active" },
  { name: "Hizmet Talepleri", usage: 620, trend: "+25%", status: "active" },
  { name: "Taşınma Motoru", usage: 540, trend: "+35%", status: "active" },
  { name: "Blog Yarışması", usage: 320, trend: "+15%", status: "active" },
  { name: "QR Tarama", usage: 280, trend: "+5%", status: "active" },
  { name: "Radyo İstek", usage: 190, trend: "+10%", status: "active" },
  { name: "Kupon Yönetimi", usage: 150, trend: "+20%", status: "active" },
  { name: "WhatsApp Grupları", usage: 2100, trend: "+30%", status: "active" },
  { name: "Şehir Haberleri", usage: 4500, trend: "+22%", status: "active" },
];


const pendingApprovals = [
  { id: "1", type: "ambassador", name: "Mehmet Yılmaz", city: "Münih", date: "2026-03-28" },
  { id: "2", type: "consultant", name: "Ayşe Kara", city: "Amsterdam", date: "2026-03-27" },
  { id: "3", type: "business", name: "TürkMarkt GmbH", city: "Berlin", date: "2026-03-26" },
  { id: "4", type: "event", name: "Nevruz Kutlaması", city: "Londra", date: "2026-03-25" },
];

// Mock messages
const mockMessages: Record<string, Array<{ id: string; from: string; text: string; time: string; unread?: boolean }>> = {
  ambassador: [
    { id: "a1", from: "Ali Demir (Berlin Elçisi)", text: "Bu hafta 3 yeni danışman onboard ettik.", time: "14:20", unread: true },
    { id: "a2", from: "Selin Ak (Londra Elçisi)", text: "Etkinlik mekanı onayı bekliyorum.", time: "12:45", unread: true },
    { id: "a3", from: "Kemal Öz (Dubai Elçisi)", text: "Ramadan etkinliği için sponsor bulduk!", time: "10:30" },
    { id: "a4", from: "Zeynep Tan (Paris Elçisi)", text: "WhatsApp grubunda 500 kişiyi geçtik.", time: "Dün" },
  ],
  users: [
    { id: "u1", from: "Fatma Yıldız (Danışman)", text: "Profil doğrulama sürecim nerede?", time: "15:10", unread: true },
    { id: "u2", from: "Osman Kaya (İşletme)", text: "Kupon modülünde bir bug var sanırım.", time: "13:55" },
    { id: "u3", from: "Derya Su (V/Blogger)", text: "Blog yarışması sonuçları ne zaman?", time: "11:20" },
    { id: "u4", from: "Emre Can (Bireysel)", text: "Taşınma raporumu indiremiyorum.", time: "09:40" },
  ],
  support: [
    { id: "s1", from: "Ticket #1042", text: "Ödeme işlemi başarısız oldu, 2 gündür çözülmedi.", time: "16:00", unread: true },
    { id: "s2", from: "Ticket #1041", text: "Profil fotoğrafı yüklenemiyor.", time: "14:30", unread: true },
    { id: "s3", from: "Ticket #1039", text: "Etkinlik sayfasında 404 hatası alıyorum.", time: "Dün" },
    { id: "s4", from: "Ticket #1038", text: "AI Twin cevapları çok genel kalıyor.", time: "Dün" },
  ],
};

// ─── KPI Cards ───────────────────────────────────────────
const kpis = [
  { label: "Toplam Kullanıcı", value: "5,117", change: "+12%", icon: Users, color: "text-primary" },
  { label: "Aktif Danışman", value: "380", change: "+8%", icon: Briefcase, color: "text-chart-2" },
  { label: "Şehir Elçisi", value: "42", change: "+5", icon: Flag, color: "text-chart-1" },
  { label: "Aylık Gelir", value: "€11,500", change: "+24%", icon: DollarSign, color: "text-chart-3" },
  { label: "Aktif Etkinlik", value: "128", change: "+15", icon: Calendar, color: "text-chart-4" },
  { label: "Sayfa Görüntülenme", value: "89.2K", change: "+18%", icon: Eye, color: "text-chart-5" },
];

const AdminDashboard = () => {
  const [msgTab, setMsgTab] = useState<"ambassador" | "users" | "support">("ambassador");
  const [msgInput, setMsgInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [revenueSortBy, setRevenueSortBy] = useState<"feature" | "userType" | "country" | "city">("feature");
  const [createEventOpen, setCreateEventOpen] = useState(false);

  const filteredFeatures = platformFeatures.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRevenue = useMemo(() => {
    const dataMap = {
      feature: overviewRevenueByFeature,
      userType: overviewRevenueByUserType,
      country: overviewRevenueByCountry,
      city: overviewRevenueByCity,
    };
    return dataMap[revenueSortBy];
  }, [revenueSortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              </div>
              <p className="text-muted-foreground">Platform yönetimi ve analitik merkezi</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setCreateEventOpen(true)} className="gap-2">
                <PlusCircle className="h-4 w-4" /> CorteQS Etkinliği Oluştur
              </Button>
              <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                <Activity className="h-3 w-3" /> Canlı
              </Badge>
            </div>
          </div>

          {/* Create Event Dialog */}
          <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni CorteQS Etkinliği</DialogTitle>
              </DialogHeader>
              <CreateEventForm
                organizerType="corteqs"
                onClose={() => setCreateEventOpen(false)}
                onCreated={() => setCreateEventOpen(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="mb-6">
              <TabsTrigger value="overview" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Genel Bakış
              </TabsTrigger>
              <TabsTrigger value="revenue" className="gap-1.5">
                <Wallet className="h-3.5 w-3.5" /> Gelir Takibi
              </TabsTrigger>
              <TabsTrigger value="ambassadors" className="gap-1.5">
                <Flag className="h-3.5 w-3.5" /> Elçi Takibi
              </TabsTrigger>
              <TabsTrigger value="vbloggers" className="gap-1.5">
                <PenLine className="h-3.5 w-3.5" /> V/Blogger Takibi
              </TabsTrigger>
              <TabsTrigger value="welcomepack" className="gap-1.5">
                <Gift className="h-3.5 w-3.5" /> Hoşgeldin Paketi
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Grupları
              </TabsTrigger>
              <TabsTrigger value="aitwin" className="gap-1.5">
                <Bot className="h-3.5 w-3.5" /> AI Twin Başvuruları
              </TabsTrigger>
            </TabsList>

            <TabsContent value="revenue">
              <RevenueTracker />
            </TabsContent>

            <TabsContent value="ambassadors">
              <AmbassadorDashboard />
            </TabsContent>

            <TabsContent value="vbloggers">
              <VBloggerDashboard />
            </TabsContent>

            <TabsContent value="welcomepack">
              <WelcomePackTracker />
            </TabsContent>

            <TabsContent value="whatsapp">
              <WhatsAppLandingsModeration />
            </TabsContent>

            <TabsContent value="aitwin">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" /> AI Twin Aktivasyon Başvuruları
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Premium Pro danışmanlardan gelen başvurular · Veri yeterliliği & RAG eğitim onayı
                    </p>
                  </div>
                  <Badge className="bg-primary/15 text-primary border-primary/30">3 Beklemede</Badge>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "Dr. Selin Yılmaz", category: "Sağlık", docs: "84 sayfa", audio: "12dk", video: "1:30", status: "pending", premium: true },
                    { name: "Av. Murat Demir", category: "Hukuk", docs: "156 sayfa", audio: "22dk", video: "2:10", status: "pending", premium: true },
                    { name: "Ayşe Korkmaz", category: "Eğitim", docs: "32 sayfa", audio: "6dk", video: "0:45", status: "insufficient", premium: true },
                    { name: "Burak Çelik", category: "Vize", docs: "—", audio: "—", video: "—", status: "needs_upgrade", premium: false },
                  ].map((req, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-muted/30 flex items-center gap-4 flex-wrap">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground text-sm">{req.name}</p>
                          {req.premium ? (
                            <Badge className="bg-gold/15 text-gold border-gold/30 text-[10px] gap-0.5">
                              <Crown className="h-2.5 w-2.5" /> Premium Pro
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Freemium</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">· {req.category}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          📄 {req.docs} · 🎙️ {req.audio} · 🎥 {req.video}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {req.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" className="gap-1 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Onayla & Eğit
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-xs">
                              <XCircle className="h-3.5 w-3.5 text-destructive" /> Reddet
                            </Button>
                          </>
                        )}
                        {req.status === "insufficient" && (
                          <Badge variant="outline" className="text-xs border-gold/40 text-gold">
                            Veri yetersiz · Twin Boost öner
                          </Badge>
                        )}
                        {req.status === "needs_upgrade" && (
                          <Badge variant="outline" className="text-xs border-destructive/40 text-destructive">
                            Premium Pro yükseltmesi bekleniyor
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                  ℹ️ Onaylanan başvurularda RAG modeli eğitilir, danışmana e-posta ile bildirilir ve profilinde
                  "AI Twin Aktif" rozeti otomatik açılır. Tüm AI Twin gelirinden <span className="font-bold text-foreground">%10</span> platform kesintisi uygulanır.
                </div>
              </div>
            </TabsContent>

            <TabsContent value="overview">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-4 w-4 ${kpi.color}`} />
                      <span className="text-xs text-emerald-500 font-semibold">{kpi.change}</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Growth */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Kullanıcı Büyümesi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyUsers}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#colorUsers)" strokeWidth={2} name="Toplam" />
                    <Area type="monotone" dataKey="active" stroke="hsl(var(--chart-2))" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Aktif" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-chart-3" />
                  Gelir Dağılımı (€)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="consultants" stackId="a" fill="hsl(var(--primary))" name="Danışmanlık" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="events" stackId="a" fill="hsl(var(--chart-2))" name="Etkinlikler" />
                    <Bar dataKey="premium" stackId="a" fill="hsl(var(--chart-4))" name="Premium" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gelir Sıralaması + Kullanıcı Dağılımı */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Gelir Sıralaması - takes 2 cols */}
            <Card className="border-border lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Gelir Sıralaması
                  </CardTitle>
                  <Select value={revenueSortBy} onValueChange={(v) => setRevenueSortBy(v as typeof revenueSortBy)}>
                    <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">Özellik Bazlı</SelectItem>
                      <SelectItem value="userType">Kullanıcı Türü</SelectItem>
                      <SelectItem value="country">Ülke Bazlı</SelectItem>
                      <SelectItem value="city">Şehir Bazlı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[320px]">
                  <div className="divide-y divide-border">
                    {sortedRevenue.map((item, i) => {
                      const maxRev = Math.max(...sortedRevenue.map(x => x.revenue), 1);
                      return (
                        <div key={item.name} className="py-3 px-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                              <span className="text-sm font-medium text-foreground">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-primary">€{item.revenue.toLocaleString()}</span>
                              <Badge variant="secondary" className="text-[10px] text-emerald-600">{item.change}</Badge>
                            </div>
                          </div>
                          <div className="ml-8 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary/50 transition-all" style={{ width: `${(item.revenue / maxRev) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Kullanıcı Dağılımı */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Kullanıcı Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={userTypeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {userTypeDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Platform Features Tracking */}
            <Card className="border-border lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Platform Fonksiyonları
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[360px]">
                  <div className="divide-y divide-border">
                    {filteredFeatures.map((f) => (
                      <div key={f.name} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{f.usage.toLocaleString()} kullanım</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-500">{f.trend}</span>
                          <Badge variant="secondary" className="text-[10px]">Aktif</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Messaging Panel */}
            <Card className="border-border lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-chart-2" />
                  Mesajlar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={msgTab} onValueChange={(v) => setMsgTab(v as typeof msgTab)}>
                  <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
                    <TabsTrigger value="ambassador" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-2.5 gap-1">
                      <Flag className="h-3 w-3" />
                      Elçiler
                      <Badge variant="destructive" className="text-[9px] h-4 px-1 ml-1">2</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-2.5 gap-1">
                      <Users className="h-3 w-3" />
                      Kullanıcılar
                      <Badge variant="destructive" className="text-[9px] h-4 px-1 ml-1">1</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="support" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-2.5 gap-1">
                      <Bell className="h-3 w-3" />
                      Destek
                      <Badge variant="destructive" className="text-[9px] h-4 px-1 ml-1">2</Badge>
                    </TabsTrigger>
                  </TabsList>

                  {(["ambassador", "users", "support"] as const).map((tab) => (
                    <TabsContent key={tab} value={tab} className="m-0">
                      <ScrollArea className="h-[260px]">
                        <div className="divide-y divide-border">
                          {mockMessages[tab].map((msg) => (
                            <div key={msg.id} className={`px-4 py-3 hover:bg-muted/30 transition-colors ${msg.unread ? "bg-primary/5" : ""}`}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-semibold text-foreground">{msg.from}</p>
                                <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{msg.text}</p>
                              {msg.unread && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="border-t border-border p-3 flex gap-2">
                        <Input
                          placeholder="Mesaj yaz..."
                          value={msgInput}
                          onChange={(e) => setMsgInput(e.target.value)}
                          className="h-8 text-xs flex-1"
                        />
                        <Button size="sm" className="h-8 px-3">
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card className="border-border lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-chart-4" />
                  Bekleyen Onaylar
                  <Badge variant="destructive" className="text-[9px] h-4 px-1.5">{pendingApprovals.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[360px]">
                  <div className="divide-y divide-border">
                    {pendingApprovals.map((item) => (
                      <div key={item.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {item.type === "ambassador" ? "Elçi" :
                             item.type === "consultant" ? "Danışman" :
                             item.type === "business" ? "İşletme" : "Etkinlik"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">📍 {item.city} · {item.date}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" className="h-7 text-xs flex-1">Onayla</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1">Reddet</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
