// Maaş Hesaplama (Almanya) — Brüt↔Net standalone hesaplayıcı paneli.
// DB/oturum YOK; tüm hesap istemci tarafında (src/lib/germany-salary). Kaynak: ref101 maas-hesaplama.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateSalary } from "@/lib/germany-salary/calculator";
import {
  SALARY_STATES,
  TAX_CLASSES,
  type SalaryDirection,
  type SalaryInput,
  type SalaryPeriod,
  type SteuerklasseValue,
} from "@/lib/germany-salary/types";
import { formatCurrency } from "@/lib/germany-salary/util";

const DEFAULT_INPUT: SalaryInput = {
  amount: 4000,
  period: "monthly",
  type: "gross",
  taxClass: "1",
  state: "NRW",
  hasChildren: false,
  childrenCount: 0,
  childrenUnder25Count: 0,
  age23Plus: true,
  churchTax: false,
  childAllowance: 0,
  insuranceType: "gkv",
  kvBase: 14.6,
  kvZusatz: 2.5,
  pkvPremium: 0,
  ppvPremium: 0,
};

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className={strong ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "font-bold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}

export function MaasHesaplamaPanel() {
  const [input, setInput] = useState<SalaryInput>(DEFAULT_INPUT);

  const result = useMemo(() => calculateSalary(input), [input]);

  const set = <K extends keyof SalaryInput>(key: K, value: SalaryInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Girdiler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bilgilerin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Tutar (€)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              value={input.amount}
              onChange={(e) => set("amount", Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Dönem</Label>
              <Select value={input.period} onValueChange={(v) => set("period", v as SalaryPeriod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Aylık</SelectItem>
                  <SelectItem value="yearly">Yıllık</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tür</Label>
              <Select value={input.type} onValueChange={(v) => set("type", v as SalaryDirection)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gross">Brüt → Net</SelectItem>
                  <SelectItem value="net">Net → Brüt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Vergi Sınıfı</Label>
              <Select value={input.taxClass} onValueChange={(v) => set("taxClass", v as SteuerklasseValue)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TAX_CLASSES.map((tc) => (
                    <SelectItem key={tc.value} value={tc.value}>{tc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Eyalet</Label>
              <Select value={input.state} onValueChange={(v) => set("state", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SALARY_STATES.map((s) => (
                    <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sağlık Sigortası</Label>
            <Select value={input.insuranceType} onValueChange={(v) => set("insuranceType", v as "gkv" | "pkv")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gkv">Kamu (GKV)</SelectItem>
                <SelectItem value="pkv">Özel (PKV)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {input.insuranceType === "gkv" && (
            <div className="space-y-2">
              <Label htmlFor="kvZusatz">KV Ek Katkı Oranı (%)</Label>
              <Input
                id="kvZusatz"
                type="number"
                step="0.1"
                value={input.kvZusatz}
                onChange={(e) => set("kvZusatz", Number(e.target.value))}
              />
            </div>
          )}

          {input.insuranceType === "pkv" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pkv">PKV Primi (€/ay)</Label>
                <Input id="pkv" type="number" value={input.pkvPremium} onChange={(e) => set("pkvPremium", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ppv">PPV Primi (€/ay)</Label>
                <Input id="ppv" type="number" value={input.ppvPremium} onChange={(e) => set("ppvPremium", Number(e.target.value))} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="church">Kilise vergisi (Kirchensteuer)</Label>
            <Switch id="church" checked={input.churchTax} onCheckedChange={(v) => set("churchTax", v)} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="children">Çocuğun var mı?</Label>
            <Switch
              id="children"
              checked={input.hasChildren}
              onCheckedChange={(v) =>
                setInput((prev) => ({
                  ...prev,
                  hasChildren: v,
                  childrenUnder25Count: v ? Math.max(1, prev.childrenUnder25Count) : 0,
                }))
              }
            />
          </div>

          {input.hasChildren && (
            <div className="space-y-2">
              <Label htmlFor="kids">25 yaş altı çocuk sayısı</Label>
              <Input
                id="kids"
                type="number"
                min={0}
                value={input.childrenUnder25Count}
                onChange={(e) => set("childrenUnder25Count", Math.max(0, Math.floor(Number(e.target.value))))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sonuç */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sonuç (2026)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Net (aylık)</p>
            <p className="text-3xl font-extrabold text-foreground">{formatCurrency(result.netMonthly)}</p>
            <p className="text-xs text-muted-foreground">Yıllık net: {formatCurrency(result.netYearly)}</p>
          </div>

          <div className="mt-4 space-y-1">
            <Row label="Brüt (aylık)" value={formatCurrency(result.grossMonthly)} strong />
            <Row label="Gelir Vergisi (Lohnsteuer)" value={`- ${formatCurrency(result.tax.lohnsteuer)}`} />
            <Row label="Dayanışma (Soli)" value={`- ${formatCurrency(result.tax.soli)}`} />
            {result.kirchensteuer > 0 && (
              <Row label="Kilise Vergisi" value={`- ${formatCurrency(result.kirchensteuer)}`} />
            )}
            <Row label="Sağlık (KV)" value={`- ${formatCurrency(result.social.kv)}`} />
            <Row label="Bakım (PV)" value={`- ${formatCurrency(result.social.pv)}`} />
            <Row label="Emeklilik (RV)" value={`- ${formatCurrency(result.social.rv)}`} />
            <Row label="İşsizlik (AV)" value={`- ${formatCurrency(result.social.av)}`} />
            {result.companyCarBenefit > 0 && (
              <Row label="Şirket aracı menfaati" value={formatCurrency(result.companyCarBenefit)} />
            )}
            <div className="my-2 border-t border-border" />
            <Row label="Toplam Kesinti (aylık)" value={`- ${formatCurrency(result.deductionsMonthly)}`} strong />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            ⚠️ Bu hesaplama 2026 vergi tablolarına göre <strong>tahminîdir</strong> ve bilgilendirme amaçlıdır;
            yasal/mali tavsiye değildir. Kesin tutar için bordro/danışman doğrulaması yap.
          </p>

          <Button variant="ghost" className="mt-3 w-full" onClick={() => setInput(DEFAULT_INPUT)}>
            Sıfırla
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
