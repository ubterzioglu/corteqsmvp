import { useState } from "react";
import {
  Rocket, Star, Users, MessageCircle, Mail, Sparkles,
  TrendingUp, Target, CheckCircle, Zap, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { boostPackage, getAudienceSegments, type AudienceSegment } from "@/data/mock";
import { useToast } from "@/hooks/use-toast";

interface EventBoostDialogProps {
  eventTitle: string;
  eventCategory: string;
  eventCountry: string;
  trigger?: React.ReactNode;
}

const typeIcons: Record<string, React.ReactNode> = {
  users: <Users className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  users: "text-primary",
  whatsapp: "text-emerald-500",
  email: "text-amber-500",
};

const EventBoostDialog = ({ eventTitle, eventCategory, eventCountry, trigger }: EventBoostDialogProps) => {
  const [step, setStep] = useState<"overview" | "audience" | "confirm">("overview");
  const [emailList, setEmailList] = useState("");
  const { toast } = useToast();

  const segments = getAudienceSegments(eventCategory, eventCountry);
  const totalReach = segments.reduce((sum, s) => sum + s.size, 0);

  const handlePurchase = () => {
    toast({
      title: "🚀 Boost Paketi Aktif!",
      description: `"${eventTitle}" etkinliğiniz artık boost ediliyor. Tahmini erişim: ${totalReach.toLocaleString()}+ kişi`,
    });
    setStep("overview");
  };

  return (
    <Dialog onOpenChange={() => setStep("overview")}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10">
            <Rocket className="h-3.5 w-3.5" /> Boost Et
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            {step === "overview" && "Etkinliğini Boost Et"}
            {step === "audience" && "AI Hedef Kitle Eşleşmesi"}
            {step === "confirm" && "Boost Onayı"}
          </DialogTitle>
        </DialogHeader>

        {step === "overview" && (
          <div className="space-y-5 mt-2">
            {/* Event name */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">Etkinlik</p>
              <p className="font-semibold text-foreground">{eventTitle}</p>
            </div>

            {/* Package card */}
            <div className="relative rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5">
              <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground border-0 gap-1">
                <Zap className="h-3 w-3" /> Tek Paket
              </Badge>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground text-lg">{boostPackage.name}</h3>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">€{boostPackage.price}</span>
                    <span className="text-xs text-muted-foreground block">/ {boostPackage.duration}</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {boostPackage.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Estimated reach */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Tahmini Erişim: {totalReach.toLocaleString()}+ kişi</p>
                <p className="text-xs text-muted-foreground">AI eşleşme ile kategori ve lokasyona uygun kitle</p>
              </div>
            </div>

            <Button className="w-full gap-2" onClick={() => setStep("audience")}>
              <Target className="h-4 w-4" /> Hedef Kitleyi Gör
            </Button>
          </div>
        )}

        {step === "audience" && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">AI Eşleşme</span> — Etkinlik kategorisi ve lokasyonuna göre en uygun kitleler belirlendi
              </p>
            </div>

            <div className="space-y-3">
              {segments.map((seg) => (
                <SegmentCard key={seg.id} segment={seg} />
              ))}
            </div>

            {/* Email list input */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-amber-500" /> Mail Listeniz (opsiyonel)
              </Label>
              <Input
                placeholder="E-posta adreslerini virgülle ayırın..."
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Kendi abone listenize de tanıtım gönderilir
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("overview")}>
                Geri
              </Button>
              <Button className="flex-1 gap-2" onClick={() => setStep("confirm")}>
                <Rocket className="h-4 w-4" /> Boost'u Onayla
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-5 mt-2">
            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
              <h4 className="font-semibold text-foreground">Sipariş Özeti</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Etkinlik</span>
                <span className="font-medium text-foreground">{eventTitle}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paket</span>
                <span className="font-medium text-foreground">{boostPackage.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Süre</span>
                <span className="font-medium text-foreground">{boostPackage.duration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tahmini Erişim</span>
                <span className="font-medium text-primary">{totalReach.toLocaleString()}+ kişi</span>
              </div>
              {emailList && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mail listesi</span>
                  <span className="font-medium text-foreground">{emailList.split(",").length} adres</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-bold text-foreground">Toplam</span>
                <span className="font-bold text-primary text-lg">€{boostPackage.price}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-foreground">
              <BarChart3 className="h-4 w-4 text-amber-500 shrink-0" />
              Boost sonrasında detaylı erişim raporu profil sayfanızda görüntülenecektir.
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("audience")}>
                Geri
              </Button>
              <Button className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80" onClick={handlePurchase}>
                <Zap className="h-4 w-4" /> €{boostPackage.price} — Satın Al
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const SegmentCard = ({ segment }: { segment: AudienceSegment }) => (
  <div className="p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-2">
        <span className={typeColors[segment.type]}>{typeIcons[segment.type]}</span>
        <span className="text-sm font-semibold text-foreground">{segment.label}</span>
      </div>
      <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
        <Sparkles className="h-3 w-3" /> %{segment.matchScore}
      </Badge>
    </div>
    <p className="text-xs text-muted-foreground mb-1.5">{segment.description}</p>
    {segment.size > 0 && (
      <p className="text-xs font-medium text-foreground/70">
        ~{segment.size.toLocaleString()} kişi erişim
      </p>
    )}
  </div>
);

export default EventBoostDialog;
