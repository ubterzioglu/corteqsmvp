import { useEffect, useState } from "react";
import EventManagePanel from "@/components/EventManagePanel";
import CreateJobListingForm from "@/components/CreateJobListingForm";
import { CouponManager } from "@/components/CouponManager";
import {
  Building2, MapPin, Globe, Phone, Mail, Calendar, Users,
  TrendingUp, Star, Package, Megaphone, Settings, BarChart3,
  CreditCard, Clock, Eye, Plus, ChevronRight, Tag, ArrowLeft, Edit, Crown,
  ScanLine, Download, BarChart2, Inbox, Info, Search, Filter, Camera, ImageIcon,
  Handshake, Trash2, Bot
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countryCities } from "@/data/countryCities";
import ConsultantServiceRequests from "@/components/ConsultantServiceRequests";
import WhatsAppGroupsTab from "@/components/profiles/WhatsAppGroupsTab";
import CreateEventForm from "@/components/CreateEventForm";
import SocialMediaCampaignDialog from "@/components/SocialMediaCampaignDialog";
import CategoryShowcasePurchase from "@/components/CategoryShowcasePurchase";
import BusinessOpportunitiesPanel from "@/components/business/BusinessOpportunitiesPanel";
import MyFollowsSection from "@/components/profiles/MyFollowsSection";
import { ProfileSetupBanner, useProfileGate } from "@/components/profiles/ProfileSetupBanner";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessagesInbox from "@/components/messaging/MessagesInbox";
import { Inbox as InboxIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import QRScannerMock from "@/components/QRScannerMock";
import MapAddressBanner from "@/components/MapAddressBanner";
import NotificationsTabTrigger from "@/components/NotificationsTabTrigger";
import MyOpenCafesAsEvents from "@/components/profiles/MyOpenCafesAsEvents";
import NotificationsList from "@/components/NotificationsList";
import SocialMediaInputs from "@/components/SocialMediaInputs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProfileLocationPhoneSettings from "@/components/profiles/ProfileLocationPhoneSettings";
import BusinessLicenseUpload from "@/components/profiles/BusinessLicenseUpload";
import ProfileCommonSettings from "@/components/profiles/ProfileCommonSettings";
import ProfileSubcategoriesSettings from "@/components/profiles/ProfileSubcategoriesSettings";

// Phone country code helper — keeps the prefix and the local number aligned with the user's saved country.
const COUNTRY_DIAL: Record<string, string> = {
  Türkiye: "+90", Almanya: "+49", Hollanda: "+31", İngiltere: "+44", Fransa: "+33",
  Belçika: "+32", Avusturya: "+43", İsviçre: "+41", "Amerika Birleşik Devletleri": "+1",
  Kanada: "+1", İsveç: "+46", Norveç: "+47", Danimarka: "+45", İtalya: "+39",
  İspanya: "+34", "Birleşik Arap Emirlikleri": "+971", Katar: "+974",
};
const dialFor = (country?: string | null) => (country && COUNTRY_DIAL[country]) || "";

const ProfileBusiness = () => {
  const { user } = useAuth();
  const { locked: gateLocked } = useProfileGate();
  const [activeTab, setActiveTab] = useState<string>("listings");
  const [isVerified, setIsVerified] = useState(false);
  const [hiringMode, setHiringMode] = useState(false);
  const [verifiedReq, setVerifiedReq] = useState<{ status: string } | null>(null);
  const [hiringReq, setHiringReq] = useState<{ status: string } | null>(null);
  const { toast } = useToast();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [managingEvent, setManagingEvent] = useState<null | { id: number; title: string; date: string; attendees: number; status?: string }>(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [editingJob, setEditingJob] = useState<null | { id: number; title: string; type: string; status: string; views: number; applications: number; package?: string; price?: number }>(null);

  // DB-backed business profile
  const [biz, setBiz] = useState({
    business_name: "",
    business_sector: "",
    business_website: "",
    business_description: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    show_on_map: false,
    full_name: "",
    avatar_url: "",
  });
  const [confirmHideMap, setConfirmHideMap] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadEvents = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("events")
      .select("id, title, event_date, max_attendees, status")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true });
    setEvents((data || []) as any);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) {
        setBiz({
          business_name: (p as any).business_name || "",
          business_sector: (p as any).business_sector || (p as any).profession || "",
          business_website: (p as any).business_website || "",
          business_description: (p as any).business_description || "",
          phone: p.phone || "",
          address: (p as any).address || "",
          city: p.city || "",
          country: p.country || "",
          show_on_map: !!(p as any).show_on_map,
          full_name: p.full_name || "",
          avatar_url: (p as any).avatar_url || "",
        });
        setIsVerified(!!(p as any).is_verified);
        setHiringMode(!!(p as any).hiring_mode);
      }
      const { data: reqs } = await (supabase.from("approval_requests" as any) as any)
        .select("request_type, status")
        .eq("user_id", user.id)
        .in("request_type", ["verified_business", "hiring_mode"])
        .order("created_at", { ascending: false });
      const v = (reqs || []).find((r: any) => r.request_type === "verified_business");
      const h = (reqs || []).find((r: any) => r.request_type === "hiring_mode");
      if (v) setVerifiedReq({ status: v.status });
      if (h) setHiringReq({ status: h.status });
      const [{ count: views }, { data: evs }, { count: listingsCount }] = await Promise.all([
        supabase.from("profile_views" as any).select("id", { count: "exact", head: true }).eq("profile_id", user.id),
        supabase.from("events").select("id, max_attendees").eq("user_id", user.id),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      const attendees = (evs || []).reduce((acc: number, e: any) => acc + (e.max_attendees || 0), 0);
      setStats({
        profileViews: views || 0,
        eventAttendees: attendees,
        totalListings: listingsCount || 0,
        averageRating: null,
        ratingCount: 0,
      });
      loadEvents();
    })();
  }, [user]);

  const persistField = async (patch: Record<string, any>) => {
    if (!user) return;
    await (supabase.from("profiles") as any).update(patch).eq("id", user.id);
  };

  const submitApproval = async (request_type: "verified_business" | "hiring_mode") => {
    if (!user) return;
    const { error } = await (supabase.from("approval_requests" as any) as any).insert({
      user_id: user.id,
      request_type,
      payload: { business_name: biz.business_name, sector: biz.business_sector, country: biz.country, city: biz.city },
      status: "pending",
    });
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    if (request_type === "verified_business") setVerifiedReq({ status: "pending" });
    else setHiringReq({ status: "pending" });
    toast({ title: "Onaya gönderildi ✅", description: "Yönetici incelemesi sonrası aktifleşecek (24 saate kadar)." });
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      await persistField({ avatar_url: pub.publicUrl });
      setBiz((b) => ({ ...b, avatar_url: pub.publicUrl }));
      toast({ title: "Profil fotoğrafın güncellendi ✅" });
    } catch (e: any) {
      toast({ title: "Yükleme başarısız", description: e.message || "Tekrar deneyin.", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleShowOnMapChange = async (checked: boolean) => {
    if (!checked) { setConfirmHideMap(true); return; }
    setBiz((b) => ({ ...b, show_on_map: true }));
    await persistField({ show_on_map: true });
    toast({ title: "Haritada görünüyorsun ✅", description: "İşletmen Diaspora Haritası'nda listelenecek." });
  };

  const business = {
    name: biz.business_name || biz.full_name || "İşletmem",
    type: biz.business_sector || "—",
    phone: biz.phone ? (biz.phone.startsWith("+") ? biz.phone : `${dialFor(biz.country)} ${biz.phone}`.trim()) : "—",
    website: biz.business_website || "",
    country: biz.country || "—",
    city: biz.city || "—",
    avatar: (biz.business_name || biz.full_name || "??").slice(0, 2).toUpperCase(),
    avatarUrl: biz.avatar_url,
    description: biz.business_description || "İşletme tanıtımınızı Ayarlar → İşletme Bilgileri'nden ekleyin.",
    balance: 0,
  };

  const [listings, setListings] = useState<Array<{ id: number; title: string; type: string; status: string; views: number; applications: number; package?: string; price?: number; country?: string; city?: string }>>([]);

  // Listing filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState<string>("");
  const filterCountryList = Object.keys(countryCities).sort();
  const filterCityList = filterCountry !== "all" ? (countryCities[filterCountry] || []) : [];
  const filteredListings = listings.filter((l) => {
    if (filterCountry !== "all" && l.country && l.country !== filterCountry) return false;
    if (filterCity !== "all" && l.city && l.city !== filterCity) return false;
    if (filterSearch && !l.title.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  });

  const [events, setEvents] = useState<Array<{ id: string; title: string; event_date: string; max_attendees: number | null; status: string }>>([]);

  const [stats, setStatsRaw] = useState({ profileViews: 0, eventAttendees: 0, totalListings: 0, averageRating: null as number | null, ratingCount: 0 });
  const setStats = setStatsRaw;

  return (
    <>
      <MapAddressBanner />
      {/* Business header */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-2xl shrink-0 overflow-hidden">
            {business.avatarUrl ? (
              <img src={business.avatarUrl} alt={business.name} className="w-full h-full object-cover" />
            ) : business.avatar}
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
              {business.website && (
                <a href={`https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <Globe className="h-3 w-3" /> {business.website}
                </a>
              )}
            </div>
          </div>
          {(() => {
            const hasExtraRevenue = (business.balance ?? 0) > 0; // Kupon/etkinlik gelirleri eklendiğinde "Toplam Gelir"
            return (
              <div className="bg-primary/10 rounded-xl p-4 text-center shrink-0 min-w-[140px]">
                <CreditCard className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">€{business.balance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{hasExtraRevenue ? "Toplam Gelir" : "Platform Geliri"}</p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Stats row — bound to live backend counters */}
      <TooltipProvider>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Profil Görüntülenme", value: stats.profileViews, icon: Eye, color: "text-primary", tip: "Profilin sayfa açılışlarında profile_views tablosuna yazılan benzersiz görüntülenme sayısı." },
            { label: "Etkinlik Katılımcı", value: stats.eventAttendees, icon: Users, color: "text-turquoise", tip: "Senin oluşturduğun etkinliklerin maksimum katılımcı kapasitelerinin toplamı." },
            { label: "Toplam İlan", value: stats.totalListings, icon: Package, color: "text-gold", tip: "Veritabanındaki yayında olan etkinlik & iş ilanı sayın." },
            { label: "Ortalama Puan", value: stats.averageRating ?? "—", icon: Star, color: "text-gold",
              tip: "Müşteri puanlarının ağırlıklı ortalamasıdır. Hesap mantığı: (kupon kullanan müşterilerden gelen puanlar × 0.6) + (etkinlik katılımcı geri bildirimleri × 0.3) + (mesaj/RFQ tamamlama puanları × 0.1). Henüz toplanmış puan yok; ilk değerlendirme geldiğinde otomatik hesaplanır." },
          ].map((stat, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div className="bg-card rounded-xl border border-border p-4 shadow-card text-center cursor-help relative">
                  <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    {stat.label} <Info className="h-3 w-3 opacity-60" />
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{stat.tip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Tabs */}
      <ProfileSetupBanner />
      <Tabs
        value={gateLocked ? "settings" : (activeTab ?? "listings")}
        onValueChange={(v) => { if (!gateLocked || v === "settings" || v === "messages" || v === "notifications") setActiveTab(v); }}
        className="w-full"
      >
        <TabsList className={`bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1 ${gateLocked ? "[&>button:not([data-state=active])]:opacity-50" : ""}`}>
          <TabsTrigger value="listings" className="gap-1.5"><Package className="h-4 w-4" /> İlanlar</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5"><Inbox className="h-4 w-4" /> Teklif Talepleri</TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1.5"><Tag className="h-4 w-4" /> Kuponlar</TabsTrigger>
          <TabsTrigger value="loyalty" className="gap-1.5"><ScanLine className="h-4 w-4" /> Loyalty</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5"><Calendar className="h-4 w-4" /> Etkinlikler</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analitik</TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1.5"><Megaphone className="h-4 w-4" /> Tanıtım</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><Globe className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-1.5"><Handshake className="h-4 w-4" /> İş Fırsatları</TabsTrigger>
          <TabsTrigger value="follows" className="gap-1.5"><Heart className="h-4 w-4" /> Takip Ettiklerim</TabsTrigger>
          <NotificationsTabTrigger className="text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" />
          <TabsTrigger value="messages" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><InboxIcon className="h-4 w-4" /> Mesaj Kutusu</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Settings className="h-4 w-4" /> Profil Ayarları</TabsTrigger>
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
                onCreated={(l) => {
                  setListings((prev) => [
                    { id: Date.now(), title: l.title, type: l.type, status: "Aktif", views: 0, applications: 0, package: l.package, price: l.price },
                    ...prev,
                  ]);
                }}
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
              <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> İş İlanları & Listeler
                </h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilters((v) => !v)}>
                    <Filter className="h-3.5 w-3.5" /> {showFilters ? "Gizle" : "Daha fazla"}
                  </Button>
                  <Button className="gap-2" onClick={() => setShowCreateJob(true)}><Plus className="h-4 w-4" /> Yeni İlan</Button>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5 p-4 rounded-xl bg-muted/40 border border-border">
                  <Select value={filterCountry} onValueChange={(v) => { setFilterCountry(v); setFilterCity("all"); }}>
                    <SelectTrigger><SelectValue placeholder="Ülke" /></SelectTrigger>
                    <SelectContent className="bg-card z-50 max-h-72">
                      <SelectItem value="all">Tüm Ülkeler</SelectItem>
                      {filterCountryList.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterCity} onValueChange={setFilterCity} disabled={filterCountry === "all"}>
                    <SelectTrigger><SelectValue placeholder={filterCountry === "all" ? "Önce ülke seç" : `Tüm Şehirler - ${filterCountry}`} /></SelectTrigger>
                    <SelectContent className="bg-card z-50 max-h-72">
                      <SelectItem value="all">Tüm Şehirler{filterCountry !== "all" ? ` - ${filterCountry}` : ""}</SelectItem>
                      {filterCityList.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="İlan başlığında ara..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
                  </div>
                </div>
              )}

              {filteredListings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{listings.length === 0 ? "Henüz ilanın yok. İlk ilanını oluştur." : "Filtrelere uyan ilan bulunamadı."}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredListings.map((listing) => (
                    <div key={listing.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{listing.title}</h3>
                          <Badge variant={listing.status === "Aktif" ? "default" : "secondary"} className="text-xs">
                            {listing.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">⏱ 24 saate kadar onayda aktif</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {listing.type}</span>
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {listing.views} görüntülenme</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {listing.applications} başvuru</span>
                          {listing.package && (
                            <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                              <Star className="h-3 w-3" /> {listing.package}{listing.price ? ` · €${listing.price}` : ""}
                            </Badge>
                          )}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditingJob(listing)}>
                        <Edit className="h-3 w-3" /> Düzenle
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* COUPONS */}
        <TabsContent value="coupons" className="mt-6">
          <CouponManager businessName={business.name} />
        </TabsContent>

        {/* LOYALTY */}
        <TabsContent value="loyalty" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-10 shadow-card text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <ScanLine className="h-7 w-7 text-primary" />
            </div>
            <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30 mb-3">Yakında</Badge>
            <h2 className="text-xl font-bold text-foreground mb-2">Loyalty & Kupon Okuyucu</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Müşteri kuponlarını tarayıp indirim uygulayabileceğin sadakat sistemini hazırlıyoruz. Açıldığında bildirim ve e-posta göndereceğiz.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={() => toast({ title: "Listeye eklendin 🚀", description: "Loyalty açıldığında haber vereceğiz." })}
            >
              Bana Haber Ver
            </Button>
          </div>
        </TabsContent>

        {/* EVENTS */}
        <TabsContent value="events" className="mt-6">
          <div className="mb-4"><MyOpenCafesAsEvents /></div>
          {managingEvent ? (
            <EventManagePanel event={managingEvent} onBack={() => { setManagingEvent(null); loadEvents(); }} />
          ) : showCreateEvent ? (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <Button variant="ghost" size="sm" className="gap-1 mb-4" onClick={() => { setShowCreateEvent(false); loadEvents(); }}>
                <ArrowLeft className="h-4 w-4" /> Etkinliklere Dön
              </Button>
              <CreateEventForm onClose={() => { setShowCreateEvent(false); loadEvents(); }} />
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-turquoise" /> İşletme Etkinlikleri
                </h2>
                <Button className="gap-2" onClick={() => setShowCreateEvent(true)}><Plus className="h-4 w-4" /> Etkinlik Oluştur</Button>
              </div>
              {events.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Henüz etkinliğin yok. İlk etkinliğini oluştur.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const d = new Date(event.event_date);
                    const day = d.getDate();
                    const month = d.toLocaleDateString("tr-TR", { month: "short" });
                    return (
                      <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="text-center shrink-0 w-14">
                          <div className="text-xl font-bold text-primary">{day}</div>
                          <div className="text-xs text-muted-foreground">{month}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {event.max_attendees ?? 0} kontenjan</span>
                            <Badge variant="outline" className="text-xs">{event.status}</Badge>
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setManagingEvent({ id: Number(event.id) || 0, title: event.title, date: `${day} ${month}`, attendees: event.max_attendees ?? 0, status: event.status } as any)}>Yönet</Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card text-center">
              <Eye className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{stats.profileViews}</p>
              <p className="text-xs text-muted-foreground mt-1">Toplam Profil Görüntülenme</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card text-center">
              <Package className="h-6 w-6 text-gold mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{stats.totalListings}</p>
              <p className="text-xs text-muted-foreground mt-1">Yayında Olan İlan / Etkinlik</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card text-center">
              <Users className="h-6 w-6 text-turquoise mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{stats.eventAttendees}</p>
              <p className="text-xs text-muted-foreground mt-1">Etkinlik Toplam Kontenjan</p>
            </div>
          </div>
          <div className="mt-6 bg-card rounded-2xl border border-border p-6 shadow-card text-center text-sm text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Detaylı haftalık trend ve başvuru kaynağı raporları, ilk başvurular geldikçe burada görünecek.
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
                { title: "Öne Çıkan İşletme", desc: "Ana sayfada ve arama sonuçlarında üst sıralarda görünün", price: "€—/hafta", icon: Star },
                { title: "Etkinlik Boost", desc: "Etkinliklerinizi platforma ve mail listelerine tanıtın", price: "€—/etkinlik", icon: TrendingUp },
                { title: "AI Görüşme (24/7 İşletme Klonu)", desc: "RAG altyapısı + üyelik paketi başvurusu, veri işleme ve test sonrası aktif. Müşteriler AI klonunuzla 7/24 görüşür.", price: "€—/ay", icon: Bot },
              ].map((promo) => (
                <div key={promo.title} className="relative border border-border rounded-xl p-4 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                  <Badge variant="outline" className="absolute top-2 right-2 text-[10px] bg-gold/10 text-gold border-gold/30">Yakında</Badge>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => toast({ title: "Yakında 🚀", description: `${promo.title} açıldığında size bildirim ve e-posta göndereceğiz.` })}
                  >
                    Bana Haber Ver
                  </Button>
                </div>
              ))}
              <div className="md:col-span-2 relative border border-primary/30 rounded-xl p-4 bg-primary/5">
                <Badge variant="outline" className="absolute top-2 right-2 text-[10px] bg-gold/10 text-gold border-gold/30">Yakında</Badge>
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
                <SocialMediaCampaignDialog entityName={business.name} entityType="business" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppGroupsTab />
        </TabsContent>

        {/* OPPORTUNITIES */}
        <TabsContent value="opportunities" className="mt-6">
          <BusinessOpportunitiesPanel />
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="mt-6">
          <NotificationsList />
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="messages" className="space-y-4">
          <MessagesInbox />
        </TabsContent>

        <TabsContent value="follows" className="mt-6">
          <MyFollowsSection />
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <BusinessLicenseUpload contextLabel="İşletme hesabınız" />
          <ProfileLocationPhoneSettings />
          <ProfileCommonSettings role="business" />
          <ProfileSubcategoriesSettings accountTypeOverride="business" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> İşletme Bilgileri
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Profil Fotoğrafı</Label>
                  <div className="flex items-center gap-4 mt-1.5">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
                      {biz.avatar_url
                        ? <img src={biz.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleAvatarUpload(f);
                        }}
                      />
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-sm">
                        <Camera className="h-4 w-4" /> {uploadingAvatar ? "Yükleniyor..." : (biz.avatar_url ? "Değiştir" : "Yükle")}
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <Label>İşletme Adı</Label>
                  <Input value={biz.business_name} onChange={(e) => setBiz({ ...biz, business_name: e.target.value })} placeholder="Örn. Anatolian Tech GmbH" />
                </div>
                <div>
                  <Label>Sektör</Label>
                  <Input value={biz.business_sector} onChange={(e) => setBiz({ ...biz, business_sector: e.target.value })} placeholder="Yazılım, Restoran, Hukuk..." />
                </div>
                <div>
                  <Label>Web Sitesi</Label>
                  <Input value={biz.business_website} onChange={(e) => setBiz({ ...biz, business_website: e.target.value })} placeholder="ornek.com" />
                </div>
                <div>
                  <Label>Kısa Tanıtım</Label>
                  <Textarea rows={3} value={biz.business_description} onChange={(e) => setBiz({ ...biz, business_description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Ülke</Label>
                    <Input value={biz.country} onChange={(e) => setBiz({ ...biz, country: e.target.value })} placeholder="Almanya" />
                  </div>
                  <div>
                    <Label>Şehir</Label>
                    <Input value={biz.city} onChange={(e) => setBiz({ ...biz, city: e.target.value })} placeholder="Berlin" />
                  </div>
                </div>
                <div>
                  <Label>Açık Adres</Label>
                  <Input value={biz.address} onChange={(e) => setBiz({ ...biz, address: e.target.value })} placeholder="Sokak, no, posta kodu" />
                  <div className="mt-2 flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
                    <div>
                      <p className="text-sm font-medium text-foreground">Haritada işletmemi göster</p>
                      <p className="text-xs text-muted-foreground">İşaretlenirse Diaspora Haritası'nda yer alırsın.</p>
                    </div>
                    <Switch checked={biz.show_on_map} onCheckedChange={handleShowOnMapChange} />
                  </div>
                </div>
                <div>
                  <Label>Telefon</Label>
                  <div className="flex gap-2">
                    <Input className="w-20 shrink-0 text-center" value={dialFor(biz.country) || "+"} readOnly title="Ülkenize göre otomatik" />
                    <Input
                      className="flex-1"
                      value={biz.phone.replace(/^\+\d+\s*/, "")}
                      onChange={(e) => setBiz({ ...biz, phone: `${dialFor(biz.country)}${e.target.value ? " " + e.target.value : ""}` })}
                      placeholder="30 1234567"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Ülke kodu kayıtlı ülkenden otomatik gelir.</p>
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={async () => {
                    await persistField({
                      business_name: biz.business_name,
                      business_sector: biz.business_sector,
                      business_website: biz.business_website,
                      business_description: biz.business_description,
                      country: biz.country,
                      city: biz.city,
                      address: biz.address,
                      phone: biz.phone,
                    });
                    toast({ title: "Kaydedildi ✅", description: "İşletme bilgilerin güncellendi." });
                  }}
                >
                  Kaydet
                </Button>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-card">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" /> Görünürlük
              </h2>
              <div className="space-y-2">
                {[
                  { key: "verified_business" as const, title: "Onaylı İşletme Rozeti", desc: "Doğrulanmış işletme olarak görünün", on: isVerified, req: verifiedReq, badge: "1 yıl ücretsiz" },
                  { key: "hiring_mode" as const, title: "İşe Alım Modu", desc: "Aktif olarak eleman aradığınızı gösterin (24 sa. içinde onaylanır)", on: hiringMode, req: hiringReq },
                ].map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3 py-1.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{row.title}</p>
                        {row.badge && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[10px] px-1.5 py-0">{row.badge}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{row.desc}</p>
                    </div>
                    {row.on ? (
                      <Badge className="bg-turquoise/10 text-turquoise border border-turquoise/30 text-[10px]">Onaylı ✓</Badge>
                    ) : row.req?.status === "pending" ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">Onay bekliyor</Badge>
                    ) : row.req?.status === "rejected" ? (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => submitApproval(row.key)}>Tekrar Gönder</Button>
                    ) : (
                      <Button size="sm" className="h-7 text-xs" onClick={() => submitApproval(row.key)}>Onaya Gönder</Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <SocialMediaInputs />
          </div>

          {/* Confirm hide-from-map dialog */}
          <AlertDialog open={confirmHideMap} onOpenChange={setConfirmHideMap}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Haritada yer almak istemiyor musunuz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diaspora Haritası, müşterilerin sizi en kolay bulduğu kanaldır. Devre dışı bırakırsanız işletmeniz haritada görünmez.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmHideMap(false)}>Vazgeç, görünür kalsın</AlertDialogCancel>
                <AlertDialogAction onClick={async () => {
                  setBiz((b) => ({ ...b, show_on_map: false }));
                  await persistField({ show_on_map: false });
                  setConfirmHideMap(false);
                  toast({ title: "Haritadan çıkarıldı", description: "Dilediğin zaman tekrar açabilirsin." });
                }}>Evet, gizle</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ProfileBusiness;
