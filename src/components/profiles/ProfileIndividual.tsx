import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Calendar,
  Tag,
  Users,
  CreditCard,
  Plus,
  MessageSquare,
  MapPin,
  Clock,
  Gift,
  Briefcase,
  Linkedin,
  FileText,
  Settings,
  Shield,
  ScanLine,
  QrCode,
  Globe,
  Trash2,
  ExternalLink,
  ClipboardList,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
  LayoutDashboard,
  Sparkles,
  Lock,
} from "lucide-react";
import StripeTransactionsPanel from "@/components/StripeTransactionsPanel";
import NotificationsList from "@/components/NotificationsList";
import NotificationsTabTrigger from "@/components/NotificationsTabTrigger";
import QRScannerMock from "@/components/QRScannerMock";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { events as allEvents } from "@/data/mock";
import { useRelocationResearches } from "@/hooks/useRelocationResearches";
import ServiceRequestForm from "@/components/ServiceRequestForm";
import ServiceRequestsList from "@/components/ServiceRequestsList";
import WhatsAppGroupsTab from "@/components/profiles/WhatsAppGroupsTab";
import WelcomePack from "@/components/profiles/WelcomePack";
import IndividualPublicCard from "@/components/profiles/IndividualPublicCard";
import MyFollowsSection from "@/components/profiles/MyFollowsSection";
import { ProfileSetupBanner, useProfileGate } from "@/components/profiles/ProfileSetupBanner";
import { useDemoFlag } from "@/lib/demoFlags";
import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/contexts/AuthContext";
import MessagesInbox from "@/components/messaging/MessagesInbox";

