import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tag, Gift, Percent, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Coupon } from "@/components/CouponManager";

interface Props {
  coupon: (Coupon & { price?: number; isFree?: boolean; businessUserId?: string }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CouponCheckoutDialog = ({ coupon, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<"summary" | "processing" | "ready">("summary");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [purchaseId, setPurchaseId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep("summary");
      setName(user?.user_metadata?.full_name ?? "");
      setEmail(user?.email ?? "");
      setPurchaseId(null);
    }
  }, [open, user]);

  if (!coupon) return null;

  const price = coupon.isFree ? 0 : Number(coupon.price ?? 0);
  const isFree = price === 0;

  const handleConfirm = async () => {
    if (!user) {
      toast({ title: "Giriş gerekli", description: "Satın almak için lütfen giriş yapın.", variant: "destructive" });
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast({ title: "Bilgileri tamamlayın", description: "Ad ve e-posta gerekli.", variant: "destructive" });
      return;
    }
    setStep("processing");
    const { data, error } = await supabase.from("coupon_purchases").insert({
      buyer_id: user.id,
      business_user_id: coupon.businessUserId ?? null,
      business_name: coupon.businessName,
      coupon_code: coupon.code,
      coupon_title: coupon.title,
      price,
      currency: "EUR",
      status: isFree ? "paid" : "pending",
      buyer_email: email.trim(),
      buyer_name: name.trim(),
    }).select("id").single();

    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      setStep("summary");
      return;
    }
    setPurchaseId(data.id);
    setStep("ready");

    if (isFree) {
      toast({ title: "Kupon eklendi! 🎉", description: `${coupon.code} kuponunuz hazır.` });
    } else {
      // TODO: When Stripe is enabled, call edge function to create checkout session and redirect.
      toast({
        title: "Sipariş hazır",
        description: "Stripe entegrasyonu yakında aktifleşecek; siparişiniz beklemede.",
      });
    }
  };

  const TypeIcon = coupon.type === "gift" ? Gift : coupon.type === "percent" ? Percent : Tag;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gold" /> Kupon Satın Al
          </DialogTitle>
          <DialogDescription>{coupon.businessName}</DialogDescription>
        </DialogHeader>

        {step === "summary" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TypeIcon className="h-4 w-4 text-gold" />
                <Badge className="bg-gold/10 text-gold border-0">
                  {coupon.type === "gift" ? "Hediye" : coupon.type === "percent" ? `%${coupon.value} İndirim` : `€${coupon.value} İndirim`}
                </Badge>
                {coupon.expires && <span className="text-xs text-muted-foreground ml-auto">Son: {coupon.expires}</span>}
              </div>
              <h3 className="font-bold text-foreground">{coupon.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>
              <code className="inline-block mt-3 bg-card px-2 py-0.5 rounded border border-border font-bold text-primary text-xs">{coupon.code}</code>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Ad Soyad</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">E-posta</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Toplam</span>
              <span className="text-lg font-bold text-foreground">{isFree ? "Ücretsiz" : `€${price.toFixed(2)}`}</span>
            </div>

            <Button onClick={handleConfirm} className="w-full bg-gold hover:bg-gold/90 text-primary-foreground">
              {isFree ? "Kuponu Al" : "Ödemeye Geç"}
            </Button>
            {!isFree && (
              <p className="text-[11px] text-center text-muted-foreground">
                Stripe ile güvenli ödeme yakında aktifleşecek. Siparişiniz hazırlanır ve Stripe açıldığında ödeme tamamlanır.
              </p>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="text-sm text-muted-foreground">Sipariş hazırlanıyor...</p>
          </div>
        )}

        {step === "ready" && (
          <div className="py-6 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-turquoise" />
            <h3 className="font-bold text-foreground">{isFree ? "Kuponunuz hazır!" : "Sipariş alındı"}</h3>
            <p className="text-sm text-muted-foreground">
              {isFree
                ? `${coupon.code} kodunu kullanabilirsiniz.`
                : "Stripe entegrasyonu aktifleştiğinde ödeme bağlantınız e-posta ile gönderilecek."}
            </p>
            {purchaseId && <p className="text-[10px] text-muted-foreground">Sipariş ID: {purchaseId.slice(0, 8)}</p>}
            <Button onClick={() => onOpenChange(false)} className="mt-2">Kapat</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
