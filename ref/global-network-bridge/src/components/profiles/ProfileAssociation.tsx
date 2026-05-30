import { useState, useEffect } from "react";
import EventManagePanel from "@/components/EventManagePanel";
import AssociationSettingsForm, { loadAssociationProfile, type AssociationProfileData } from "@/components/profiles/AssociationSettingsForm";
import ProfileLocationPhoneSettings from "@/components/profiles/ProfileLocationPhoneSettings";
import BusinessLicenseUpload from "@/components/profiles/BusinessLicenseUpload";
import ProfileCommonSettings from "@/components/profiles/ProfileCommonSettings";
import { findOrgCategory, findOrgSubcategory } from "@/data/organizationCategories";
import {
  Users, MapPin, Globe, Calendar, Heart, Megaphone,
  TrendingUp, Settings, Bell, Mail, MessageSquare, Briefcase,
  Plus, Star, BarChart3, ArrowLeft, Crown
} from "lucide-react";
import JobListingsManager from "@/components/JobListingsManager";
import SocialMediaCampaignDialog from "@/components/SocialMediaCampaignDialog";
import CategoryShowcasePurchase from "@/components/CategoryShowcasePurchase";
import CreateEventForm from "@/components/CreateEventForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessagesInbox from "@/components/messaging/MessagesInbox";
import MyFollowsSection from "@/components/profiles/MyFollowsSection";
import { ProfileSetupBanner, useProfileGate } from "@/components/profiles/ProfileSetupBanner";
import { Inbox as InboxIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import WhatsAppGroupsTab from "@/components/profiles/WhatsAppGroupsTab";
import CorBotPromoBanner from "@/components/CorBotPromoBanner";
import MapAddressBanner from "@/components/MapAddressBanner";
import NotificationsTabTrigger from "@/components/NotificationsTabTrigger";
import MyOpenCafesAsEvents from "@/components/profiles/MyOpenCafesAsEvents";
import NotificationsList from "@/components/NotificationsList";
import SocialMediaInputs from "@/components/SocialMediaInputs";

const ProfileAssociation = () => {
  const { locked: gateLocked } = useProfileGate();
  const [activeTab, setActiveTab] = useState<string>("events");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [managingEvent, setManagingEvent] = useState<null | typeof upcomingEvents[0]>(null);
  const [profileData, setProfileData] = useState<AssociationProfileData>(loadAssociationProfile());

  useEffect(() => {
    const refresh = () => setProfileData(loadAssociationProfile());
    window.addEventListener("association-profile-updated", refresh);
    return () => window.removeEventListener("association-profile-updated", refresh);
  }, []);

  const cat = findOrgCategory(profileData.categoryKey);
  const sub = findOrgSubcategory(profileData.categoryKey, profileData.subcategoryKey);
  const association = {
    name: profileData.name || "Kuruluşunuz",
    type: sub?.label || cat?.label || "Tür seçilmedi",
    email: profileData.email,
    website: profileData.website,
    country: profileData.country,
    city: profileData.city,
    avatar: (profileData.name || "K").trim().charAt(0).toUpperCase(),
    members: 0,
    founded: profileData.founded ? Number(profileData.founded) : new Date().getFullYear(),
    description: profileData.description || "Tanıtım metninizi profil ayarlarından ekleyin.",
    balance: 0,
  };

  const upcomingEvents: { id: number; title: string; date: string; attendees: number; type: string }[] = [];

  

  const stats = {
    totalMembers: 0,
    activeMembers: 0,
    eventsThisYear: 0,
    totalDonations: 0,
  };

  return (
    <>
      <MapAddressBanner />
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

      <div className="mb-6"><CorBotPromoBanner /></div>

      {/* Tabs */}
      <ProfileSetupBanner />
      <Tabs
        value={gateLocked && !["messages","notifications"].includes(activeTab) ? "settings" : activeTab}
        onValueChange={(v) => { if (!gateLocked || v === "settings" || v === "messages" || v === "notifications") setActiveTab(v); }}
        className="w-full"
      >
        <TabsList className={`bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1 ${gateLocked ? "[&>button:not([data-state=active])]:opacity-50" : ""}`}>
          <TabsTrigger value="events" className="gap-1.5"><Calendar className="h-4 w-4" /> Etkinlikler</TabsTrigger>
          <TabsTrigger value="communications" className="gap-1.5"><Mail className="h-4 w-4" /> İletişim</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analitik</TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1.5"><Megaphone className="h-4 w-4" /> Tanıtım</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="job-listings" className="gap-1.5"><Briefcase className="h-4 w-4" /> İş İlanları</TabsTrigger>
          <TabsTrigger value="follows" className="gap-1.5"><Heart className="h-4 w-4" /> Takip Ettiklerim</TabsTrigger>
          <NotificationsTabTrigger className="text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" />
          <TabsTrigger value="messages" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><InboxIcon className="h-4 w-4" /> Mesaj Kutusu</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Settings className="h-4 w-4" /> Profil Ayarları</TabsTrigger>
        </TabsList>

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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-turquoise" /> Dernek Etkinlikleri
                </h2>
                <Button className="gap-2" onClick={() => setShowCreateEvent(true)}><Plus className="h-4 w-4" /> Yeni Etkinlik</Button>
              </div>
              {upcomingEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                  <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Henüz etkinlik yok</p>
                  <p className="text-xs text-muted-foreground mt-0.5">"Yeni Etkinlik" butonu ile ilk etkinliğinizi oluşturun.</p>
                </div>
              ) : (
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
              )}
            </div>
          )}
        </TabsContent>

        {/* COMMUNICATIONS */}
        <TabsContent value="communications" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> E-posta Kampanyaları
              </h2>
              <div className="space-y-3">
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                  <Mail className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm font-medium text-foreground">Henüz kampanya yok</p>
                  <p className="text-xs text-muted-foreground mt-0.5">İlk e-posta kampanyanızı oluşturun.</p>
                </div>
                <Button variant="outline" className="w-full gap-2"><Plus className="h-4 w-4" /> Yeni Kampanya</Button>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-turquoise" /> WhatsApp Grupları
              </h2>
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <MessageSquare className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-sm font-medium text-foreground">Henüz WhatsApp grubu yok</p>
                <p className="text-xs text-muted-foreground mt-0.5">WhatsApp sekmesinden yeni grup ekleyebilirsiniz.</p>
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
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <BarChart3 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Henüz veri yok</p>
              <p className="text-xs text-muted-foreground mt-0.5">Üye eklendikçe büyüme grafiğiniz burada görünecek.</p>
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
                { title: "Öne Çıkan Kuruluş", desc: "Ana sayfada ve arama sonuçlarında üst sıralarda görünün", price: "€—/hafta", icon: Star },
                { title: "WhatsApp Tanıtımı", desc: "CorteQS Kanalında Tanıtım", price: "€—/tanıtım", icon: Megaphone },
                { title: "Etkinlik Boost", desc: "Etkinliklerinizi platforma ve mail listelerine tanıtın", price: "€—/etkinlik", icon: TrendingUp },
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
                    <p className="text-xs font-semibold text-primary">$—/platform</p>
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
                    <p className="text-xs font-semibold text-gold">€—/hafta</p>
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
          <BusinessLicenseUpload contextLabel="Kuruluş hesabınız" />
          <ProfileLocationPhoneSettings />
          <ProfileCommonSettings role="association" />
          <AssociationSettingsForm onSaved={(d) => setProfileData(d)} />

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

          <SocialMediaInputs />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ProfileAssociation;
