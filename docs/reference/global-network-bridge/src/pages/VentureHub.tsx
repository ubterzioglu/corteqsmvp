import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Rocket, Sparkles, TrendingUp, Users, Building2, GraduationCap, Lightbulb,
  HandCoins, Briefcase, Megaphone, Search, Send, ShieldCheck, Eye,
  Calendar, MapPin, ExternalLink, MessageSquare, Star, ArrowRight,
  FileText, Presentation, FileSpreadsheet, Download, UserPlus, Heart, CalendarCheck, Globe,
  Play, Volume2, VolumeX, Pause,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CountryCitySelector from "@/components/CountryCitySelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDiaspora } from "@/contexts/DiasporaContext";
import { bloggers } from "@/data/mock";

/* -------------------- Demo users per segment -------------------- */
type DemoUser = {
  name: string;
  title: string;
  city: string;
  country: string;
  bio: string;
  tags: string[];
  rating: number;
  followers: number;
  initials: string;
  kind: "person" | "org";
  image: string;
  attachments: { kind: "deck" | "onepager" | "bp" | "video"; label: string; size: string }[];
};

const personImg = (n: number) => `https://i.pravatar.cc/200?img=${n}`;
const orgLogo = (seed: string) => `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=10b981,3b82f6,8b5cf6,f59e0b,ef4444`;

