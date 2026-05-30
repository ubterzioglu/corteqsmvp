import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquare, Users, GraduationCap, Heart, PlusCircle, Sparkles, Stethoscope,
  ShieldCheck, Layout, FileText,
  TrendingUp, Rocket, BookOpen, HandHeart, Search,
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
import Navbar from "@/components/Navbar";
import CountryCitySelector from "@/components/CountryCitySelector";
import { useDiaspora } from "@/contexts/DiasporaContext";

import { useToast } from "@/hooks/use-toast";
import { submitLanding, listLandings, type LandingMode, type WhatsAppLanding } from "@/lib/whatsappLandings";
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

  const [createLanding, setCreateLanding] = useState(true);
  const [mode, setMode] = useState<LandingMode>("visual");
  const [heroImage, setHeroImage] = useState("");
  const [tagline, setTagline] = useState("");
  const [callToActionText, setCallToActionText] = useState("");
  const [conditions, setConditions] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminContact, setAdminContact] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(emptyConsent);

  const resetForm = () => {
    setGroupName(""); setCountry(""); setCity(""); setWhatsappLink(""); setDescription("");
    setHeroImage(""); setTagline(""); setCallToActionText(""); setConditions("");
    setAdminName(""); setAdminContact(""); setMode("visual"); setCreateLanding(true);
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
        description: category === "diger" && otherCategory.trim()
          ? `[Kategori: ${otherCategory.trim()}] ${description}`
          : description,
      });
      toast({
        title: "Başvurun alındı! 🎉",
        description: createLanding
          ? "Landing sayfan admin onayından sonra herkese görünür olacak."
          : "Grubun admin onayından sonra listede yayınlanacak.",
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-[#25D366]" /> WhatsApp Grupları
              </h1>
              <p className="text-muted-foreground font-body mt-1">
                Diasporanın WhatsApp gruplarını ülke ve şehir bazında filtrele.
              </p>
            </div>
            <CountryCitySelector city={filterCity} onCityChange={setFilterCity} />
          </div>

          {/* Hero */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#25D366]/10 via-turquoise/5 to-primary/10 p-6 md:p-10 mb-8 text-center">
            <Badge className="mb-4 bg-[#25D366]/15 text-[#25D366] border-0">
              <MessageSquare className="h-3 w-3 mr-1" /> WhatsApp Diaspora Ağı
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
              Diasporanın WhatsApp Gruplarını <span className="text-gradient-primary">Tek Çatı Altında</span> Bul
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-body max-w-3xl mx-auto mb-2">
              Alumni, doktor, hobi ve iş gruplarına saniyeler içinde katıl — ya da kendi grubun için ücretsiz bir landing sayfası yayınla.
            </p>
            <Badge className="bg-success/15 text-success border-0 text-sm px-3 py-1 mt-2">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Grup listeleme ve landing page tamamen ücretsiz
            </Badge>
          </section>

          {/* Banner: Listing + Landing CTA */}
          <div className="rounded-2xl border border-turquoise/30 bg-gradient-to-br from-turquoise/5 via-card to-orange-50/40 p-5 md:p-6 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-turquoise shrink-0 mt-1" />
              <div>
                <h2 className="text-lg md:text-xl font-bold">WhatsApp Gruplarımıza başvurularımız devam etmektedir</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Aşağıda gördüğün kartlar örnek (DEMO) gruplardır. Sen de grubunu hem listele hem de istersen profesyonel bir landing sayfasıyla paylaş.
                </p>
              </div>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full sm:w-auto gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white">
                  <PlusCircle className="h-4 w-4" /> Grubunu Listele + Landing Page Oluştur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Grubunu Paylaş</DialogTitle>
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

                  {/* Step 2 — Landing page opsiyonu */}
                  <div className="rounded-xl border border-border p-4 bg-muted/30">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox checked={createLanding} onCheckedChange={(v) => setCreateLanding(!!v)} className="mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Profesyonel landing sayfası da oluştur</p>
                        <p className="text-xs text-muted-foreground">
                          Linkini paylaştığında insanlar önce çağrını ve grup koşullarını görsün, sonra katılsın.
                        </p>
                      </div>
                    </label>

                    {createLanding && (
                      <div className="mt-5 space-y-4">
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
                    )}
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                    🛡️ Başvurun admin onayından sonra herkese görünür olacak. (Spam ve sahte grupları önlemek için.)
                  </div>

                  <ConsentCheckboxes compact value={consent} onChange={setConsent} />

                  <Button
                    className="w-full gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white"
                    onClick={handleSubmit}
                    disabled={submitting || !isConsentValid(consent)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {submitting ? "Gönderiliyor..." : (createLanding ? "Landing Sayfası Oluştur ve Onaya Gönder" : "Grubu Onaya Gönder")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Blurred placeholder row — "Grubunuzu ekleyin" */}
          <div className="relative mb-12 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 select-none pointer-events-none blur-sm opacity-70">
              {([
                { cat: "alumni" as const, platform: "whatsapp" as const },
                { cat: "doktor" as const, platform: "whatsapp" as const },
                { cat: "hobi" as const, platform: "telegram" as const },
              ]).map(({ cat, platform }) => {
                const meta = categoryMeta[cat];
                const Icon = meta.icon;
                const isTg = platform === "telegram";
                return (
                  <div key={cat} className="bg-card rounded-2xl border border-border p-5 shadow-card flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl border ${meta.color} flex items-center justify-center`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${isTg ? "border-[#229ED9]/40 text-[#229ED9] bg-[#229ED9]/10" : "border-[#25D366]/40 text-[#25D366] bg-[#25D366]/10"}`}>
                        {isTg ? "✈️ Telegram" : "💬 WhatsApp"}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{meta.label} Grubu</h3>
                    <p className="text-xs text-muted-foreground mb-2">📍 Şehir, Ülke</p>
                    <p className="text-sm text-muted-foreground mb-3">Grup açıklaması burada yer alacak.</p>
                    <Button size="sm" className={`w-full text-white ${isTg ? "bg-[#229ED9]" : "bg-[#25D366]"}`}>Katıl</Button>
                  </div>
                );
              })}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-card/95 backdrop-blur border-2 border-dashed border-[#25D366]/50 rounded-2xl px-6 py-5 text-center shadow-lg max-w-md">
                <PlusCircle className="h-8 w-8 text-[#25D366] mx-auto mb-2" />
                <h3 className="font-bold text-lg mb-1">Grubunuzu ekleyin</h3>
                <p className="text-sm text-muted-foreground mb-3">Alumni, Doktor, Hobi ve daha fazlası — kendi grubunu ücretsiz listele.</p>
                <Button size="sm" className="gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white" onClick={() => setOpenDialog(true)}>
                  <PlusCircle className="h-4 w-4" /> Grubunu Listele
                </Button>
              </div>
            </div>
          </div>

          {/* Approved (cloud) landings — populated as you add groups */}
          <section className="mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-turquoise" /> Yayında Olan Gruplar
              </h2>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Grup adı, kategori, şehir, ülke..."
                  className="pl-9 h-9"
                />
              </div>
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
                  return (
                    <div key={g.id} className="rounded-xl border border-border bg-card p-4 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg border ${meta.color} flex items-center justify-center`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <h4 className="font-semibold text-sm leading-tight">{g.groupName}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">📍 {g.city}, {g.country}</p>
                      {g.tagline && (
                        <p className="text-xs text-muted-foreground font-body mb-3 line-clamp-2">{g.tagline}</p>
                      )}
                      <div className="mt-auto flex gap-2">
                        <Link to={`/whatsapp-groups/${g.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                            <Layout className="h-3 w-3" /> Landing
                          </Button>
                        </Link>
                        <a href={g.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button size="sm" className="w-full gap-1 text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white">
                            <MessageSquare className="h-3 w-3" /> Katıl
                          </Button>
                        </a>
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
    </div>
  );
};

export default WhatsAppGroups;