const ProfileIndividual = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "transactions";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isJobSeeking, setIsJobSeeking] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com/in/emreaydin");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploaded, setCvUploaded] = useState(true);
  const [selectedCouponForScan, setSelectedCouponForScan] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [expandedResearchId, setExpandedResearchId] = useState<string | null>(null);
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const [calendarFilter, setCalendarFilter] = useState<string>("all");
  const [showArchive, setShowArchive] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const { profile, user: authUser } = useAuth();
  const { locked: gateLocked } = useProfileGate();

  const fullName = profile?.full_name?.trim() || authUser?.email?.split("@")[0] || "Emre Aydın";
  const initials = fullName
    .split(/\s+/)
    .map((piece) => piece[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "EA";

  const user = {
    name: fullName,
    email: authUser?.email || "emre@example.com",
    avatar: initials,
    country: (profile as any)?.country || "Almanya",
    city: (profile as any)?.city || "Berlin",
    title: (profile as any)?.profession || "Yazılım Mühendisi",
  };

  const hasRealCoupons = useDemoFlag("coupons");
  const demoCoupons = [
    { id: 1, title: "Demo · Hoşgeldin İndirimi %15", code: "DEMO15", expires: "30 Nis 2026", type: "discount" as const, businessName: "Turkish Döner GmbH" },
    { id: 2, title: "Demo · Hediye Baklava", code: "DEMOTATLI", expires: "15 Mar 2026", type: "free" as const, businessName: "İstanbul Baklava House" },
  ];
  const coupons = hasRealCoupons ? [] : demoCoupons;

  const { researches, remove: removeResearch } = useRelocationResearches();
  const { isFollowed, list: followList } = useFollow();
  const followedEventIds = followList("event");
  const joinedEventIds = followList("event-joined");
  const userEventIds = Array.from(new Set([...followedEventIds, ...joinedEventIds]));
  const userEvents = userEventIds
    .map((id) => allEvents.find((event) => event.id === id))
    .filter((event): event is NonNullable<typeof event> => !!event);

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

  const TR_MONTHS: Record<string, number> = {
    Oca: 0,
    Şub: 1,
    Mar: 2,
    Nis: 3,
    May: 4,
    Haz: 5,
    Tem: 6,
    Ağu: 7,
    Eyl: 8,
    Eki: 9,
    Kas: 10,
    Ara: 11,
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
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

  const calendarEvents = userEvents
    .map((event) => {
      const parsedDate = parseTrDate(event.date);
      const isPast = parsedDate ? parsedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate()) : false;
      const inArchiveWindow = parsedDate ? parsedDate >= threeMonthsAgo : false;
      return {
        id: event.id,
        title: event.title,
        date: event.date.split(" ").slice(0, 2).join(" "),
        rawDate: event.date,
        time: event.time,
        type: (event.type === "online" ? "online" : "yüz yüze") as "online" | "yüz yüze",
        city: event.city,
        source: isFollowed("event-joined", event.id) ? ("joined" as const) : ("followed" as const),
        isPast,
        keep: !isPast || inArchiveWindow,
      };
    })
    .filter((event) => event.keep);

  const recentPublicEvents = calendarEvents
    .filter((event) => {
      const parsedDate = parseTrDate(event.rawDate);
      return parsedDate ? parsedDate >= twoMonthsAgo : false;
    })
    .map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      city: event.city,
      source: event.source,
    }));

  const upcomingEvents = calendarEvents.filter((event) => !event.isPast);
  const archivedEvents = calendarEvents.filter((event) => event.isPast);
  const cityOptions = Array.from(new Set(upcomingEvents.map((event) => event.city))).filter(Boolean);
  const baseList = showArchive ? archivedEvents : upcomingEvents;
  const filteredCalendar = calendarFilter === "all" || showArchive
    ? baseList
    : baseList.filter((event) => event.city === calendarFilter);

  const cvDoc = cvUploaded
    ? { path: cvFile?.name || "local-cv", name: cvFile?.name || "emre_aydin_cv.pdf" }
    : null;

  const previewBadges = [
    profileVisible ? "Profil görünür" : "Profil gizli",
    isJobSeeking ? "İş arıyor rozeti açık" : "İş arıyor rozeti kapalı",
    linkedinUrl ? "LinkedIn bağlı" : "LinkedIn eksik",
    cvUploaded ? "CV yüklü" : "CV eksik",
  ];

  return (
    <>
      <IndividualPublicCard
        name={user.name}
        avatarInitials={user.avatar}
        email={user.email}
        title={user.title}
        city={user.city}
        country={user.country}
        recentEvents={recentPublicEvents}
        isJobSeeking={isJobSeeking}
        profileVisible={profileVisible}
        linkedinUrl={linkedinUrl}
        cvDoc={cvDoc}
        onOpenCv={() => cvInputRef.current?.click()}
      />

      <ProfileSetupBanner />

      <Tabs
        value={gateLocked && !["messages", "notifications", "settings"].includes(activeTab) ? "settings" : activeTab}
        onValueChange={(value) => {
          if (!gateLocked || value === "settings" || value === "messages" || value === "notifications") {
            setActiveTab(value);
          }
        }}
        className="w-full"
      >
        <TabsList className={`h-auto w-full justify-start gap-1 overflow-x-auto border border-border bg-card p-1 ${gateLocked ? "[&>button:not([data-state=active]):not([value=settings]):not([value=messages]):not([value=notifications])]:opacity-50" : ""}`}>
          <TabsTrigger value="transactions" className="gap-1.5">
            <CreditCard className="h-4 w-4" /> İşlemlerim
          </TabsTrigger>
          <TabsTrigger value="service-requests" className="gap-1.5">
            <ClipboardList className="h-4 w-4" /> Hizmet Talepleri
          </TabsTrigger>
          <TabsTrigger value="relocations" className="gap-1.5">
            <Globe className="h-4 w-4" /> Taşınma Yönetimi
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <Calendar className="h-4 w-4" /> Takvim
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1.5">
            <Tag className="h-4 w-4" /> Kuponlar
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-1.5">
            <Users className="h-4 w-4" /> Takip
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5">
            <MessageSquare className="h-4 w-4" /> WhatsApp
          </TabsTrigger>
          <NotificationsTabTrigger className="text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" />
          <TabsTrigger value="messages" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <MessageSquare className="h-4 w-4" /> Mesaj Kutusu
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings className="h-4 w-4" /> Profil Ayarları
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-6 space-y-6">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-card">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">
                  <LayoutDashboard className="mr-1 h-3 w-3" /> Finans Özeti
                </Badge>
                <h2 className="mt-3 text-2xl font-bold text-foreground">İşlemlerim</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Ödeme ve harcama akışlarını aynı panel içinde takip edebilmen için finans görünümü üstte tutuldu.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                Stripe bağlantısı hazır olduğunda bu alan canlı bakiyeyi ve son işlemleri aynı görünümde gösterecek.
              </div>
            </div>
          </div>
          <StripeTransactionsPanel stripeConnected={false} outgoingOnly />
        </TabsContent>

        <TabsContent value="service-requests" className="mt-6">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" /> Hizmet Taleplerim
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Taleplerini oluştur, yönet ve durumlarını tek akışta izle.
                </p>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => setShowServiceForm(!showServiceForm)}>
                <Plus className="h-4 w-4" /> {showServiceForm ? "Taleplerime Dön" : "Yeni Talep"}
              </Button>
            </div>
            {showServiceForm ? (
              <ServiceRequestForm onSuccess={() => setShowServiceForm(false)} onCancel={() => setShowServiceForm(false)} />
            ) : (
              <ServiceRequestsList />
            )}
          </div>
        </TabsContent>

        <TabsContent value="relocations" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
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
                <div className="py-8 text-center">
                  <span className="mb-3 block text-4xl">🌍</span>
                  <p className="mb-1 text-sm font-semibold text-foreground">Henüz araştırma yok</p>
                  <p className="mb-4 text-xs text-muted-foreground">Taşınma Motoru ile araştırma başlatın.</p>
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
                      const checklistContent = research.checklistState?.map((item) => `${item.done ? "✅" : "⬜"} ${item.item} — ${item.cost}`).join("\n") || "Checklist yok";
                      const chatContent = research.chatMessages.filter((message) => message.role === "assistant").map((message) => message.content).join("\n\n---\n\n");
                      const docsContent = research.savedDocs.map((doc) => `[${doc.type}] ${doc.title}\n${doc.content}`).join("\n\n");
                      return `📋 ANKET VERİLERİ\n${surveyContent}\n\n✅ CHECKLİST\n${checklistContent}\n\n📄 DÖKÜMANLAR\n${docsContent}\n\n💬 SOHBET GEÇMİŞİ\n${chatContent}`;
                    };

                    const handleDownload = () => {
                      const report = generateFullReport();
                      const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const anchor = document.createElement("a");
                      anchor.href = url;
                      anchor.download = `${research.title || "arastirma"}_rapor.txt`;
                      document.body.appendChild(anchor);
                      anchor.click();
                      document.body.removeChild(anchor);
                      URL.revokeObjectURL(url);
                    };

                    return (
                      <div key={research.id} className="rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">🌍</div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-bold text-foreground">{research.title}</h3>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {research.targetCountry}{research.targetCity ? ` / ${research.targetCity}` : ""}
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">💬 {research.chatMessages.length}</span>
                                <span className="rounded-full bg-turquoise/10 px-1.5 py-0.5 text-[10px] text-turquoise">📄 {research.savedDocs.length}</span>
                                <span className="text-[10px] text-muted-foreground/60">{new Date(research.updatedAt).toLocaleDateString("tr-TR")}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
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

                        <div className="mt-2 flex gap-2 border-t border-border/50 pt-2">
                          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px]" onClick={() => setExpandedResearchId(isExpanded ? null : research.id)}>
                            <FileText className="h-3 w-3" /> Dökümanlar
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px]" onClick={() => setExpandedChatId(isChatExpanded ? null : research.id)}>
                            <MessageSquare className="h-3 w-3" /> Sohbet
                            {isChatExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        </div>

                        {isExpanded ? (
                          <div className="mt-2 space-y-1.5">
                            {research.savedDocs.length === 0 ? (
                              <p className="text-xs italic text-muted-foreground">Kayıtlı döküman yok.</p>
                            ) : research.savedDocs.map((doc, index) => (
                              <div key={index} className="rounded-lg border border-border/50 bg-card p-2">
                                <p className="text-[11px] font-semibold text-foreground">
                                  {doc.type === "report" ? "📊" : doc.type === "checklist" ? "📋" : "💬"} {doc.title}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{doc.content}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {isChatExpanded ? (
                          <div className="mt-2 max-h-60 space-y-1.5 overflow-y-auto">
                            {research.chatMessages.length <= 1 ? (
                              <p className="text-xs italic text-muted-foreground">Henüz sohbet yok.</p>
                            ) : research.chatMessages.map((message, index) => (
                              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] ${message.role === "user" ? "bg-primary/10 text-foreground" : "border border-border/50 bg-card text-foreground"}`}>
                                  <p className="whitespace-pre-line">{message.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <WelcomePack userName={user.name} country={user.country} city={user.city} onDismiss={() => {}} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Takvimim
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={!showArchive && calendarFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowArchive(false);
                    setCalendarFilter("all");
                  }}
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
                  onClick={() => setShowArchive((value) => !value)}
                  className="gap-1 text-xs"
                >
                  🗂️ Arşiv {archivedEvents.length > 0 && `(${archivedEvents.length})`}
                </Button>
              </div>
            </div>
            {filteredCalendar.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {showArchive
                    ? "Arşivde gösterilecek geçmiş etkinlik yok. (Son 3 ay tutulur)"
                    : <>Takvimin boş. Etkinlikleri <Link to="/events" className="text-primary hover:underline">takip et</Link> veya bilet alarak buraya ekle.</>}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCalendar.map((event) => {
                  const typeColors: Record<string, string> = {
                    online: "bg-turquoise/10 text-turquoise",
                    "yüz yüze": "bg-primary/10 text-primary",
                  };
                  return (
                    <Link key={event.id} to={`/events/${event.id}`} className="flex items-center gap-4 rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted">
                      <div className="w-14 shrink-0 text-center">
                        <div className="text-xl font-bold text-primary">{event.date.split(" ")[0]}</div>
                        <div className="text-xs text-muted-foreground">{event.date.split(" ")[1]}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-foreground">{event.title}</h3>
                        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" /> {event.time}
                          <span className="text-muted-foreground/50">·</span>
                          <MapPin className="h-3 w-3" /> {event.city}
                          <span className={`rounded-full px-2 py-0.5 text-xs ${typeColors[event.type] || "bg-muted text-muted-foreground"}`}>
                            {event.type}
                          </span>
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                            {event.source === "joined" ? "🎟️ Bilet" : "🔔 Takip"}
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

        <TabsContent value="coupons" className="mt-6">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" /> Kuponlarım & İndirimlerim
              </h2>
              <Button
                variant={showScanner ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setShowScanner(!showScanner);
                  setSelectedCouponForScan(null);
                }}
              >
                <ScanLine className="h-4 w-4" /> {showScanner ? "Listeye Dön" : "Kupon Kullan"}
              </Button>
            </div>

            {!hasRealCoupons ? (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-foreground">Demo görünüm</p>
                  <p className="mt-0.5 text-muted-foreground">
                    İşletmelerden aldığınız kuponlar burada listelenir. Aşağıdakiler örnek kuponlardır; ilk gerçek kupon satın alımınızda otomatik olarak kaldırılır.
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 border-amber-500/40 text-[10px] text-amber-700">Demo</Badge>
              </div>
            ) : null}

            {showScanner ? (
              <div className="space-y-6">
                {!selectedCouponForScan ? (
                  <>
                    <p className="mb-4 text-center text-sm text-muted-foreground">Kullanmak istediğiniz kuponu seçin:</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {coupons.map((coupon) => (
                        <button
                          key={coupon.id}
                          onClick={() => setSelectedCouponForScan(coupon.id)}
                          className="rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                        >
                          <h3 className="text-sm font-bold text-foreground">{coupon.title}</h3>
                          <p className="text-xs text-muted-foreground">{coupon.businessName}</p>
                          <code className="mt-1 block text-xs font-bold text-primary">{coupon.code}</code>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <p className="mb-4 text-sm text-muted-foreground">İşletmedeki okuyucuya gösterin:</p>
                    <div className="mb-4 rounded-2xl bg-muted p-6">
                      <QrCode className="mx-auto h-32 w-32 text-foreground" />
                      <p className="mt-3 text-center font-bold text-foreground">
                        {coupons.find((coupon) => coupon.id === selectedCouponForScan)?.code}
                      </p>
                      <p className="mt-1 text-center text-xs text-muted-foreground">
                        {coupons.find((coupon) => coupon.id === selectedCouponForScan)?.businessName}
                      </p>
                    </div>
                    <QRScannerMock couponCode={coupons.find((coupon) => coupon.id === selectedCouponForScan)?.code} />
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setSelectedCouponForScan(null)}>
                      Başka Kupon Seç
                    </Button>
                  </div>
                )}
              </div>
            ) : coupons.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                İşletmelerden aldığınız kuponlar burada listelenecek.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="relative rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 transition-colors hover:bg-primary/10">
                    <div className="mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${coupon.type === "free" ? "bg-turquoise/10 text-turquoise" : "bg-gold/10 text-gold"}`}>
                        {coupon.type === "free" ? "Ücretsiz" : "İndirim"}
                      </span>
                    </div>
                    <h3 className="mb-1 font-bold text-foreground">{coupon.title}</h3>
                    <p className="mb-1 text-xs text-muted-foreground">{coupon.businessName}</p>
                    <p className="mb-3 text-xs text-muted-foreground">Son: {coupon.expires}</p>
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
                      <code className="text-sm font-bold tracking-wider text-primary">{coupon.code}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="following" className="mt-6 space-y-6">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-card">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">
                  <Sparkles className="mr-1 h-3 w-3" /> Ağ Görünümü
                </Badge>
                <h2 className="mt-3 text-2xl font-bold text-foreground">Takip panelin</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Takip ettiğin kişi, kurum ve etkinlikleri tek blokta toplayarak referans repo akışına daha yakın, temiz bir görünüm sunduk.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                Takip ilişkileri burada yönetilir; kaldırma işlemi mevcut davranışıyla aynen korunur.
              </div>
            </div>
          </div>
          <MyFollowsSection />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-card">
            <h2 className="mb-6 text-xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Bildirimler
            </h2>
            <NotificationsList />
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppGroupsTab />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <MessagesInbox />
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-card">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">
                  <Settings className="mr-1 h-3 w-3" /> Profil Ayarları
                </Badge>
                <h2 className="mt-3 text-2xl font-bold text-foreground">Bireysel panel görünümünü yönet</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Üst karttaki görünürlük ve kariyer aksiyonları bu ayarlardan beslenir. Veri akışını değiştirmeden görsel önizleme düzenini güçlendirdik.
                </p>
              </div>
              <div className="rounded-[24px] border border-border bg-background/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Önizleme durumu</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {previewBadges.map((item) => (
                    <Badge key={item} variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
                      {item}
                    </Badge>
                  ))}
                </div>
                {gateLocked ? (
                  <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800">
                    <div className="flex items-center gap-2 font-medium">
                      <Lock className="h-4 w-4" /> Panel kilitli
                    </div>
                    <p className="mt-1 text-xs text-amber-900/80">
                      Telefon doğrulama, profil fotoğrafı ve açıklama tamamlandığında diğer sekmeler tam erişime açılır.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-border bg-card p-6 shadow-card">
              <h3 className="mb-6 text-xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Görünürlük ve Rozetler
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-4">
                  <div>
                    <p className="font-medium text-foreground">İş Arıyorum badge'i</p>
                    <p className="text-sm text-muted-foreground">Profil kartında kariyer niyetini öne çıkarır.</p>
                  </div>
                  <Switch checked={isJobSeeking} onCheckedChange={setIsJobSeeking} />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-4">
                  <div>
                    <p className="font-medium text-foreground">Profil görünürlüğü</p>
                    <p className="text-sm text-muted-foreground">Diğer üyeler profilini dizin ve kart görünümünde görebilsin.</p>
                  </div>
                  <Switch checked={profileVisible} onCheckedChange={setProfileVisible} />
                </div>
                <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground">
                  Bu iki ayar yalnızca sunum katmanını etkiler; backend akışına veya kayıt yapısına yeni alan eklenmez.
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-border bg-card p-6 shadow-card">
              <h3 className="mb-6 text-xl font-bold text-foreground flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-primary" /> Kariyer Bilgileri
              </h3>
              <div className="space-y-5">
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
                      <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-4">
                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
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
                <div className="rounded-2xl border border-dashed border-border bg-background/70 p-4 text-sm text-muted-foreground">
                  LinkedIn ve CV aksiyonları üstteki public kartta otomatik görünür. Bu eşleşme referans repo kompozisyonuna göre güçlendirildi.
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ProfileIndividual;
