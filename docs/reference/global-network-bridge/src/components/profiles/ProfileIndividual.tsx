import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Calendar, Tag, Users, Bell,
  ArrowLeft, Plus, ChevronRight, Star, Bot, MessageSquare,
  MapPin, Clock, Gift, TrendingUp, Briefcase, Linkedin,
  FileText, Eye, EyeOff, Settings, Shield, UserPlus, ScanLine, QrCode,
  Globe, Trash2, ExternalLink, ClipboardList, Download, ChevronDown, ChevronUp, Info,
  Presentation, Loader2, User, X
} from "lucide-react";

import NotificationsList from "@/components/NotificationsList";
import NotificationsTabTrigger from "@/components/NotificationsTabTrigger";
import QRScannerMock from "@/components/QRScannerMock";
import SocialMediaInputs from "@/components/SocialMediaInputs";
import CreateEventForm from "@/components/CreateEventForm";
import EventManagePanel from "@/components/EventManagePanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessagesInbox from "@/components/messaging/MessagesInbox";
import { Inbox as InboxIcon } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck } from "lucide-react";
import { countryList } from "@/contexts/DiasporaContext";
import { countryCities } from "@/data/countryCities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDemoFlag } from "@/lib/demoFlags";
import { useFollow } from "@/hooks/useFollow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ProfileLocationPhoneSettings from "@/components/profiles/ProfileLocationPhoneSettings";
import ProfileCommonSettings from "@/components/profiles/ProfileCommonSettings";
import ProfileSubcategoriesSettings from "@/components/profiles/ProfileSubcategoriesSettings";
import { getHolidaysForCountries } from "@/lib/publicHolidays";



