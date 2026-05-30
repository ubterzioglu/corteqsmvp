import {
  Users, Calendar, TrendingUp, DollarSign, MapPin,
  Wallet, ArrowUpRight, ArrowDownRight, Clock, CreditCard,
  MessageSquare, Bell, Target, Star, Globe, Plus,
  Send, CheckCircle, XCircle, Eye, Settings, ExternalLink, Video, ArrowLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import CreateEventForm from "@/components/CreateEventForm";
import EventManagePanel from "@/components/EventManagePanel";
import StripeTransactionsPanel, { type StripeTxn } from "@/components/StripeTransactionsPanel";
import NotificationsList from "@/components/NotificationsList";

type AmbassadorEvent = {
  id: number;
  title: string;
  date: string;
  attendees: number;
  maxCapacity: number;
  status: "upcoming" | "completed";
};

const ProfileAmbassador = () => {
  const [messageText, setMessageText] = useState("");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [managingEvent, setManagingEvent] = useState<AmbassadorEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<AmbassadorEvent | null>(null);
  const [profileSettings, setProfileSettings] = useState({
    showWallet: true,
    showKpis: true,
    showOnboarding: true,
    showEvents: true,
    whatsappCtaEnabled: true,
    liveCallCtaEnabled: true,
    profilePublic: true,
  });

  // Mock KPI data
  const kpis = {
    usersOnboarded: 47,
    usersTarget: 100,
    activeAdvisors: 12,
    advisorsTarget: 20,
    eventsOrganized: 3,
    eventsTarget: 5,
    revenueGenerated: 1240,
    totalAttendees: 144,
  };

  const stripeTxns: StripeTxn[] = [
    { id: "py_001", date: "2026-03-28", description: "Danışman onboarding komisyonu", direction: "in", amount: 25, status: "succeeded", source: "Komisyon", stripeRef: "py_3PXa1b" },
    { id: "py_002", date: "2026-03-25", description: "Etkinlik bilet komisyonu", direction: "in", amount: 45, status: "succeeded", source: "Etkinlik", stripeRef: "py_3PXa2c" },
    { id: "py_003", date: "2026-03-22", description: "İşletme kayıt komisyonu", direction: "in", amount: 30, status: "succeeded", source: "Komisyon", stripeRef: "py_3PXa3d" },
    { id: "po_004", date: "2026-03-20", description: "Ödeme talebi (payout)", direction: "out", amount: 200, status: "succeeded", source: "Payout", stripeRef: "po_3PXa4e" },
    { id: "py_005", date: "2026-03-18", description: "Kullanıcı onboarding x5", direction: "in", amount: 50, status: "succeeded", source: "Komisyon", stripeRef: "py_3PXa5f" },
    { id: "py_006", date: "2026-03-15", description: "Etkinlik organizasyon bonusu", direction: "in", amount: 100, status: "succeeded", source: "Bonus", stripeRef: "py_3PXa6g" },
  ];

  const events = [
    { id: 1, title: "Berlin Networking Buluşması", date: "15 Nisan 2026", attendees: 45, maxCapacity: 60, status: "upcoming" as const },
    { id: 2, title: "Türk Girişimciler Meetup", date: "28 Mart 2026", attendees: 32, maxCapacity: 40, status: "completed" as const },
    { id: 3, title: "CorteQS Tanıtım Gecesi", date: "10 Mart 2026", attendees: 67, maxCapacity: 80, status: "completed" as const },
  ];

  const onboardedUsers = [
    { name: "Ahmet Y.", type: "Bireysel", date: "27 Mar", status: "active" },
    { name: "Selin K.", type: "Danışman", date: "25 Mar", status: "active" },
    { name: "Oğuz T.", type: "İşletme", date: "22 Mar", status: "active" },
    { name: "Deniz A.", type: "Bireysel", date: "20 Mar", status: "pending" },
    { name: "Fatma B.", type: "V/Blogger", date: "18 Mar", status: "active" },
    { name: "Kerem S.", type: "Bireysel", date: "15 Mar", status: "inactive" },
  ];

  const messages = [
    { from: "HQ", text: "Berlin etkinliği için poster hazır. İndirmek için paneli kontrol edin.", time: "2 saat önce", read: false },
    { from: "Elif K.", text: "Networking buluşması için mekan ayarlandı!", time: "5 saat önce", read: true },
    { from: "HQ", text: "Bu haftaki performans raporunuz hazır.", time: "1 gün önce", read: true },
    { from: "Murat D.", text: "London elçisi olarak deneyimlerimi paylaşmak isterim.", time: "2 gün önce", read: true },
  ];

  // Notifications loaded live via NotificationsList component.

  return (
    <>
      {/* Ambassador header */}
      <div className="bg-card rounded-2xl border border-gold/30 p-6 md:p-8 shadow-card mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gold/15 flex items-center justify-center shrink-0">
            <Star className="h-8 w-8 text-gold" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Şehir Elçisi Paneli
              <Badge className="bg-gold/15 text-gold border-gold/30">Berlin</Badge>
            </h1>
            <p className="text-muted-foreground">Topluluk, performans, etkinlik ve gelir yönetimi</p>
          </div>
        </div>
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

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="transactions" className="gap-1.5"><CreditCard className="h-4 w-4" /> İşlemlerim</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5"><Calendar className="h-4 w-4" /> Etkinlikler</TabsTrigger>
          <TabsTrigger value="onboarding" className="gap-1.5"><Users className="h-4 w-4" /> Onboarding</TabsTrigger>
          <TabsTrigger value="messaging" className="gap-1.5"><MessageSquare className="h-4 w-4" /> Mesajlar</TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5"><TrendingUp className="h-4 w-4" /> Performans</TabsTrigger>
          <TabsTrigger value="community" className="gap-1.5"><Globe className="h-4 w-4" /> Topluluk</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-4 w-4" /> Ayarlar</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-4 w-4" /> Bildirimler</TabsTrigger>
        </TabsList>

        {/* TRANSACTIONS (Stripe) */}
        <TabsContent value="transactions" className="mt-6">
          <StripeTransactionsPanel transactions={stripeTxns} stripeConnected={false} />
        </TabsContent>

        {/* EVENTS */}
        <TabsContent value="events" className="mt-6">
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
                {events.map((ev) => (
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
            const detailedOnboarded = [
              { name: "Ahmet Y.", type: "Bireysel", date: "27 Mar", status: "active", revenue: 0, commission: 5 },
              { name: "Selin K.", type: "Danışman", date: "25 Mar", status: "active", revenue: 480, commission: 48 },
              { name: "Oğuz T. (Anatolia Restaurant)", type: "İşletme", date: "22 Mar", status: "active", revenue: 1850, commission: 92.5 },
              { name: "Deniz A.", type: "Bireysel", date: "20 Mar", status: "pending", revenue: 0, commission: 0 },
              { name: "Fatma B.", type: "V/Blogger", date: "18 Mar", status: "active", revenue: 220, commission: 22 },
              { name: "Kerem S. (KS Consulting)", type: "İşletme", date: "15 Mar", status: "active", revenue: 3200, commission: 160 },
              { name: "Murat T.", type: "Danışman", date: "12 Mar", status: "active", revenue: 360, commission: 36 },
            ];
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
        <TabsContent value="messaging" className="mt-6">
          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-turquoise" /> Mesajlar
              </h3>
              <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                {messages.map((m, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${!m.read ? "bg-primary/5 border border-primary/10" : "bg-muted/50"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.from === "HQ" ? "bg-gold/15" : "bg-primary/10"}`}>
                      {m.from === "HQ" ? <Star className="h-4 w-4 text-gold" /> : <Users className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{m.from}</p>
                        {!m.read && <Badge className="bg-primary/15 text-primary text-[10px] px-1.5 py-0">Yeni</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{m.text}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{m.time}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Mesaj yaz..."
                  className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <Button className="gap-1.5 shrink-0">
                  <Send className="h-4 w-4" /> Gönder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Haftalık Performans</h3>
                <div className="space-y-4">
                  {[
                    { label: "Yeni Kullanıcı", current: 8, target: 15 },
                    { label: "Danışman Eşleşme", current: 3, target: 5 },
                    { label: "Etkinlik Katılım", current: 22, target: 30 },
                    { label: "WhatsApp Aktivite", current: 85, target: 100 },
                  ].map((m, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">{m.label}</span>
                        <span className="text-muted-foreground">{m.current}/{m.target}</span>
                      </div>
                      <Progress value={(m.current / m.target) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-gold" /> Aylık Gelir Özeti</h3>
                <div className="space-y-3">
                  {[
                    { month: "Ocak", val: 320 },
                    { month: "Şubat", val: 480 },
                    { month: "Mart", val: 440 },
                  ].map((item) => (
                    <div key={item.month} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-12">{item.month}</span>
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div className="bg-gold rounded-full h-3" style={{ width: `${(item.val / 500) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-foreground w-16 text-right">€{item.val}</span>
                    </div>
                  ))}
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm font-semibold text-foreground mb-1">📱 Elçiler WhatsApp Grubu</p>
                  <p className="text-xs text-muted-foreground mb-3">Tüm şehir elçileriyle koordinasyon</p>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Gruba Katıl
                  </Button>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm font-semibold text-foreground mb-1">📍 Berlin WhatsApp Grubu</p>
                  <p className="text-xs text-muted-foreground mb-3">Kendi şehrinizin yerel grubu</p>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Grup Yönetimi
                  </Button>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <h4 className="font-semibold text-foreground text-sm mb-2">Otomatik Mesajlaşma</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Onboarding mesajları — yeni kullanıcı kaydında</p>
                  <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Haftalık performans hatırlatması</p>
                  <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Etkinlik bildirimleri</p>
                  <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> İnaktif elçi uyarısı</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-border lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" /> Profil Görünüm Yönetimi
                </h3>

                <div className="space-y-5">
                  <div className="rounded-xl border border-border p-4 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground mb-3">Profil Modülleri</p>
                    <div className="space-y-3">
                      {[
                        { key: "showKpis", label: "KPI kartları görünsün" },
                        { key: "showWallet", label: "İşlemlerim (Stripe) görünsün" },
                        { key: "showEvents", label: "Etkinlik verileri görünsün" },
                        { key: "showOnboarding", label: "Onboarding sayıları görünsün" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <Label className="text-sm text-foreground">{item.label}</Label>
                          <Switch
                            checked={profileSettings[item.key as keyof typeof profileSettings] as boolean}
                            onCheckedChange={(checked) =>
                              setProfileSettings((prev) => ({ ...prev, [item.key]: checked }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground mb-3">CTA Yönetimi (Mock)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-link">WhatsApp Linki</Label>
                        <Input id="whatsapp-link" defaultValue="https://wa.me/491234567890" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="live-link">Canlı Görüşme Linki</Label>
                        <Input id="live-link" defaultValue="https://meet.google.com" />
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
                      <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 flex-1">
                        <Label className="text-sm text-foreground">Canlı Görüş CTA aktif</Label>
                        <Switch
                          checked={profileSettings.liveCallCtaEnabled}
                          onCheckedChange={(checked) => setProfileSettings((prev) => ({ ...prev, liveCallCtaEnabled: checked }))}
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
                      {profileSettings.liveCallCtaEnabled && <Badge variant="secondary">Canlı Görüş</Badge>}
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
                      <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
                        <Video className="h-3.5 w-3.5" /> Canlı Görüş CTA Test Et
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
