import { useState } from "react";
import {
  Calendar, MapPin, Globe, Clock, Image, FileText, Star,
  Search, Mail, Rocket, Users, Link as LinkIcon, DollarSign,
  CheckCircle2, Sparkles, TrendingUp, Instagram, Linkedin, Video, Send, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CreateEventFormProps {
  onClose?: () => void;
  onCreated?: () => void;
  organizerType?: "community" | "corteqs";
}

const emptyForm = {
  title: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  category: "networking",
  type: "yüz yüze",
  location: "",
  city: "",
  country: "",
  onlineUrl: "",
  price: 0,
  maxAttendees: 100,
  tags: "",
  image: "",
};

const audienceSegments = [
  { name: "Berlin Türk Tech Topluluğu", members: 1240, match: 96 },
  { name: "Almanya Startup Ağı", members: 890, match: 88 },
  { name: "Avrupa Diaspora Profesyonelleri", members: 2100, match: 82 },
];

const CreateEventForm = ({ onClose, onCreated, organizerType = "community" }: CreateEventFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [featuredHome, setFeaturedHome] = useState(false);
  const [featuredCountry, setFeaturedCountry] = useState(false);
  const [emailNotify, setEmailNotify] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [socialCaption, setSocialCaption] = useState("");

  const totalCost =
    (featuredHome ? 29 : 0) + (featuredCountry ? 19 : 0) + (emailNotify ? 15 : 0);

  // Mock connection state — to be wired to user's connected social accounts
  const connectedAccounts: Record<string, boolean> = {
    instagram_post: false,
    instagram_story: false,
    facebook: false,
    linkedin: false,
    x: false,
    tiktok: false,
  };

  const socialPreviews = [
    { key: "instagram_post", label: "Instagram Post", icon: Instagram, ratio: "aspect-square", w: "w-40", color: "text-pink-500" },
    { key: "instagram_story", label: "Instagram Story", icon: Instagram, ratio: "aspect-[9/16]", w: "w-28", color: "text-pink-500" },
    { key: "facebook", label: "Facebook", icon: Globe, ratio: "aspect-[1.91/1]", w: "w-56", color: "text-blue-600" },
    { key: "linkedin", label: "LinkedIn", icon: Linkedin, ratio: "aspect-[1.91/1]", w: "w-56", color: "text-blue-700" },
    { key: "x", label: "X / Twitter", icon: Globe, ratio: "aspect-[16/9]", w: "w-52", color: "text-foreground" },
    { key: "tiktok", label: "TikTok", icon: Video, ratio: "aspect-[9/16]", w: "w-28", color: "text-foreground" },
  ];

  const handleSocialPost = (platformKey: string, label: string) => {
    if (!connectedAccounts[platformKey]) {
      toast({
        title: "Hesap bağlı değil",
        description: `${label} hesabınızı bağlamak için profil > sosyal hesaplar bölümünü kullanın.`,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: `${label}'ye gönderildi 🚀`,
      description: "Etkinlik görseliniz ve metniniz başarıyla paylaşıldı.",
    });
  };

  const handlePublish = async () => {
    if (!user) {
      toast({ title: "Giriş gerekli", description: "Etkinlik oluşturmak için giriş yapın.", variant: "destructive" });
      return;
    }
    if (!form.title.trim() || !form.description.trim() || !form.date || !form.category) {
      toast({ title: "Eksik bilgi", description: "Başlık, açıklama, tarih ve kategori zorunludur.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      type: form.type,
      event_date: form.date,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      country: form.country || null,
      city: form.city || null,
      location: form.location || null,
      online_url: form.onlineUrl || null,
      price: form.price || 0,
      max_attendees: form.maxAttendees || null,
      cover_image: form.image || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      organizer_name: organizerType === "corteqs" ? "CorteQS" : (user.user_metadata?.full_name || user.email || null),
      organizer_type: organizerType,
      featured: featuredHome || organizerType === "corteqs",
      status: "published",
    } as never);
    setSubmitting(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Etkinlik yayınlandı! 🎉",
      description: totalCost > 0
        ? `"${form.title}" yayınlandı. Ödeme entegrasyonu yakında — tanıtım seçenekleri pasif başlatıldı.`
        : `"${form.title}" başarıyla yayınlandı.`,
    });
    onCreated?.();
    onClose?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {organizerType === "corteqs" ? "Yeni CorteQS Etkinliği Oluştur" : "Yeni Etkinlik Oluştur"}
          {organizerType === "corteqs" && (
            <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
              <Shield className="h-3 w-3" /> Resmi
            </Badge>
          )}
        </h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            İptal
          </Button>
        )}
      </div>

      {/* Image Preview */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Image className="h-4 w-4 text-primary" /> Kapak Görseli
        </Label>
        <div className="relative rounded-xl overflow-hidden h-48 bg-muted border border-border">
          <img
            src={form.image}
            alt="Etkinlik görseli"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-primary/90 text-primary-foreground border-0">
              Önizleme
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm"
          >
            Görsel Değiştir
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label className="flex items-center gap-1.5 mb-1.5">
            <FileText className="h-4 w-4 text-primary" /> Etkinlik Başlığı
          </Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label className="flex items-center gap-1.5 mb-1.5">
            <FileText className="h-4 w-4 text-primary" /> Açıklama
          </Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label className="flex items-center gap-1.5 mb-1.5">
            <Calendar className="h-4 w-4 text-primary" /> Tarih
          </Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div>
          <Label className="flex items-center gap-1.5 mb-1.5">
            <Clock className="h-4 w-4 text-primary" /> Başlangıç
          </Label>
          <Input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          />
        </div>
        <div>
          <Label className="flex items-center gap-1.5 mb-1.5">
            <Clock className="h-4 w-4 text-primary" /> Bitiş
          </Label>
          <Input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          />
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-1.5 mb-1.5">
            <MapPin className="h-4 w-4 text-primary" /> Fiziksel Konum
          </Label>
          <Input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <div>
          <Label className="flex items-center gap-1.5 mb-1.5">
            <Globe className="h-4 w-4 text-primary" /> Şehir / Ülke
          </Label>
          <div className="flex gap-2">
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Şehir"
              className="flex-1"
            />
            <Input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="Ülke"
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label className="flex items-center gap-1.5 mb-1.5">
            <LinkIcon className="h-4 w-4 text-primary" /> Online Bağlantı URL
          </Label>
          <Input
            value={form.onlineUrl}
            onChange={(e) => setForm({ ...form, onlineUrl: e.target.value })}
            placeholder="https://zoom.us/..."
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <DollarSign className="h-4 w-4 text-primary" /> Ücret (€)
            </Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <Users className="h-4 w-4 text-primary" /> Maks. Kişi
            </Label>
            <Input
              type="number"
              value={form.maxAttendees}
              onChange={(e) =>
                setForm({ ...form, maxAttendees: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      {/* Category & Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">Kategori</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "networking", label: "Networking" },
              { key: "eğitim", label: "Eğitim" },
              { key: "kültür", label: "Kültür" },
              { key: "iş", label: "İş & Kariyer" },
              { key: "sosyal", label: "Sosyal" },
              { key: "spor", label: "Spor" },
            ].map((c) => (
              <Badge
                key={c.key}
                variant={form.category === c.key ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => setForm({ ...form, category: c.key })}
              >
                {c.label}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block">Etkinlik Türü</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "yüz yüze", label: "📍 Yüz yüze" },
              { key: "online", label: "🌐 Online" },
              { key: "hybrid", label: "🔄 Hybrid" },
            ].map((t) => (
              <Badge
                key={t.key}
                variant={form.type === t.key ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => setForm({ ...form, type: t.key })}
              >
                {t.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label className="flex items-center gap-1.5 mb-1.5">Etiketler</Label>
        <Input
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="virgülle ayırın: tech, networking..."
        />
      </div>

      {/* ── SOCIAL MEDIA PREVIEW & PUBLISH ── */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" /> Sosyal Medya Provası
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Etkinlik görseliniz ve metniniz farklı sosyal medya formatlarında nasıl görüneceğini yan yana inceleyin.
          Tıklayarak — eğer hesabınız bağlıysa — doğrudan paylaşabilirsiniz.
        </p>

        <div className="mb-4">
          <Label className="text-sm font-semibold mb-1.5 block">Sosyal Medya Metni</Label>
          <Textarea
            value={socialCaption}
            onChange={(e) => setSocialCaption(e.target.value)}
            placeholder={`📣 ${form.title || "Etkinlik adı"}\n\n${form.description || "Kısa etkinlik açıklaması"}\n\n#diaspora #corteqs`}
            rows={3}
          />
        </div>

        <div className="overflow-x-auto -mx-2 px-2 pb-2">
          <div className="flex items-end gap-3 min-w-max">
            {socialPreviews.map((p) => {
              const Icon = p.icon;
              const isConnected = connectedAccounts[p.key];
              return (
                <div key={p.key} className="flex flex-col items-center gap-1.5">
                  <div
                    onClick={() => handleSocialPost(p.key, p.label)}
                    className={`relative ${p.w} ${p.ratio} rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-card-hover ${
                      isConnected ? "border-primary" : "border-border"
                    }`}
                    title={isConnected ? `${p.label}'ye gönder` : `${p.label} hesabı bağlı değil`}
                  >
                    {form.image ? (
                      <img src={form.image} alt={p.label} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-turquoise/15 to-gold/20 flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute top-1.5 left-1.5">
                      <Icon className={`h-3.5 w-3.5 ${p.color} drop-shadow`} />
                    </div>
                    {!isConnected && (
                      <div className="absolute top-1.5 right-1.5 bg-background/90 rounded px-1 py-0.5 text-[8px] font-semibold text-muted-foreground">
                        Bağlı değil
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 text-white">
                      <p className="text-[10px] font-bold leading-tight line-clamp-2 drop-shadow">
                        {form.title || "Etkinlik Başlığı"}
                      </p>
                      <p className="text-[8px] leading-tight line-clamp-2 opacity-90 mt-0.5 drop-shadow">
                        {(socialCaption || form.description || "Kısa açıklama burada görünecek.").slice(0, 70)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          💡 Not: Sosyal medya hesap bağlama özelliği yakında. Şimdilik bağlı görünen hesaplara gönderim mock olarak çalışır.
        </p>
      </div>

      {/* ── PROMOTION OPTIONS ── */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" /> Tanıtım Seçenekleri
        </h3>

        <div className="space-y-4">
          {/* Featured on Homepage */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors bg-muted/30">
            <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center shrink-0 mt-0.5">
              <Star className="h-5 w-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">
                  Ana Sayfa "Öne Çıkan Etkinlikler"
                </h4>
                <Switch checked={featuredHome} onCheckedChange={setFeaturedHome} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Etkinliğiniz ana sayfadaki Featured Etkinlikler karuselinde 7 gün
                boyunca görünür.
              </p>
              <Badge className="bg-gold/15 text-gold border-gold/30 mt-2">
                €29 / hafta
              </Badge>
            </div>
          </div>

          {/* Featured in Country Search */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors bg-muted/30">
            <div className="w-10 h-10 rounded-lg bg-turquoise/15 flex items-center justify-center shrink-0 mt-0.5">
              <Search className="h-5 w-5 text-turquoise" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">
                  Ülke Aramasında Öne Çıkarma
                </h4>
                <Switch
                  checked={featuredCountry}
                  onCheckedChange={setFeaturedCountry}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                "{form.country}" ülke filtresinde etkinlikler listesinin en üstünde
                "⭐ Öne Çıkan" etiketiyle görünür.
              </p>
              <Badge className="bg-turquoise/15 text-turquoise border-turquoise/30 mt-2">
                €19 / hafta
              </Badge>
            </div>
          </div>

          {/* AI-Matched Email Notification */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors bg-muted/30">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">
                  AI Eşleşmeli E-posta Duyurusu
                </h4>
                <Switch checked={emailNotify} onCheckedChange={setEmailNotify} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Platform veritabanındaki etkinlikle eşleşen kullanıcılara otomatik
                e-posta duyurusu gönderilir.
              </p>
              <Badge className="bg-primary/15 text-primary border-primary/30 mt-2">
                €15 / duyuru
              </Badge>

              {/* AI matched segments preview */}
              {emailNotify && (
                <div className="mt-3 space-y-2 p-3 rounded-lg bg-background border border-border">
                  <p className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> AI Eşleşen Hedef
                    Kitleler
                  </p>
                  {audienceSegments.map((seg) => (
                    <div
                      key={seg.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">{seg.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {seg.members} kişi
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          %{seg.match} eşleşme
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                    Tahmini erişim:{" "}
                    <span className="font-semibold text-foreground">
                      ~{audienceSegments.reduce((a, s) => a + s.members, 0)} kişi
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary & Submit */}
      <div className="border-t border-border pt-6">
        <div className="bg-muted/50 rounded-xl p-4 mb-4 space-y-2">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Sipariş Özeti
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Etkinlik Yayını</span>
              <span className="text-foreground font-medium">Ücretsiz</span>
            </div>
            {featuredHome && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Ana Sayfa Öne Çıkarma
                </span>
                <span className="text-foreground font-medium">€29</span>
              </div>
            )}
            {featuredCountry && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Ülke Araması Öne Çıkarma
                </span>
                <span className="text-foreground font-medium">€19</span>
              </div>
            )}
            {emailNotify && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  AI E-posta Duyurusu
                </span>
                <span className="text-foreground font-medium">€15</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border/50 font-bold">
              <span className="text-foreground">Toplam</span>
              <span className="text-primary">
                {totalCost === 0 ? "Ücretsiz" : `€${totalCost}`}
              </span>
            </div>
          </div>
        </div>

        {totalCost > 0 && (
          <p className="text-xs text-muted-foreground text-center mb-3">
            💳 Ödeme entegrasyonu yakında — şimdilik etkinlik ücretsiz yayınlanacak, tanıtım seçenekleri ileride aktive edilebilir.
          </p>
        )}
        <div className="flex gap-3">
          <Button className="flex-1 gap-2" size="lg" onClick={handlePublish} disabled={submitting}>
            <CheckCircle2 className="h-5 w-5" />
            {submitting ? "Yayınlanıyor..." : "Etkinliği Yayınla"}
          </Button>
          {onClose && (
            <Button variant="outline" size="lg" onClick={onClose}>
              Vazgeç
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEventForm;
