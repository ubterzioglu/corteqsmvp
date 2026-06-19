// Taşınma wizard'ı — hedef ülke, pencere, bütçe, hane, must-haves topla → createMove.
// Ülke seçenekleri relocation_locations'tan gelir (veri-tabanlı; kontrat ISO alpha-2 kodu).
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { moveCreateSchema, type MoveCreateInput } from "@/lib/relocation-schemas";
import { useToast } from "@/hooks/use-toast";

export interface CountryOption {
  code: string; // ISO alpha-2
  label: string;
}

interface RelocationWizardProps {
  countryOptions: CountryOption[];
  labels: {
    targets: string;
    window: string;
    budget: string;
    household: string;
    adults: string;
    children: string;
    mustHaves: string;
    submit: string;
  };
  onSubmit: (input: MoveCreateInput) => void;
  isSubmitting: boolean;
}

export function RelocationWizard({
  countryOptions,
  labels,
  onSubmit,
  isSubmitting,
}: RelocationWizardProps) {
  const { toast } = useToast();
  const [targets, setTargets] = useState<string[]>([]);
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [budget, setBudget] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [mustHaves, setMustHaves] = useState("");

  const canSubmit = useMemo(() => targets.length > 0 && !isSubmitting, [targets, isSubmitting]);

  function toggleTarget(code: string) {
    setTargets((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function handleSubmit() {
    const raw = {
      target_country_codes: targets,
      move_window_start: windowStart || "",
      move_window_end: windowEnd || "",
      budget_monthly: budget ? Number(budget) : undefined,
      currency: "EUR",
      household: {
        adults: Number(adults) || 1,
        children: Number(children) || 0,
        pets: [],
        accessibility_needs: [],
      },
      must_haves: mustHaves
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      nice_to_haves: [],
      preferred_language: "tr-TR" as const,
    };
    const parsed = moveCreateSchema.safeParse(raw);
    if (!parsed.success) {
      toast({
        title: "Form hatası",
        description: parsed.error.issues[0]?.message ?? "Geçersiz giriş",
        variant: "destructive",
      });
      return;
    }
    onSubmit(parsed.data);
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-5">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">{labels.targets} *</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {countryOptions.map((opt) => (
              <label
                key={opt.code}
                className="flex items-center gap-2 rounded-md border border-border p-2 text-sm"
              >
                <Checkbox
                  checked={targets.includes(opt.code)}
                  onCheckedChange={() => toggleTarget(opt.code)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{labels.window}</Label>
            <Input type="date" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">&nbsp;</Label>
            <Input type="date" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">{labels.budget} (EUR)</Label>
          <Input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="1800"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{labels.adults}</Label>
            <Input type="number" min={1} value={adults} onChange={(e) => setAdults(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{labels.children}</Label>
            <Input type="number" min={0} value={children} onChange={(e) => setChildren(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">{labels.mustHaves}</Label>
          <Input
            value={mustHaves}
            onChange={(e) => setMustHaves(e.target.value)}
            placeholder="turkish_community, family_doctor_access"
          />
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full" size="lg">
          {labels.submit}
        </Button>
      </CardContent>
    </Card>
  );
}
