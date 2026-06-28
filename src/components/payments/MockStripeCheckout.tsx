import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lock, CreditCard, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

/**
 * GÖSTERMELİK (mockup) Stripe Checkout ekranı.
 *
 * Bu bileşen gerçek bir ödeme YAPMAZ. Hiçbir Stripe API'sine, edge function'a
 * veya dış servise istek atmaz. Stripe Checkout görünümünü taklit ederek
 * demo amaçlı "ödeme başarılı" akışını gösterir. Gerçek tahsilat için ileride
 * Stripe entegrasyonu (test/live anahtar + edge function) eklenmelidir.
 *
 * Kart alanları sadece görseldir; girilen değer hiçbir yere gönderilmez.
 */

export interface MockStripeCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tahsil edilecekmiş gibi gösterilecek tutar (görsel). */
  amount: number;
  /** Para birimi sembolü, varsayılan €. */
  currency?: string;
  /** Ödeme satırının açıklaması, ör. "Hizmet Talebi Ücreti". */
  productName: string;
  /** Müşteri e-postası (Stripe genelde gösterir). */
  customerEmail?: string;
  /** Ödeme "başarılı" olduğunda çağrılır — gerçek iş burada yapılır. */
  onPaymentSuccess: () => void | Promise<void>;
}

type CheckoutStep = "form" | "processing" | "success";

const TEST_CARD = "4242 4242 4242 4242";

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function MockStripeCheckout({
  open,
  onOpenChange,
  amount,
  currency = "€",
  productName,
  customerEmail,
  onPaymentSuccess,
}: MockStripeCheckoutProps) {
  const [step, setStep] = useState<CheckoutStep>("form");
  const [cardNumber, setCardNumber] = useState(TEST_CARD);
  const [expiry, setExpiry] = useState("12 / 34");
  const [cvc, setCvc] = useState("123");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    if (open) {
      setStep("form");
      setCardNumber(TEST_CARD);
      setExpiry("12 / 34");
      setCvc("123");
      setCardName("");
    }
  }, [open]);

  const formattedAmount = useMemo(
    () => `${currency}${amount.toFixed(2)}`,
    [currency, amount],
  );

  const handlePay = async () => {
    setStep("processing");
    // Sahte işlem gecikmesi — gerçek bir ağ çağrısı YOK.
    await new Promise((resolve) => setTimeout(resolve, 1600));
    setStep("success");
    // Başarı ekranını kısa süre göster, sonra gerçek işi tetikle.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await onPaymentSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => step === "form" && onOpenChange(v)}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        {/* Stripe-benzeri üst şerit */}
        <div className="bg-[#635bff] px-6 py-5 text-white">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5" />
              Ödeme · {productName}
            </DialogTitle>
            <DialogDescription className="text-white/80">
              {customerEmail ? `${customerEmail} · ` : ""}Stripe ile güvenli ödeme
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-sm text-white/80">Ödenecek Tutar</span>
            <span className="text-3xl font-bold tracking-tight">{formattedAmount}</span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          {/* DEMO uyarısı — gerçek tahsilat olmadığını net belirtir */}
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Demo / Test ödemesi.</strong> Bu ekran
              göstermeliktir; gerçek para tahsil edilmez. Test kartı{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">4242…</code>{" "}
              ön-doludur.
            </p>
          </div>

          {step === "form" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Kart Üzerindeki İsim</Label>
                <Input
                  placeholder="Ad Soyad"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Kart Numarası</Label>
                <div className="relative">
                  <Input
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="pr-10 font-mono"
                  />
                  <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Son Kullanma</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="AA / YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CVC</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="font-mono"
                  />
                </div>
              </div>

              <Button
                onClick={handlePay}
                className="h-11 w-full bg-[#635bff] text-white hover:bg-[#5249e0]"
              >
                <Lock className="mr-1.5 h-4 w-4" />
                {formattedAmount} Öde
              </Button>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Vazgeç
              </button>

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>
                  Stripe tarafından güvenli şekilde işlenir · <span className="font-semibold">Powered by Stripe</span>
                </span>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-9 w-9 animate-spin text-[#635bff]" />
              <p className="text-sm text-muted-foreground">Ödeme işleniyor…</p>
              <Badge variant="outline" className="text-[10px]">
                Test modu
              </Badge>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-9 w-9 text-success" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Ödeme Başarılı</h3>
              <p className="text-sm text-muted-foreground">
                {formattedAmount} tutarındaki demo ödemeniz onaylandı.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MockStripeCheckout;
