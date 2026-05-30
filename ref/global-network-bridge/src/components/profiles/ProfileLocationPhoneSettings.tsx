import { useEffect, useState } from "react";
import { MapPin, Save, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { countryCities } from "@/data/countryCities";
import PhoneVerification from "@/components/PhoneVerification";
import { isTRResident, getDigitalCommunityFlag, setDigitalCommunityFlag } from "@/lib/caddeRules";

/**
 * Reusable settings block: required Country + City selectors (synced to profiles table)
 * and the PhoneVerification widget. Drop into the "Profil Ayarları" tab of every
 * profile type so onboarding completion fields are always editable.
 */
const ProfileLocationPhoneSettings = () => {
  const { profile, refreshProfile, isGlobalDiaspora } = useAuth();
  const { toast } = useToast();
  const [country, setCountry] = useState(profile?.country ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [yearsInCity, setYearsInCity] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.country && !country) setCountry(profile.country);
    if (profile?.city && !city) setCity(profile.city);
  }, [profile?.country, profile?.city]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("years_in_current_city")
        .eq("id", user.id)
        .maybeSingle();
      const yc = (data as any)?.years_in_current_city;
      if (typeof yc === "number") setYearsInCity(String(yc));
    })();
  }, []);

  const countries = Object.keys(countryCities).sort();
  const cities = country && countryCities[country] ? countryCities[country] : [];

  const save = async () => {
    if (!country || !city) {
      toast({ title: "Ülke ve şehir zorunludur", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı");
      const yc = yearsInCity ? parseInt(yearsInCity, 10) : null;
      const updates: any = { country, city, years_in_current_city: Number.isFinite(yc as number) ? yc : null };
      if (profile?.phone_verified) updates.onboarding_completed = true;
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;
      toast({ title: "Konum kaydedildi" });
      await refreshProfile();
    } catch (e: any) {
      toast({ title: "Kaydedilemedi", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Label className="flex items-center gap-1.5 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" /> Konum (zorunlu)
          </Label>
          {isGlobalDiaspora && (
            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">CorteQS Pasaport</Badge>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Ülke *</Label>
            <Select value={country} onValueChange={(v) => { setCountry(v); setCity(""); }}>
              <SelectTrigger><SelectValue placeholder="Ülke seçin" /></SelectTrigger>
              <SelectContent>
                {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Şehir *</Label>
            <Select value={city} onValueChange={setCity} disabled={!country}>
              <SelectTrigger><SelectValue placeholder={country ? "Şehir seçin" : "Önce ülke"} /></SelectTrigger>
              <SelectContent>
                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Kaç yıldır bu şehirde?</Label>
            <Input
              type="number"
              min={0}
              max={120}
              value={yearsInCity}
              onChange={(e) => setYearsInCity(e.target.value)}
              placeholder="Örn: 5"
              disabled={!city}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Diğer yaşadığın şehirler & yıllar için Profil Bilgileri sekmesindeki "Yaşadığın Ülkeler & Yıllar" alanını kullanabilirsin.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Konumu Kaydet
        </Button>
      </div>

      <PhoneVerification />

      <KopruDigitalCommunityToggle />
    </div>
  );
};

const KopruDigitalCommunityToggle = () => {
  const { profile } = useAuth();
  const [enabled, setEnabled] = useState<boolean>(() => getDigitalCommunityFlag());
  const acc = (profile?.account_type || "").toLowerCase();
  const isOrgLike = ["business", "consultant", "association", "ambassador"].includes(acc);
  if (!isTRResident(profile) || !isOrgLike) return null;
  return (
    <div className="rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/5 via-amber-400/5 to-emerald-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Label className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-rose-500" /> Dijital Topluluk · Köprü erişimi
          </Label>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Türkiye'den kayıtlı işletme / danışman / kuruluş olarak hesabını <strong>Dijital Topluluk</strong> olarak işaretlersen,
            paylaşımlarını TR–Diaspora ortak akışı olan <strong>🌉 Köprü</strong>'de de yapabilirsin.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => { setEnabled(v); setDigitalCommunityFlag(v); }}
        />
      </div>
    </div>
  );
};


export default ProfileLocationPhoneSettings;
