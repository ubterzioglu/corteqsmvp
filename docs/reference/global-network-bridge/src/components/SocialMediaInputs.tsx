import { useEffect, useState } from "react";
import { Globe, Instagram, Facebook, Linkedin, Youtube, Twitter, Music2, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SocialMediaValues {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  x?: string;
  website?: string;
}

export type SocialMediaVisibility = Partial<Record<keyof SocialMediaValues, boolean>>;

const FIELDS: Array<{
  key: keyof SocialMediaValues;
  label: string;
  placeholder: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { key: "instagram", label: "Instagram", placeholder: "@kullaniciadi veya tam URL", Icon: Instagram, color: "text-pink-500" },
  { key: "facebook", label: "Facebook", placeholder: "Sayfa URL'si", Icon: Facebook, color: "text-blue-600" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/...", Icon: Linkedin, color: "text-sky-700" },
  { key: "youtube", label: "YouTube", placeholder: "@kanal veya URL", Icon: Youtube, color: "text-red-600" },
  { key: "tiktok", label: "TikTok", placeholder: "@kullaniciadi", Icon: Music2, color: "text-foreground" },
  { key: "x", label: "X (Twitter)", placeholder: "@kullaniciadi", Icon: Twitter, color: "text-foreground" },
  { key: "website", label: "Web Sitesi", placeholder: "https://...", Icon: Globe, color: "text-primary" },
];

interface Props {
  defaultValues?: SocialMediaValues;
  title?: string;
  storageKey?: string;
}

const SocialMediaInputs = ({ defaultValues = {}, title = "Sosyal Medya Hesapları", storageKey = "social_visibility_default" }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [values, setValues] = useState<SocialMediaValues>(defaultValues);
  const [visibility, setVisibility] = useState<SocialMediaVisibility>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: true }), {} as SocialMediaVisibility);
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved values from DB
  useEffect(() => {
    if (!user || loaded) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("social_links")
        .eq("id", user.id)
        .maybeSingle();
      const sl: any = (data as any)?.social_links || {};
      if (sl?.values) setValues({ ...defaultValues, ...sl.values });
      if (sl?.visibility) setVisibility((v) => ({ ...v, ...sl.visibility }));
      setLoaded(true);
    })();
  }, [user, loaded]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(visibility)); } catch {}
  }, [visibility, storageKey]);

  const isVisible = (k: keyof SocialMediaValues) => visibility[k] ?? true;

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Giriş yapın", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ social_links: { values, visibility } as any })
        .eq("id", user.id);
      if (error) throw error;
      toast({ title: "Sosyal medya hesapları kaydedildi" });
    } catch (e: any) {
      toast({ title: "Kaydedilemedi", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" /> {title}
      </h2>
      <p className="text-xs text-muted-foreground font-body mb-5">
        Hesaplarını ekle ve her biri için profilde gösterimi ayrı ayrı aç/kapat. Boş bırakılan alanlar zaten görünmez.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, placeholder, Icon, color }) => (
          <div key={key} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between mb-2 gap-2">
              <Label className="flex items-center gap-1.5 mb-0">
                <Icon className={`h-4 w-4 ${color}`} /> {label}
              </Label>
              <div className="flex items-center gap-1.5">
                {isVisible(key) ? (
                  <Eye className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <Switch
                  checked={isVisible(key)}
                  onCheckedChange={(v) => setVisibility((prev) => ({ ...prev, [key]: v }))}
                />
              </div>
            </div>
            <Input
              value={values[key] ?? ""}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-5 pt-4 border-t border-border">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Sosyal Medyayı Kaydet
        </Button>
      </div>
    </div>
  );
};

export default SocialMediaInputs;
