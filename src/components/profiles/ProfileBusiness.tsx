import { useState } from "react";
import EventManagePanel from "@/components/EventManagePanel";
import CreateJobListingForm from "@/components/CreateJobListingForm";
import { CouponManager } from "@/components/CouponManager";
import {
  Building2, MapPin, Globe, Phone, Mail, Calendar, Users,
  TrendingUp, Star, Package, Megaphone, Settings, BarChart3,
  CreditCard, Clock, Eye, Plus, ChevronRight, Tag, ArrowLeft, Edit, Crown,
  ScanLine, Download, BarChart2, Inbox
} from "lucide-react";
import ConsultantServiceRequests from "@/components/ConsultantServiceRequests";
import WhatsAppGroupsTab from "@/components/profiles/WhatsAppGroupsTab";
import CreateEventForm from "@/components/CreateEventForm";
import SocialMediaCampaignDialog from "@/components/SocialMediaCampaignDialog";
import CategoryShowcasePurchase from "@/components/CategoryShowcasePurchase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import QRScannerMock from "@/components/QRScannerMock";

const ProfileBusiness = () => {
  const [isVerified, setIsVerified] = useState(true);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [managingEvent, setManagingEvent] = useState<null | typeof events[0]>(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [editingJob, setEditingJob] = useState<null | typeof listings[0]>(null);

  const business = {
    name: "Anatolian Tech GmbH",
    type: "Yazılım & Danışmanlık",
    email: "info@corteqs.net",
    phone: "+49 30 1234567",
    website: "anatoliantech.de",
    country: "Almanya",
    city: "Berlin",
    avatar: "AT",
    employees: 12,
    founded: 2019,
    description: "Diaspora Türk girişimcilerine yönelik yazılım çözümleri ve dijital danışmanlık hizmetleri sunan teknoloji şirketi.",
    balance: 1250.00,
  };

  const listings = [
    { id: 1, title: "Kıdemli Frontend Geliştirici", type: "İş İlanı", status: "Aktif", views: 342, applications: 18 },
    { id: 2, title: "Dijital Pazarlama Uzmanı", type: "İş İlanı", status: "Aktif", views: 156, applications: 7 },
    { id: 3, title: "Stajyer - Backend", type: "Staj", status: "Kapalı", views: 89, applications: 23 },
  ];

  const events = [
    { id: 1, title: "Tech Meetup Berlin", date: "22 Mar 2026", attendees: 45, status: "Yaklaşan" },
    { id: 2, title: "Startup Workshop", date: "05 Nis 2026", attendees: 30, status: "Yaklaşan" },
  ];

  const stats = {
    profileViews: 1240,
    eventAttendees: 187,
    totalListings: 5,
    averageRating: 4.7,
  };

  return (
    <>
      {/* Business header */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-2xl shrink-0">
            {business.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
              {isVerified && (
                <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30 gap-1">
                  <Star className="h-3 w-3" /> Onaylı İşletme
                </Badge>
              )}
              <Badge variant="outline" className="gap-1 text-xs">
                <Building2 className="h-3 w-3" /> {business.type}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{business.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {business.city}, {business.country}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {business.employees} çalışan</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {business.founded}'den beri</span>
              <a href={`https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <Globe className="h-3 w-3" /> {business.website}
              </a>
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-4 text-center shrink-0 min-w-[140px]">
            <CreditCard className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">€{business.balance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">İşletme Bakiyesi</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Profil Görüntülenme", value: stats.profileViews, icon: Eye, color: "text-primary" },
          { label: "Etkinlik Katılımcı", value: stats.eventAttendees, icon: Users, color: "text-turquoise" },
          { label: "Toplam İlan", value: stats.totalListings, icon: Package, color: "text-gold" },
          { label: "Ortalama Puan", value: stats.averageRating, icon: Star, color: "text-gold" },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-card text-center">
            <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="listings" className="gap-1.5"><Package className="h-4 w-4" /> İlanlar</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5"><Inbox className="h-4 w-4" /> Teklif Talepleri</TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1.5"><Tag className="h-4 w-4" /> Kuponlar</TabsTrigger>
          <TabsTrigger value="loyalty" className="gap-1.5"><ScanLine className="h-4 w-4" /> Loyalty</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5"><Calendar className="h-4 w-4" /> Etkinlikler</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analitik</TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1.5"><Megaphone className="h-4 w-4" /> Tanıtım</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><Globe className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-4 w-4" /> Ayarlar</TabsTrigger>
        </TabsList>

        {/* LISTINGS */}
        <TabsContent value="requests" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" /> Teklif Talepleri
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Kategorinize uygun kullanıcı talepleri burada listelenir. Teklif vererek ulaşın.
            </p>
            <ConsultantServiceRequests />
          </div>
        </TabsContent>

        <TabsContent value="listings" className="mt-6">
          {showCreateJob || editingJob ? (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <Button variant="ghost" size="sm" className="gap-1 mb-4" onClick={() => { setShowCreateJob(false); setEditingJob(null); }}>
                <ArrowLeft className="h-4 w-4" /> İlanlara Dön
              </Button>
              <CreateJobListingForm
                onClose={() => { setShowCreateJob(false); setEditingJob(null); }}
                editData={editingJob ? {
                  id: editingJob.id,
                  title: editingJob.title,
                  type: editingJob.type,
                  department: "Yazılım",
                  location: "Berlin, Almanya",
                  locationType: "hybrid",
                  salary: "3500-5500",
                  description: "Mock iş tanımı detayları burada yer alacak.",
                  requirements: "Mock aranan nitelikler burada yer alacak.",
                } : null}
              />
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> İş İlanları & Listeler
                </h2>
                <Button className="gap-2" onClick={() => setShowCreateJob(true)}><Plus className="h-4 w-4" /> Yeni İlan</Button>
              </div>
              <div className="space-y-3">
                {listings.map((listing) => (
                  <div key={listing.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{listing.title}</h3>
                        <Badge variant={listing.status === "Aktif" ? "default" : "secondary"} className="text-xs">
                          {listing.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-3">
                        <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {listing.type}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {listing.views} görüntülenme</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {listing.applications} başvuru</span>
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditingJob(listing)}>
                      <Edit className="h-3 w-3" /> Düzenle
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* COUPONS */}
        <TabsContent value="coupons" className="mt-6">
          <CouponManager businessName={business.name} />
        </TabsContent>

        {/* LOYALTY */}
        <TabsContent value="loyalty" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scanner */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" /> Kupon Okuyucu
              </h2>
              <p className="text-sm text-muted-foreground mb-6">Müşterinin kuponunu tarayarak indirimi uygulayın.</p>
              <QRScannerMock />
            </div>

            {/* Discount report */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-turquoise" /> İndirim Raporu
                </h2>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" /> Dışa Aktar
                </Button>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  { code: "HOSGELDIN15", title: "Hoşgeldin İndirimi", downloaded: 342, processed: 89, revenue: "€4,450" },
                  { code: "YAZ25", title: "Yaz Kampanyası %25", downloaded: 215, processed: 56, revenue: "€2,800" },
                  { code: "SADIK10", title: "Sadık Müşteri %10", downloaded: 128, processed: 112, revenue: "€8,960" },
                ].map((r, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{r.title}</p>
                        <code className="text-xs text-primary">{r.code}</code>
                      </div>
                      <p className="text-sm font-bold text-success">{r.revenue}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" /> {r.downloaded} indirme
                      </span>
                      <span className="flex items-center gap-1">
                        <ScanLine className="h-3 w-3" /> {r.processed} kullanım
                      </span>
                      <span className="text-turquoise font-semibold">
                        %{Math.round((r.processed / r.downloaded) * 100)} dönüşüm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">685</p>
                  <p className="text-[11px] text-muted-foreground">Toplam İndirme</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-turquoise">257</p>
                  <p className="text-[11px] text-muted-foreground">Toplam Kullanım</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">€16,210</p>
                  <p className="text-[11px] text-muted-foreground">Kuponlu Gelir</p>
                </div>
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
                  <Calendar className="h-5 w-5 text-turquoise" /> İşletme Etkinlikleri
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

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Haftalık Görüntülenme
              </h2>
              <div className="space-y-3">
                {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day, i) => {
                  const val = [45, 62, 38, 71, 89, 54, 33][i];
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-8">{day}</span>
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${val}%` }} />
                      </div>
                      <span className="text-sm font-medium text-foreground w-8">{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-turquoise" /> Başvuru Kaynakları
              </h2>
              <div className="space-y-4">
                {[
                  { source: "CorteQS Platform", count: 34, pct: 60 },
                  { source: "WhatsApp Grupları", count: 12, pct: 21 },
                  { source: "Doğrudan Link", count: 8, pct: 14 },
                  { source: "Dernek Yönlendirme", count: 3, pct: 5 },
                ].map((s) => (
                  <div key={s.source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">{s.source}</span>
                      <span className="text-muted-foreground">{s.count} ({s.pct}%)</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-turquoise rounded-full h-2 transition-all" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
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
                { title: "Öne Çıkan İşletme", desc: "Ana sayfada ve arama sonuçlarında üst sıralarda görünün", price: "€29/hafta", icon: Star },
                { title: "WhatsApp Tanıtımı", desc: "CorteQS Kanalında Tanıtım", price: "€19/tanıtım", icon: Megaphone },
                { title: "Etkinlik Boost", desc: "Etkinliklerinizi platforma ve mail listelerine tanıtın", price: "€49/etkinlik", icon: TrendingUp },
                { title: "İlan Öne Çıkarma", desc: "İş ilanlarınızı üst sıralara taşıyın", price: "€15/ilan", icon: Package },
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
              <div className="md:col-span-2 border border-primary/30 rounded-xl p-4 bg-primary/5">
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
                <SocialMediaCampaignDialog entityName={business.name} entityType="business" />
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
                <CategoryShowcasePurchase entityName={business.name} category={business.type} />
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
                <Building2 className="h-5 w-5 text-primary" /> İşletme Bilgileri
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>İşletme Adı</Label>
                  <Input defaultValue={business.name} />
                </div>
                <div>
                  <Label>Sektör</Label>
                  <Input defaultValue={business.type} />
                </div>
                <div>
                  <Label>Web Sitesi</Label>
                  <Input defaultValue={business.website} />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input defaultValue={business.phone} />
                </div>
                <Button className="w-full mt-2">Kaydet</Button>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Görünürlük
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Onaylı İşletme Rozeti</p>
                    <p className="text-sm text-muted-foreground">Doğrulanmış işletme olarak görünün</p>
                  </div>
                  <Switch checked={isVerified} onCheckedChange={setIsVerified} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">İşe Alım Modu</p>
                    <p className="text-sm text-muted-foreground">Aktif olarak eleman aradığınızı gösterin</p>
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

export default ProfileBusiness;
