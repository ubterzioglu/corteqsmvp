// StepStone Maaş Karşılaştırma (Almanya) — /relocation/tools/stepstone-karsilastirma-almanya.
// StepStone Gehaltsreport 2026 medyanlarıyla maaş karşılaştırma. Standalone; DB yok.
// Kaynak: ref101 stepstone-karsilastirma. RelocationToolPage standalone registry üzerinden render eder.
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  STEPSTONE_COMPANY_SIZE_OPTIONS,
  STEPSTONE_EXPERIENCE_OPTIONS,
  compareStepstone,
  getStepstoneCities,
  getStepstoneJobGroups,
  type StepstoneSelection,
} from "@/lib/germany-stepstone";

function eur(v: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
}

export default function StepstoneKarsilastirmaToolPage() {
  const [sel, setSel] = useState<StepstoneSelection>({});
  const jobGroups = useMemo(getStepstoneJobGroups, []);
  const cities = useMemo(getStepstoneCities, []);
  const result = useMemo(() => compareStepstone(sel), [sel]);

  const set = <K extends keyof StepstoneSelection>(k: K, v: StepstoneSelection[K]) =>
    setSel((prev) => ({ ...prev, [k]: v }));

  const maxMedian = Math.max(...result.benchmarks.map((b) => b.median), sel.salary ?? 0, 1);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 text-center">
        <span className="mb-1 block text-3xl">📊</span>
        <h1 className="text-2xl font-extrabold text-foreground">StepStone Maaş Karşılaştırma (Almanya)</h1>
        <p className="text-sm text-muted-foreground">
          StepStone Gehaltsreport 2026 medyanlarıyla maaşını karşılaştır; pazar değerini gör.
        </p>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Profilin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Meslek grubu</Label>
            <Select value={sel.jobGroup ?? ""} onValueChange={(v) => set("jobGroup", v)}>
              <SelectTrigger><SelectValue placeholder="Seç (opsiyonel)" /></SelectTrigger>
              <SelectContent>
                {jobGroups.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Deneyim</Label>
              <Select value={sel.experience ?? ""} onValueChange={(v) => set("experience", v)}>
                <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                <SelectContent>
                  {STEPSTONE_EXPERIENCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Şirket büyüklüğü</Label>
              <Select value={sel.companySize ?? ""} onValueChange={(v) => set("companySize", v)}>
                <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                <SelectContent>
                  {STEPSTONE_COMPANY_SIZE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Şehir</Label>
            <Select value={sel.city ?? ""} onValueChange={(v) => set("city", v)}>
              <SelectTrigger><SelectValue placeholder="Seç (opsiyonel)" /></SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Yıllık brüt maaşın (€) — opsiyonel</Label>
            <Input
              id="salary"
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="örn. 60000"
              value={sel.salary ?? ""}
              onChange={(e) => set("salary", e.target.value ? Math.max(0, Number(e.target.value)) : undefined)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Karşılaştırma (medyan, yıllık brüt)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.diffPercent !== null && (
            <div
              className={cn(
                "rounded-lg border p-3 text-sm",
                result.diffPercent >= 0
                  ? "border-green-300 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200"
                  : "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-200",
              )}
            >
              Maaşın, en yakın referans medyanından{" "}
              <strong>
                {result.diffPercent >= 0 ? "+" : ""}
                {result.diffPercent}%
              </strong>{" "}
              {result.diffPercent >= 0 ? "yüksek" : "düşük"} ({eur(result.primaryMedian)} medyan).
            </div>
          )}

          {sel.salary && sel.salary > 0 && (
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-foreground">Senin maaşın</span>
                <span className="text-foreground">{eur(sel.salary)}</span>
              </div>
              <Progress value={Math.round((sel.salary / maxMedian) * 100)} className="h-2" />
            </div>
          )}

          {result.benchmarks.map((b) => (
            <div key={b.key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="text-foreground">{eur(b.median)}</span>
              </div>
              <Progress value={Math.round((b.median / maxMedian) * 100)} className="h-1.5" />
            </div>
          ))}

          <p className="pt-2 text-xs text-muted-foreground">
            ⚠️ Veriler StepStone Gehaltsreport 2026 medyanlarına dayanır ve bilgilendirme amaçlıdır.
            Gerçek maaş; firma, performans ve pazarlığa göre değişir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
