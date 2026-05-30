import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquare, Users, GraduationCap, Heart, PlusCircle, Sparkles, Stethoscope,
  ShieldCheck, Layout, FileText, Send, Link2, ExternalLink, ArrowRight,
  TrendingUp, Rocket, BookOpen, HandHeart, Search, ThumbsUp, Bell, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CountryCitySelector from "@/components/CountryCitySelector";
import { useDiaspora } from "@/contexts/DiasporaContext";

import { useToast } from "@/hooks/use-toast";
import { submitLanding, submitLinkRequest, listLandings, type LandingMode, type WhatsAppLanding } from "@/lib/whatsappLandings";
import { useAuth } from "@/contexts/AuthContext";
import ConsentCheckboxes, { emptyConsent, isConsentValid, type ConsentState } from "@/components/ConsentCheckboxes";

const categoryMeta = {
  alumni: { icon: GraduationCap, label: "Alumni", color: "text-primary bg-primary/10 border-primary/20" },
  doktor: { icon: Stethoscope, label: "Doktor", color: "text-success bg-success/10 border-success/20" },
  hobi: { icon: Heart, label: "Hobi", color: "text-turquoise bg-turquoise/10 border-turquoise/20" },
  is: { icon: Users, label: "İş", color: "text-gold bg-gold/10 border-gold/20" },
  yatirim: { icon: TrendingUp, label: "Yatırım & Girişim", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  girisim: { icon: Rocket, label: "Yatırım & Girişim", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  akademik: { icon: BookOpen, label: "Akademik", color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20" },
  dayanisma: { icon: HandHeart, label: "Dayanışma", color: "text-rose-600 bg-rose-500/10 border-rose-500/20" },
  diger: { icon: Sparkles, label: "Diğer", color: "text-muted-foreground bg-muted border-border" },
} as const;

const WhatsAppGroups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedCountry } = useDiaspora();
  const [filterCity, setFilterCity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setFilterCity("all"); }, [selectedCountry]);

  // 4 örnek demo grup: 2 Alumni (farklı şehir), 1 Doktor, 1 Hobi
  const [landings, setLandings] = useState<WhatsAppLanding[]>([]);
  const [loadingLandings, setLoadingLandings] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listLandings()
      .then((rows) => { if (!cancelled) setLandings(rows); })
      .finally(() => { if (!cancelled) setLoadingLandings(false); });
    return () => { cancelled = true; };
  }, []);

  // ---- Post Group + Landing Page form state ----
  const [groupName, setGroupName] = useState("");
  const [category, setCategory] = useState<keyof typeof categoryMeta>("alumni");
  const [otherCategory, setOtherCategory] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [description, setDescription] = useState("");

  
  const [mode, setMode] = useState<LandingMode>("visual");
  const [heroImage, setHeroImage] = useState("");
  const [tagline, setTagline] = useState("");
  const [callToActionText, setCallToActionText] = useState("");
  const [conditions, setConditions] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminContact, setAdminContact] = useState("");

  // Admin-curated metadata
  const [theme, setTheme] = useState("");
  const [memberCount, setMemberCount] = useState<string>("");
  const [centralCountry, setCentralCountry] = useState("");
  const [centralCity, setCentralCity] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("");
  const [foundedYear, setFoundedYear] = useState<string>("");
  const [acceptFormEnabled, setAcceptFormEnabled] = useState(true);
  const [acceptFormQuestions, setAcceptFormQuestions] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(emptyConsent);

  // Member quick-link submission
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [quickLink, setQuickLink] = useState("");
  const [quickGroupName, setQuickGroupName] = useState("");
  const [quickCountry, setQuickCountry] = useState("");
  const [quickCity, setQuickCity] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // Demo like/follow/comment state (frontend-only, marked DEMO)
  const [demoLikes, setDemoLikes] = useState<Record<string, number>>({ d1: 24, d2: 41 });
  const [demoLiked, setDemoLiked] = useState<Record<string, boolean>>({});
  const [demoFollowed, setDemoFollowed] = useState<Record<string, boolean>>({});

  // Redirect dialog (link-only flow) + LP preview dialog (LP flow)
  const [redirectTarget, setRedirectTarget] = useState<{ url: string; name: string } | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [lpPreview, setLpPreview] = useState<null | {
    name: string; city: string; tagline: string; heroImage: string;
    theme: string; conditions: string[]; whatsappLink: string;
    memberCount?: number; centralCountry?: string; centralCity?: string;
    primaryLanguage?: string; foundedYear?: number;
    adminName?: string; acceptFormQuestions?: string[];
  }>(null);
  const [joinForm, setJoinForm] = useState({ name: "", email: "", note: "", answers: "" });

  useEffect(() => {
    if (!redirectTarget) { setRedirectCountdown(3); return; }
    setRedirectCountdown(3);
    const tick = setInterval(() => {
      setRedirectCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          window.open(redirectTarget.url, "_blank", "noopener,noreferrer");
          setRedirectTarget(null);
          return 3;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [redirectTarget]);

  const resetForm = () => {
    setGroupName(""); setCountry(""); setCity(""); setWhatsappLink(""); setDescription("");
    setHeroImage(""); setTagline(""); setCallToActionText(""); setConditions("");
    setAdminName(""); setAdminContact(""); setMode("visual");
    setTheme(""); setMemberCount(""); setCentralCountry(""); setCentralCity("");
    setPrimaryLanguage(""); setFoundedYear(""); setAcceptFormEnabled(true); setAcceptFormQuestions("");
  };

  const handleQuickLinkSubmit = async () => {
    if (!quickLink.trim()) {
      toast({ title: "Link gerekli", description: "WhatsApp grup linkini yapıştır.", variant: "destructive" });
      return;
    }
    setQuickSubmitting(true);
    try {
      await submitLinkRequest({
        whatsappLink: quickLink.trim(),
        groupName: quickGroupName || undefined,
        country: quickCountry || undefined,
        city: quickCity || undefined,
        note: quickNote || undefined,
      });
      toast({
        title: "Talebin alındı 🎉",
        description: "Yöneticilere bildirim gönderildi — grubunu listeleyip listelemeyeceklerini sana ileteceğiz.",
      });
      setOpenLinkDialog(false);
      setQuickLink(""); setQuickGroupName(""); setQuickCountry(""); setQuickCity(""); setQuickNote("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
      toast({ title: "Gönderilemedi", description: msg, variant: "destructive" });
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!groupName || !country || !city || !whatsappLink) {
      toast({ title: "Eksik alan", description: "Grup adı, ülke, şehir ve WhatsApp linki zorunludur.", variant: "destructive" });
      return;
    }
    if (category === "diger" && !otherCategory.trim()) {
      toast({ title: "Kategori eksik", description: "'Diğer' seçtin — lütfen kategori adını yaz.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({
        title: "Giriş gerekli",
        description: "Giriş sayfası yeni sekmede açılıyor. Giriş yaptıktan sonra bu sekmeye dönüp tekrar Gönder'e bas — formun korunuyor.",
      });
      window.open("/auth", "_blank", "noopener");
      return;
    }
    if (!isConsentValid(consent)) {
      toast({ title: "Onay gerekli", description: "KVKK / GDPR onaylarını işaretleyin.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await submitLanding({
        groupName,
        category,
        country,
        city,
        mode,
        heroImage: mode === "visual" ? heroImage : undefined,
        tagline: tagline || description.slice(0, 100),
        callToActionText: callToActionText || description,
        conditions,
        whatsappLink,
        adminName,
        adminContact,
        theme: theme || undefined,
        memberCount: memberCount ? Number(memberCount) : undefined,
        centralCountry: centralCountry || undefined,
        centralCity: centralCity || undefined,
        primaryLanguage: primaryLanguage || undefined,
        foundedYear: foundedYear ? Number(foundedYear) : undefined,
        acceptFormEnabled,
        acceptFormQuestions: acceptFormQuestions || undefined,
        description: category === "diger" && otherCategory.trim()
          ? `[Kategori: ${otherCategory.trim()}] ${description}`
          : description,
      });
      toast({
        title: "Başvurun alındı! 🎉",
        description: "Landing sayfan admin onayından sonra herkese görünür olacak.",
      });
      setOpenDialog(false);
      resetForm();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
      toast({ title: "Gönderilemedi", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">

          {/* Header row: title + Country/City selector */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3 flex-wrap">
                <MessageSquare className="h-8 w-8 text-[#25D366]" />
                <Send className="h-7 w-7 text-[#229ED9]" />
                Mesajlaşma Grupları
              </h1>
              <p className="text-muted-foreground font-body mt-1">
                Diasporanın WhatsApp ve Telegram gruplarını ülke ve şehir bazında filtrele.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              <CountryCitySelector city={filterCity} onCityChange={setFilterCity} />
              <div className="relative w-full lg:w-[420px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Grup adı, kategori, şehir, ülke..."
                  className="pl-9 h-10"
                  aria-label="Gruplarda ara"
                />
              </div>
            </div>
          </div>

          {/* Hero — compact */}
          <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-[#25D366]/10 via-[#229ED9]/10 to-primary/10 px-4 py-4 md:px-6 md:py-5 mb-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge className="bg-[#25D366]/15 text-[#25D366] border-0 text-[10px]"><MessageSquare className="h-3 w-3 mr-1" /> WhatsApp</Badge>
                  <Badge className="bg-[#229ED9]/15 text-[#229ED9] border-0 text-[10px]"><Send className="h-3 w-3 mr-1" /> Telegram</Badge>
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Diaspora Ağı</Badge>
                </div>
                <h2 className="text-lg md:text-xl font-bold leading-tight">
                  Diasporanın WhatsApp & Telegram Gruplarını <span className="text-gradient-primary">Tek Çatı Altında</span>
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground font-body mt-0.5">
                  Alumni, doktor, hobi, iş gruplarına saniyeler içinde katıl ya da kendi grubunu ücretsiz listele.
                </p>
              </div>
              <Badge className="bg-success/15 text-success border-0 text-xs px-2.5 py-1 shrink-0 self-start md:self-center">
                <ShieldCheck className="h-3 w-3 mr-1" /> Listeleme ücretsiz
              </Badge>
            </div>
          </section>

          {/* Two side-by-side submission cards — compact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {/* LEFT — Member: link only */}
            <div className="rounded-xl border-2 border-[#25D366]/30 bg-gradient-to-br from-[#25D366]/5 via-card to-card p-3.5 flex flex-col">
              <div className="flex items-start gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                  <Link2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <Badge className="bg-[#25D366]/15 text-[#25D366] border-0 text-[10px] mb-0.5">Üyeler • Hızlı</Badge>
                  <h3 className="text-base font-bold leading-tight">Sadece Link Paylaş</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    30 sn'de gönder, admin senin için listelesin.
                  </p>
                </div>
              </div>
              <ul className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mb-3 ml-0.5">
                <li>• 30 sn</li>
                <li>• Tasarım derdi yok</li>
                <li>• Admin'e otomatik bildirim</li>
              </ul>
              <Dialog open={openLinkDialog} onOpenChange={setOpenLinkDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="mt-auto w-full gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white">
                    <Link2 className="h-4 w-4" /> Link Gönder
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Hızlı Link Gönder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label>WhatsApp Grup Linki *</Label>
                      <Input value={quickLink} onChange={(e) => setQuickLink(e.target.value)} placeholder="https://chat.whatsapp.com/..." />
                    </div>
                    <div>
                      <Label>Grup Adı (opsiyonel)</Label>
                      <Input value={quickGroupName} onChange={(e) => setQuickGroupName(e.target.value)} placeholder="Örn: Berlin Türk Doktorlar" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Ülke</Label>
                        <Input value={quickCountry} onChange={(e) => setQuickCountry(e.target.value)} placeholder="Almanya" />
                      </div>
                      <div>
                        <Label>Şehir</Label>
                        <Input value={quickCity} onChange={(e) => setQuickCity(e.target.value)} placeholder="Berlin" />
                      </div>
                    </div>
                    <div>
                      <Label>Not (opsiyonel)</Label>
                      <Textarea value={quickNote} onChange={(e) => setQuickNote(e.target.value)} rows={2} placeholder="Yöneticiye kısa bir not bırak..." />
                    </div>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900">
                      🔔 Talebin yöneticilere otomatik iletilecek: <em>"Böyle bir talep var — Grubunu Listelemek ister misin?"</em>
                    </div>
                    <Button onClick={handleQuickLinkSubmit} disabled={quickSubmitting} className="w-full gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white">
                      <Send className="h-4 w-4" />
                      {quickSubmitting ? "Gönderiliyor..." : "Yöneticiye Gönder"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* RIGHT — Admin / power user: full landing page */}
            <div className="rounded-xl border-2 border-turquoise/30 bg-gradient-to-br from-turquoise/5 via-card to-orange-50/40 p-3.5 flex flex-col">
              <div className="flex items-start gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-lg bg-turquoise/15 text-turquoise flex items-center justify-center shrink-0">
                  <Layout className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <Badge className="bg-turquoise/15 text-turquoise border-0 text-[10px] mb-0.5">Yöneticiler • Detaylı</Badge>
                  <h3 className="text-base font-bold leading-tight">Landing Page ile Listele</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    Profesyonel LP + kabul formu. Tema, üye sayısı, merkez şehir senin.
                  </p>
                </div>
              </div>
              <ul className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mb-3 ml-0.5">
                <li>• Hero + tagline + koşullar</li>
                <li>• Kabul formu (kapatılabilir)</li>
                <li>• Like / follow / yorum</li>
              </ul>
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="mt-auto w-full gap-2 bg-turquoise hover:bg-turquoise/90 text-white">
                    <Layout className="h-4 w-4" /> Landing Page Oluştur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Landing Page ile Grup Listele</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-5 mt-4">
                    {/* Step 1 — Grup bilgisi */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">1. Grup Bilgileri</h3>
                      <div>
                        <Label>Grup Adı *</Label>
                        <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Örn: Berlin Türk Girişimciler" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Kategori *</Label>
                          <Select value={category} onValueChange={(v) => setCategory(v as keyof typeof categoryMeta)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alumni">Alumni</SelectItem>
                              <SelectItem value="doktor">Doktor / Sağlık</SelectItem>
                              <SelectItem value="hobi">Hobi</SelectItem>
                              <SelectItem value="is">İş Grubu</SelectItem>
                              <SelectItem value="yatirim">Yatırım & Girişim</SelectItem>
                              <SelectItem value="akademik">Akademik</SelectItem>
                              <SelectItem value="dayanisma">Dayanışma</SelectItem>
                              <SelectItem value="diger">Diğer (kendin yaz)</SelectItem>
                            </SelectContent>
                          </Select>
                          {category === "diger" && (
                            <Input
                              value={otherCategory}
                              onChange={(e) => setOtherCategory(e.target.value)}
                              placeholder="Kategori adını yaz (örn: Spor, Müzik)"
                              className="mt-2"
                            />
                          )}
                        </div>
                        <div>
                          <Label>WhatsApp Linki *</Label>
                          <Input value={whatsappLink} onChange={(e) => setWhatsappLink(e.target.value)} placeholder="https://chat.whatsapp.com/..." />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Ülke *</Label>
                          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Almanya" />
                        </div>
                        <div>
                          <Label>Şehir *</Label>
                          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Berlin" />
                        </div>
                      </div>
                      <div>
                        <Label>Kısa Açıklama</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Grup hakkında 1-2 cümle" rows={2} />
                      </div>
                    </div>

                    {/* Step 1b — Admin metadata */}
                    <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/30">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">2. Grup Detayları (Yönetici)</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Grup Teması</Label>
                          <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Örn: Kariyer & Mentorluk" />
                        </div>
                        <div>
                          <Label>Üye Sayısı (tahmini)</Label>
                          <Input type="number" value={memberCount} onChange={(e) => setMemberCount(e.target.value)} placeholder="350" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Merkez Ülke</Label>
                          <Input value={centralCountry} onChange={(e) => setCentralCountry(e.target.value)} placeholder="Almanya" />
                        </div>
                        <div>
                          <Label>Merkez Şehir</Label>
                          <Input value={centralCity} onChange={(e) => setCentralCity(e.target.value)} placeholder="Berlin" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Grup Dili</Label>
                          <Input value={primaryLanguage} onChange={(e) => setPrimaryLanguage(e.target.value)} placeholder="Türkçe / İngilizce" />
                        </div>
                        <div>
                          <Label>Kuruluş Yılı</Label>
                          <Input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="2022" />
                        </div>
                      </div>
                    </div>

                    {/* Step 2 — Landing details */}
                    <div className="rounded-xl border border-border p-4 bg-muted/30 space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">3. Landing Sayfası</h3>
                      <div>
                        <Label className="mb-2 block">Landing Stili</Label>
                        <RadioGroup value={mode} onValueChange={(v) => setMode(v as LandingMode)} className="grid grid-cols-2 gap-3">
                          <label className={`rounded-lg border p-3 cursor-pointer flex items-start gap-2 ${mode === "visual" ? "border-primary bg-primary/5" : "border-border"}`}>
                            <RadioGroupItem value="visual" className="mt-0.5" />
                            <div>
                              <div className="flex items-center gap-1.5 font-semibold text-sm"><Layout className="h-3.5 w-3.5" /> Görsel + CTA</div>
                              <p className="text-xs text-muted-foreground">Hero görseli ve büyük CTA butonu ile.</p>
                            </div>
                          </label>
                          <label className={`rounded-lg border p-3 cursor-pointer flex items-start gap-2 ${mode === "text" ? "border-primary bg-primary/5" : "border-border"}`}>
                            <RadioGroupItem value="text" className="mt-0.5" />
                            <div>
                              <div className="flex items-center gap-1.5 font-semibold text-sm"><FileText className="h-3.5 w-3.5" /> Sade Yazı</div>
                              <p className="text-xs text-muted-foreground">Sadece çağrı yazısı + grup koşulları.</p>
                            </div>
                          </label>
                        </RadioGroup>
                      </div>

                      {mode === "visual" && (
                        <div>
                          <Label>Hero Görsel URL</Label>
                          <Input value={heroImage} onChange={(e) => setHeroImage(e.target.value)} placeholder="https://..." />
                          <p className="text-[11px] text-muted-foreground mt-1">Boş bırakırsan gradient arka plan kullanılır.</p>
                        </div>
                      )}

                      <div>
                        <Label>Tagline (kısa pitch)</Label>
                        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Tek cümlede grubunu anlat" />
                      </div>

                      <div>
                        <Label>Çağrı Metni</Label>
                        <Textarea value={callToActionText} onChange={(e) => setCallToActionText(e.target.value)} placeholder="Topluluğa neden katılmalı? Ne sunuyorsun?" rows={4} />
                      </div>

                      <div>
                        <Label>Grup Koşulları (her satıra bir madde)</Label>
                        <Textarea value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder={"Sadece mezunlar\nReklam yasak\n..."} rows={4} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Yönetici Adı</Label>
                          <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Adın" />
                        </div>
                        <div>
                          <Label>Yönetici İletişim</Label>
                          <Input value={adminContact} onChange={(e) => setAdminContact(e.target.value)} placeholder="E-posta veya telefon" />
                        </div>
                      </div>
                    </div>

                    {/* Step 4 — Accept form */}
                    <div className="rounded-xl border border-border p-4 bg-card space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold">Kabul Kayıt Formu</h3>
                          <p className="text-xs text-muted-foreground">Landing'de "Katıl" diyenlerden bilgi toplansın mı? İstemezsen tamamen kapatabilirsin.</p>
                        </div>
                        <Switch checked={acceptFormEnabled} onCheckedChange={setAcceptFormEnabled} />
                      </div>
                      {acceptFormEnabled && (
                        <div>
                          <Label>Form Soruları (her satıra bir soru, opsiyonel)</Label>
                          <Textarea
                            value={acceptFormQuestions}
                            onChange={(e) => setAcceptFormQuestions(e.target.value)}
                            rows={3}
                            placeholder={"Mezuniyet yılın?\nNeden katılmak istiyorsun?\nLinkedIn profilin?"}
                          />
                          <p className="text-[11px] text-muted-foreground mt-1">Boş bırakırsan sadece ad, e-posta, telefon ve not alınır. Form sonrası başvurular admin panelinde görünür ve istediğin zaman düzenleyebilir veya iptal edebilirsin.</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                      🛡️ Başvurun admin onayından sonra herkese görünür olacak.
                    </div>

                    <ConsentCheckboxes compact value={consent} onChange={setConsent} />

                    <Button
                      className="w-full gap-2 bg-turquoise hover:bg-turquoise/90 text-white"
                      onClick={handleSubmit}
                      disabled={submitting || !isConsentValid(consent)}
                    >
                      <Layout className="h-4 w-4" />
                      {submitting ? "Gönderiliyor..." : "Landing Sayfası Oluştur ve Onaya Gönder"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* DEMO mocks — interaction preview (like / follow / comment) */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-gold/20 text-foreground border-gold/40">DEMO</Badge>
              <h3 className="text-sm font-semibold text-muted-foreground">
                Üyeler bu gruplarda beğeni, takip ve yorum yapabilir — örnek önizleme (gerçek gruplar gelince kaldırılacak)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  id: "d1",
                  name: "İstanbul→Londra Yazılımcılar (DEMO)",
                  cat: "is" as const,
                  city: "Londra, İngiltere",
                  tagline: "Relocation, vize, mülakat — birlikte çözüyoruz.",
                  hasLp: true,
                  heroImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=500&fit=crop",
                  theme: "Yazılım & Relocation",
                  conditions: ["Tech/yazılım profili", "Spam/ilan paylaşımı yasak", "İngilizce CV önerilir"],
                  whatsappLink: "https://chat.whatsapp.com/demo-london-devs",
                  memberCount: 312,
                  centralCountry: "İngiltere",
                  centralCity: "Londra",
                  primaryLanguage: "Türkçe / İngilizce",
                  foundedYear: 2022,
                  adminName: "Mert A.",
                  acceptFormQuestions: [
                    "LinkedIn profilin?",
                    "Hangi teknolojilerde çalışıyorsun?",
                    "Şu an Londra'da mısın yoksa relocation aşamasında mı?",
                  ],
                  comments: [
                    { name: "Mert A.", text: "Bu grup sayesinde 2 ay içinde iş buldum 🙌" },
                    { name: "Ece K.", text: "Vize avukatı tavsiyeleri çok değerli." },
                  ],
                },
                {
                  id: "d2",
                  name: "Berlin Türk Anne–Baba Topluluğu (DEMO)",
                  cat: "dayanisma" as const,
                  city: "Berlin, Almanya",
                  tagline: "Kreş, okul, çocuk doktoru — gerçek deneyimler.",
                  hasLp: false,
                  whatsappLink: "https://chat.whatsapp.com/demo-berlin-parents",
                  comments: [
                    { name: "Selin Y.", text: "Kita başvurularında çok yardımcı oldular." },
                  ],
                },
              ].map((g) => {
                const meta = categoryMeta[g.cat];
                const Icon = meta.icon;
                const liked = !!demoLiked[g.id];
                const followed = !!demoFollowed[g.id];
                return (
                  <div key={g.id} className="relative rounded-2xl border border-border bg-card p-5 shadow-card">
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      <Badge className="bg-gold/20 text-foreground border-gold/40 text-[10px]">DEMO</Badge>
                      <Badge variant="outline" className={`text-[10px] ${g.hasLp ? "border-turquoise/40 text-turquoise bg-turquoise/10" : "border-[#25D366]/40 text-[#25D366] bg-[#25D366]/10"}`}>
                        {g.hasLp ? "📄 Landing Page'li" : "🔗 Sadece Link"}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-3 mb-3 pr-20">
                      <div className={`w-10 h-10 rounded-lg border ${meta.color} flex items-center justify-center shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground leading-tight">{g.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">📍 {g.city}</p>
                        <p className="text-sm text-muted-foreground font-body mt-1">{g.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Button
                        size="sm"
                        variant={liked ? "default" : "outline"}
                        className={`gap-1.5 ${liked ? "bg-[#25D366] hover:bg-[#20bd5a] text-white" : ""}`}
                        onClick={() => {
                          setDemoLiked((s) => ({ ...s, [g.id]: !s[g.id] }));
                          setDemoLikes((s) => ({ ...s, [g.id]: (s[g.id] || 0) + (liked ? -1 : 1) }));
                        }}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" /> {demoLikes[g.id]}
                      </Button>
                      <Button
                        size="sm"
                        variant={followed ? "default" : "outline"}
                        className={`gap-1.5 ${followed ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => setDemoFollowed((s) => ({ ...s, [g.id]: !s[g.id] }))}
                      >
                        <Bell className="h-3.5 w-3.5" /> {followed ? "Takip ediliyor" : "Takip Et"}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5" /> {g.comments.length} yorum
                      </Button>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-3 space-y-2 mb-3">
                      {g.comments.map((c, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-semibold">{c.name}:</span>{" "}
                          <span className="text-muted-foreground">{c.text}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {g.hasLp ? (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 gap-1.5 bg-turquoise hover:bg-turquoise/90 text-white"
                            onClick={() => setLpPreview({
                              name: g.name, city: g.city, tagline: g.tagline,
                              heroImage: g.heroImage!, theme: g.theme!, conditions: g.conditions!,
                              whatsappLink: g.whatsappLink,
                              memberCount: (g as any).memberCount,
                              centralCountry: (g as any).centralCountry,
                              centralCity: (g as any).centralCity,
                              primaryLanguage: (g as any).primaryLanguage,
                              foundedYear: (g as any).foundedYear,
                              adminName: (g as any).adminName,
                              acceptFormQuestions: (g as any).acceptFormQuestions,
                            })}
                          >
                            <Layout className="h-3.5 w-3.5" /> Landing'i Aç
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => setRedirectTarget({ url: g.whatsappLink, name: g.name })}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white"
                          onClick={() => setRedirectTarget({ url: g.whatsappLink, name: g.name })}
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> WhatsApp'a Katıl
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Approved (cloud) landings — populated as you add groups */}
          <section className="mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-turquoise" /> Yayında Olan Gruplar
              </h2>
              {searchQuery && (
                <p className="text-xs text-muted-foreground">Arama: <span className="font-medium text-foreground">"{searchQuery}"</span></p>
              )}
            </div>

            {(() => {
              const q = searchQuery.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const filteredLandings = landings.filter((g) => {
                const matchesCountry = selectedCountry === "all" || g.country === selectedCountry;
                const matchesCity = filterCity === "all" || g.city === filterCity;
                if (!q) return matchesCountry && matchesCity;
                const hay = `${g.groupName} ${g.category} ${categoryMeta[g.category]?.label ?? ""} ${g.city} ${g.country} ${g.tagline ?? ""}`
                  .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return matchesCountry && matchesCity && hay.includes(q);
              });
              if (loadingLandings) {
                return <p className="text-sm text-muted-foreground">Yükleniyor...</p>;
              }
              if (filteredLandings.length === 0) {
                return (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {landings.length === 0
                        ? "Henüz yayında grup yok. İlk grubu sen ekle!"
                        : "Bu ülke/şehir için henüz grup yok."}
                    </p>
                  </div>
                );
              }
              return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLandings.map((g) => {
                  const meta = categoryMeta[g.category];
                  const Icon = meta.icon;
                  const hasLp = !!(g.heroImage || g.tagline || g.callToActionText || g.conditions);
                  return (
                    <div key={g.id} className="rounded-xl border border-border bg-card p-4 flex flex-col">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-lg border ${meta.color} flex items-center justify-center shrink-0`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <h4 className="font-semibold text-sm leading-tight truncate">{g.groupName}</h4>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-[10px] ${hasLp ? "border-turquoise/40 text-turquoise bg-turquoise/10" : "border-[#25D366]/40 text-[#25D366] bg-[#25D366]/10"}`}>
                          {hasLp ? "📄 LP" : "🔗 Link"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">📍 {g.city}, {g.country}</p>
                      {g.tagline && (
                        <p className="text-xs text-muted-foreground font-body mb-3 line-clamp-2">{g.tagline}</p>
                      )}
                      <div className="mt-auto flex gap-2">
                        {hasLp && (
                          <Link to={`/whatsapp-groups/${g.id}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                              <Layout className="h-3 w-3" /> Landing
                            </Button>
                          </Link>
                        )}
                        <Button
                          size="sm"
                          className={`${hasLp ? "flex-1" : "w-full"} gap-1 text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white`}
                          onClick={() => setRedirectTarget({ url: g.whatsappLink, name: g.groupName })}
                        >
                          <MessageSquare className="h-3 w-3" /> Katıl
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              );
            })()}
          </section>
        </div>
      </main>

      {/* Redirect dialog — link-only flow */}
      <Dialog open={!!redirectTarget} onOpenChange={(v) => !v && setRedirectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-[#25D366]" /> WhatsApp'a yönlendiriliyorsunuz
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{redirectTarget?.name}</span> grubunun WhatsApp linkine
              <span className="font-bold text-[#25D366]"> {redirectCountdown} </span>
              saniye içinde yönlendirileceksiniz.
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 text-left">
              ⚠️ CorteQS, üçüncü taraf WhatsApp gruplarının içeriğinden sorumlu değildir. Grup kurallarına uyduğunuzdan emin olun.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRedirectTarget(null)}>Vazgeç</Button>
              <Button
                className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white"
                onClick={() => {
                  if (redirectTarget) window.open(redirectTarget.url, "_blank", "noopener,noreferrer");
                  setRedirectTarget(null);
                }}
              >
                <ArrowRight className="h-4 w-4" /> Şimdi Git
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* LP preview dialog — landing page flow */}
      <Dialog open={!!lpPreview} onOpenChange={(v) => !v && setLpPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {lpPreview && (
            <div>
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img src={lpPreview.heroImage} alt={lpPreview.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <Badge className="absolute top-3 left-3 bg-gold/30 text-white border-gold/50">DEMO LANDING</Badge>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h2 className="text-xl font-bold leading-tight">{lpPreview.name}</h2>
                  <p className="text-xs opacity-90">📍 {lpPreview.city} · 🎯 {lpPreview.theme}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground italic">{lpPreview.tagline}</p>

                {/* Group metadata — collected at admin registration */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-xs">
                  {lpPreview.memberCount != null && (
                    <div><span className="text-muted-foreground">Üye:</span> <span className="font-semibold">{lpPreview.memberCount}</span></div>
                  )}
                  {(lpPreview.centralCity || lpPreview.centralCountry) && (
                    <div><span className="text-muted-foreground">Merkez:</span> <span className="font-semibold">{[lpPreview.centralCity, lpPreview.centralCountry].filter(Boolean).join(", ")}</span></div>
                  )}
                  {lpPreview.primaryLanguage && (
                    <div><span className="text-muted-foreground">Dil:</span> <span className="font-semibold">{lpPreview.primaryLanguage}</span></div>
                  )}
                  {lpPreview.foundedYear != null && (
                    <div><span className="text-muted-foreground">Kuruluş:</span> <span className="font-semibold">{lpPreview.foundedYear}</span></div>
                  )}
                  {lpPreview.adminName && (
                    <div><span className="text-muted-foreground">Yönetici:</span> <span className="font-semibold">{lpPreview.adminName}</span></div>
                  )}
                  <div><span className="text-muted-foreground">Tema:</span> <span className="font-semibold">{lpPreview.theme}</span></div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-success" /> Grup Koşulları
                  </h3>
                  <ul className="space-y-1">
                    {lpPreview.conditions.map((c, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-success">✓</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border-2 border-turquoise/30 bg-turquoise/5 p-4 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-turquoise" /> Kayıt Formu
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Ad Soyad</Label>
                      <Input value={joinForm.name} onChange={(e) => setJoinForm((f) => ({ ...f, name: e.target.value }))} placeholder="Adınız" className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">E-posta</Label>
                      <Input value={joinForm.email} onChange={(e) => setJoinForm((f) => ({ ...f, email: e.target.value }))} placeholder="ornek@mail.com" className="h-9" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Kısa Tanıtım</Label>
                    <Textarea value={joinForm.note} onChange={(e) => setJoinForm((f) => ({ ...f, note: e.target.value }))} rows={2} placeholder="Kendinizden kısaca bahsedin..." />
                  </div>
                  {lpPreview.acceptFormQuestions && lpPreview.acceptFormQuestions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Yöneticinin soruları</Label>
                      {lpPreview.acceptFormQuestions.map((q, i) => (
                        <div key={i} className="text-xs text-muted-foreground">• {q}</div>
                      ))}
                      <Textarea
                        value={joinForm.answers}
                        onChange={(e) => setJoinForm((f) => ({ ...f, answers: e.target.value }))}
                        rows={3}
                        placeholder="Soruları sırayla yanıtla..."
                      />
                    </div>
                  )}
                  <Button
                    className="w-full gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white"
                    onClick={() => {
                      toast({ title: "Başvurun alındı 🎉", description: "Grup yöneticisi inceleyip seni WhatsApp'a yönlendirecek." });
                      setJoinForm({ name: "", email: "", note: "", answers: "" });
                      setLpPreview(null);
                      setRedirectTarget({ url: lpPreview.whatsappLink, name: lpPreview.name });
                    }}
                  >
                    <Send className="h-4 w-4" /> Başvuruyu Gönder & WhatsApp'a Git
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default WhatsAppGroups;
