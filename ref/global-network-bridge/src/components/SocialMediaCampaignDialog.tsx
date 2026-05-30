import { useState } from "react";
import {
  Megaphone, Instagram, Globe, Linkedin, Check, Sparkles,
  Image as ImageIcon, Video, Send, Loader2, ArrowRight, ArrowLeft,
  Calendar, CreditCard, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

const socialPlatforms = [
  { key: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500", minBudget: 25 },
  { key: "facebook", label: "Facebook", icon: Globe, color: "text-blue-600", minBudget: 25 },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700", minBudget: 25 },
  { key: "tiktok", label: "TikTok", icon: Video, color: "text-foreground", minBudget: 25 },
  { key: "corteqs", label: "CorteQS Site", icon: Globe, color: "text-primary", minBudget: 25 },
];

const campaignPackages = [
  { id: "silver", name: "Silver Paket", duration: "1 Hafta", color: "from-gray-300 to-gray-400", badge: "bg-gray-200 text-gray-700" },
  { id: "gold", name: "Gold Paket", duration: "4 Hafta", color: "from-gold to-yellow-500", badge: "bg-gold/20 text-gold" },
];

type Step = "details" | "summary" | "date" | "payment";

interface Props {
  entityName: string;
  entityType: "consultant" | "business" | "association" | "blogger" | "individual";
  trigger?: React.ReactNode;
}

const SocialMediaCampaignDialog = ({ entityName, entityType, trigger }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [selectedPkg, setSelectedPkg] = useState<string>("silver");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [contentText, setContentText] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [publishDate, setPublishDate] = useState("");

  const togglePlatform = (key: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        const newBudgets = { ...budgets };
        delete newBudgets[key];
        setBudgets(newBudgets);
      } else {
        next.add(key);
        setBudgets(prev => ({ ...prev, [key]: 25 }));
      }
      return next;
    });
  };

  const updateBudget = (key: string, value: number) => {
    setBudgets(prev => ({ ...prev, [key]: Math.max(25, value) }));
  };

  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
  const pkgMultiplier = selectedPkg === "gold" ? 4 : 1;
  const totalCost = totalBudget * pkgMultiplier;

  const generateAIContent = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const typeLabel = entityType === "consultant" ? "danışman" : entityType === "business" ? "işletme" : entityType === "association" ? "kuruluş" : entityType === "individual" ? "profesyonel" : "vlogger";
      setContentText(`🌟 ${entityName} ile tanışın!\n\nDiaspora topluluğuna hizmet veren güvenilir bir ${typeLabel}. Profesyonel hizmetler ve deneyim için hemen iletişime geçin!\n\n✅ Güvenilir & Deneyimli\n📲 Hemen ulaşın\n\n#diaspora #corteqs #${entityType}`);
      setAiGenerating(false);
      toast({ title: "AI İçerik Oluşturuldu ✨" });
    }, 1500);
  };

  const handleMediaUpload = () => {
    setMediaFiles(["kampanya-gorsel.jpg", "tanitim-video.mp4"]);
    toast({ title: "Medya yüklendi 📸" });
  };

  const handlePayment = () => {
    toast({
      title: "Kampanya Oluşturuldu! 🚀",
      description: `${selectedPlatforms.size} platformda ${campaignPackages.find(p => p.id === selectedPkg)?.name} yayınlanacak.`,
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setStep("details");
    setSelectedPkg("silver");
    setSelectedPlatforms(new Set());
    setBudgets({});
    setContentText("");
    setMediaFiles([]);
    setPublishDate("");
  };

  const canProceedFromDetails = selectedPlatforms.size > 0 && contentText.length > 0;

  const steps: { key: Step; label: string }[] = [
    { key: "details", label: "Kampanya Detayları" },
    { key: "summary", label: "Kampanya Özeti" },
    { key: "date", label: "Yayın Tarihi" },
    { key: "payment", label: "Ödeme" },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 w-full border-primary/30 text-primary hover:bg-primary/5">
            <Megaphone className="h-4 w-4" /> Sosyal Medya Tanıtımı
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Sosyal Medya Kampanyası
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              <div className={`h-1.5 flex-1 rounded-full ${i <= currentStepIndex ? "bg-primary" : "bg-muted"}`} />
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold text-foreground mb-4">{steps[currentStepIndex].label}</p>

        {/* STEP 1: Details */}
        {step === "details" && (
          <div className="space-y-5">
            {/* Package selection */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Paket Seçimi</Label>
              <div className="grid grid-cols-2 gap-3">
                {campaignPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg.id)}
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedPkg === pkg.id ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/30"
                    }`}
                  >
                    {selectedPkg === pkg.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <Badge className={pkg.badge}>{pkg.id === "silver" ? "🥈" : "🥇"} {pkg.name}</Badge>
                    <p className="text-sm text-muted-foreground mt-2">{pkg.duration} yayın süresi</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform selection with budget */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Yayın Platformları & Bütçe</Label>
              <div className="space-y-2">
                {socialPlatforms.map((p) => {
                  const isActive = selectedPlatforms.has(p.key);
                  return (
                    <div key={p.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}>
                      <div
                        onClick={() => togglePlatform(p.key)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                          isActive ? "bg-primary border-primary" : "border-muted-foreground/30"
                        }`}
                      >
                        {isActive && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <p.icon className={`h-4 w-4 ${p.color}`} />
                      <span className="text-sm font-medium text-foreground flex-1">{p.label}</span>
                      {isActive && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">$</span>
                          <Input
                            type="number"
                            min={25}
                            value={budgets[p.key] || 25}
                            onChange={(e) => updateBudget(p.key, parseInt(e.target.value) || 25)}
                            className="w-20 h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-[10px] text-muted-foreground">/hafta</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Post İçeriği</Label>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={generateAIContent} disabled={aiGenerating}>
                  {aiGenerating ? <><Loader2 className="h-3 w-3 animate-spin" /> Oluşturuluyor...</> : <><Sparkles className="h-3 w-3" /> AI ile Oluştur</>}
                </Button>
              </div>
              <Textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                placeholder="Post içeriğinizi yazın veya AI ile oluşturun..."
                rows={4}
              />
            </div>

            {/* Media */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Görsel / Video</Label>
              {mediaFiles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {mediaFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
                      {f.endsWith(".mp4") ? <Video className="h-3.5 w-3.5 text-primary" /> : <ImageIcon className="h-3.5 w-3.5 text-primary" />}
                      {f}
                    </div>
                  ))}
                </div>
              ) : (
                <div onClick={handleMediaUpload} className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/30 transition-colors">
                  <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Görsel veya video yükleyin</p>
                </div>
              )}
            </div>

            <Button onClick={() => setStep("summary")} disabled={!canProceedFromDetails} className="w-full gap-2">
              Devam <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: Summary */}
        {step === "summary" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profil</span>
                <span className="font-semibold text-foreground">{entityName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paket</span>
                <Badge className={campaignPackages.find(p => p.id === selectedPkg)?.badge}>
                  {campaignPackages.find(p => p.id === selectedPkg)?.name}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Süre</span>
                <span className="font-semibold text-foreground">{campaignPackages.find(p => p.id === selectedPkg)?.duration}</span>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm font-semibold text-foreground mb-2">Platformlar & Bütçeler</p>
                {Array.from(selectedPlatforms).map(key => {
                  const platform = socialPlatforms.find(p => p.key === key);
                  return (
                    <div key={key} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        {platform && <platform.icon className={`h-3.5 w-3.5 ${platform.color}`} />}
                        {platform?.label}
                      </span>
                      <span className="font-semibold text-foreground">${budgets[key]}/hafta × {pkgMultiplier} hafta = ${budgets[key] * pkgMultiplier}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-bold text-foreground">Toplam</span>
                <span className="font-bold text-primary text-lg">${totalCost}</span>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><Eye className="h-4 w-4" /> Post Önizleme</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{contentText}</p>
              {mediaFiles.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {mediaFiles.map((f, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("details")} className="flex-1 gap-2">
                <ArrowLeft className="h-4 w-4" /> Geri
              </Button>
              <Button onClick={() => setStep("date")} className="flex-1 gap-2">
                Devam <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Date */}
        {step === "date" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-6 text-center">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-3" />
              <Label className="text-sm font-semibold mb-3 block">Yayın Başlangıç Tarihi</Label>
              <Input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="max-w-xs mx-auto"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Kampanyanız seçtiğiniz tarihte otomatik başlayacak
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("summary")} className="flex-1 gap-2">
                <ArrowLeft className="h-4 w-4" /> Geri
              </Button>
              <Button onClick={() => setStep("payment")} disabled={!publishDate} className="flex-1 gap-2">
                Ödemeye Geç <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Payment */}
        {step === "payment" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-6">
              <CreditCard className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-center text-sm text-muted-foreground mb-4">Ödeme bilgilerinizi girin</p>

              <div className="space-y-3 max-w-sm mx-auto">
                <div>
                  <Label className="text-xs">Kart Üzerindeki İsim</Label>
                  <Input placeholder="Ad Soyad" />
                </div>
                <div>
                  <Label className="text-xs">Kart Numarası</Label>
                  <Input placeholder="0000 0000 0000 0000" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Son Kullanma</Label>
                    <Input placeholder="AA/YY" />
                  </div>
                  <div>
                    <Label className="text-xs">CVV</Label>
                    <Input placeholder="000" />
                  </div>
                </div>
              </div>

              <div className="border-t border-border mt-4 pt-4 flex justify-between items-center max-w-sm mx-auto">
                <span className="text-sm text-muted-foreground">Toplam Tutar</span>
                <span className="text-xl font-bold text-primary">${totalCost}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("date")} className="flex-1 gap-2">
                <ArrowLeft className="h-4 w-4" /> Geri
              </Button>
              <Button onClick={handlePayment} className="flex-1 gap-2">
                <Send className="h-4 w-4" /> Ödemeyi Tamamla
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SocialMediaCampaignDialog;
