import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, Lightbulb, Camera, Sparkles, Loader2, CheckCircle2,
  Globe, Users, Calendar, Heart, Flag, PartyPopper, UserCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ideasImage from "@/assets/may19-ideas.jpg";
import momentsImage from "@/assets/may19-moments.jpg";
import globePinsImage from "@/assets/may19-globe-pins.png";

type Kind = "map_pin" | "idea" | "moment";

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  social_handle: "",
  title: "",
  description: "",
  message: "",
  link: "",
  show_on_map: true,
  consent: false,
  livestream_participation: "",
  livestream_time_slot: "",
  livestream_topic: "",
  bio: "",
};

const ideaExamples = [
  "Global Türk gençleri için mentorluk ağı",
  "Yurt dışındaki Türk işletmeleri haritası",
  "Türk öğrenciler için şehir rehberleri",
  "Diaspora kadın girişimciler ağı",
  "Ülke ülke Türk başarı hikâyeleri serisi",
  "Global Türk yatırımcı ve girişimci ağı",
  "Türkçe kültür ve medya içerik arşivi",
  "Türk profesyoneller için networking sistemi",
];

const momentExamples = [
  "Melbourne'dan 19 Mayıs selamları.",
  "Berlin'de Türk gençleri olarak 19 Mayıs bizim için…",
  "Londra'daki Türk diasporasından bir an.",
  "Sydney'de bir Türk işletmesinin başarı hikâyesi.",
  "Doha'dan global Türk diasporasına selamlar.",
];

const isDriveLink = (url: string) =>
  /^https?:\/\/(drive|docs)\.google\.com\//i.test(url.trim());

const isSocialPostLink = (url: string) =>
  /^https?:\/\/([a-z0-9-]+\.)*(instagram\.com|facebook\.com|fb\.watch|tiktok\.com|x\.com|twitter\.com|youtube\.com|youtu\.be|linkedin\.com|threads\.net|pinterest\.com)\//i.test(url.trim());

const isAcceptedShareLink = (url: string) => isDriveLink(url) || isSocialPostLink(url);