const demoUsers: Record<string, DemoUser> = {
  girisimci: { name: "Ayşe Demir", title: "Co-Founder & CEO · FinPath", city: "Berlin", country: "Germany", bio: "B2B SaaS — Avrupa'daki Türk işletmeleri için akıllı muhasebe & ödeme altyapısı. €450K ARR, 1.2K aktif müşteri.", tags: ["FinTech", "SaaS", "Seed Round Açık"], rating: 4.9, followers: 1820, initials: "AD", kind: "person", image: personImg(47), attachments: [{ kind: "deck", label: "FinPath Pitch Deck v3", size: "4.2 MB" }, { kind: "onepager", label: "Investor One-Pager", size: "180 KB" }, { kind: "bp", label: "Business Plan 2026", size: "2.1 MB" }, { kind: "video", label: "Product Teaser", size: "1:24" }, { kind: "video", label: "Founder Intro", size: "2:15" }] },
  melek: { name: "Murat Kaya", title: "Angel Investor · Ex-Founder (exit 2022)", city: "Amsterdam", country: "Netherlands", bio: "Pre-seed & seed yatırımcı. Ticket size €25K–€100K. Odak: SaaS, marketplace, climate tech. 18 portföy şirketi.", tags: ["Pre-Seed", "Seed", "B2B SaaS"], rating: 4.8, followers: 3420, initials: "MK", kind: "person", image: personImg(13), attachments: [{ kind: "onepager", label: "Investment Thesis 2026", size: "240 KB" }] },
  vc: { name: "Zeynep Arslan", title: "Partner · Bosphorus Ventures", city: "London", country: "United Kingdom", bio: "Series A/B odaklı €120M fon. Türk kurucuların global çıkışına yatırım. Ortalama ticket €2M–€8M.", tags: ["Series A", "Series B", "Global"], rating: 4.9, followers: 5210, initials: "ZA", kind: "person", image: personImg(45), attachments: [{ kind: "deck", label: "Fund II Overview", size: "3.8 MB" }, { kind: "onepager", label: "Investment Criteria", size: "190 KB" }] },
  kulucka: { name: "TR-Hub Berlin", title: "Akselatör Programı · Cohort 7", city: "Berlin", country: "Germany", bio: "12 haftalık intensive program. €50K SAFE + mentor ağı + Avrupa pazarına soft-landing. Başvurular açık.", tags: ["Accelerator", "€50K SAFE", "Cohort 7"], rating: 4.7, followers: 2840, initials: "TH", kind: "org", image: orgLogo("TR-Hub Berlin"), attachments: [{ kind: "deck", label: "Program Overview", size: "2.6 MB" }, { kind: "onepager", label: "Application Brief", size: "210 KB" }] },
  mentor: { name: "Dr. Emre Yıldız", title: "Growth Mentor · Ex-VP Spotify", city: "Stockholm", country: "Sweden", bio: "B2C growth, retention & monetization. 60+ kurucuya mentörlük. İlk seans ücretsiz, sonrası €180/saat.", tags: ["Growth", "B2C", "Mentor"], rating: 5.0, followers: 1240, initials: "EY", kind: "person", image: personImg(33), attachments: [{ kind: "onepager", label: "Mentor Profile", size: "120 KB" }] },
  servis: { name: "LegalBridge", title: "Hukuk & KVKK Servisi · Türk girişimler", city: "Paris", country: "France", bio: "Şirket kuruluşu, SAFE/term-sheet, IP, GDPR. 200+ Türk startup'a hizmet. Sabit paket: €490/ay.", tags: ["Legal", "GDPR", "SAFE"], rating: 4.8, followers: 980, initials: "LB", kind: "org", image: orgLogo("LegalBridge"), attachments: [{ kind: "onepager", label: "Hizmet Paketleri", size: "150 KB" }] },
  fon: { name: "EU Horizon Desk · Çiğdem K.", title: "Grant Advisor · EU & Horizon Europe", city: "Brussels", country: "Belgium", bio: "EIC Accelerator, Horizon Europe, EUREKA fonlarına özel başvuru desteği. 14 onaylı dosya, toplam €11M hibe.", tags: ["EU Grants", "EIC", "Horizon"], rating: 4.9, followers: 1670, initials: "ÇK", kind: "person", image: personImg(20), attachments: [{ kind: "deck", label: "EIC Hazırlık Rehberi", size: "5.1 MB" }, { kind: "onepager", label: "Hibe Takvimi 2026", size: "200 KB" }] },
  corp: { name: "Hakan Öztürk", title: "Head of CVC · GlobalTek AG", city: "Munich", country: "Germany", bio: "Kurumsal venture client & CVC. Otomotiv, enerji, lojistik startup'larıyla POC & yatırım. Ticket €500K–€3M.", tags: ["CVC", "POC", "Enterprise"], rating: 4.7, followers: 2100, initials: "HÖ", kind: "person", image: personImg(60), attachments: [{ kind: "onepager", label: "CVC Mandate", size: "230 KB" }, { kind: "bp", label: "Partnership Framework", size: "1.4 MB" }] },
  talent: { name: "Selin Aydın", title: "Senior Product Designer · Startup-ready", city: "Lisbon", country: "Portugal", bio: "8 yıl B2B SaaS deneyimi. Remote / hybrid arıyor. Equity + maaş kombinasyonuna açık. Portfolio mevcut.", tags: ["Product Design", "Remote", "Senior"], rating: 4.9, followers: 540, initials: "SA", kind: "person", image: personImg(48), attachments: [{ kind: "onepager", label: "CV & Portfolio", size: "1.8 MB" }] },
  etkinlik: { name: "Diaspora Demo Day '26", title: "Pitch & Networking · 8 Haziran 2026", city: "Berlin", country: "Germany", bio: "20 startup pitch, 60+ yatırımcı, after-party. Erken bilet €49, kapıda €89. Yer: betahaus Kreuzberg.", tags: ["Demo Day", "Pitch", "Networking"], rating: 4.8, followers: 3210, initials: "DD", kind: "org", image: orgLogo("Diaspora Demo Day"), attachments: [{ kind: "onepager", label: "Sponsor Kit", size: "320 KB" }] },
  medya: { name: "Startup Diaspora Podcast", title: "Haftalık Podcast · 24K dinleyici", city: "Istanbul", country: "Turkey", bio: "Global Türk kurucularıyla derin sohbetler. Spotify Top 50 Business TR. Sponsorluk & röportaj başvuruları açık.", tags: ["Podcast", "Media", "Sponsorship"], rating: 4.9, followers: 24000, initials: "SD", kind: "org", image: orgLogo("Startup Diaspora Podcast"), attachments: [{ kind: "onepager", label: "Media Kit 2026", size: "1.1 MB" }] },
  scout: { name: "Burak Şahin", title: "Deal Scout · 4 fon için kaynak", city: "Dubai", country: "UAE", bio: "MENA & Avrupa arası deal flow. Erken aşama Türk girişimlerini fonlara yönlendiriyor. Komisyon bazlı.", tags: ["Deal Flow", "MENA", "Scout"], rating: 4.6, followers: 890, initials: "BŞ", kind: "person", image: personImg(11), attachments: [{ kind: "onepager", label: "Scout Brief", size: "140 KB" }] },
};

type SegmentKey =
  | "girisimci" | "melek" | "vc" | "kulucka" | "mentor" | "servis"
  | "fon" | "corp" | "talent" | "etkinlik" | "medya" | "scout";

