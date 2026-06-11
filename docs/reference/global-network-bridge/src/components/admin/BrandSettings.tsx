import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Upload, Save, Sparkles } from "lucide-react";

interface SiteSettings {
  brand_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  email_header_html: string | null;
}

const BrandSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>({
    brand_name: "",
    logo_url: "",
    favicon_url: "",
    email_header_html: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("site_settings" as any) as any)
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (data) setSettings(data as SiteSettings);
      setLoading(false);
    })();
  }, []);

  const uploadAsset = async (file: File, kind: "logo" | "favicon") => {
    const ext = file.name.split(".").pop() ?? "png";
    const path = `branding/${kind}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (upErr) {
      toast({ title: "Yükleme hatası", description: upErr.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadAsset(file, "logo");
    if (url) setSettings((s) => ({ ...s, logo_url: url }));
  };

  const onPickFavicon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadAsset(file, "favicon");
    if (url) setSettings((s) => ({ ...s, favicon_url: url }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase.from("site_settings" as any) as any)
      .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) {
      toast({ title: "Kaydedilemedi", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Marka ayarları kaydedildi", description: "Logo, favicon ve mail başlığı güncellendi." });
    // Live update favicon
    if (settings.favicon_url) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (link) link.href = settings.favicon_url;
    }
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" /> Marka & Mail Kimliği
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Buraya yüklediğiniz logo ve favicon site genelinde, otomatik bildirim mailleri ve kullanıcı yazışmalarında kullanılır.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Platform Logosu</Label>
            <div className="border border-dashed border-border rounded-xl p-4 flex items-center justify-center bg-muted/30 min-h-[140px]">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="max-h-24 object-contain" />
              ) : (
                <div className="text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <ImageIcon className="h-8 w-8 opacity-50" />
                  Logo yüklenmedi
                </div>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={onPickLogo}
            />
            <Button variant="outline" className="w-full gap-2" onClick={() => logoInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Logo Yükle (PNG/SVG önerilir)
            </Button>
          </div>

          {/* Favicon */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Favicon</Label>
            <div className="border border-dashed border-border rounded-xl p-4 flex items-center justify-center bg-muted/30 min-h-[140px]">
              {settings.favicon_url ? (
                <img src={settings.favicon_url} alt="Favicon" className="h-16 w-16 object-contain" />
              ) : (
                <div className="text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <ImageIcon className="h-8 w-8 opacity-50" />
                  Favicon yüklenmedi
                </div>
              )}
            </div>
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/png,image/x-icon,image/svg+xml"
              className="hidden"
              onChange={onPickFavicon}
            />
            <Button variant="outline" className="w-full gap-2" onClick={() => faviconInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Favicon Yükle (32x32 / 64x64)
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div>
            <Label className="text-sm font-semibold">Marka Adı</Label>
            <Input
              value={settings.brand_name ?? ""}
              onChange={(e) => setSettings((s) => ({ ...s, brand_name: e.target.value }))}
              placeholder="CorteQS"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold">Mail Başlık Kompozisyonu (opsiyonel)</Label>
            <Input
              value={settings.email_header_html ?? ""}
              onChange={(e) => setSettings((s) => ({ ...s, email_header_html: e.target.value }))}
              placeholder="Örn: Global Diaspora Platformu"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Mail şablonunda logonun altında küçük başlık olarak görünür.</p>
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="mt-6 gap-2 w-full md:w-auto">
          <Save className="h-4 w-4" /> {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </div>
  );
};

export default BrandSettings;