const ProfileIndividual = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "service-requests";
  const [isJobSeeking, setIsJobSeeking] = useState(true);
  const [_showWelcomePack, _setShowWelcomePack] = useState(true); // kept for future use
  const [profileVisible, setProfileVisible] = useState(true);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [cvDoc, setCvDoc] = useState<{ path: string; name: string } | null>(null);
  const [pptDoc, setPptDoc] = useState<{ path: string; name: string } | null>(null);
  const [uploadingKind, setUploadingKind] = useState<null | "cv" | "presentation">(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [managingEvent, setManagingEvent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const { locked: gateLocked } = useProfileGate();
  const [isVolunteerMentor, setIsVolunteerMentor] = useState(false);
  const [socialVisibility, setSocialVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem("individual_social_visibility");
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });
  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem("individual_social_visibility");
        setSocialVisibility(raw ? JSON.parse(raw) : {});
      } catch {}
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  const linkedinVisible = socialVisibility.linkedin ?? true;
  const [mentorTopics, setMentorTopics] = useState("");
  const [mentorWeeklyHours, setMentorWeeklyHours] = useState("");
  const [savingMentor, setSavingMentor] = useState(false);

  // Public profile editable fields (persisted in localStorage for now)
  const [tagline, setTagline] = useState(() => localStorage.getItem("indiv_tagline") || "");
  const [worldMessage, setWorldMessage] = useState(() => localStorage.getItem("indiv_world_message") || "");
  const [birthDate, setBirthDate] = useState(() => localStorage.getItem("indiv_birth_date") || "");
  const [pCountry, setPCountry] = useState(() => localStorage.getItem("indiv_country") || "");
  const [pCity, setPCity] = useState(() => localStorage.getItem("indiv_city") || "");
  const [hasPassport, setHasPassport] = useState(() => localStorage.getItem("indiv_corteqs_passport") === "true");
  const [relocating, setRelocating] = useState(() => localStorage.getItem("indiv_relocating") === "true");
  const [relocCountry, setRelocCountry] = useState(() => localStorage.getItem("indiv_reloc_country") || "");
  const [relocCity, setRelocCity] = useState(() => localStorage.getItem("indiv_reloc_city") || "");
  const [languages, setLanguages] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("indiv_languages") || "[]"); } catch { return []; }
  });
  const [languageInput, setLanguageInput] = useState("");
  const cityChoices = countryCities[pCountry] || [];
  const relocCityChoices = countryCities[relocCountry] || [];
  const savePublicProfile = async () => {
    localStorage.setItem("indiv_tagline", tagline);
    localStorage.setItem("indiv_world_message", worldMessage);
    localStorage.setItem("indiv_birth_date", birthDate);
    localStorage.setItem("indiv_country", pCountry);
    localStorage.setItem("indiv_city", pCity);
    localStorage.setItem("indiv_corteqs_passport", String(hasPassport));
    localStorage.setItem("indiv_relocating", String(relocating));
    localStorage.setItem("indiv_reloc_country", relocCountry);
    localStorage.setItem("indiv_reloc_city", relocCity);
    localStorage.setItem("indiv_languages", JSON.stringify(languages));
    // Sync to Supabase so the public card reads from profiles.languages_spoken
    if (authUser?.id) {
      await supabase.from("profiles").update({ languages_spoken: languages.slice(0, 5) }).eq("id", authUser.id);
    }
    toast({ title: "Profil güncellendi", description: "Genel profilin yenilendi." });
  };

  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const { profile } = useAuth();

  const fullName = profile?.full_name?.trim() || authUser?.email?.split("@")[0] || "Üye";
  const initials = fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";
  const user = {
    name: fullName,
    email: authUser?.email || "",
    avatar: initials,
    country: profile?.country || pCountry || "",
    city: profile?.city || pCity || "",
    title: profile?.profession || "",
  };

  const hasRealCoupons = useDemoFlag("coupons");
  const coupons: Array<{ id: number; title: string; code: string; expires: string; type: "discount" | "free"; businessName: string }> = [];

  const [selectedCouponForScan, setSelectedCouponForScan] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const { researches, remove: removeResearch } = useRelocationResearches();
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [expandedResearchId, setExpandedResearchId] = useState<string | null>(null);
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const pptInputRef = useRef<HTMLInputElement>(null);

  // Load existing documents + mentor settings from profile
  useEffect(() => {
    if (!authUser?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("cv_path, cv_name, presentation_path, presentation_name, is_volunteer_mentor, mentor_topics, mentor_weekly_hours, languages_spoken")
        .eq("id", authUser.id)
        .maybeSingle();
      if (cancelled || !data) return;
      if (data.cv_path) setCvDoc({ path: data.cv_path, name: data.cv_name || "CV" });
      if (data.presentation_path) setPptDoc({ path: data.presentation_path, name: data.presentation_name || "Sunum" });
      setIsVolunteerMentor(!!data.is_volunteer_mentor);
      setMentorTopics(data.mentor_topics || "");
      setMentorWeeklyHours(data.mentor_weekly_hours || "");
      const ls = (data as any).languages_spoken;
      if (Array.isArray(ls)) setLanguages(ls.slice(0, 5));
    })();
    return () => { cancelled = true; };
  }, [authUser?.id]);

  const saveMentorSettings = async () => {
    if (!authUser?.id) {
      toast({ title: "Giriş yapın", description: "Mentör ayarlarını kaydetmek için oturum açın.", variant: "destructive" });
      return;
    }
    if (isVolunteerMentor && !mentorTopics.trim()) {
      toast({ title: "Konu gerekli", description: "Mentörlük yapmak istediğin konuları yaz.", variant: "destructive" });
      return;
    }
    setSavingMentor(true);
    try {
      const { error } = await supabase.from("profiles").update({
        is_volunteer_mentor: isVolunteerMentor,
        mentor_topics: mentorTopics.trim() || null,
        mentor_weekly_hours: mentorWeeklyHours.trim() || null,
      }).eq("id", authUser.id);
      if (error) throw error;
      toast({
        title: isVolunteerMentor ? "Mentör kartın oluşturuldu" : "Mentör kaydın güncellendi",
        description: isVolunteerMentor
          ? "Danışmanlar → Gönüllüler altında listeleneceksin."
          : "Mentör listesinden çıkarıldın.",
      });
    } catch (err: any) {
      toast({ title: "Kaydedilemedi", description: err?.message || "Tekrar deneyin", variant: "destructive" });
    } finally {
      setSavingMentor(false);
    }
  };

  const goToMentorSettings = () => {
    setActiveTab("settings");
    setTimeout(() => {
      document.getElementById("mentor-settings")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "cv" | "presentation"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!authUser?.id) {
      toast({ title: "Giriş yapın", description: "Dosya yüklemek için oturum açmanız gerekiyor.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Dosya çok büyük", description: "Maksimum 20 MB.", variant: "destructive" });
      return;
    }
    setUploadingKind(kind);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${authUser.id}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("user-documents")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const prev = kind === "cv" ? cvDoc : pptDoc;
      if (prev?.path && prev.path !== path) {
        await supabase.storage.from("user-documents").remove([prev.path]);
      }

      const updates = kind === "cv"
        ? { cv_path: path, cv_name: file.name }
        : { presentation_path: path, presentation_name: file.name };
      const { error: dbErr } = await supabase.from("profiles").update(updates).eq("id", authUser.id);
      if (dbErr) throw dbErr;

      const next = { path, name: file.name };
      if (kind === "cv") setCvDoc(next); else setPptDoc(next);
      toast({ title: "Yüklendi", description: file.name });
    } catch (err: any) {
      toast({ title: "Yükleme hatası", description: err?.message || "Tekrar deneyin", variant: "destructive" });
    } finally {
      setUploadingKind(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleDocRemove = async (kind: "cv" | "presentation") => {
    if (!authUser?.id) return;
    const doc = kind === "cv" ? cvDoc : pptDoc;
    if (!doc) return;
    try {
      await supabase.storage.from("user-documents").remove([doc.path]);
      const updates = kind === "cv"
        ? { cv_path: null, cv_name: null }
        : { presentation_path: null, presentation_name: null };
      await supabase.from("profiles").update(updates).eq("id", authUser.id);
      if (kind === "cv") setCvDoc(null); else setPptDoc(null);
      toast({ title: "Kaldırıldı" });
    } catch (err: any) {
      toast({ title: "Hata", description: err?.message || "Tekrar deneyin", variant: "destructive" });
    }
  };

  const handleDocOpen = async (kind: "cv" | "presentation") => {
    const doc = kind === "cv" ? cvDoc : pptDoc;
    if (!doc) return;
    const { data, error } = await supabase.storage
      .from("user-documents")
      .createSignedUrl(doc.path, 60 * 5);
    if (error || !data?.signedUrl) {
      toast({ title: "Açılamadı", description: error?.message || "Tekrar deneyin", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
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

  // Pull "countries_lived" from the profile so holidays cover every country
  // the user is registered with (current + previously lived).
  const [livedCountries, setLivedCountries] = useState<string[]>([]);
  useEffect(() => {
    if (!authUser?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("countries_lived")
        .eq("id", authUser.id)
        .maybeSingle();
      if (cancelled) return;
      const cl = (data as any)?.countries_lived;
      if (Array.isArray(cl)) {
        const names = cl
          .map((c: any) => (typeof c === "string" ? c : c?.country))
          .filter((s: any): s is string => typeof s === "string" && s.length > 0);
        setLivedCountries(names);
      }
    })();
    return () => { cancelled = true; };
  }, [authUser?.id]);

  const TR_MONTH_NAMES = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  const holidayCountries = Array.from(new Set([user.country, ...livedCountries].filter(Boolean)));
  const holidayCalendar = getHolidaysForCountries(holidayCountries)
    .map((h) => {
      const isPast = h.date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const inArchiveWindow = h.date >= threeMonthsAgo;
      return {
        id: h.id,
        title: h.name,
        date: `${h.date.getDate()} ${TR_MONTH_NAMES[h.date.getMonth()]}`,
        time: "Tüm gün",
        type: "yüz yüze" as const,
        city: h.country,
        source: "holiday" as const,
        isPast,
        keep: !isPast || inArchiveWindow,
      };
    })
    .filter((h) => h.keep);

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
        source: (isFollowed("event-joined", e.id) ? "joined" : "followed") as "joined" | "followed" | "holiday",
        isPast,
        keep: !isPast || inArchiveWindow,
      };
    })
    .filter((e) => e.keep)
    .concat(holidayCalendar);

  const upcomingEvents = calendarEvents.filter((e) => !e.isPast);
  const archivedEvents = calendarEvents.filter((e) => e.isPast);
  const cityOptions = Array.from(new Set(upcomingEvents.map((e) => e.city))).filter(Boolean);

  const [calendarFilter, setCalendarFilter] = useState<string>("all");
  const [showArchive, setShowArchive] = useState(false);

  const baseList = showArchive ? archivedEvents : upcomingEvents;
  const filteredCalendar = calendarFilter === "all" || showArchive
    ? baseList
    : baseList.filter((e) => e.city === calendarFilter);

  // Recent (last 2 months) events for public card
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
  const recentPublicEvents = calendarEvents
    .filter((e) => e.source !== "holiday")
    .filter((e) => {
      const d = parseTrDate(e.date + " " + new Date().getFullYear());
      return d ? d >= twoMonthsAgo : false;
    })
    .map((e) => ({ id: e.id, title: e.title, date: e.date, city: e.city, source: e.source as "joined" | "followed" }));

  return (
    <>
      <IndividualPublicCard
        name={user.name}
        avatarInitials={user.avatar}
        email={user.email}
        title={user.title}
        tagline={tagline}
        worldMessage={worldMessage}
        city={pCity || user.city}
        country={pCountry || user.country}
        corteqsPassport={hasPassport}
        recentEvents={recentPublicEvents}
        relocating={relocating ? { country: relocCountry, city: relocCity } : null}
        isJobSeeking={isJobSeeking}
        profileVisible={profileVisible}
        linkedinUrl={linkedinUrl}
        linkedinVisible={linkedinVisible}
        cvDoc={cvDoc}
        pptDoc={pptDoc}
        onOpenCv={() => handleDocOpen("cv")}
        onOpenPpt={() => handleDocOpen("presentation")}
      />


      {/* Tabs */}
      <ProfileSetupBanner />
      <Tabs
        value={gateLocked && !["messages","notifications"].includes(activeTab) ? "settings" : activeTab}
        onValueChange={(v) => { if (!gateLocked || v === "settings" || v === "messages" || v === "notifications") setActiveTab(v); }}
        className="w-full"
      >
        <TabsList className={`bg-card border border-border w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1 ${gateLocked ? "[&>button:not([data-state=active]):not([value=settings])]:opacity-50" : ""}`}>
          <TabsTrigger value="service-requests" className="gap-1.5"><ClipboardList className="h-4 w-4" /> Hizmet Talepleri</TabsTrigger>
          <TabsTrigger value="relocations" className="gap-1.5"><Globe className="h-4 w-4" /> Taşınma Yönetimi</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5"><Calendar className="h-4 w-4" /> Takvim</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5"><Calendar className="h-4 w-4" /> Etkinliklerim</TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1.5"><Tag className="h-4 w-4" /> Kuponlar</TabsTrigger>
          <TabsTrigger value="following" className="gap-1.5"><Users className="h-4 w-4" /> Takip</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <NotificationsTabTrigger className="text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" />
          <TabsTrigger value="messages" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><InboxIcon className="h-4 w-4" /> Mesaj Kutusu</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Settings className="h-4 w-4" /> Profil Ayarları</TabsTrigger>
        </TabsList>

        {/* EVENTS - user can create & manage events too */}
        <TabsContent value="events" className="mt-6">
          {managingEvent ? (
            <EventManagePanel event={managingEvent} onBack={() => setManagingEvent(null)} />
          ) : showCreateEvent ? (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <Button variant="ghost" size="sm" className="gap-1 mb-4" onClick={() => setShowCreateEvent(false)}>
                <ArrowLeft className="h-4 w-4" /> Etkinliklere Dön
              </Button>
              <CreateEventForm onClose={() => setShowCreateEvent(false)} organizerType="member" />
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
                Oluşturduğun etkinlikler hem platformda hem de profilinde görünür. Kayıt için kendi Google Form linkini kullanabilirsin.
              </p>
            </div>
          )}
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
                  <p className="mt-4 text-xs font-semibold text-primary">
                    Yakında: Akıllı Taşınma Motorunuz Gelecek
                  </p>
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
                {holidayCountries.length > 0 && (
                  <p className="text-[11px] text-muted-foreground -mt-1 mb-1">
                    🎌 Kayıtlı olduğun ülkelerin ({holidayCountries.join(", ")}) resmi tatilleri etkinliklerinle birlikte gösterilir.
                  </p>
                )}
                {filteredCalendar.map((evt) => {
                  const typeColors: Record<string, string> = {
                    online: "bg-turquoise/10 text-turquoise",
                    "yüz yüze": "bg-primary/10 text-primary",
                  };
                  const isHoliday = evt.source === "holiday";
                  const innerContent = (
                    <>
                      <div className="text-center shrink-0 w-14">
                        <div className={`text-xl font-bold ${isHoliday ? "text-rose-600" : "text-primary"}`}>{evt.date.split(" ")[0]}</div>
                        <div className="text-xs text-muted-foreground">{evt.date.split(" ")[1]}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{evt.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          <Clock className="h-3 w-3" /> {evt.time}
                          <span className="text-muted-foreground/50">·</span>
                          {isHoliday ? (
                            <>🌍 {evt.city}</>
                          ) : (
                            <><MapPin className="h-3 w-3" /> {evt.city}</>
                          )}
                          {!isHoliday && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${typeColors[evt.type] || "bg-muted text-muted-foreground"}`}>
                              {evt.type}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-4 px-1.5 ${isHoliday ? "border-rose-500/40 text-rose-600 bg-rose-500/5" : ""}`}
                          >
                            {isHoliday ? "🎌 Resmi Tatil" : evt.source === "joined" ? "🎟️ Bilet" : "🔔 Takip"}
                          </Badge>
                        </p>
                      </div>
                    </>
                  );
                  return isHoliday ? (
                    <div
                      key={evt.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5"
                    >
                      {innerContent}
                    </div>
                  ) : (
                    <Link
                      key={evt.id}
                      to={`/events/${evt.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {innerContent}
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
          <MyFollowsSection />
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
        <TabsContent value="messages" className="space-y-4">
          <MessagesInbox />
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <ProfileLocationPhoneSettings />
          <ProfileCommonSettings role="individual" />
          <ProfileSubcategoriesSettings accountTypeOverride="individual" />
          {/* Genel Profil */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6">
            <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Genel Profil
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Bu bilgiler diğer üyelerin gördüğü profilinde yer alır.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                   <Label>Profil Mesajım (Status)</Label>
                  <span className="text-[10px] text-muted-foreground">{worldMessage.length}/100</span>
                </div>
                <textarea
                  value={worldMessage}
                  onChange={(e) => setWorldMessage(e.target.value)}
                  rows={3}
                  maxLength={100}
                  placeholder={'Örn: "Diasporadaki yazılımcılarla bağ kuralım — birlikte daha güçlüyüz." veya "Amsterdam\'a taşınıyorum, daire ve okul önerilerine açığım 🙏"'}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Profil kartının ortasındaki vurgu mesajı. Niyetini, aradığını ya da topluluğa sözünü yaz (max 100 karakter).
                </p>
              </div>
            </div>


            {/* Yakında taşınacağım */}
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-semibold text-foreground">Yakında Taşınacağım</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Açtığında taşınacağın ülke/şehir profilinde rozet olarak görünür ve "Diasporada İnsanları Ara" panelinde "Taşınacaklar" filtresinde listelenirsin.
                  </p>
                </div>
                <Switch checked={relocating} onCheckedChange={setRelocating} />
              </div>
              {relocating && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <Label>Taşınacağın Ülke</Label>
                    <Select value={relocCountry} onValueChange={(v) => { setRelocCountry(v); setRelocCity(""); }}>
                      <SelectTrigger><SelectValue placeholder="Ülke seç" /></SelectTrigger>
                      <SelectContent className="max-h-[60vh]">
                        {countryList.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Taşınacağın Şehir</Label>
                    <Select value={relocCity} onValueChange={setRelocCity} disabled={!relocCountry}>
                      <SelectTrigger><SelectValue placeholder={relocCountry ? `Tüm Şehirler - ${relocCountry}` : "Önce ülke seç"} /></SelectTrigger>
                      <SelectContent className="max-h-[60vh]">
                        {relocCityChoices.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-5">
              <Button onClick={savePublicProfile}>Kaydet</Button>
            </div>
          </div>

          {/* Volunteer Mentor settings */}
          <div id="mentor-settings" className="bg-card rounded-2xl border border-emerald-500/30 p-6 shadow-card mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Gönüllü Mentörlük</h2>
                  <p className="text-sm text-muted-foreground">Açtığında profilinden otomatik bir Gönüllü Mentör kartı oluşturulur.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mentör olmak istiyorum</span>
                <Switch checked={isVolunteerMentor} onCheckedChange={setIsVolunteerMentor} />
              </div>
            </div>
            {isVolunteerMentor && (
              <div className="space-y-4">
                <div>
                  <Label>Mentörlük yapacağınız konular</Label>
                  <textarea
                    value={mentorTopics}
                    onChange={(e) => setMentorTopics(e.target.value)}
                    placeholder="Örn: Almanya'da iş başvurusu, vize süreci, yazılım kariyeri…"
                    rows={3}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Şehir, dil ve uzmanlık bilgilerin profilinden otomatik kullanılır.</p>
                </div>
                <div>
                  <Label>Haftalık ayırabileceğin saat (opsiyonel)</Label>
                  <Input
                    value={mentorWeeklyHours}
                    onChange={(e) => setMentorWeeklyHours(e.target.value)}
                    placeholder="Örn: 2-3 saat"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button onClick={saveMentorSettings} disabled={savingMentor} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                {savingMentor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {isVolunteerMentor ? "Kaydet & Kartı Oluştur" : "Kaydet"}
              </Button>
            </div>
          </div>
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
                    onChange={(e) => handleDocUpload(e, "cv")}
                  />
                  <DocumentSlot
                    doc={cvDoc}
                    uploading={uploadingKind === "cv"}
                    icon={<FileText className="h-5 w-5 text-primary" />}
                    uploadLabel="CV Yükle (PDF, DOC, DOCX)"
                    onPick={() => cvInputRef.current?.click()}
                    onOpen={() => handleDocOpen("cv")}
                    onRemove={() => handleDocRemove("cv")}
                  />
                </div>

                <div>
                  <Label>Sunum / Tanıtım</Label>
                  <input
                    ref={pptInputRef}
                    type="file"
                    accept=".pdf,.ppt,.pptx,.key"
                    className="hidden"
                    onChange={(e) => handleDocUpload(e, "presentation")}
                  />
                  <DocumentSlot
                    doc={pptDoc}
                    uploading={uploadingKind === "presentation"}
                    icon={<Presentation className="h-5 w-5 text-primary" />}
                    uploadLabel="Sunum Yükle (PDF, PPT, PPTX, KEY)"
                    onPick={() => pptInputRef.current?.click()}
                    onOpen={() => handleDocOpen("presentation")}
                    onRemove={() => handleDocRemove("presentation")}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <SocialMediaInputs
              defaultValues={{ linkedin: linkedinUrl }}
              storageKey="individual_social_visibility"
            />
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

interface DocumentSlotProps {
  doc: { path: string; name: string } | null;
  uploading: boolean;
  icon: React.ReactNode;
  uploadLabel: string;
  onPick: () => void;
  onOpen: () => void;
  onRemove: () => void;
}

const DocumentSlot = ({ doc, uploading, icon, uploadLabel, onPick, onOpen, onRemove }: DocumentSlotProps) => (
  <div className="mt-2">
    {doc ? (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        {icon}
        <button onClick={onOpen} className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-foreground truncate hover:text-primary">{doc.name}</p>
          <p className="text-xs text-muted-foreground">Görüntülemek için tıkla</p>
        </button>
        <Button variant="outline" size="sm" onClick={onPick} disabled={uploading}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Değiştir"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onRemove} disabled={uploading}>Kaldır</Button>
      </div>
    ) : (
      <Button variant="outline" className="w-full gap-2" onClick={onPick} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        {uploading ? "Yükleniyor..." : uploadLabel}
      </Button>
    )}
  </div>
);

export default ProfileIndividual;
