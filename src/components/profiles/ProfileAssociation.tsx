import { useState } from "react";
import EventManagePanel from "@/components/EventManagePanel";
import {
  Users, MapPin, Globe, Calendar, Heart, Megaphone,
  TrendingUp, Settings, Bell, Mail, MessageSquare,
  Plus, ChevronRight, Star, Eye, BarChart3, FileText, ArrowLeft, Crown, Inbox
} from "lucide-react";
import ConsultantServiceRequests from "@/components/ConsultantServiceRequests";
import SocialMediaCampaignDialog from "@/components/SocialMediaCampaignDialog";
import CategoryShowcasePurchase from "@/components/CategoryShowcasePurchase";
import CreateEventForm from "@/components/CreateEventForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import WhatsAppGroupsTab from "@/components/profiles/WhatsAppGroupsTab";

const ProfileAssociation = () => {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [managingEvent, setManagingEvent] = useState<null | typeof upcomingEvents[0]>(null);
  const association = {
    name: "Almanya Türk Toplumu Derneği",
    type: "Dernek",
    email: "info@corteqs.net",
    website: "att-berlin.de",
    country: "Almanya",
    city: "Berlin",
    avatar: "ATT",
    members: 1250,
    founded: 2008,
    description: "Berlin ve çevresinde yaşayan Türk diasporasının sosyal, kültürel ve ekonomik entegrasyonuna katkıda bulunan sivil toplum kuruluşu.",
    balance: 3400.00,
  };

  const upcomingEvents = [
    { id: 1, title: "Nevruz Kutlaması", date: "21 Mar 2026", attendees: 200, type: "Kültürel" },
    { id: 2, title: "Networking Yemeği", date: "18 Mar 2026", attendees: 60, type: "Sosyal" },
    { id: 3, title: "Vize Bilgilendirme Semineri", date: "25 Mar 2026", attendees: 85, type: "Eğitim" },
  ];

  const members = [
    { name: "Emre Aydın", role: "Üye", since: "2023", active: true },
    { name: "Elif Demir", role: "Yönetim Kurulu", since: "2019", active: true },
    { name: "Can Özdemir", role: "Üye", since: "2021", active: true },
    { name: "Zeynep Arslan", role: "Gönüllü", since: "2024", active: false },
  ];

  const stats = {
    totalMembers: 1250,
    activeMembers: 890,
    eventsThisYear: 24,
    totalDonations: 12500,
  };

  return (
    <>
      {/* Association header */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-turquoise/20 flex items-center justify-center text-turquoise font-bold text-xl shrink-0">
            {association.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{association.name}</h1>
              <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30">{association.type}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{association.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {association.city}, {association.country}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {association.members} üye</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {association.founded}'den beri</span>
              <a href={`https://${association.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <Globe className="h-3 w-3" /> {association.website}
              </a>
            </div>
          </div>
          <div className="bg-turquoise/10 rounded-xl p-4 text-center shrink-0 min-w-[140px]">
            <Heart className="h-5 w-5 text-turquoise mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">€{association.balance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Dernek Bakiyesi</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Toplam Üye", value: stats.totalMembers, icon: Users, color: "text-primary" },
          { label: "Aktif Üye", value: stats.activeMembers, icon: Star, color: "text-turquoise" },
          { label: "Bu Yıl Etkinlik", value: stats.eventsThisYear, icon: Calendar, color: "text-gold" },
          { label: "Toplam Bağış", value: `€${(stats.totalDonations / 1000).toFixed(1)}K`, icon: Heart, color: "text-destructive" },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-card text-center">
            <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="events" className="gap-1.5"><Calendar className="h-4 w-4" /> Etkinlikler</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5"><Inbox className="h-4 w-4" /> Teklif Talepleri</TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5"><Users className="h-4 w-4" /> Üyeler</TabsTrigger>
          <TabsTrigger value="communications" className="gap-1.5"><Mail className="h-4 w-4" /> İletişim</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analitik</TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1.5"><Megaphone className="h-4 w-4" /> Tanıtım</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-4 w-4" /> Ayarlar</TabsTrigger>
        </TabsList>

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
                  <Calendar className="h-5 w-5 text-turquoise" /> Dernek Etkinlikleri
                </h2>
                <Button className="gap-2" onClick={() => setShowCreateEvent(true)}><Plus className="h-4 w-4" /> Yeni Etkinlik</Button>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="text-center shrink-0 w-14">
                      <div className="text-xl font-bold text-primary">{event.date.split(" ")[0]}</div>
                      <div className="text-xs text-muted-foreground">{event.date.split(" ")[1]}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {event.attendees} katılımcı</span>
                        <Badge variant="outline" className="text-xs">{event.type}</Badge>
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setManagingEvent(event)}>Yönet</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* REQUESTS */}
        <TabsContent value="requests" className="mt-6">
          <ConsultantServiceRequests />
        </TabsContent>

        {/* MEMBERS */}
        <TabsContent value="members" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Üye Yönetimi
              </h2>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Üye Ekle</Button>
            </div>
            <div className="space-y-3">
              {members.map((member, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role} · {member.since}'den beri</p>
                  </div>
                  <Badge variant={member.active ? "default" : "secondary"} className="text-xs">
                    {member.active ? "Aktif" : "Pasif"}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* COMMUNICATIONS */}
        <TabsContent value="communications" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> E-posta Kampanyaları
              </h2>
              <div className="space-y-3">
                {[
                  { title: "Nevruz Daveti", sent: 890, opened: 456, date: "10 Mar" },
                  { title: "Aylık Bülten - Mart", sent: 1100, opened: 623, date: "01 Mar" },
                ].map((campaign, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/50">
                    <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {campaign.sent} gönderildi · {campaign.opened} açıldı · {campaign.date}
                    </p>
                  </div>
                ))}
                <Button variant="outline" className="w-full gap-2"><Plus className="h-4 w-4" /> Yeni Kampanya</Button>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-turquoise" /> WhatsApp Grupları
              </h2>
              <div className="space-y-3">
                {[
                  { name: "ATT Genel Grup", members: 320, messages: 45 },
                  { name: "ATT Etkinlik Duyuruları", members: 890, messages: 12 },
                  { name: "ATT Yönetim", members: 15, messages: 78 },
                ].map((group, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">{group.members} üye · {group.messages} mesaj/hafta</p>
                    </div>
                    <Button variant="outline" size="sm">Yönet</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Üyelik Büyümesi
            </h2>
            <div className="space-y-3">
              {["Oca", "Şub", "Mar", "Nis", "May", "Haz"].map((month, i) => {
                const val = [18, 25, 32, 22, 28, 35][i];
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-8">{month}</span>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div className="bg-turquoise rounded-full h-3 transition-all" style={{ width: `${val * 2.8}%` }} />
                    </div>
                    <span className="text-sm font-medium text-foreground w-12">+{val} üye</span>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* PROMOTIONS */}
        <TabsContent value="promotions" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> Tanıtım & Reklam
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: "Öne Çıkan Kuruluş", desc: "Ana sayfada ve arama sonuçlarında üst sıralarda görünün", price: "€29/hafta", icon: Star },
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
                <SocialMediaCampaignDialog entityName={association.name} entityType="association" />
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
                <CategoryShowcasePurchase entityName={association.name} category={association.type} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppGroupsTab />
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Dernek Bilgileri
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Dernek Adı</Label>
                  <Input defaultValue={association.name} />
                </div>
                <div>
                  <Label>Tür</Label>
                  <Input defaultValue={association.type} />
                </div>
                <div>
                  <Label>Web Sitesi</Label>
                  <Input defaultValue={association.website} />
                </div>
                <Button className="w-full mt-2">Kaydet</Button>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Tercihler
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Bağış Kabul Et</p>
                    <p className="text-sm text-muted-foreground">Online bağış alın</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Üyelik Başvurusu</p>
                    <p className="text-sm text-muted-foreground">Yeni üyeliklere açık</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ProfileAssociation;