const May19 = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Kind>("map_pin");
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [doneKind, setDoneKind] = useState<Kind | null>(null);
  const [identityLocked, setIdentityLocked] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(false);

  // Prefill from profile or last submission so logged-in users don't
  // re-enter name/email/city/country across the three actions.
  useEffect(() => {
    let cancelled = false;
    const prefill = async () => {
      if (!user) return;
      const { data: prior } = await supabase
        .from("may19_submissions")
        .select("full_name, email, phone, country, city, social_handle")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const src = prior ?? {};
      const fullName = (src as any).full_name || profile?.full_name || "";
      const email = (src as any).email || user.email || "";
      const country = (src as any).country || (profile as any)?.country || "";
      const city = (src as any).city || (profile as any)?.city || "";
      const phone = (src as any).phone || profile?.phone || "";
      const social = (src as any).social_handle || "";
      setForm((p) => ({
        ...p,
        full_name: fullName,
        email,
        country,
        city,
        phone,
        social_handle: social || p.social_handle,
      }));
      if (fullName && country && city) setIdentityLocked(true);
    };
    prefill();
    return () => { cancelled = true; };
  }, [user, profile]);

  const update = <K extends keyof typeof initialForm>(k: K, v: (typeof initialForm)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const reset = () => { setForm(initialForm); setFiles([]); };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (files.length + list.length > 5) {
      toast({ title: "En fazla 5 dosya", variant: "destructive" });
      return;
    }
    const big = list.find((f) => f.size > 25 * 1024 * 1024);
    if (big) {
      toast({ title: "Dosya çok büyük", description: `${big.name} > 25MB`, variant: "destructive" });
      return;
    }
    setFiles((p) => [...p, ...list]);
  };

  const upload = async (kind: Kind) => {
    const urls: string[] = [];
    for (const f of files) {
      const ext = f.name.split(".").pop() || "bin";
      const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("may19-uploads").upload(path, f, { contentType: f.type });
      if (error) throw error;
      const { data } = supabase.storage.from("may19-uploads").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const submit = async (kind: Kind) => {
    // Validation per kind
    if (kind === "map_pin" && (!form.full_name || !form.country || !form.city)) {
      toast({ title: "Ad, ülke ve şehir gerekli", variant: "destructive" }); return;
    }
    if (kind === "idea") {
      if (!form.title || !form.description || !form.consent) {
        toast({ title: "Başlık, açıklama ve onay gerekli", variant: "destructive" }); return;
      }
      if (form.link && !isAcceptedShareLink(form.link)) {
        toast({ title: "Geçersiz link", description: "Google Drive ya da sosyal medya post linki ekle.", variant: "destructive" }); return;
      }
    }
    if (kind === "moment") {
      if (!form.title || !form.consent) {
        toast({ title: "Başlık ve paylaşım onayı gerekli", variant: "destructive" }); return;
      }
      if (!form.link || !isAcceptedShareLink(form.link)) {
        toast({ title: "Google Drive veya sosyal medya post linki gerekli", description: "Foto / videonu Google Drive ya da Instagram, TikTok, YouTube, X gibi sosyal medya post linkiyle paylaş.", variant: "destructive" }); return;
      }
    }
    setSubmitting(true);
    try {
      const attachment_urls = await upload(kind);
      const { error } = await supabase.from("may19_submissions").insert({
        kind,
        user_id: user?.id ?? null,
        full_name: form.full_name || null,
        email: form.email || null,
        phone: form.phone || null,
        country: form.country || null,
        city: form.city || null,
        social_handle: form.social_handle || null,
        title: form.title || null,
        description: form.description || null,
        message: form.message || null,
        link: form.link || null,
        attachment_urls,
        show_on_map: form.show_on_map,
        consent: form.consent,
        livestream_participation: form.livestream_participation || null,
        livestream_time_slot: form.livestream_time_slot || null,
        livestream_topic: form.livestream_topic || null,
        bio: form.bio || null,
      });
      if (error) throw error;
      setDoneKind(kind);
      reset();
      toast({ title: "Teşekkürler!", description: "Gönderimin alındı." });
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "h-9 text-sm";

  const showPersonal = !identityLocked || editingIdentity;
  const IdentityCard = () => (
    <div className="col-span-2 flex items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-foreground min-w-0">
        <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="truncate">
          <span className="font-semibold">{form.full_name}</span>
          {form.city || form.country ? <> — {form.city}{form.city && form.country ? ", " : ""}{form.country}</> : null}
          {form.email ? <span className="text-muted-foreground"> · {form.email}</span> : null}
        </span>
      </div>
      <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditingIdentity(true)}>
        Değiştir
      </Button>
    </div>
  );
  const labelCls = "text-xs font-medium mb-1 block";

  const ModuleVisual = ({ kind }: { kind: Kind }) => {
    if (kind === "map_pin") return (
      <div className="relative h-full min-h-[260px] rounded-xl overflow-hidden border border-rose-500/30 flex flex-col justify-end">
        <img
          src={globePinsImage}
          alt="Dünya üzerinde Türk diasporası pin'leri"
          loading="lazy"
          width={1024}
          height={1024}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
        {/* confetti accents */}
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-3 left-6 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="absolute top-8 right-12 w-2 h-2 rounded-sm bg-amber-400 rotate-12" />
          <span className="absolute top-16 left-1/3 w-1 h-3 bg-turquoise rotate-45" />
          <span className="absolute bottom-24 right-8 w-1.5 h-1.5 rounded-full bg-rose-500" />
        </div>
        {/* corner ribbon */}
        <div className="absolute -top-1 -right-1 z-10 px-3 py-1 bg-rose-500 text-white text-[9px] font-extrabold shadow-md rotate-3 rounded-bl-md flex items-center gap-1">
          <Flag className="h-2.5 w-2.5" /> 19 MAYIS
        </div>
        <div className="relative p-5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-turquoise/30 text-[10px] font-extrabold text-turquoise">MODÜL 01</div>
          <h3 className="text-xl font-extrabold mt-2 leading-tight text-foreground">Global Haritada<br/><span className="text-rose-600">Kendini İşaretle</span></h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Bayram coşkusunu dünyanın dört bir yanından paylaş; CorteQS Türk Diaspora Haritası'nda parla.</p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/40"><MapPin className="h-4 w-4 text-white" /></div>
            <div className="flex-1 text-[11px] font-semibold text-foreground/80">5 kıta · 80+ ülke · canlı pin akışı</div>
          </div>
        </div>
      </div>
    );
    if (kind === "idea") return (
      <div className="relative h-full min-h-[260px] rounded-xl overflow-hidden border border-amber-400/40 flex flex-col justify-end">
        <img src={ideasImage} alt="Diasporayı güçlendirecek 19 fikir" loading="lazy" width={768} height={768}
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-rose-900/80 via-rose-900/40 to-amber-500/30" />
        {/* sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-4 right-4 h-5 w-5 text-amber-200 animate-pulse" />
          <span className="absolute top-12 left-6 w-1.5 h-1.5 rounded-full bg-amber-300" />
          <span className="absolute top-20 right-12 w-1 h-1 rounded-full bg-white/80" />
          <span className="absolute top-6 left-20 w-1 h-1 rounded-full bg-amber-200" />
        </div>
        <div className="absolute -top-1 -right-1 z-10 px-3 py-1 bg-amber-400 text-rose-900 text-[9px] font-extrabold shadow-md rotate-3 rounded-bl-md flex items-center gap-1">
          <PartyPopper className="h-2.5 w-2.5" /> COŞKU HAFTASI
        </div>
        <div className="relative p-5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-rose-900 text-[10px] font-extrabold">MODÜL 02</div>
          <h3 className="text-xl font-extrabold mt-2 leading-tight text-white drop-shadow-lg">
            Diasporayı Güçlendirecek<br/><span className="text-amber-300">19 Fikir</span>
          </h3>
          <p className="text-xs text-white/90 mt-1.5 leading-relaxed">En etkili 19 fikir CorteQS tarafından öne çıkarılır ve duyurulur.</p>
        </div>
      </div>
    );
    // MOMENT
    return (
      <div className="relative h-full min-h-[260px] rounded-xl overflow-hidden border border-primary/40 flex flex-col justify-end">
        <img src={momentsImage} alt="19 Mayıs ve diaspora anları" loading="lazy" width={768} height={768}
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-rose-900/85 via-rose-700/40 to-transparent" />
        {/* hearts + confetti */}
        <div className="absolute inset-0 pointer-events-none">
          <Heart className="absolute top-4 right-5 h-4 w-4 text-rose-300 fill-rose-400 animate-pulse" />
          <Heart className="absolute top-16 left-6 h-3 w-3 text-rose-200 fill-rose-300" />
          <span className="absolute top-8 left-16 w-1.5 h-1.5 rounded-full bg-amber-300" />
          <span className="absolute top-20 right-16 w-2 h-2 rounded-sm bg-white/70 rotate-12" />
        </div>
        <div className="absolute -top-1 -right-1 z-10 px-3 py-1 bg-rose-500 text-white text-[9px] font-extrabold shadow-md rotate-3 rounded-bl-md flex items-center gap-1">
          <Flag className="h-2.5 w-2.5" /> BAYRAM
        </div>
        <div className="relative p-5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white text-rose-600 text-[10px] font-extrabold">MODÜL 03</div>
          <h3 className="text-xl font-extrabold mt-2 leading-tight text-white drop-shadow-lg">
            19 Mayıs ve<br/><span className="text-amber-300">Diaspora Anını Gönder</span>
          </h3>
          <p className="text-xs text-white/90 mt-1.5 leading-relaxed">Foto, 19 saniyelik video veya kısa mesaj — global hesaplarımızda paylaşalım.</p>
        </div>
      </div>
    );
  };

  const Done = ({ kind }: { kind: Kind }) => (
    <div className="flex flex-col items-center text-center py-12 gap-3">
      <CheckCircle2 className="h-14 w-14 text-turquoise" />
      <h3 className="text-2xl font-bold">Teşekkürler!</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Gönderimini aldık. CorteQS ekibi inceledikten sonra seninle iletişime geçecek.
      </p>
      <Button variant="outline" onClick={() => setDoneKind(null)}>Yeni Gönderim</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-16 min-h-[60vh] flex items-center bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-20 w-80 h-80 bg-turquoise/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 pt-20 pb-12 relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/15 border border-rose-500/40 mb-6 shadow-md">
            <span className="text-base leading-none" aria-label="Türk Bayrağı" role="img">🇹🇷</span>
            <span className="text-sm font-semibold text-rose-700">19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı</span>
            <PartyPopper className="h-4 w-4 text-amber-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5">
            19 Mayıs <span className="text-gradient-primary">Global Diaspora Buluşması</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mb-8 font-body">
            Bayram coşkusunu dünyanın dört bir yanındaki Türklerle paylaşıyoruz. Global haritada yerini
            işaretle, diasporayı güçlendirecek <span className="font-semibold text-rose-600">19 fikrinden</span> birini paylaş ve
            <span className="font-semibold text-primary"> 19 Mayıs anını</span> CorteQS global kanallarına gönder.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white gap-2 shadow-lg shadow-rose-500/30"
              onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}>
              <Sparkles className="h-5 w-5" /> Kayıt Ol ve Katıl
            </Button>
            <Link to="/19-mayis/harita"><Button size="lg" variant="outline" className="gap-2"><Globe className="h-4 w-4" />Global Diaspora Haritası</Button></Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground mt-8">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-turquoise" /> 5 Kıta</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-rose-500" /> 19 Mayıs Bayram Haftası</span>
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-amber-500" /> Global Diaspora</span>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as Kind); setDoneKind(null); }}>
            <TabsList className="grid grid-cols-3 h-auto gap-1.5 bg-transparent p-0 mb-5">
              <TabsTrigger value="map_pin" className="data-[state=active]:bg-turquoise data-[state=active]:text-primary-foreground rounded-lg border border-border h-auto py-2 flex flex-col gap-0.5">
                <MapPin className="h-4 w-4" /><span className="text-[11px] font-semibold leading-tight text-center">1. Dünya Üzerinde Yerini İşaretle</span>
              </TabsTrigger>
              <TabsTrigger value="idea" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg border border-border h-auto py-2 flex flex-col gap-0.5">
                <Lightbulb className="h-4 w-4" /><span className="text-[11px] font-semibold leading-tight text-center">2. 19 Kelimelik Fikrini Gönder</span>
              </TabsTrigger>
              <TabsTrigger value="moment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-border h-auto py-2 flex flex-col gap-0.5">
                <Camera className="h-4 w-4" /><span className="text-[11px] font-semibold leading-tight text-center">3. 19 Mayıs Anını Paylaş</span>
              </TabsTrigger>
            </TabsList>

            {/* MODULE 1 */}
            <TabsContent value="map_pin">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card grid md:grid-cols-[260px_1fr] gap-5">
                <ModuleVisual kind="map_pin" />
                {doneKind === "map_pin" ? <Done kind="map_pin" /> : (
                  <div className="grid grid-cols-2 gap-3">
                    {identityLocked && !editingIdentity && <IdentityCard />}
                    <div className="col-span-2"><Label className={labelCls}>Ad Soyad *</Label><Input className={inputCls} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} /></div>
                    <div><Label className={labelCls}>Ülke *</Label><Input className={inputCls} value={form.country} onChange={(e) => update("country", e.target.value)} /></div>
                    <div><Label className={labelCls}>Şehir *</Label><Input className={inputCls} value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
                    <div className="col-span-2"><Label className={labelCls}>Kısa mesaj</Label><Textarea rows={2} className="text-sm min-h-0" value={form.message} onChange={(e) => update("message", e.target.value)} placeholder={`Ben ${form.city || "[şehir]"}/${form.country || "[ülke]"}'den katılıyorum.`} /></div>
                    <div><Label className={labelCls}>Sosyal medya</Label><Input className={inputCls} value={form.social_handle} onChange={(e) => update("social_handle", e.target.value)} placeholder="@kullanici" /></div>
                    <div><Label className={labelCls}>E-posta</Label><Input className={inputCls} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
                    <label className="col-span-2 flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox checked={form.show_on_map} onCheckedChange={(v) => update("show_on_map", !!v)} />
                      Haritada görünmek istiyorum
                    </label>
                    <Button onClick={() => submit("map_pin")} disabled={submitting} className="col-span-2 bg-turquoise hover:bg-turquoise-light text-primary-foreground" size="sm">
                      {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
                      Haritada Yerimi İşaretle
                    </Button>
                    <Link to="/auth?mode=signup" className="col-span-2">
                      <Button variant="outline" size="sm" className="w-full border-rose-500/40 text-rose-600 hover:bg-rose-500/10">
                        <Sparkles className="h-4 w-4 mr-2" /> Platforma Kaydımı Tamamla
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* MODULE 2 */}
            <TabsContent value="idea">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card grid md:grid-cols-[260px_1fr] gap-5">
                <ModuleVisual kind="idea" />
                {doneKind === "idea" ? <Done kind="idea" /> : (
                  <div className="grid grid-cols-2 gap-3">
                    {identityLocked && !editingIdentity && <IdentityCard />}
                    <details className="col-span-2 text-xs bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 rounded-md px-2 py-1.5">
                      <summary className="cursor-pointer font-semibold text-amber-700">Fikir örnekleri</summary>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 text-muted-foreground">
                        {ideaExamples.map((x) => <li key={x}>{x}</li>)}
                      </ul>
                    </details>
                    <div><Label className={labelCls}>Ad Soyad</Label><Input className={inputCls} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} /></div>
                    <div><Label className={labelCls}>E-posta</Label><Input className={inputCls} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
                    <div className="col-span-2"><Label className={labelCls}>Fikir başlığı *</Label><Input className={inputCls} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="19 kelimelik fikrin / proje adın" /></div>
                    <div className="col-span-2"><Label className={labelCls}>Fikir açıklaması *</Label><Textarea rows={3} className="text-sm min-h-0" value={form.description} onChange={(e) => update("description", e.target.value)} /></div>
                    <div className="col-span-2"><Label className={labelCls}>Diasporayı nasıl güçlendirir?</Label><Textarea rows={2} className="text-sm min-h-0" value={form.message} onChange={(e) => update("message", e.target.value)} /></div>
                    <div><Label className={labelCls}>Ülke / topluluk</Label><Input className={inputCls} value={form.country} onChange={(e) => update("country", e.target.value)} /></div>
                    <div><Label className={labelCls}>Şehir</Label><Input className={inputCls} value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
                    <div className="col-span-2">
                      <Label className={labelCls}>Google Drive veya sosyal medya post linki (sunum / video / doküman)</Label>
                      <Input className={inputCls} value={form.link} onChange={(e) => update("link", e.target.value)} placeholder="https://drive.google.com/... veya https://instagram.com/p/..." />
                      <p className="text-[10px] text-muted-foreground mt-1">Google Drive ("Linke sahip herkes görüntüleyebilir") ya da Instagram / TikTok / YouTube / X / LinkedIn post linki kabul ediyoruz.</p>
                    </div>
                    <label className="col-span-2 flex items-start gap-2 text-xs cursor-pointer">
                      <Checkbox checked={form.consent} onCheckedChange={(v) => update("consent", !!v)} className="mt-0.5" />
                      Fikrimin CorteQS tarafından değerlendirilip paylaşılmasına izin veriyorum *
                    </label>
                    <Button onClick={() => submit("idea")} disabled={submitting} className="col-span-2 bg-amber-500 hover:bg-amber-600 text-white" size="sm">
                      {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-2" />}
                      Fikrimi Gönder
                    </Button>
                    <Link to="/auth" className="col-span-2">
                      <Button type="button" variant="outline" size="sm" className="w-full border-amber-400/50 text-amber-700 hover:bg-amber-500/10">
                        <Sparkles className="h-3.5 w-3.5 mr-2" /> Platforma Kaydımı Tamamla
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* MODULE 3 */}
            <TabsContent value="moment">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card grid md:grid-cols-[260px_1fr] gap-5">
                <ModuleVisual kind="moment" />
                {doneKind === "moment" ? <Done kind="moment" /> : (
                  <div className="grid grid-cols-2 gap-3">
                    {identityLocked && !editingIdentity && <IdentityCard />}
                    <details className="col-span-2 text-xs bg-primary/5 border border-primary/20 rounded-md px-2 py-1.5">
                      <summary className="cursor-pointer font-semibold text-primary">Örnek içerikler</summary>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 text-muted-foreground">
                        {momentExamples.map((x) => <li key={x}>{x}</li>)}
                      </ul>
                    </details>
                    <div className="col-span-2"><Label className={labelCls}>Ad Soyad</Label><Input className={inputCls} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} /></div>
                    <div><Label className={labelCls}>Ülke</Label><Input className={inputCls} value={form.country} onChange={(e) => update("country", e.target.value)} /></div>
                    <div><Label className={labelCls}>Şehir</Label><Input className={inputCls} value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
                    <div className="col-span-2"><Label className={labelCls}>İçerik başlığı *</Label><Input className={inputCls} value={form.title} onChange={(e) => update("title", e.target.value)} /></div>
                    <div className="col-span-2"><Label className={labelCls}>Kısa açıklama</Label><Textarea rows={2} className="text-sm min-h-0" value={form.description} onChange={(e) => update("description", e.target.value)} /></div>
                    <div className="col-span-2">
                      <Label className={labelCls}>Google Drive veya sosyal medya post linki (foto / video) *</Label>
                      <Input className={inputCls} value={form.link} onChange={(e) => update("link", e.target.value)} placeholder="https://drive.google.com/... veya https://instagram.com/p/..." />
                      <p className="text-[10px] text-muted-foreground mt-1">Google Drive ("Linke sahip herkes görüntüleyebilir") ya da Instagram / TikTok / YouTube / X / Facebook / LinkedIn post linki kabul ediyoruz.</p>
                    </div>
                    <div className="col-span-2"><Label className={labelCls}>Sosyal medya</Label><Input className={inputCls} value={form.social_handle} onChange={(e) => update("social_handle", e.target.value)} placeholder="@kullaniciadi" /></div>
                    <label className="col-span-2 flex items-start gap-2 text-xs cursor-pointer">
                      <Checkbox checked={form.consent} onCheckedChange={(v) => update("consent", !!v)} className="mt-0.5" />
                      İçeriğimin CorteQS platformunda, canlı yayın ve sosyal medyada paylaşılmasına izin veriyorum *
                    </label>
                    <Button onClick={() => submit("moment")} disabled={submitting} className="col-span-2" size="sm">
                      {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                      Anımı Gönder
                    </Button>
                    <Link to="/auth" className="col-span-2">
                      <Button type="button" variant="outline" size="sm" className="w-full border-primary/50 text-primary hover:bg-primary/10">
                        <Sparkles className="h-3.5 w-3.5 mr-2" /> Platforma Kaydımı Tamamla
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default May19;
