import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Calendar, Tag, Users, Bell, CreditCard,
  ArrowLeft, Plus, ChevronRight, Star, Bot, MessageSquare,
  MapPin, Clock, Gift, TrendingUp, Briefcase, Linkedin,
  FileText, Eye, EyeOff, Settings, Shield, UserPlus, ScanLine, QrCode,
  Globe, Trash2, ExternalLink, ClipboardList, Download, ChevronDown, ChevronUp, Info
} from "lucide-react";
import StripeTransactionsPanel from "@/components/StripeTransactionsPanel";
import NotificationsList from "@/components/NotificationsList";
import QRScannerMock from "@/components/QRScannerMock";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { consultants, associations, events as allEvents } from "@/data/mock";
import { useRelocationResearches } from "@/hooks/useRelocationResearches";
import ServiceRequestForm from "@/components/ServiceRequestForm";
import ServiceRequestsList from "@/components/ServiceRequestsList";
import WhatsAppGroupsTab from "@/components/profiles/WhatsAppGroupsTab";
import WelcomePack from "@/components/profiles/WelcomePack";
import { useDemoFlag } from "@/lib/demoFlags";
import { useFollow } from "@/hooks/useFollow";



const ProfileIndividual = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "transactions";
  const [isJobSeeking, setIsJobSeeking] = useState(true);
  const [_showWelcomePack, _setShowWelcomePack] = useState(true); // kept for future use
  const [profileVisible, setProfileVisible] = useState(true);
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com/in/emreaydin");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploaded, setCvUploaded] = useState(true);

  const user = {
    name: "Emre Aydın",
    email: "emre@example.com",
    avatar: "EA",
    country: "Almanya",
    city: "Berlin",
    balance: 250.00,
    title: "Yazılım Mühendisi",
  };

  const followedConsultants = consultants.slice(0, 3);
  const followedAssociations = associations.slice(0, 2);

  const hasRealCoupons = useDemoFlag("coupons");
  const demoCoupons = [
    { id: 1, title: "Demo · Hoşgeldin İndirimi %15", code: "DEMO15", expires: "30 Nis 2026", type: "discount" as const, businessName: "Turkish Döner GmbH" },
    { id: 2, title: "Demo · Hediye Baklava", code: "DEMOTATLI", expires: "15 Mar 2026", type: "free" as const, businessName: "İstanbul Baklava House" },
  ];
  const coupons = hasRealCoupons ? [] : demoCoupons;

  const [selectedCouponForScan, setSelectedCouponForScan] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const { researches, remove: removeResearch } = useRelocationResearches();
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [expandedResearchId, setExpandedResearchId] = useState<string | null>(null);
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
      setCvUploaded(true);
    }
  };

  const handleCvRemove = () => {
    setCvFile(null);
    setCvUploaded(false);
    if (cvInputRef.current) cvInputRef.current.value = "";
  };

  // Notifications now load from the live notifications table via NotificationsList component.

  const { isFollowed, list: followList } = useFollow();
  const followedEventIds = followList("event");
  const joinedEventIds = followList("event-joined");
  const userEventIds = Array.from(new Set([...followedEventIds, ...joinedEventIds]));
  const userEvents = userEventIds
    .map((id) => allEvents.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => !!e);

  const TR_MONTHS: Record<string, number> = {
    Oca: 0, Şub: 1, Mar: 2, Nis: 3, May: 4, Haz: 5,
    Tem: 6, Ağu: 7, Eyl: 8, Eki: 9, Kas: 10, Ara: 11,
  };
  const parseTrDate = (s: string): Date | null => {
    const parts = s.split(" ");
    if (parts.length < 2) return null;
    const day = parseInt(parts[0], 10);
    const month = TR_MONTHS[parts[1]];
    const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
    if (isNaN(day) || month === undefined) return null;
    return new Date(year, month, day);
  };

  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

  const calendarEvents = userEvents
    .map((e) => {
      const d = parseTrDate(e.date);
      const isPast = d ? d < new Date(now.getFullYear(), now.getMonth(), now.getDate()) : false;
      const inArchiveWindow = d ? d >= threeMonthsAgo : false;
      return {
        id: e.id,
        title: e.title,
        date: e.date.split(" ").slice(0, 2).join(" "),
        time: e.time,
        type: (e.type === "online" ? "online" : "yüz yüze") as "online" | "yüz yüze",
        city: e.city,
        source: isFollowed("event-joined", e.id) ? ("joined" as const) : ("followed" as const),
        isPast,
        keep: !isPast || inArchiveWindow,
      };
    })
    .filter((e) => e.keep);

  const upcomingEvents = calendarEvents.filter((e) => !e.isPast);
  const archivedEvents = calendarEvents.filter((e) => e.isPast);
  const cityOptions = Array.from(new Set(upcomingEvents.map((e) => e.city))).filter(Boolean);

  const [calendarFilter, setCalendarFilter] = useState<string>("all");
  const [showArchive, setShowArchive] = useState(false);

  const baseList = showArchive ? archivedEvents : upcomingEvents;
  const filteredCalendar = calendarFilter === "all" || showArchive
    ? baseList
    : baseList.filter((e) => e.city === calendarFilter);

  return (
    <>

      {/* Profile header */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shrink-0">
            {user.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              {isJobSeeking && (
                <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30 gap-1">
                  <Briefcase className="h-3 w-3" /> İş Arıyorum
                </Badge>
              )}
              {profileVisible ? (
                <Badge variant="outline" className="gap-1 text-xs"><Eye className="h-3 w-3" /> Profil Açık</Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-xs text-muted-foreground"><EyeOff className="h-3 w-3" /> Profil Gizli</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{user.title} · {user.email}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" /> {user.city}, {user.country}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              )}
              {cvUploaded && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" /> CV yüklendi
                </span>
              )}
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-4 text-center shrink-0 min-w-[140px]">
            <CreditCard className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground mt-1">Stripe ile</p>
            <p className="text-sm font-semibold text-foreground">İşlemlerim</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Yakında aktif</p>
          </div>
        </div>
      </div>


      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="transactions" className="gap-1.5"><CreditCard className="h-4 w-4" /> İşlemlerim</TabsTrigger>
          <TabsTrigger value="service-requests" className="gap-1.5"><ClipboardList className="h-4 w-4" /> Hizmet Talepleri</TabsTrigger>
          <TabsTrigger value="relocations" className="gap-1.5"><Globe className="h-4 w-4" /> Taşınma Yönetimi</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5"><Calendar className="h-4 w-4" /> Takvim</TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1.5"><Tag className="h-4 w-4" /> Kuponlar</TabsTrigger>
          <TabsTrigger value="following" className="gap-1.5"><Users className="h-4 w-4" /> Takip</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-4 w-4" /> Bildirimler</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-4 w-4" /> Ayarlar</TabsTrigger>
        </TabsList>

        {/* TRANSACTIONS (Stripe) */}
        <TabsContent value="transactions" className="mt-6">
          <StripeTransactionsPanel stripeConnected={false} outgoingOnly />
        </TabsContent>

        {/* RELOCATION MANAGEMENT */}
        <TabsContent value="relocations" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Researches */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" /> Araştırmalarım
                </h2>
                <Link to="/relocation">
                  <Button variant="default" size="sm" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Yeni
                  </Button>
                </Link>
              </div>

              {researches.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-3 block">🌍</span>
                  <p className="text-sm font-semibold text-foreground mb-1">Henüz araştırma yok</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Taşınma Motoru ile araştırma başlatın.
                  </p>
                  <Link to="/relocation">
                    <Button variant="hero" size="sm" className="gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> Taşınma Motoru
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {researches.map((research) => {
                    const isExpanded = expandedResearchId === research.id;
                    const isChatExpanded = expandedChatId === research.id;

                    const generateFullReport = () => {
                      const surveyContent = `Hedef: ${research.targetCountry} ${research.targetCity || ""}\nMeslek: ${research.profession}\nAile: ${research.familyStatus}\nTecrübe: ${research.userExperience || "—"}`;
                      const checklistContent = research.checklistState?.map(c => `${c.done ? "✅" : "⬜"} ${c.item} — ${c.cost}`).join("\n") || "Checklist yok";
                      const chatContent = research.chatMessages.filter(m => m.role === "assistant").map(m => m.content).join("\n\n---\n\n");
                      const docsContent = research.savedDocs.map(d => `[${d.type}] ${d.title}\n${d.content}`).join("\n\n");
                      return `📋 ANKET VERİLERİ\n${surveyContent}\n\n✅ CHECKLİST\n${checklistContent}\n\n📄 DÖKÜMANLAR\n${docsContent}\n\n💬 SOHBET GEÇMİŞİ\n${chatContent}`;
                    };

                    const handleDownload = () => {
                      const report = generateFullReport();
                      const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${research.title || "arastirma"}_rapor.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    };

                    return (
                      <div
                        key={research.id}
                        className="border border-border rounded-xl p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">
                              🌍
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-foreground text-sm">
                                {research.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {research.targetCountry}{research.targetCity ? ` / ${research.targetCity}` : ""}
                              </p>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                  💬 {research.chatMessages.length}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-turquoise/10 text-turquoise">
                                  📄 {research.savedDocs.length}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60">
                                  {new Date(research.updatedAt).toLocaleDateString("tr-TR")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Link to={`/relocation?research=${research.id}`}>
                              <Button variant="default" size="icon" className="h-7 w-7" title="Araştırmaya Git">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Button variant="outline" size="icon" className="h-7 w-7" title="İndir" onClick={handleDownload}>
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeResearch(research.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
                          <Button variant="ghost" size="sm" className="gap-1 text-[11px] h-7 px-2" onClick={() => setExpandedResearchId(isExpanded ? null : research.id)}>
                            <FileText className="h-3 w-3" /> Dökümanlar
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1 text-[11px] h-7 px-2" onClick={() => setExpandedChatId(isChatExpanded ? null : research.id)}>
                            <MessageSquare className="h-3 w-3" /> Sohbet
                            {isChatExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className="mt-2 space-y-1.5">
                            {research.savedDocs.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">Kayıtlı döküman yok.</p>
                            ) : research.savedDocs.map((doc, i) => (
                              <div key={i} className="p-2 rounded-lg bg-card border border-border/50">
                                <p className="text-[11px] font-semibold text-foreground">{doc.type === "report" ? "📊" : doc.type === "checklist" ? "📋" : "💬"} {doc.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{doc.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {isChatExpanded && (
                          <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto">
                            {research.chatMessages.length <= 1 ? (
                              <p className="text-xs text-muted-foreground italic">Henüz sohbet yok.</p>
                            ) : research.chatMessages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] ${
                                  msg.role === "user" ? "bg-primary/10 text-foreground" : "bg-card border border-border/50 text-foreground"
                                }`}>
                                  <p className="whitespace-pre-line">{msg.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Welcome Pack */}
            <div>
              <WelcomePack
                userName={user.name}
                country={user.country}
                city={user.city}
                onDismiss={() => {}}
              />
            </div>
          </div>
        </TabsContent>

        {/* CALENDAR */}
        <TabsContent value="calendar" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Takvimim
              </h2>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant={!showArchive && calendarFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setShowArchive(false); setCalendarFilter("all"); }}
                  className="text-xs"
                >
                  Tümü
                </Button>
                {!showArchive && cityOptions.map((city) => (
                  <Button
                    key={city}
                    variant={calendarFilter === city ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCalendarFilter(city)}
                    className="text-xs"
                  >
                    📍 {city}
                  </Button>
                ))}
                <Button
                  variant={showArchive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowArchive((v) => !v)}
                  className="text-xs gap-1"
                >
                  🗂️ Arşiv {archivedEvents.length > 0 && `(${archivedEvents.length})`}
                </Button>
              </div>
            </div>
            {filteredCalendar.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {showArchive
                    ? "Arşivde gösterilecek geçmiş etkinlik yok. (Son 3 ay tutulur)"
                    : <>Takvimin boş. Etkinlikleri <Link to="/events" className="text-primary hover:underline">takip et</Link> veya bilet alarak buraya ekle.</>}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCalendar.map((evt) => {
                  const typeColors: Record<string, string> = {
                    online: "bg-turquoise/10 text-turquoise",
                    "yüz yüze": "bg-primary/10 text-primary",
                  };
                  return (
                    <Link
                      key={evt.id}
                      to={`/events/${evt.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="text-center shrink-0 w-14">
                        <div className="text-xl font-bold text-primary">{evt.date.split(" ")[0]}</div>
                        <div className="text-xs text-muted-foreground">{evt.date.split(" ")[1]}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{evt.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          <Clock className="h-3 w-3" /> {evt.time}
                          <span className="text-muted-foreground/50">·</span>
                          <MapPin className="h-3 w-3" /> {evt.city}
                          <span className={`px-2 py-0.5 rounded-full text-xs ${typeColors[evt.type] || "bg-muted text-muted-foreground"}`}>
                            {evt.type}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {evt.source === "joined" ? "🎟️ Bilet" : "🔔 Takip"}
                          </Badge>
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* COUPONS */}
        <TabsContent value="coupons" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" /> Kuponlarım & İndirimlerim
              </h2>
              <Button
                variant={showScanner ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => { setShowScanner(!showScanner); setSelectedCouponForScan(null); }}
              >
                <ScanLine className="h-4 w-4" /> {showScanner ? "Listeye Dön" : "Kupon Kullan"}
              </Button>
            </div>

            {!hasRealCoupons && (
              <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3 mb-5 flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-foreground">Demo görünüm</p>
                  <p className="text-muted-foreground mt-0.5">
                    İşletmelerden aldığınız kuponlar burada listelenir. Aşağıdakiler örnek (demo) kuponlardır;
                    ilk gerçek kupon satın alımınızda otomatik olarak kaldırılır.
                  </p>
                </div>
                <Badge variant="outline" className="border-amber-500/40 text-amber-700 shrink-0 text-[10px]">Demo</Badge>
              </div>
            )}

            {showScanner ? (
              <div className="space-y-6">
                {!selectedCouponForScan ? (
                  <>
                    <p className="text-sm text-muted-foreground text-center mb-4">Kullanmak istediğiniz kuponu seçin:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {coupons.map((coupon) => (
                        <button
                          key={coupon.id}
                          onClick={() => setSelectedCouponForScan(coupon.id)}
                          className="text-left border border-border rounded-xl p-4 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                        >
                          <h3 className="font-bold text-foreground text-sm">{coupon.title}</h3>
                          <p className="text-xs text-muted-foreground">{coupon.businessName}</p>
                          <code className="text-xs font-bold text-primary mt-1 block">{coupon.code}</code>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      İşletmedeki okuyucuya gösterin:
                    </p>
                    <div className="bg-muted rounded-2xl p-6 mb-4">
                      <QrCode className="h-32 w-32 text-foreground mx-auto" />
                      <p className="text-center font-bold text-foreground mt-3">
                        {coupons.find(c => c.id === selectedCouponForScan)?.code}
                      </p>
                      <p className="text-center text-xs text-muted-foreground mt-1">
                        {coupons.find(c => c.id === selectedCouponForScan)?.businessName}
                      </p>
                    </div>
                    <QRScannerMock couponCode={coupons.find(c => c.id === selectedCouponForScan)?.code} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setSelectedCouponForScan(null)}
                    >
                      Başka Kupon Seç
                    </Button>
                  </div>
                )}
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                İşletmelerden aldığınız kuponlar burada listelenecek.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="relative border border-dashed border-primary/30 rounded-xl p-5 bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${coupon.type === "free" ? "bg-turquoise/10 text-turquoise" : "bg-gold/10 text-gold"}`}>
                        {coupon.type === "free" ? "Ücretsiz" : "İndirim"}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{coupon.title}</h3>
                    <p className="text-xs text-muted-foreground mb-1">{coupon.businessName}</p>
                    <p className="text-xs text-muted-foreground mb-3">Son: {coupon.expires}</p>
                    <div className="bg-card rounded-lg px-3 py-2 text-center border border-border">
                      <code className="text-sm font-bold text-primary tracking-wider">{coupon.code}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* FOLLOWING */}
        <TabsContent value="following" className="mt-6 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-gold" /> Takip Ettiğim Danışmanlar
            </h2>
            <div className="space-y-3">
              {followedConsultants.map((c) => (
                <Link to={`/consultant/${c.id}`} key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <img src={c.photo} alt={c.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">{c.role} · {c.city}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="default" size="sm" className="gap-1 text-xs"><Bot className="h-3 w-3" /> AI Twin</Button>
                    <Button variant="outline" size="sm" className="gap-1 text-xs"><MessageSquare className="h-3 w-3" /></Button>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-turquoise" /> Takip Ettiğim Dernekler
            </h2>
            <div className="space-y-3">
              {followedAssociations.map((a) => (
                <Link to={`/association/${a.id}`} key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold shrink-0">{a.logo}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{a.name}</h3>
                    <p className="text-sm text-muted-foreground">{a.type} · {a.city}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Bildirimler
            </h2>
            <NotificationsList />
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
                <Shield className="h-5 w-5 text-primary" /> Profil Ayarları
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">İş Arıyorum Badge'i</p>
                    <p className="text-sm text-muted-foreground">Profilinizde "İş Arıyorum" etiketi görünsün</p>
                  </div>
                  <Switch checked={isJobSeeking} onCheckedChange={setIsJobSeeking} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Profil Görünürlüğü</p>
                    <p className="text-sm text-muted-foreground">Diğer üyeler profilinizi görebilsin</p>
                  </div>
                  <Switch checked={profileVisible} onCheckedChange={setProfileVisible} />
                </div>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-primary" /> Kariyer Bilgileri
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>LinkedIn Profili</Label>
                  <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/kullaniciadi" />
                </div>
                <div>
                  <Label>CV / Özgeçmiş</Label>
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleCvUpload}
                  />
                  <div className="mt-2">
                    {cvUploaded ? (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{cvFile?.name || "emre_aydin_cv.pdf"}</p>
                          <p className="text-xs text-muted-foreground">
                            Yüklendi{cvFile ? ` · ${(cvFile.size / (1024 * 1024)).toFixed(1)} MB` : " · 2.3 MB"}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleCvRemove}>Kaldır</Button>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full gap-2" onClick={() => cvInputRef.current?.click()}>
                        <FileText className="h-4 w-4" /> CV Yükle (PDF)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        {/* SERVICE REQUESTS */}
        <TabsContent value="service-requests" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" /> Hizmet Taleplerim
              </h2>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setShowServiceForm(!showServiceForm)}
              >
                <Plus className="h-4 w-4" /> {showServiceForm ? "Taleplerime Dön" : "Yeni Talep"}
              </Button>
            </div>
            {showServiceForm ? (
              <ServiceRequestForm
                onSuccess={() => setShowServiceForm(false)}
                onCancel={() => setShowServiceForm(false)}
              />
            ) : (
              <ServiceRequestsList />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ProfileIndividual;
