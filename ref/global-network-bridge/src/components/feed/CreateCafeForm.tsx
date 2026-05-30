import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, Loader2, Linkedin, Globe2, MapPin, Ticket, Users, Crown, Briefcase, ShieldCheck, Lock, Music } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allCountries, countryCities } from "@/data/countryCities";
import { continents } from "@/data/continents";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsPremium } from "@/hooks/useIsPremium";
import { toast } from "@/hooks/use-toast";
import { moderateCafeName } from "@/lib/cafeNameModeration";

const THEME_SUGGESTIONS = [
  "IT",
  "Hekimler",
  "Profesyoneller",
  "İşletmeler",
  "Kuruluşlar",
  "Blogger/Vlogger",
  "Genel",
];

type AudienceScope = "everyone" | "geo" | "referral";

interface Props {
  trigger?: React.ReactNode;
  onCreated?: () => void;
  /** Ambassadors get an extended 6-hour slot with larger capacity */
  ambassadorMode?: boolean;
  /** Pre-fill country (e.g. user's profile country or active feed country) */
  defaultCountry?: string | null;
  /** Pre-fill city if it belongs to defaultCountry */
  defaultCity?: string | null;
}

const CreateCafeForm = ({ trigger, onCreated, ambassadorMode = false, defaultCountry, defaultCity }: Props) => {
  const { user, accountType } = useAuth();
  const isPremium = useIsPremium();
  const navigate = useNavigate();

  // Cadde Kural Seti:
  //  • Pro hesap (Premium + işletme/danışman/kuruluş/blogger-vlogger): 6 saat · 1000 kişi
  //  • Ücretsiz subscriber: 3 saat · 100 kişi
  //  • Şehir Elçisi: 6 saat · 1000 kişi
  const PRO_ROLES = ["business", "consultant", "association", "blogger", "vlogger"];
  const isPro = isPremium || PRO_ROLES.includes((accountType || "").toLowerCase());
  const maxDuration = ambassadorMode || isPro ? 6 : 3;
  const maxCapacity = ambassadorMode || isPro ? 1000 : 100;
  const defaultDuration = maxDuration;
  const [duration, setDuration] = useState<number>(defaultDuration);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("Genel");
  const [audienceScope, setAudienceScope] = useState<AudienceScope>(defaultCountry ? "geo" : "everyone");
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState(defaultCountry || "");
  const [city, setCity] = useState(
    defaultCountry && defaultCity && (countryCities[defaultCountry] || []).includes(defaultCity)
      ? defaultCity
      : ""
  );
  const [referralCode, setReferralCode] = useState("");
  const [profession, setProfession] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [extra, setExtra] = useState("");
  const [openEntry, setOpenEntry] = useState(true);
  const [entryQuestion, setEntryQuestion] = useState("");
  const [musicPrompt, setMusicPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cities = country ? countryCities[country] || [] : [];
  const continentList = Object.keys(continents);
  const capacity = maxCapacity;

  const submit = async () => {
    if (!user) {
      toast({ title: "Giriş yapmalısın", variant: "destructive" });
      return;
    }
    const mod = moderateCafeName(name);
    if (mod.ok === false) {
      toast({ title: "Cafe adı kabul edilmedi", description: mod.reason, variant: "destructive" });
      return;
    }
    if (!theme.trim()) {
      toast({ title: "Tema gir", variant: "destructive" });
      return;
    }
    if (audienceScope === "referral" && !referralCode.trim()) {
      toast({ title: "Davet kodu gir", description: "Sadece davet kodu olanlar katılabilsin diye bir kod tanımla.", variant: "destructive" });
      return;
    }
    if (!openEntry && !entryQuestion.trim()) {
      toast({ title: "Onaylı giriş için bir soru gir", variant: "destructive" });
      return;
    }
    if (linkedin.trim()) {
      try { new URL(linkedin); } catch {
        toast({ title: "Geçerli LinkedIn URL gir", variant: "destructive" });
        return;
      }
    }
    setSubmitting(true);
    const opens = new Date();
    const closes = new Date(opens.getTime() + duration * 60 * 60 * 1000);
    const payload: any = {
      name: name.trim(),
      theme,
      country: audienceScope === "geo" ? (country || null) : null,
      city: audienceScope === "geo" ? (city || null) : null,
      continent: audienceScope === "geo" ? (continent || null) : null,
      audience_scope: audienceScope,
      referral_code: audienceScope === "referral" ? referralCode.trim().toUpperCase() : null,
      linkedin_url: linkedin.trim(),
      extra_links: extra.trim() ? [extra.trim()] : [],
      created_by: user.id,
      opens_at: opens.toISOString(),
      closes_at: closes.toISOString(),
      duration_hours: duration,
      kind: "community",
      open_entry: openEntry,
      entry_question: openEntry ? null : entryQuestion.trim(),
      capacity,
    };
    const { data, error } = await supabase.from("cafes" as any).insert(payload).select("id").single();

    if (error) {
      setSubmitting(false);
      const msg = error.message?.includes("cafes_name_unique_lower") || error.code === "23505"
        ? "Bu isimde bir cafe zaten var. Farklı bir isim seç."
        : error.message;
      toast({ title: "Cafe açılamadı", description: msg, variant: "destructive" });
      return;
    }

    const cafeId = (data as any).id as string;
    await supabase.from("cafe_memberships" as any).insert({ cafe_id: cafeId, user_id: user.id, approved: true });
    if (musicPrompt.trim()) {
      try { localStorage.setItem(`cafe:${cafeId}:music_prompt`, musicPrompt.trim()); } catch {}
    }

    setSubmitting(false);
    setOpen(false);
    setName("");
    setLinkedin("");
    setExtra("");
    setEntryQuestion("");
    setOpenEntry(true);
    setReferralCode("");
    toast({ title: "Cafe açma talebin gönderildi ☕", description: `${duration} saat · kapasite ${capacity}. Admin onayı bekleniyor.` });
    onCreated?.();
    navigate(`/cadde/${cafeId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="w-full gap-1.5 h-8 text-[11px]">
            <Coffee className="h-3.5 w-3.5" /> + Cafe Aç
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-amber-600" /> Yeni Cafe Aç
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Cafe Adı *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Berlin Devs Cafe" maxLength={60} />
            <p className="text-[10px] text-muted-foreground mt-1">
              Küfür, siyaset, ırkçılık ve nefret söylemi içeren adlar reddedilir.
            </p>
          </div>
          <div>
            <Label className="text-xs">Tema</Label>
            <Input
              list="cafe-theme-suggestions"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Örn: IT, Hekimler, Genel veya kendi temanı yaz"
              maxLength={40}
            />
            <datalist id="cafe-theme-suggestions">
              {THEME_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>

          {/* Audience scope */}
          <div className="rounded-lg border border-border p-2.5 space-y-2">
            <Label className="text-xs font-semibold">Kimler katılabilir?</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { v: "everyone" as const, icon: Users, label: "Herkes" },
                { v: "geo" as const, icon: Globe2, label: "Coğrafya" },
                { v: "referral" as const, icon: Ticket, label: "Davet kodu" },
              ]).map(({ v, icon: Icon, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAudienceScope(v)}
                  className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[11px] font-medium transition-colors ${
                    audienceScope === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {audienceScope === "geo" && (
              <div className="space-y-2 pt-1">
                <div>
                  <Label className="text-[11px] flex items-center gap-1"><Globe2 className="h-3 w-3" /> Kıta (opsiyonel)</Label>
                  <Select value={continent} onValueChange={setContinent}>
                    <SelectTrigger><SelectValue placeholder="Tüm kıtalar" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {continentList.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px]">Ülke</Label>
                    <Select value={country} onValueChange={(v) => { setCountry(v); setCity(""); }}>
                      <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {allCountries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] flex items-center gap-1"><MapPin className="h-3 w-3" /> Şehir</Label>
                    <Select value={city} onValueChange={setCity} disabled={!country}>
                      <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {audienceScope === "referral" && (
              <div className="pt-1">
                <Label className="text-[11px] flex items-center gap-1"><Ticket className="h-3 w-3" /> Davet Kodu *</Label>
                <Input
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Örn: BERLIN-DEV-2026"
                  maxLength={32}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Sadece bu kodu girenler cafe'ye katılabilir.
                </p>
              </div>
            )}

            {/* Premium-only extra filter: meslek (CKS: standart kullanıcıda kilitli + "premium özellik" overlay) */}
            <div className="pt-1 border-t border-border/60 mt-1 relative">
              <Label className="text-[11px] flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> Meslek filtresi (opsiyonel)
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px] gap-0.5">
                  <Crown className="h-2.5 w-2.5" /> Pro
                </Badge>
              </Label>
              <Input
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Örn: Yazılım, Hekim, Avukat…"
                maxLength={60}
                disabled={!isPro}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Pro üyeler ülke, şehir, meslek ve davet kodu kriterlerini birlikte kullanabilir.
              </p>
              {!isPro && (
                <div className="absolute inset-0 -m-1 rounded-md bg-background/70 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-semibold text-white shadow">
                    <Lock className="h-3 w-3" /> premium özellik
                  </div>
                </div>
              )}
            </div>
          </div>


          <div>
            <Label className="text-xs flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn URL (opsiyonel)</Label>
            <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <Label className="text-xs">Ek Link (opsiyonel)</Label>
            <Input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="https://..." />
          </div>
          <div className="rounded-lg border border-border p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex flex-col">
                <span className="font-semibold">Serbest Giriş</span>
                <span className="text-[10px] text-muted-foreground font-normal">Açık ise herkes direkt katılabilir.</span>
              </Label>
              <Switch checked={openEntry} onCheckedChange={setOpenEntry} />
            </div>
            {!openEntry && (
              <div>
                <Label className="text-xs">Giriş Sorusu *</Label>
                <Textarea
                  value={entryQuestion}
                  onChange={(e) => setEntryQuestion(e.target.value)}
                  placeholder="Örn: Hangi şirkette çalışıyorsun? / LinkedIn linkini paylaşır mısın?"
                  rows={2}
                  className="resize-none"
                />
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1">
              <Music className="h-3 w-3" /> Cafeniz için temasını yazın veya bir anket açın (opsiyonel)
            </Label>
            <Textarea
              value={musicPrompt}
              onChange={(e) => setMusicPrompt(e.target.value)}
              placeholder="Cafe temanızı yazın (Örn: 'Startup Sohbetleri') veya bir anket sorusu girin (Örn: 'Bugün konumuz ne olsun?')."
              rows={2}
              className="resize-none"
              maxLength={180}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Juke Box yanında post-it olarak yayınlanır. Üyeler tıklayarak temayı/anketi takip eder.
            </p>
          </div>
          <div className="relative">
            <Label className="text-xs flex items-center gap-1">
              Cafe Süresi
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px] gap-0.5">
                <Crown className="h-2.5 w-2.5" /> Pro
              </Badge>
            </Label>
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))} disabled={!(ambassadorMode || isPro)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxDuration }, (_, i) => i + 1).map((h) => (
                  <SelectItem key={h} value={String(h)}>{h} saat</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              {ambassadorMode ? "Şehir elçileri" : "Pro üyeler"} 1–{ambassadorMode || isPro ? maxDuration : 6} saat arası süre seçebilir.
            </p>
            {!(ambassadorMode || isPro) && (
              <div className="absolute inset-0 -m-1 rounded-md bg-background/70 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-semibold text-white shadow">
                  <Lock className="h-3 w-3" /> premium özellik
                </div>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground space-y-1">
            <div>
              Süre: <strong className="text-foreground">{duration} saat</strong> · Kapasite:{" "}
              <strong className="text-foreground">{capacity} kişi</strong>{" "}
              {isPro ? (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px] gap-0.5">
                  <Crown className="h-2.5 w-2.5" /> Pro
                </Badge>
              ) : (
                <span className="text-[10px]">(Pro: 6 saat / 1000 kişi)</span>
              )}
            </div>
            <div className="flex items-start gap-1.5 text-[10px] pt-1 border-t border-border/60">
              <ShieldCheck className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
              <span>Cafe açma talebin admin onayına gönderilir. Onaylanınca yayına alınır.</span>
            </div>
          </div>
          <Button className="w-full" disabled={submitting} onClick={submit}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Cafe'yi Aç
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCafeForm;
