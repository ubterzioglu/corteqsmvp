import { useState } from "react";
import {
  Megaphone, Star, Instagram, Globe, Linkedin, Check, Sparkles,
  Image as ImageIcon, Video, FileText, Send, Loader2, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const platforms = [
  { key: "site", label: "CorteQS Site", icon: Globe, desc: "Platform içi featured danışman alanı" },
  { key: "instagram", label: "Instagram & Facebook", icon: Instagram, desc: "Reel, Story ve Post formatları" },
  { key: "linkedin", label: "LinkedIn & TikTok", icon: Linkedin, desc: "Profesyonel ve kısa video içerik" },
];

const packages = [
  {
    id: "site-boost",
    name: "Site İçi Tanıtım Paketi",
    price: 49,
    period: "/hafta",
    features: [
      "⭐ Ana sayfada Featured Consultant olarak yer alma",
      "🔍 Arama sonuçlarında öncelikli gösterim",
      "📊 Detaylı görüntülenme ve tıklama raporu",
      "🏷️ Öne Çıkan Danışman rozeti",
    ],
  },
  {
    id: "social-boost",
    name: "Sosyal Medya Paketi",
    price: 99,
    period: "/kampanya",
    features: [
      "📸 Instagram & Facebook post/reel yayını",
      "💼 LinkedIn profesyonel tanıtım postu",
      "🎬 TikTok kısa video adaptasyonu",
      "🤖 AI ile içerik optimizasyonu",
      "📈 Platform bazlı performans raporu",
    ],
  },
];

const ConsultantCampaign = () => {
  const { toast } = useToast();
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(["site"]));
  const [contentText, setContentText] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [adaptedContent, setAdaptedContent] = useState<Record<string, string>>({});

  const togglePackage = (id: string) => {
    setSelectedPackages(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePlatform = (key: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const generateAIContent = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const generated = "🇹🇷 Almanya'da vize ve oturum izni süreçlerinde 12 yıllık deneyimimle yanınızdayım. Mavi Kart, aile birleşimi ve çalışma vizesi başvurularınızda profesyonel rehberlik için hemen randevu alın!\n\n✅ İlk 10 dakika ücretsiz\n📞 Canlı görüşme veya AI Twin ile 7/24 destek\n\n#diaspora #göçmenlik #almanya #vize #corteqs";
      setContentText(generated);

      const adapted: Record<string, string> = {};
      if (selectedPlatforms.has("instagram")) {
        adapted.instagram = "🇹🇷 Almanya'da vize süreçleri karmaşık mı geliyor? 12 yıllık deneyimle yanınızdayım! 💪\n\nMavi Kart | Aile Birleşimi | Çalışma Vizesi\n\n📲 İlk 10dk ÜCRETSİZ!\nLink bio'da 👆\n\n#diaspora #almanya #vize #göçmenlik #türkler";
      }
      if (selectedPlatforms.has("linkedin")) {
        adapted.linkedin = "Almanya'da vize ve göçmenlik süreçlerinde 12 yıllık deneyimimle Türk diasporasına profesyonel danışmanlık sunuyorum.\n\nUzmanlık Alanlarım:\n• Mavi Kart başvuruları\n• Aile birleşimi süreçleri\n• Çalışma vizesi danışmanlığı\n\nCorteQS platformunda ilk 10 dakika ücretsiz görüşme ile tanışalım.\n\n#Immigration #BlueCard #Diaspora #CorteQS";
      }
      setAdaptedContent(adapted);
      setAiGenerating(false);
      toast({ title: "AI İçerik Oluşturuldu ✨", description: "Seçili platformlara göre içerik adapte edildi." });
    }, 2000);
  };

  const handleMediaUpload = () => {
    const mockFiles = ["kampanya-gorsel-1.jpg", "tanitim-video.mp4"];
    setMediaFiles(mockFiles);
    toast({ title: "Medya yüklendi 📸", description: `${mockFiles.length} dosya başarıyla eklendi.` });
  };

  const publishCampaign = () => {
    toast({
      title: "Kampanya Yayınlandı! 🚀",
      description: `${selectedPlatforms.size} platformda içerik yayınlanmak üzere işleme alındı.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Packages */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" /> Corteqs Pazarlama Paketleri
        </h2>
        <p className="text-sm text-muted-foreground mb-6">Uçtan uca marketing araçlarıyla daha fazla müşteriye ulaşın.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => {
            const isSelected = selectedPackages.has(pkg.id);
            return (
              <div
                key={pkg.id}
                onClick={() => togglePackage(pkg.id)}
                className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <h3 className="font-bold text-foreground text-lg mb-1">{pkg.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-primary">€{pkg.price}</span>
                  <span className="text-sm text-muted-foreground">{pkg.period}</span>
                </div>
                <ul className="space-y-2">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{f}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Creator */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-turquoise" /> İçerik Oluşturucu
        </h2>
        <p className="text-sm text-muted-foreground mb-6">İçeriğinizi oluşturun, AI ile optimize edin ve platformlara göre adapte edin.</p>

        {/* Platform selection */}
        <div className="mb-6">
          <Label className="text-sm font-semibold mb-3 block">Yayın Platformları</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {platforms.map((p) => {
              const isActive = selectedPlatforms.has(p.key);
              return (
                <div
                  key={p.key}
                  onClick={() => togglePlatform(p.key)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-primary/15" : "bg-muted"}`}>
                    <p.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.desc}</p>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Text content */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold">İçerik Metni</Label>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={generateAIContent}
              disabled={aiGenerating}
            >
              {aiGenerating ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Oluşturuluyor...</>
              ) : (
                <><Sparkles className="h-3 w-3" /> AI ile Oluştur</>
              )}
            </Button>
          </div>
          <Textarea
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder="Kampanya metninizi buraya yazın veya AI ile otomatik oluşturun..."
            rows={5}
          />
        </div>

        {/* Media upload */}
        <div className="mb-6">
          <Label className="text-sm font-semibold mb-2 block">Görsel / Video</Label>
          {mediaFiles.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {mediaFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                  {f.endsWith(".mp4") ? <Video className="h-4 w-4 text-turquoise" /> : <ImageIcon className="h-4 w-4 text-primary" />}
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleMediaUpload}>+ Ekle</Button>
            </div>
          ) : (
            <div
              onClick={handleMediaUpload}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/30 transition-colors"
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Görsel veya video yükleyin</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, MP4 · Maks 20MB</p>
            </div>
          )}
        </div>

        {/* Adapted content previews */}
        {Object.keys(adaptedContent).length > 0 && (
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-3 block">📱 Platform Adaptasyonları</Label>
            <div className="space-y-3">
              {selectedPlatforms.has("instagram") && adaptedContent.instagram && (
                <div className="border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    <span className="text-sm font-semibold text-foreground">Instagram & Facebook</span>
                    <Badge variant="outline" className="text-[10px]">Adapte Edildi</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{adaptedContent.instagram}</p>
                </div>
              )}
              {selectedPlatforms.has("linkedin") && adaptedContent.linkedin && (
                <div className="border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-foreground">LinkedIn & TikTok</span>
                    <Badge variant="outline" className="text-[10px]">Adapte Edildi</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{adaptedContent.linkedin}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Publish */}
        <Button
          onClick={publishCampaign}
          disabled={!contentText || selectedPlatforms.size === 0}
          className="w-full gap-2"
        >
          <Send className="h-4 w-4" /> Kampanyayı Yayınla
        </Button>
      </div>
    </div>
  );
};

export default ConsultantCampaign;
