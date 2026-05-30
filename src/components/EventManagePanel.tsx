import { useState } from "react";
import {
  Users, Calendar, MapPin, Clock, Eye, TrendingUp,
  Mail, Download, Edit3, CheckCircle, XCircle, AlertTriangle,
  CreditCard, Globe, Link2, Ticket, BarChart3, Send, ArrowLeft,
  ExternalLink, Copy, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface EventManagePanelProps {
  event: {
    id: number;
    title: string;
    date: string;
    attendees: number;
    status?: string;
    type?: string;
  };
  onBack: () => void;
}

const EventManagePanel = ({ event, onBack }: EventManagePanelProps) => {
  const [isEditing, setIsEditing] = useState(false);

  // Mock detailed event data
  const eventDetail = {
    title: event.title,
    description: "Avrupa'daki Türk teknoloji profesyonellerini bir araya getiren, networking ve bilgi paylaşımı odaklı etkinlik. Sektör liderleri ve girişimciler deneyimlerini paylaşacak.",
    date: event.date,
    time: "14:00 - 18:00",
    location: "Türk-Alman Ticaret Odası, Berlin",
    isOnline: true,
    onlineUrl: "https://zoom.us/j/123456789",
    capacity: 150,
    ticketPrice: 15,
    freeTicket: false,
    image: "/placeholder.svg",
    category: event.type || "Teknoloji",
    isFeaturedHome: true,
    isFeaturedCountry: true,
    emailNotification: true,
  };

  const ticketStats = {
    totalSold: 87,
    capacity: 150,
    revenue: 1305,
    checkedIn: 0,
    refunded: 3,
    pending: 12,
  };

  const registrations = [
    { id: 1, name: "Emre Aydın", email: "emre@mail.com", date: "08 Mar", status: "Onaylı", ticketType: "Standart", checkedIn: false },
    { id: 2, name: "Elif Demir", email: "elif@mail.com", date: "07 Mar", status: "Onaylı", ticketType: "VIP", checkedIn: false },
    { id: 3, name: "Can Özdemir", email: "can@mail.com", date: "07 Mar", status: "Onaylı", ticketType: "Standart", checkedIn: false },
    { id: 4, name: "Zeynep Arslan", email: "zeynep@mail.com", date: "06 Mar", status: "Onaylı", ticketType: "Standart", checkedIn: false },
    { id: 5, name: "Ahmet Yılmaz", email: "ahmet@mail.com", date: "06 Mar", status: "Beklemede", ticketType: "Standart", checkedIn: false },
    { id: 6, name: "Fatma Kaya", email: "fatma@mail.com", date: "05 Mar", status: "İade", ticketType: "Standart", checkedIn: false },
  ];

  const dailyRegistrations = [
    { day: "03 Mar", count: 8 },
    { day: "04 Mar", count: 12 },
    { day: "05 Mar", count: 18 },
    { day: "06 Mar", count: 22 },
    { day: "07 Mar", count: 15 },
    { day: "08 Mar", count: 12 },
  ];

  const announcements = [
    { title: "Etkinlik hatırlatması gönderildi", date: "07 Mar", recipients: 84, type: "E-posta" },
    { title: "Program güncelleme duyurusu", date: "05 Mar", recipients: 72, type: "E-posta" },
    { title: "WhatsApp grup duyurusu", date: "04 Mar", recipients: 320, type: "WhatsApp" },
  ];

  const maxBar = Math.max(...dailyRegistrations.map(d => d.count));

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <Button variant="ghost" size="sm" className="gap-1" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Etkinliklere Dön
      </Button>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{eventDetail.title}</h1>
              <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30 text-xs">
                {event.status || "Yaklaşan"}
              </Badge>
              {eventDetail.isFeaturedHome && (
                <Badge variant="outline" className="text-xs gap-1 border-gold/40 text-gold">
                  <TrendingUp className="h-3 w-3" /> Öne Çıkan
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {eventDetail.date} · {eventDetail.time}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {eventDetail.location}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1">
              <Copy className="h-3 w-3" /> Link Kopyala
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink className="h-3 w-3" /> Önizle
            </Button>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Satılan Bilet", value: ticketStats.totalSold, icon: Ticket, color: "text-primary" },
          { label: "Kapasite", value: `${ticketStats.totalSold}/${ticketStats.capacity}`, icon: Users, color: "text-turquoise" },
          { label: "Gelir", value: `€${ticketStats.revenue}`, icon: CreditCard, color: "text-success" },
          { label: "İade", value: ticketStats.refunded, icon: XCircle, color: "text-destructive" },
          { label: "Beklemede", value: ticketStats.pending, icon: Clock, color: "text-gold" },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 shadow-card text-center">
            <stat.icon className={`h-4 w-4 ${stat.color} mx-auto mb-1`} />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Management tabs */}
      <Tabs defaultValue="registrations" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="registrations" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Kayıtlar</TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5 text-xs"><Ticket className="h-3.5 w-3.5" /> Bilet & Gelir</TabsTrigger>
          <TabsTrigger value="announce" className="gap-1.5 text-xs"><Send className="h-3.5 w-3.5" /> Duyuru</TabsTrigger>
          <TabsTrigger value="edit" className="gap-1.5 text-xs"><Edit3 className="h-3.5 w-3.5" /> Düzenle</TabsTrigger>
        </TabsList>

        {/* REGISTRATIONS */}
        <TabsContent value="registrations" className="mt-4">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Katılımcı Listesi ({registrations.length})
              </h2>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-3 w-3" /> CSV İndir
              </Button>
            </div>

            <div className="space-y-2">
              {registrations.map((reg) => (
                <div key={reg.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {reg.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{reg.name}</p>
                    <p className="text-xs text-muted-foreground">{reg.email} · {reg.date}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{reg.ticketType}</Badge>
                  <Badge
                    className={`text-[10px] shrink-0 ${
                      reg.status === "Onaylı" ? "bg-turquoise/15 text-turquoise border-turquoise/30" :
                      reg.status === "Beklemede" ? "bg-gold/15 text-gold border-gold/30" :
                      "bg-destructive/15 text-destructive border-destructive/30"
                    }`}
                  >
                    {reg.status === "Onaylı" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {reg.status === "Beklemede" && <Clock className="h-3 w-3 mr-1" />}
                    {reg.status === "İade" && <XCircle className="h-3 w-3 mr-1" />}
                    {reg.status}
                  </Badge>
                  {reg.status === "Beklemede" && (
                    <Button size="sm" variant="outline" className="text-xs h-7">Onayla</Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TICKETS & REVENUE */}
        <TabsContent value="tickets" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Registration trend */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Kayıt Trendi
              </h2>
              <div className="space-y-2">
                {dailyRegistrations.map((d) => (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-14">{d.day}</span>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${(d.count / maxBar) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground w-6 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue breakdown */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-success" /> Gelir Detayı
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Standart Bilet (72×)", amount: "€1.080", pct: 83 },
                  { label: "VIP Bilet (15×)", amount: "€225", pct: 17 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{item.label}</span>
                      <span className="font-semibold text-foreground">{item.amount}</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-success rounded-full h-2" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-3 mt-3 flex justify-between">
                  <span className="font-bold text-foreground">Toplam Gelir</span>
                  <span className="font-bold text-success">€{ticketStats.revenue}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Platform Komisyonu (%5)</span>
                  <span>-€{(ticketStats.revenue * 0.05).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-foreground">Net Gelir</span>
                  <span className="font-semibold text-foreground">€{(ticketStats.revenue * 0.95).toFixed(0)}</span>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-lg bg-muted/50">
                <h3 className="text-sm font-semibold text-foreground mb-2">Bilet Kapasitesi</h3>
                <div className="bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-primary rounded-full h-4 flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                    style={{ width: `${(ticketStats.totalSold / ticketStats.capacity) * 100}%` }}
                  >
                    {Math.round((ticketStats.totalSold / ticketStats.capacity) * 100)}%
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ticketStats.totalSold} / {ticketStats.capacity} bilet satıldı · {ticketStats.capacity - ticketStats.totalSold} kalan
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ANNOUNCEMENTS */}
        <TabsContent value="announce" className="mt-4">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Duyuru & Bildirimler
            </h2>

            {/* Send new announcement */}
            <div className="p-4 rounded-xl border border-border mb-5">
              <h3 className="font-semibold text-foreground mb-3">Yeni Duyuru Gönder</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Başlık</Label>
                  <Input placeholder="ör: Program değişikliği hakkında" defaultValue="Etkinlik programı güncellendi" />
                </div>
                <div>
                  <Label className="text-xs">Mesaj</Label>
                  <Textarea
                    placeholder="Katılımcılara gönderilecek mesajı yazın..."
                    rows={3}
                    defaultValue="Değerli katılımcımız, etkinlik programımızda küçük bir güncelleme yapıldı. Güncel programı etkinlik sayfamızdan inceleyebilirsiniz."
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch defaultChecked />
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> E-posta ({registrations.filter(r => r.status === "Onaylı").length} kişi)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch />
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> WhatsApp Grubu
                  </label>
                </div>
                <Button className="gap-2"><Send className="h-4 w-4" /> Duyuru Gönder</Button>
              </div>
            </div>

            {/* Past announcements */}
            <h3 className="font-semibold text-foreground mb-3 text-sm">Geçmiş Duyurular</h3>
            <div className="space-y-2">
              {announcements.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {a.type === "E-posta" ? (
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-turquoise shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.date} · {a.recipients} alıcı</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* EDIT EVENT */}
        <TabsContent value="edit" className="mt-4">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" /> Etkinlik Detaylarını Düzenle
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <Label>Etkinlik Adı</Label>
                  <Input defaultValue={eventDetail.title} />
                </div>
                <div>
                  <Label>Açıklama</Label>
                  <Textarea defaultValue={eventDetail.description} rows={4} />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Input defaultValue={eventDetail.category} />
                </div>
                <div>
                  <Label>Etkinlik Görseli</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-muted/30">
                    <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Mevcut görsel yüklü</p>
                    <Button variant="outline" size="sm" className="mt-2">Değiştir</Button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tarih</Label>
                    <Input defaultValue="2026-03-22" type="date" />
                  </div>
                  <div>
                    <Label>Saat</Label>
                    <Input defaultValue="14:00" type="time" />
                  </div>
                </div>
                <div>
                  <Label>Mekan / Adres</Label>
                  <Input defaultValue={eventDetail.location} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground text-sm">Online Katılım</p>
                    <p className="text-xs text-muted-foreground">Zoom / Meet bağlantısı</p>
                  </div>
                  <Switch defaultChecked={eventDetail.isOnline} />
                </div>
                {eventDetail.isOnline && (
                  <div>
                    <Label>Online Bağlantı URL</Label>
                    <Input defaultValue={eventDetail.onlineUrl} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Kapasite</Label>
                    <Input defaultValue={eventDetail.capacity} type="number" />
                  </div>
                  <div>
                    <Label>Bilet Fiyatı (€)</Label>
                    <Input defaultValue={eventDetail.ticketPrice} type="number" />
                  </div>
                </div>

                {/* Boost options */}
                <div className="border border-border rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gold" /> Tanıtım Seçenekleri
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Ana Sayfa Öne Çıkan</p>
                      <p className="text-xs text-muted-foreground">€29/hafta</p>
                    </div>
                    <Switch defaultChecked={eventDetail.isFeaturedHome} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Ülke Aramasında Öne Çıkan</p>
                      <p className="text-xs text-muted-foreground">€19/hafta</p>
                    </div>
                    <Switch defaultChecked={eventDetail.isFeaturedCountry} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">E-posta Duyurusu</p>
                      <p className="text-xs text-muted-foreground">€15/duyuru</p>
                    </div>
                    <Switch defaultChecked={eventDetail.emailNotification} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <Button className="gap-2"><CheckCircle className="h-4 w-4" /> Değişiklikleri Kaydet</Button>
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                <XCircle className="h-4 w-4" /> Etkinliği İptal Et
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventManagePanel;
