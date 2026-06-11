import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import CreateEventForm from "@/components/CreateEventForm";
import EventManagePanel from "@/components/EventManagePanel";
import SocialMediaCampaignDialog from "@/components/SocialMediaCampaignDialog";
import CategoryShowcasePurchase from "@/components/CategoryShowcasePurchase";
import CorBotPromoBanner from "@/components/CorBotPromoBanner";
import {
  Users, MapPin, Globe, Calendar, Heart, Megaphone,
  TrendingUp, Settings, Star, Eye, BarChart3, CreditCard, Crown,
  Instagram, Video, Bot, MessageSquare, Phone, PenLine,
  Edit3, Handshake, Play, Link2, Trash2, ExternalLink, Radio, Lock, Briefcase
} from "lucide-react";
import BloggerAnalytics from "@/components/booking/BloggerAnalytics";
import JobListingsManager from "@/components/JobListingsManager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentManagePanel from "@/components/booking/AppointmentManagePanel";
import MessagesInbox from "@/components/messaging/MessagesInbox";
import MyFollowsSection from "@/components/profiles/MyFollowsSection";
import { ProfileSetupBanner, useProfileGate } from "@/components/profiles/ProfileSetupBanner";
import { Inbox as InboxIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import WhatsAppGroupsTab from "@/components/profiles/WhatsAppGroupsTab";
import NotificationsTabTrigger from "@/components/NotificationsTabTrigger";
import MyOpenCafesAsEvents from "@/components/profiles/MyOpenCafesAsEvents";
import NotificationsList from "@/components/NotificationsList";
import { addDiasporaBlogLink, getDiasporaBlogLinksByAuthor, removeDiasporaBlogLink, type DiasporaBlogLink } from "@/lib/diasporaBlogLinks";
import { toast } from "@/hooks/use-toast";
import ProfileLocationPhoneSettings from "@/components/profiles/ProfileLocationPhoneSettings";
import ProfileCommonSettings from "@/components/profiles/ProfileCommonSettings";
import ProfileSubcategoriesSettings from "@/components/profiles/ProfileSubcategoriesSettings";

const ProfileBlogger = () => {
  const { locked: gateLocked } = useProfileGate();
  const [activeTab, setActiveTab] = useState<string>("content");
  const blogger = {
    name: "Selin Akış",
    title: "Travel & Lifestyle Influencer",
    email: "selin@corteqs.com",
    country: "Hollanda",
    city: "Amsterdam",
    avatar: "SA",
    followers: 0,
    totalViews: 0,
    posts: 0,
    rating: 0,
    reviewCount: 0,
    languages: ["Türkçe", "İngilizce", "Hollandaca"],
    description: "Hollanda'da yaşam, seyahat ve diaspora kültürü üzerine içerik üreten influencer.",
    balance: 0,
    instagram: "@selinakis",
    youtube: "SelinAkışVlog",
    website: "selinakis.com",
    gustos: ["Seyahat", "Yaşam", "Kültür", "Yemek"],
    aiTwinEnabled: false,
  };

  // Diaspora blog link uploader state (links published to Medya page → Türk Diaspora Medyası filter)
  const [myBlogLinks, setMyBlogLinks] = useState<DiasporaBlogLink[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDesc, setLinkDesc] = useState("");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [managingEvent, setManagingEvent] = useState<any | null>(null);

  useEffect(() => {
    setMyBlogLinks(getDiasporaBlogLinksByAuthor(blogger.name));
  }, []);

  const handleAddLink = () => {
    if (!linkUrl.trim() || !linkTitle.trim()) {
      toast({ title: "Eksik alan", description: "Link ve başlık zorunludur.", variant: "destructive" });
      return;
    }
    addDiasporaBlogLink({
      url: linkUrl.trim(),
      title: linkTitle.trim(),
      description: linkDesc.trim() || undefined,
      author: blogger.name,
      city: blogger.city,
      country: blogger.country,
    });
    setMyBlogLinks(getDiasporaBlogLinksByAuthor(blogger.name));
    setLinkUrl("");
    setLinkTitle("");
    setLinkDesc("");
    toast({ title: "Yazı eklendi", description: "Medya → Türk Diaspora Medyası filtresinde yayında." });
  };

  const handleRemoveLink = (id: string) => {
    removeDiasporaBlogLink(id);
    setMyBlogLinks(getDiasporaBlogLinksByAuthor(blogger.name));
  };

  const sessions = { aiTwin: [] as any[], live: [] as any[] };
  const collaborations: { brand: string; type: string; status: string; fee: string }[] = [];
  const blogPosts: { title: string; views: number; likes: number; date: string }[] = [];

  const stats = {
    monthlyViews: 0,
    monthlyEngagement: "—",
    monthlyRevenue: 0,
    newFollowers: 0,
  };

  return (
    <>
      {/* Blogger header */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
            {blogger.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{blogger.name}</h1>
              <Badge className="bg-pink-500/15 text-pink-600 border-pink-500/30 gap-1">
                <Play className="h-3 w-3" /> Influencer
              </Badge>
              {blogger.aiTwinEnabled && (
                <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
                  <Bot className="h-3 w-3" /> AI Twin Aktif
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground font-medium mt-0.5">{blogger.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{blogger.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {blogger.city}, {blogger.country}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> — takipçi</span>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 text-gold" /> — (—)</span>
              <span className="flex items-center gap-1"><Instagram className="h-3 w-3" /> {blogger.instagram}</span>
              <a href={`https://${blogger.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <Globe className="h-3 w-3" /> {blogger.website}
              </a>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {blogger.gustos.map((g) => (
                <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
              ))}
            </div>
          </div>
          <div className="bg-pink-500/10 rounded-xl p-4 text-center shrink-0 min-w-[140px]">
            <CreditCard className="h-5 w-5 text-pink-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">€{blogger.balance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Bakiye</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Aylık Görüntülenme", value: "—", icon: Eye, color: "text-primary" },
          { label: "Etkileşim Oranı", value: "—", icon: Heart, color: "text-pink-500" },
          { label: "Aylık Gelir", value: "€—", icon: CreditCard, color: "text-success" },
          { label: "Yeni Takipçi", value: "—", icon: Users, color: "text-turquoise" },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 shadow-card text-center">
            <stat.icon className={`h-4 w-4 ${stat.color} mx-auto mb-1`} />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6"><CorBotPromoBanner /></div>

      {/* Tabs */}
      <ProfileSetupBanner />
      <Tabs
        value={gateLocked && !["messages","notifications"].includes(activeTab) ? "settings" : activeTab}
        onValueChange={(v) => { if (!gateLocked || v === "settings" || v === "messages" || v === "notifications") setActiveTab(v); }}
        className="w-full"
      >
        <TabsList className={`bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1 ${gateLocked ? "[&>button:not([data-state=active])]:opacity-50" : ""}`}>
          <TabsTrigger value="content" className="gap-1.5"><PenLine className="h-4 w-4" /> İçerikler</TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5"><Video className="h-4 w-4" /> Görüşmeler</TabsTrigger>
          <TabsTrigger value="collaborations" className="gap-1.5"><Handshake className="h-4 w-4" /> İşbirlikleri</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5"><Calendar className="h-4 w-4" /> Etkinlikler</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analitik</TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1.5"><Megaphone className="h-4 w-4" /> Tanıtım</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="job-listings" className="gap-1.5"><Briefcase className="h-4 w-4" /> İş İlanları</TabsTrigger>
          <TabsTrigger value="follows" className="gap-1.5"><Heart className="h-4 w-4" /> Takip Ettiklerim</TabsTrigger>
          <NotificationsTabTrigger className="text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" />
          <TabsTrigger value="messages" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><InboxIcon className="h-4 w-4" /> Mesaj Kutusu</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Settings className="h-4 w-4" /> Profil Ayarları</TabsTrigger>
        </TabsList>

        {/* CONTENT */}
        <TabsContent value="content" className="mt-6 space-y-6">
          {/* Diaspora Blog Link Uploader */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" /> Blog Linkleri Yükle
                </h2>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Radio className="h-3 w-3" />
                  Eklediğiniz yazılar <strong className="mx-1">Medya → Türk Diaspora Medyası</strong> filtresinde yayınlanır.
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">{myBlogLinks.length} yazı</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <Label className="text-xs">Yazı Linki *</Label>
                <Input
                  placeholder="https://blogunuz.com/yazi"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Yazı Başlığı *</Label>
                <Input
                  placeholder="Amsterdam'da Türk Mahalleleri"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-3">
              <Label className="text-xs">Kısa Açıklama (opsiyonel)</Label>
              <Textarea
                rows={2}
                placeholder="Yazının kısa özeti..."
                value={linkDesc}
                onChange={(e) => setLinkDesc(e.target.value)}
              />
            </div>
            <Button onClick={handleAddLink} className="gap-2">
              <Link2 className="h-4 w-4" /> Linki Yayınla
            </Button>

            {myBlogLinks.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Yayınlanan Yazılarım</p>
                {myBlogLinks.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{b.title}</p>
                      <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 truncate">
                        <ExternalLink className="h-3 w-3" /> {b.url}
                      </a>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveLink(b.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <PenLine className="h-5 w-5 text-primary" /> Blog Yazıları & İçerikler
              </h2>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Yayınladığın blog yazıları yukarıdaki "Blog Linkleri Yükle" alanından eklenir ve burada listelenir.
            </div>
          </div>
        </TabsContent>

        {/* SESSIONS */}
        <TabsContent value="sessions" className="mt-6 space-y-6">
          {/* AI Twin */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" /> AI Twin Sohbetleri
              </h2>
              <Badge variant="outline" className="text-xs">Yakında</Badge>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              AI Twin aktive edildikten sonra takipçilerinle yapılan sohbetler burada görünecek.
            </div>
          </div>

          {/* Live sessions — real appointment requests */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Video className="h-5 w-5 text-turquoise" /> Canlı Görüşme Randevuları
              </h2>
              <div className="text-sm text-muted-foreground">Müşterinin saat dilimine göre talep edilir</div>
            </div>
            <AppointmentManagePanel />
          </div>
        </TabsContent>

        {/* COLLABORATIONS */}
        <TabsContent value="collaborations" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" /> Marka İşbirlikleri
              </h2>
              <Badge variant="outline" className="text-xs">Yakında</Badge>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Markalar ile yapılan işbirlikleri ve sponsorlu içerikler burada görünecek.
            </div>
          </div>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          <BloggerAnalytics authorName={blogger.name} />
        </TabsContent>

        {/* PROMOTIONS */}
        <TabsContent value="promotions" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> Tanıtım & Reklam
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: "Öne Çıkan Influencer", desc: "Ana sayfada ve arama sonuçlarında üst sıralarda görünün", price: "€—/hafta", icon: Star },
                { title: "Reklam İşbirliği", desc: "Markalarla eşleşme ve sponsorlu içerik fırsatları", price: "€—", icon: Handshake },
                { title: "Sosyal Medya Paketi", desc: "Sosyal medya hesaplarınızda profesyonel kampanya yönetimi", price: "€—/platform", icon: Megaphone },
                { title: "Kategori Vitrini", desc: "Kategorinizde ilk 6 sırada gösterilerek daha fazla müşteriye ulaşın", price: "€—/hafta", icon: Crown },
              ].map((promo) => (
                <div key={promo.title} className="relative border border-border rounded-xl p-4 overflow-hidden">
                  <div className="opacity-60">
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
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-1.5" disabled>
                    <Lock className="h-3.5 w-3.5" /> Yakında
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* EVENTS */}
        <TabsContent value="events" className="mt-6">
          <div className="mb-4"><MyOpenCafesAsEvents /></div>
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> Etkinliklerim
                </h2>
                <Button className="gap-2" onClick={() => setShowCreateEvent(true)}>
                  <Plus className="h-4 w-4" /> Etkinlik Oluştur
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Yarattığın etkinlikler hem platformda hem de profil mikrositende görünür. Kayıt için kendi Google Form linkini kullanabilirsin.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppGroupsTab />
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="mt-6">
          <NotificationsList />
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="messages" className="space-y-4">
          <MessagesInbox />
        </TabsContent>

        <TabsContent value="job-listings" className="mt-6">
          <JobListingsManager />
        </TabsContent>

        <TabsContent value="follows" className="mt-6">
          <MyFollowsSection />
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <ProfileLocationPhoneSettings />
          <ProfileCommonSettings role="blogger" />
          <ProfileSubcategoriesSettings accountTypeOverride="blogger" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" /> Profil Bilgileri
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Ad Soyad</Label>
                  <Input defaultValue={blogger.name} />
                </div>
                <div>
                  <Label>Ünvan</Label>
                  <Input defaultValue={blogger.title} />
                </div>
                <div>
                  <Label>Bio / Hakkında</Label>
                  <Textarea
                    defaultValue={blogger.description}
                    rows={8}
                    maxLength={3000}
                    onChange={(e) => {
                      const el = e.currentTarget.parentElement?.querySelector("[data-bio-count]") as HTMLElement | null;
                      if (el) el.textContent = `${e.currentTarget.value.length} / 3000`;
                    }}
                  />
                  <p data-bio-count className="text-[11px] text-muted-foreground mt-1 text-right">
                    {blogger.description.length} / 3000
                  </p>
                </div>
                <div>
                  <Label>Gustolar (virgülle ayırın)</Label>
                  <Input defaultValue={blogger.gustos.join(", ")} />
                </div>
                <Button className="w-full mt-2">Profili Güncelle</Button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" /> Sosyal Medya & İletişim
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label>Instagram</Label>
                    <Input defaultValue={blogger.instagram} />
                  </div>
                  <div>
                    <Label>YouTube</Label>
                    <Input defaultValue={blogger.youtube} />
                  </div>
                  <div>
                    <Label>Web Sitesi</Label>
                    <Input defaultValue={blogger.website} />
                  </div>
                  <div>
                    <Label>E-posta</Label>
                    <Input defaultValue={blogger.email} />
                  </div>
                  <Button variant="outline" className="w-full">Kaydet</Button>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" /> Tercihler
                </h2>
                <div className="space-y-4">
                  {[
                    { title: "AI Twin Aktif", desc: "Takipçileriniz AI Twin ile sohbet edebilsin" },
                    { title: "Canlı Görüşme Kabul Et", desc: "Randevu talepleri alın" },
                    { title: "İşbirliği Teklifleri", desc: "Markalardan teklif almaya açık" },
                  ].map((p) => (
                    <div key={p.title} className="flex items-center justify-between opacity-70">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{p.title}</p>
                          <Badge variant="secondary" className="text-[10px] bg-gold/20 text-gold-foreground border-gold/30">Yakında</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{p.desc}</p>
                      </div>
                      <Switch disabled />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ProfileBlogger;
