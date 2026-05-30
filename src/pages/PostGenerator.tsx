import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { toPng } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Download, Trash2, Image as ImageIcon, Sparkles,
  Facebook, Instagram, Linkedin, Twitter, Send,
} from "lucide-react";
import PostTemplate, { ALL_TEMPLATES, TemplateType, getTemplate } from "@/components/PostTemplates";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700",
    share: (url: string, text: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}` },
  { id: "twitter", label: "X / Twitter", icon: Twitter, color: "text-slate-900",
    share: (url: string, text: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600",
    share: (url: string, text: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}` },
  { id: "whatsapp", label: "WhatsApp", icon: Send, color: "text-green-600",
    share: (url: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(text + " " + url)}` },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-600",
    share: (url: string) => url }, // IG doesn't accept web share — open image to download
];

type Archived = {
  id: string;
  template_type: string;
  recipient_name: string;
  image_url: string;
  thumbnail_url: string | null;
  platforms: string[];
  share_text: string | null;
  created_at: string;
};

const PostGenerator = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [template, setTemplate] = useState<TemplateType>("consultant");
  const [recipient, setRecipient] = useState("");
  const [expertise, setExpertise] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [shareText, setShareText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(["linkedin", "twitter", "facebook"]),
  );
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Archived | null>(null);
  const [archive, setArchive] = useState<Archived[]>([]);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user]);

  const loadArchive = async () => {
    const { data, error } = await supabase
      .from("generated_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setArchive(data as any);
  };

  useEffect(() => { if (isAdmin) loadArchive(); }, [isAdmin]);

  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    const path = `logos/${user.id}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("post-archive").upload(path, file, { upsert: false });
    if (error) { toast({ title: "Logo yüklenemedi", description: error.message, variant: "destructive" }); return; }
    const { data } = supabase.storage.from("post-archive").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    toast({ title: "Logo yüklendi" });
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const generate = async () => {
    if (!recipient.trim()) {
      toast({ title: "İsim gerekli", description: "Firma / Danışman adını girin.", variant: "destructive" });
      return;
    }
    if (!previewRef.current || !user) return;
    setGenerating(true);
    try {
      // Wait a frame so any image swap renders
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      // Full-size image
      const fullDataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: 1080,
        height: 1350,
      });
      const fullBlob = await (await fetch(fullDataUrl)).blob();

      // Thumbnail
      const thumbDataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 0.3,
        width: 1080,
        height: 1350,
      });
      const thumbBlob = await (await fetch(thumbDataUrl)).blob();

      const ts = Date.now();
      const base = `posts/${template}-${ts}`;
      const fullPath = `${base}.png`;
      const thumbPath = `${base}-thumb.png`;

      const [{ error: e1 }, { error: e2 }] = await Promise.all([
        supabase.storage.from("post-archive").upload(fullPath, fullBlob, { contentType: "image/png" }),
        supabase.storage.from("post-archive").upload(thumbPath, thumbBlob, { contentType: "image/png" }),
      ]);
      if (e1 || e2) throw e1 || e2;

      const fullUrl = supabase.storage.from("post-archive").getPublicUrl(fullPath).data.publicUrl;
      const thumbUrl = supabase.storage.from("post-archive").getPublicUrl(thumbPath).data.publicUrl;

      const cfg = getTemplate(template);
      const finalShareText = shareText.trim() ||
        `${recipient} ${cfg.title.toLowerCase()} ${cfg.subtitle.toLowerCase()} 🎉\n${tagline || cfg.intro}\n\n#CorteQS #Diaspora`;

      const { data: inserted, error: insErr } = await supabase
        .from("generated_posts")
        .insert({
          created_by: user.id,
          template_type: template,
          recipient_name: recipient,
          tagline,
          expertise,
          logo_url: logoUrl,
          image_url: fullUrl,
          thumbnail_url: thumbUrl,
          platforms: Array.from(selectedPlatforms),
          share_text: finalShareText,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      setLastGenerated(inserted as any);
      await loadArchive();
      toast({ title: "Post oluşturuldu! 🎉", description: "Aşağıdan paylaşım linklerini açabilirsiniz." });
    } catch (err: any) {
      toast({ title: "Hata", description: err.message ?? "Bilinmeyen hata", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const remove = async (item: Archived) => {
    if (!confirm("Bu post arşivden silinsin mi?")) return;
    await supabase.from("generated_posts").delete().eq("id", item.id);
    // best-effort storage cleanup
    const fullPath = item.image_url.split("/post-archive/")[1];
    const thumbPath = item.thumbnail_url?.split("/post-archive/")[1];
    if (fullPath) await supabase.storage.from("post-archive").remove([fullPath]);
    if (thumbPath) await supabase.storage.from("post-archive").remove([thumbPath]);
    await loadArchive();
    if (lastGenerated?.id === item.id) setLastGenerated(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (isAdmin === false) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Yetkisiz Erişim</h1>
          <p className="text-muted-foreground">Bu sayfa sadece adminler içindir.</p>
        </Card>
      </div>
    </div>
  );
  if (isAdmin === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="text-primary" /> Onboarding Post Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Yeni katılan firma/danışman/dernek için sosyal medya görseli üretin ve hızlıca paylaşın.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT — controls */}
          <div className="space-y-6">
            <Card className="p-6">
              <Label className="text-sm font-semibold mb-3 block">1. Şablon Seçin</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`p-3 rounded-lg border-2 text-left text-sm font-medium transition-all ${
                      template === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <Label className="text-sm font-semibold block">2. İçerik Bilgileri</Label>
              <div>
                <Label className="text-xs">İsim / Firma Adı *</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Örn: ABC Danışmanlık" maxLength={80} />
              </div>
              <div>
                <Label className="text-xs">Uzmanlık Alanı / Etiketler</Label>
                <Input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="Strateji | Hukuk | Vergi" maxLength={120} />
              </div>
              <div>
                <Label className="text-xs">Özel Tagline (opsiyonel)</Label>
                <Textarea rows={2} value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={200} placeholder="Boş bırakılırsa varsayılan kullanılır" />
              </div>
              <div>
                <Label className="text-xs">Logo / Profil Görseli</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
                />
                {logoUrl && <p className="text-xs text-green-600 mt-1">✓ Logo yüklendi</p>}
              </div>
            </Card>

            <Card className="p-6 space-y-3">
              <Label className="text-sm font-semibold block">3. Paylaşım Kanalları</Label>
              {PLATFORMS.map((p) => {
                const I = p.icon;
                return (
                  <label key={p.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-muted/30 rounded-lg">
                    <Checkbox checked={selectedPlatforms.has(p.id)} onCheckedChange={() => togglePlatform(p.id)} />
                    <I className={`w-5 h-5 ${p.color}`} />
                    <span className="text-sm font-medium">{p.label}</span>
                  </label>
                );
              })}
              <div className="pt-2">
                <Label className="text-xs">Paylaşım Metni (opsiyonel — otomatik üretilir)</Label>
                <Textarea rows={3} value={shareText} onChange={(e) => setShareText(e.target.value)} maxLength={500} />
              </div>
            </Card>

            <Button onClick={generate} disabled={generating || !recipient} className="w-full" size="lg">
              {generating ? <><Loader2 className="animate-spin mr-2" /> Oluşturuluyor...</> : <><Sparkles className="mr-2" /> Postu Oluştur ve Arşivle</>}
            </Button>

            {lastGenerated && (
              <Card className="p-6 border-2 border-green-500 bg-green-50/50">
                <h3 className="font-bold mb-3 flex items-center gap-2">✅ Post Hazır — Kanallarda Paylaşın</h3>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.filter((p) => lastGenerated.platforms.includes(p.id)).map((p) => {
                    const I = p.icon;
                    const url = p.share(lastGenerated.image_url, lastGenerated.share_text || "");
                    return (
                      <a key={p.id} href={url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          <I className={`w-4 h-4 ${p.color}`} /> {p.label}
                        </Button>
                      </a>
                    );
                  })}
                  <a href={lastGenerated.image_url} download target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> PNG İndir</Button>
                  </a>
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT — preview */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Canlı Önizleme (1080×1350)</Label>
            <div className="border rounded-lg overflow-hidden bg-muted/20" style={{ aspectRatio: "1080/1350" }}>
              <div style={{ transform: "scale(0.45)", transformOrigin: "top left", width: 1080, height: 1350 }}>
                <div ref={previewRef}>
                  <PostTemplate
                    template={template}
                    recipientName={recipient || "Firma / Danışman Adı"}
                    expertise={expertise}
                    tagline={tagline}
                    logoUrl={logoUrl}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Archive */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">📦 Arşiv ({archive.length})</h2>
          {archive.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz post oluşturulmadı.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {archive.map((a) => (
                <Card key={a.id} className="overflow-hidden">
                  <a href={a.image_url} target="_blank" rel="noopener noreferrer">
                    <img src={a.thumbnail_url || a.image_url} alt={a.recipient_name} className="w-full aspect-[4/5] object-cover bg-muted" />
                  </a>
                  <div className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">{getTemplate(a.template_type as TemplateType)?.label || a.template_type}</Badge>
                      <button onClick={() => remove(a)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-medium truncate">{a.recipient_name}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString("tr-TR")}</p>
                    <div className="flex gap-1 flex-wrap pt-1">
                      {a.platforms.slice(0, 4).map((pid) => {
                        const p = PLATFORMS.find((x) => x.id === pid);
                        if (!p) return null;
                        const I = p.icon;
                        return <I key={pid} className={`w-3 h-3 ${p.color}`} />;
                      })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostGenerator;
