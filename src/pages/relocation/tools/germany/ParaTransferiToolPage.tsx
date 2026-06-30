// Para Transferi (Almanya) standalone tool sayfası — /relocation/tools/para-transferi-almanya.
// EUR tutarı → 6 sağlayıcı için ücret + kur sonrası net TL → en avantajlıdan sıralı liste.
// Kaynak: ref101 para-transferi. RelocationToolPage bunu standalone registry üzerinden render eder.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { rankTransfers } from "@/lib/germany-transfer";

function fmt(value: number, currency: "EUR" | "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ParaTransferiToolPage() {
  const [amount, setAmount] = useState(1000);
  const ranked = useMemo(() => rankTransfers(amount > 0 ? amount : 0), [amount]);
  const best = ranked[0];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 text-center">
        <span className="mb-1 block text-3xl">💸</span>
        <h1 className="text-2xl font-extrabold text-foreground">Para Transferi (Almanya)</h1>
        <p className="text-sm text-muted-foreground">
          Almanya'dan Türkiye'ye gönderimde en avantajlı yöntemi bul — ücret + kur sonrası eline geçecek TL'ye göre.
        </p>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Transfer Tutarı</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="amount" className="mb-2 block text-sm">
            Göndereceğin tutar (€)
          </Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {ranked.map((p, idx) => (
          <Card key={p.id} className={cn(idx === 0 && "border-2 border-primary")}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">
                    <span className="mr-1">{p.logo}</span>
                    {idx + 1}. {p.name}
                    {idx === 0 && <Badge className="ml-2">En Avantajlı</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ⭐ {p.rating} · {p.transferTime}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Eline geçen</p>
                  <p className="font-bold text-foreground">{fmt(p.receivedAmount, "TRY")}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Ücret: {fmt(p.fee, "EUR")}</span>
                <span>Kur: {p.exchangeRate.toFixed(5)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {best && (
        <p className="mt-4 text-xs text-muted-foreground">
          ⚠️ Kur ve ücretler örnek/bilgilendirme amaçlıdır; transferden önce sağlayıcının güncel kur ve
          ücretini kontrol et. Nakit teslim, limit ve kampanyalar yönteme göre değişir.
          <Button variant="ghost" className="ml-2" onClick={() => setAmount(1000)}>
            Sıfırla
          </Button>
        </p>
      )}
    </div>
  );
}