const segments: { key: SegmentKey; label: string; icon: any; color: string; desc: string }[] = [
  { key: "girisimci", label: "Girişimciler", icon: Rocket, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30", desc: "Erken aşamadan büyüme aşamasına startup kurucuları" },
  { key: "melek", label: "Melek Yatırımcılar", icon: Sparkles, color: "text-amber-600 bg-amber-500/10 border-amber-500/30", desc: "Pre-seed / seed yatırım yapan bireysel yatırımcılar" },
  { key: "vc", label: "VC & Fonlar", icon: TrendingUp, color: "text-primary bg-primary/10 border-primary/30", desc: "Risk sermayesi şirketleri ve girişim fonları" },
  { key: "kulucka", label: "Kuluçka & Hızlandırıcılar", icon: Building2, color: "text-turquoise bg-turquoise/10 border-turquoise/30", desc: "Inkübatör, akselatör ve teknopark programları" },
  { key: "mentor", label: "Mentorlar", icon: GraduationCap, color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/30", desc: "Sektör ve yolculuk mentörleri, eski kurucular" },
  { key: "servis", label: "Startup Servisleri", icon: Briefcase, color: "text-blue-600 bg-blue-500/10 border-blue-500/30", desc: "Hukuk, finans, pazarlama, ürün, dev shop'lar" },
  { key: "fon", label: "Fon & Hibeler", icon: HandCoins, color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/30", desc: "Hibe programları, devlet fonları, EU grants" },
  { key: "corp", label: "Corporate Innovation", icon: Building2, color: "text-slate-600 bg-slate-500/10 border-slate-500/30", desc: "Kurumsal inovasyon, CVC ve venture client ekipleri" },
  { key: "talent", label: "Startup Talent", icon: Users, color: "text-rose-600 bg-rose-500/10 border-rose-500/30", desc: "Startup'ta çalışmak isteyen yetenekler" },
  { key: "etkinlik", label: "Etkinlikler", icon: Megaphone, color: "text-orange-600 bg-orange-500/10 border-orange-500/30", desc: "Demo Day'ler, pitch geceleri, zirveler" },
  { key: "medya", label: "Medya & İçerik", icon: Megaphone, color: "text-pink-600 bg-pink-500/10 border-pink-500/30", desc: "Startup gazeteciliği, podcast ve içerik üreticileri" },
  { key: "scout", label: "Startup Scout'lar", icon: Eye, color: "text-purple-600 bg-purple-500/10 border-purple-500/30", desc: "Yatırım fonları adına deal scout'luğu yapanlar" },
];

/* -------------------- Segment → subcategory taxonomy -------------------- */
const SEGMENT_SUBCATEGORIES: Record<SegmentKey, string[]> = {
  girisimci: ["Pre-Seed / Idea", "MVP / Prototip", "Seed Aşaması", "Series A+", "Bootstrapped", "Solo Founder", "Co-founder Arıyorum"],
  melek: ["Pre-Seed (≤€25K)", "Seed (€25K–€100K)", "Follow-on Investor", "Syndicate Lead", "Sector Agnostic", "Vertical Specialist"],
  vc: ["Pre-Seed Fund", "Seed Fund", "Series A Fund", "Series B+ Fund", "Growth / Late Stage", "Sector-Focused (FinTech/Health/AI)", "Corporate VC"],
  kulucka: ["Akselatör Programı", "İnkübatör", "Teknopark", "Üniversite Programı", "Soft-Landing Programı", "Vertical Accelerator"],
  mentor: ["Growth & Marketing", "Ürün & Tasarım", "Teknoloji & Mühendislik", "Satış & İş Geliştirme", "Fundraising & Strateji", "Operasyon & İK", "Uluslararasılaşma"],
  servis: ["Hukuk & KVKK", "Muhasebe & Vergi", "Pazarlama & İçerik", "Dev Shop / Yazılım Geliştirme", "Tasarım & Branding", "PR & İletişim", "HR / Recruitment"],
  fon: ["EU Horizon / EIC", "Devlet Hibesi (TR)", "Bölgesel Fonlar", "Yarışma & Ödüller", "Crowdfunding", "Impact / ESG Fonu"],
  corp: ["CVC (Corporate VC)", "Venture Client / POC", "Open Innovation", "Stratejik Ortaklık", "M&A", "Innovation Lab"],
  talent: ["Yazılım Geliştirici", "Ürün & Tasarım", "Growth & Pazarlama", "Satış", "Operasyon", "Veri & AI", "Yönetici / C-Level"],
  etkinlik: ["Demo Day", "Pitch Gecesi", "Konferans / Zirve", "Meetup / Networking", "Hackathon", "Workshop"],
  medya: ["Podcast", "YouTube / Vlog", "Newsletter", "Blog / Yazılı Medya", "Sosyal Medya İçeriği", "Basın & PR"],
  scout: ["VC Scout", "Angel Network Scout", "Sektör Scout (FinTech/Health/AI)", "Coğrafi Scout (MENA/EU/US)", "M&A Scout"],
};

/* -------------------- Founder Teaser Banner -------------------- */

const FounderTeaserBanner = () => {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const { toast } = useToast();

  const handlePlay = () => {
    setPlaying(!playing);
    if (!playing) {
      toast({ title: "Teaser oynatılıyor (DEMO)", description: "Gerçek profilde video içeriği aktif çalışır." });
    }
  };

  const videos = [
    { label: "Product Teaser", duration: "1:24" },
    { label: "Founder Intro", duration: "2:15" },
    { label: "Demo Day Pitch", duration: "3:05" },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-primary/10 to-turquoise/10 p-5 md:p-6 mb-6">
      {/* Decorative banner background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-turquoise/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
        {/* Text & CTA */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className="bg-emerald-500/15 text-emerald-700 border-0"><Rocket className="h-3 w-3 mr-1" /> Girişimciler</Badge>
            <Badge className="bg-amber-500/15 text-amber-700 border-0">DEMO</Badge>
          </div>
          <h2 className="text-xl md:text-2xl font-bold leading-tight mb-2">
            Fikrini <span className="text-gradient-primary">dünyaya duyur</span> — teaser'ınla yatırımcıları cezbe.
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            CorteQS Venture Hub'da her girişimci profiline teaser video, pitch kaydı ve founder intro ekleyebilirsin.
            Yatırımcılar ve mentörler seni görmeden önce seni tanısın.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast({ title: "Profil oluştur (DEMO)", description: "Kayıt olduktan sonra girişimci profilini tamamla." })}>
              <Rocket className="h-3.5 w-3.5" /> Girişimci Profili Oluştur
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast({ title: "Videoları keşfet (DEMO)", description: "Tüm girişimci teaser videolarına göz at." })}>
              <Play className="h-3.5 w-3.5" /> Teaser'ları Keşfet
            </Button>
          </div>

          {/* Mini video list */}
          <div className="mt-4 flex flex-wrap gap-2">
            {videos.map((v) => (
              <button
                key={v.label}
                onClick={() => toast({ title: `${v.label} (DEMO)`, description: "Video içeriği seçildi — mock oynatma." })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card/80 hover:border-primary/40 hover:bg-primary/5 transition-colors text-xs"
              >
                <Play className="h-3 w-3 text-emerald-600" />
                <span className="font-medium text-foreground">{v.label}</span>
                <span className="text-muted-foreground">{v.duration}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mock Video Player */}
        <div className="relative rounded-xl overflow-hidden border border-border bg-black aspect-video shadow-lg group">
          {/* Background banner mock frame */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-primary/40 to-slate-900/90" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <button onClick={handlePlay}>
                {playing ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white ml-0.5" />}
              </button>
            </div>
            <p className="text-white/90 font-semibold text-sm text-center">
              {playing ? "Teaser oynatılıyor…" : "FinPath Product Teaser"}
            </p>
            <p className="text-white/50 text-xs text-center mt-1">
              {playing ? "1:24 · 720p · DEMO" : "Tıkla ve izle · DEMO"}
            </p>
          </div>

          {/* Player controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-2">
            <button onClick={handlePlay} className="text-white/80 hover:text-white">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full bg-emerald-400 rounded-full ${playing ? "animate-pulse" : ""}`} style={{ width: playing ? "42%" : "0%" }} />
            </div>
            <span className="text-[10px] text-white/70 font-mono">1:24</span>
            <button onClick={() => setMuted(!muted)} className="text-white/80 hover:text-white">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <Badge className="bg-amber-500/80 text-white border-0 text-[9px] px-1 py-0">DEMO</Badge>
          </div>

          {/* Floating badge */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-black/50 text-white border-0 text-[10px] backdrop-blur-sm">Teaser Video</Badge>
          </div>
        </div>
      </div>
    </section>
  );
};

const VentureHub = () => {
  const { toast } = useToast();
  const { selectedCountry } = useDiaspora();
  const [filterCity, setFilterCity] = useState("all");
  const [activeSegment, setActiveSegment] = useState<SegmentKey | "all">("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<{ name: string; email: string; segment: SegmentKey | ""; subcategory: string; note: string }>({ name: "", email: "", segment: "", subcategory: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [openSegment, setOpenSegment] = useState<SegmentKey | null>(null);
  const [contact, setContact] = useState({ name: "", email: "", note: "" });

  const visibleSegments = useMemo(
    () => segments.filter((s) =>
      activeSegment === "all" ? true : s.key === activeSegment,
    ).filter((s) =>
      !search ? true : (s.label + " " + s.desc).toLowerCase().includes(search.toLowerCase()),
    ),
    [activeSegment, search],
  );

  const handleInterest = async () => {
    if (!form.email) {
      toast({ title: "E-posta gerekli", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const segmentLabel = form.segment ? segments.find((s) => s.key === form.segment)?.label : null;
      await supabase.from("interest_registrations").insert({
        category: "venture_hub",
        name: form.name || null,
        email: form.email,
        role: segmentLabel || null,
        message: [form.subcategory ? `Alt kategori: ${form.subcategory}` : null, form.note || null].filter(Boolean).join("\n") || null,
        source: "venture-hub-page",
      });
      toast({ title: "Kaydın alındı 🚀", description: "Venture Hub açıldığında ilk sen haberdar olacaksın." });
      setForm({ name: "", email: "", segment: "", subcategory: "", note: "" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
      toast({ title: "Gönderilemedi", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const activeSeg = openSegment ? segments.find((s) => s.key === openSegment) : null;

  const handleSegmentContact = async () => {
    if (!openSegment) return;
    if (!contact.email) {
      toast({ title: "E-posta gerekli", variant: "destructive" });
      return;
    }
    try {
      await supabase.from("interest_registrations").insert({
        category: "venture_hub",
        name: contact.name || null,
        email: contact.email,
        role: activeSeg?.label || openSegment,
        message: contact.note || null,
        country: selectedCountry !== "all" ? selectedCountry : null,
        city: filterCity !== "all" ? filterCity : null,
        source: `venture-hub:${openSegment}`,
      });
      toast({ title: "İlgi bildirimin alındı 🚀", description: `${activeSeg?.label} kategorisinde sana ulaşacağız.` });
      setContact({ name: "", email: "", note: "" });
      setOpenSegment(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
      toast({ title: "Gönderilemedi", description: msg, variant: "destructive" });
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-emerald-500/10 via-primary/10 to-turquoise/10 p-6 md:p-8 mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge className="bg-emerald-500/15 text-emerald-700 border-0"><Rocket className="h-3 w-3 mr-1" /> Venture Hub</Badge>
              <Badge variant="outline" className="border-gold/40 text-gold-foreground bg-gold/10">Girişim & Yatırım</Badge>
              <Badge className="bg-amber-500/15 text-amber-700 border-0">DEMO</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
              Fikrini, sermayeni, mentorluğunu ve pazar bağlantını <span className="text-gradient-primary">CorteQS Venture Hub</span>'da buluştur.
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl">
              Global Türk girişimcileri, yatırımcıları, mentorları ve ekosistem aktörleri için buluşma alanı.
              Yatırım, mentor, ekip, pazar, müşteri ve global bağlantı ihtiyaçlarını doğru kişilerle eşleştirir.
            </p>
          </section>

          {/* Girişimciler Teaser Banner + Mock Video */}
          <FounderTeaserBanner />

          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
            <div className="flex-1 min-w-0">
              <CountryCitySelector city={filterCity} onCityChange={setFilterCity} />
            </div>
            <div className="relative w-full lg:w-[360px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Segment, isim, sektör..." className="pl-9 h-10" />
            </div>
          </div>

          {/* Segment chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            <Button size="sm" variant={activeSegment === "all" ? "default" : "outline"} onClick={() => setActiveSegment("all")}>Tümü</Button>
            {segments.map((s) => (
              <Button
                key={s.key}
                size="sm"
                variant={activeSegment === s.key ? "default" : "outline"}
                onClick={() => setActiveSegment(s.key)}
                className="gap-1.5"
              >
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </Button>
            ))}
          </div>

          {/* Segment grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
            {visibleSegments.map((s) => (
              <Card
                key={s.key}
                onClick={() => { setOpenSegment(s.key); setContact({ name: "", email: "", note: "" }); }}
                className="p-4 hover:shadow-card hover:border-primary/40 transition-all relative cursor-pointer group"
              >
                <Badge className="absolute top-2 right-2 bg-amber-500/15 text-amber-700 border-0 text-[10px]">DEMO</Badge>
                <div className={`w-10 h-10 rounded-lg border ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground text-sm mb-1">{s.label}</h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{s.desc}</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>⭐ Google Rating</span>
                  <span className="inline-flex items-center gap-0.5 text-primary group-hover:translate-x-0.5 transition-transform">
                    Detay <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Interest form */}
          <section className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-card to-primary/5 p-6 md:p-8 mb-10">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <Badge className="bg-emerald-500/15 text-emerald-700 border-0 mb-1">Erken Erişim</Badge>
                <h2 className="text-lg md:text-xl font-bold">Venture Hub'a Erken Kayıt Ol</h2>
                <p className="text-sm text-muted-foreground">Profilini öne çıkar, doğru taraflarla eşleş. Açılışta sana özel listede yer al.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Ad Soyad / Şirket</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Adınız veya şirket adınız" />
              </div>
              <div>
                <Label className="text-xs">E-posta *</Label>
                <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="ornek@mail.com" />
              </div>
              <div>
                <Label className="text-xs">Hangi segment?</Label>
                <Select
                  value={form.segment || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, segment: v as SegmentKey, subcategory: "" }))}
                >
                  <SelectTrigger><SelectValue placeholder="Segment seç..." /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {segments.map((s) => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Alt kategori</Label>
                <Select
                  value={form.subcategory || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, subcategory: v }))}
                  disabled={!form.segment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={form.segment ? "Alt kategori seç..." : "Önce segment seç"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {(form.segment ? SEGMENT_SUBCATEGORIES[form.segment] : []).map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Kısa not</Label>
                <Textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} rows={2} placeholder="Ne arıyorsun? Ne sunuyorsun?" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <Button onClick={handleInterest} disabled={submitting} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Send className="h-4 w-4" /> {submitting ? "Gönderiliyor..." : "Erken Kayıt Ol"}
              </Button>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> KVKK / GDPR uyumlu, istediğin zaman silebilirsin.
              </span>
            </div>
          </section>
        </div>
      </main>

      {/* Segment detail dialog */}
      <Dialog open={openSegment !== null} onOpenChange={(o) => !o && setOpenSegment(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {activeSeg && (() => {
            const SegIcon = activeSeg.icon;
            return (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-lg border ${activeSeg.color} inline-flex items-center justify-center`}>
                    <SegIcon className="h-4 w-4" />
                  </span>
                  {activeSeg.label}
                  <Badge className="ml-2 bg-amber-500/15 text-amber-700 border-0 text-[10px]">DEMO</Badge>
                </DialogTitle>
                <DialogDescription>{activeSeg.desc}</DialogDescription>
              </DialogHeader>

              <SegmentDetailBody
                segmentKey={openSegment!}
                segmentLabel={activeSeg.label}
                country={selectedCountry}
                city={filterCity}
                contact={contact}
                setContact={setContact}
                onSubmit={handleSegmentContact}
              />

              <DialogFooter className="text-[11px] text-muted-foreground flex sm:justify-start">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> KVKK / GDPR uyumlu — istediğin zaman silebilirsin.
              </DialogFooter>
            </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

/* -------------------- Segment detail body -------------------- */

interface SegmentDetailBodyProps {
  segmentKey: SegmentKey;
  segmentLabel: string;
  country: string;
  city: string;
  contact: { name: string; email: string; note: string };
  setContact: React.Dispatch<React.SetStateAction<{ name: string; email: string; note: string }>>;
  onSubmit: () => void;
}

const SegmentDetailBody = ({ segmentKey, segmentLabel, country, city, contact, setContact, onSubmit }: SegmentDetailBodyProps) => {
  const { toast } = useToast();
  if (segmentKey === "etkinlik") return <EventsByLocation country={country} city={city} />;
  if (segmentKey === "medya") return <MediaByLocation country={country} city={city} />;

  const user = demoUsers[segmentKey];
  const ctas = segmentCtas(segmentKey);

  const handleMockAction = (label: string) => {
    toast({ title: `${label} (DEMO)`, description: "Bu aksiyon mock — gerçek profilde aktif çalışır." });
  };

  const attachmentIcon = (kind: "deck" | "onepager" | "bp" | "video") =>
    kind === "video" ? Play : kind === "deck" ? Presentation : kind === "bp" ? FileSpreadsheet : FileText;
  const attachmentColor = (kind: "deck" | "onepager" | "bp" | "video") =>
    kind === "video" ? "text-rose-600 bg-rose-500/10" : kind === "deck" ? "text-purple-600 bg-purple-500/10" : kind === "bp" ? "text-emerald-600 bg-emerald-500/10" : "text-blue-600 bg-blue-500/10";

  return (
    <div className="space-y-3">
      {/* Demo user profile card — compact */}
      {user && (
        <Card className="p-3.5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 ${user.kind === "org" ? "rounded-md" : "rounded-full"} overflow-hidden bg-gradient-to-br from-primary/20 to-turquoise/20 flex items-center justify-center font-bold text-sm shrink-0 border border-border`}>
              <img src={user.image} alt={user.name} className={user.kind === "org" ? "w-full h-full object-contain p-1 bg-white" : "w-full h-full object-cover"} loading="lazy" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{user.name}</h4>
                  <p className="text-[11px] text-muted-foreground truncate">{user.title}</p>
                </div>
                <Badge className="bg-amber-500/15 text-amber-700 border-0 text-[9px] shrink-0">DEMO</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{user.city}, {user.country}</span>
                <span className="inline-flex items-center gap-0.5 text-amber-600"><Star className="h-2.5 w-2.5 fill-amber-500" /> {user.rating}</span>
                <span>{user.followers.toLocaleString()} takipçi</span>
                <span className="inline-flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" /> Google Rating</span>
              </div>
              <p className="text-xs text-foreground/80 mt-2 leading-relaxed">{user.bio}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {user.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[9px] px-1.5 py-0">{t}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Platform CTAs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3">
            <Button size="sm" variant="default" className="h-8 text-xs gap-1" onClick={() => handleMockAction("Mesaj Gönder")}>
              <MessageSquare className="h-3 w-3" /> Mesaj
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => handleMockAction("Bağlantı İste")}>
              <UserPlus className="h-3 w-3" /> Bağlan
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => handleMockAction("Takip Et")}>
              <Heart className="h-3 w-3" /> Takip
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => handleMockAction("Randevu Al")}>
              <CalendarCheck className="h-3 w-3" /> Randevu
            </Button>
          </div>

          {/* Attachments */}
          {user.attachments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Profil Dosyaları</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {user.attachments.map((a, i) => {
                  const Icon = attachmentIcon(a.kind);
                  return (
                    <button
                      key={i}
                      onClick={() => handleMockAction(`İndir: ${a.label}`)}
                      className="flex items-center gap-2 p-2 rounded-md border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                    >
                      <span className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${attachmentColor(a.kind)}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{a.label}</div>
                        <div className="text-[10px] text-muted-foreground">{a.size}</div>
                      </div>
                      <Download className="h-3 w-3 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Related platform shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {ctas.map((c, i) => (
          <a key={i} href={c.href} className="flex items-start gap-2 p-2.5 rounded-md border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
            <c.icon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-medium">{c.label}</div>
              <div className="text-[10px] text-muted-foreground line-clamp-1">{c.desc}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Interest mini form */}
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Send className="h-3.5 w-3.5 text-emerald-600" />
          <h4 className="font-semibold text-xs">{segmentLabel} için ilgini bildir</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <Input className="h-8 text-xs" placeholder="Ad Soyad / Şirket" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} />
          <Input className="h-8 text-xs" placeholder="E-posta *" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} />
          <Textarea className="sm:col-span-2 text-xs" rows={2} placeholder="Kısa not: ne arıyorsun, ne sunuyorsun?" value={contact.note} onChange={(e) => setContact((c) => ({ ...c, note: e.target.value }))} />
        </div>
        <div className="flex justify-end mt-2">
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onSubmit}>
            <Send className="h-3 w-3" /> Gönder
          </Button>
        </div>
      </div>
    </div>
  );
};

const segmentCtas = (key: SegmentKey): { icon: any; label: string; desc: string; href: string }[] => {
  const base = [
    { icon: Calendar, label: "Etkinlikleri Gör", desc: "Bu segmente ait demo day, pitch ve toplulukları gör.", href: "/events" },
    { icon: Briefcase, label: "İş Fırsatları", desc: "Startup pozisyonları ve iş ilanları.", href: "/is-ilanlari" },
  ];
  if (key === "talent") return [
    { icon: Briefcase, label: "Açık Pozisyonlar", desc: "Türk startup'larındaki ilanları keşfet.", href: "/is-ilanlari" },
    { icon: Users, label: "Topluluk", desc: "Startup yeteneklerinin buluştuğu akışa katıl.", href: "/feed" },
  ];
  if (key === "mentor") return [
    { icon: GraduationCap, label: "Mentor Profilleri", desc: "Gönüllü mentorlar ve danışmanlar.", href: "/consultants" },
    { icon: MessageSquare, label: "Mentor Talebi Aç", desc: "AI destekli hizmet talebi oluştur.", href: "/relocation" },
  ];
  if (key === "servis") return [
    { icon: Briefcase, label: "Danışmanlar", desc: "Hukuk, finans, pazarlama, ürün danışmanları.", href: "/consultants" },
    { icon: Building2, label: "Türk İşletmeleri", desc: "Servis sağlayan global Türk şirketleri.", href: "/businesses" },
  ];
  if (key === "kulucka") return [
    { icon: Building2, label: "Kuluçka & Hızlandırıcılar", desc: "Kuruluşlar dizininde inkübatörleri gör.", href: "/associations" },
    ...base,
  ];
  if (key === "vc" || key === "melek" || key === "fon" || key === "scout") return [
    { icon: TrendingUp, label: "Yatırımcı Topluluğu", desc: "Yatırımcılarla doğrudan iletişime geç.", href: "/diaspora-people" },
    ...base,
  ];
  if (key === "corp") return [
    { icon: Building2, label: "Kurumsal Diziniş", desc: "Kurumsal inovasyon ekiplerini incele.", href: "/businesses" },
    ...base,
  ];
  return [
    { icon: Rocket, label: "Girişimciler", desc: "Diaspora kurucularının profilleri.", href: "/diaspora-people" },
    ...base,
  ];
};

/* -------------------- Events pulled from main events table -------------------- */

const EventsByLocation = ({ country, city }: { country: string; city: string }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("events")
        .select("id,title,description,event_date,start_time,city,country,location,online_url,type,category,registration_url,price")
        .eq("status", "published")
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("event_date", { ascending: true })
        .limit(20);
      if (country !== "all") q = q.eq("country", country);
      if (city !== "all") q = q.eq("city", city);
      const { data } = await q;
      if (!cancelled) {
        setEvents(data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [country, city]);

  return (
    <div className="space-y-3">
      <Card className="p-3 bg-muted/30 border-dashed flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span>Platformdaki etkinliklerden çekiliyor:</span>
        <Badge variant="outline" className="text-[10px]">{country === "all" ? "Tüm Ülkeler" : country}</Badge>
        <Badge variant="outline" className="text-[10px]">{city === "all" ? "Tüm Şehirler" : city}</Badge>
        <Link to="/events" className="ml-auto text-primary text-[11px] inline-flex items-center gap-0.5">
          Tümünü Gör <ArrowRight className="h-3 w-3" />
        </Link>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Yükleniyor…</p>
      ) : events.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Bu lokasyonda yakın etkinlik bulunamadı.</p>
          <Link to="/events"><Button size="sm" variant="outline" className="mt-3 gap-1.5"><Calendar className="h-3.5 w-3.5" /> Etkinlik Takvimini Aç</Button></Link>
        </div>
      ) : (
        events.map((ev) => {
          const dt = new Date(ev.event_date);
          const day = String(dt.getDate()).padStart(2, "0");
          const mon = dt.toLocaleString("tr-TR", { month: "short" });
          return (
            <Link key={ev.id} to={`/event/${ev.id}`} className="flex gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
              <div className="text-center w-12 shrink-0">
                <div className="text-xl font-bold text-primary leading-none">{day}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{mon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm">{ev.title}</h4>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{ev.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ev.description}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                  {(ev.city || ev.country) && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{[ev.city, ev.country].filter(Boolean).join(", ")}</span>
                  )}
                  {ev.price ? <span className="font-medium text-foreground">€{ev.price}</span> : <span className="text-success font-medium">Ücretsiz</span>}
                </div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
};

/* -------------------- Media pulled from main bloggers section -------------------- */

const MediaByLocation = ({ country, city }: { country: string; city: string }) => {
  const list = useMemo(() => {
    return bloggers.filter((b) => {
      if (country !== "all" && b.country !== country) return false;
      if (city !== "all" && b.city !== city) return false;
      return true;
    }).slice(0, 12);
  }, [country, city]);

  return (
    <div className="space-y-3">
      <Card className="p-3 bg-muted/30 border-dashed flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span>Diaspora medya kütüphanesinden çekiliyor:</span>
        <Badge variant="outline" className="text-[10px]">{country === "all" ? "Tüm Ülkeler" : country}</Badge>
        <Badge variant="outline" className="text-[10px]">{city === "all" ? "Tüm Şehirler" : city}</Badge>
        <Link to="/bloggers" className="ml-auto text-primary text-[11px] inline-flex items-center gap-0.5">
          Tümünü Gör <ArrowRight className="h-3 w-3" />
        </Link>
      </Card>

      {list.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <Megaphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Bu lokasyonda içerik üretici bulunamadı.</p>
          <Link to="/bloggers"><Button size="sm" variant="outline" className="mt-3 gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Tüm Medya Kütüphanesi</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {list.map((b) => (
            <Link key={b.id} to={`/blogger/${b.id}`} className="flex gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
              <img src={b.photo} alt={b.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-sm truncate">{b.name}</h4>
                  <Badge variant="secondary" className="text-[9px] capitalize">{b.type}</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />{b.city}, {b.country}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="inline-flex items-center gap-0.5 text-amber-600"><Star className="h-2.5 w-2.5 fill-amber-500" /> {b.rating}</span>
                  <span className="text-muted-foreground">{b.followers.toLocaleString()} takipçi</span>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground self-center" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default VentureHub;
