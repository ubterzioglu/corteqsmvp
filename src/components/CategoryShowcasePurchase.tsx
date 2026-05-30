import { useState } from "react";
import { Crown, Check, ArrowRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

const showcasePackages = [
  { id: "1week", name: "1 Hafta", price: 29, badge: "bg-muted text-muted-foreground" },
  { id: "2week", name: "2 Hafta", price: 49, badge: "bg-primary/10 text-primary" },
  { id: "1month", name: "1 Ay", price: 79, badge: "bg-gold/20 text-gold", popular: true },
  { id: "3month", name: "3 Ay", price: 199, badge: "bg-turquoise/20 text-turquoise" },
];

interface Props {
  entityName: string;
  category: string;
  trigger?: React.ReactNode;
}

const CategoryShowcasePurchase = ({ entityName, category, trigger }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState("1month");
  const [step, setStep] = useState<"select" | "payment">("select");

  const selected = showcasePackages.find(p => p.id === selectedPkg)!;

  const handlePayment = () => {
    toast({
      title: "Kategori Vitrini Aktif! 👑",
      description: `${category} kategorisinde ${selected.name} boyunca üst sıralarda gösterileceksiniz.`,
    });
    setOpen(false);
    setStep("select");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setStep("select"); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 w-full border-gold/30 text-gold hover:bg-gold/5">
            <Crown className="h-4 w-4" /> Kategori Vitrini
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold" /> Kategori Vitrini Satın Al
          </DialogTitle>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>{category}</strong> kategorisinde ilk 6 sırada gösterilirsiniz. Daha fazla görünürlük, daha fazla müşteri!
            </p>

            <div className="space-y-2">
              {showcasePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg.id)}
                  className={`relative flex items-center justify-between border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedPkg === pkg.id ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedPkg === pkg.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{pkg.name}</span>
                        {pkg.popular && <Badge className="bg-gold/20 text-gold text-[10px]">Popüler</Badge>}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-foreground">€{pkg.price}</span>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">✨ Vitrin Avantajları</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>👑 Kategoride ilk 6 sırada sabit gösterim</li>
                <li>⭐ "Vitrin" rozeti ile öne çıkma</li>
                <li>📊 Tıklama & görüntülenme raporları</li>
                <li>🔄 Süre bitiminde otomatik yenileme seçeneği</li>
              </ul>
            </div>

            <Button onClick={() => setStep("payment")} className="w-full gap-2">
              Devam — €{selected.price} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-foreground">{entityName}</p>
                <p className="text-xs text-muted-foreground">{category} · {selected.name}</p>
              </div>
              <span className="text-lg font-bold text-primary">€{selected.price}</span>
            </div>

            <div className="space-y-3">
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

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("select")} className="flex-1">
                Geri
              </Button>
              <Button onClick={handlePayment} className="flex-1 gap-2">
                <CreditCard className="h-4 w-4" /> Ödemeyi Tamamla
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryShowcasePurchase;
