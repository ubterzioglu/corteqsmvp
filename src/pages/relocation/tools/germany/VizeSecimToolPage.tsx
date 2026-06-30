// Vize Seçimi (Almanya) standalone tool sayfası — /relocation/tools/vize-secim-almanya.
// Dallanmalı karar ağacı: her cevap bir sonraki soruya veya bir sonuca götürür.
// Kaynak: ref101 vize-secim. RelocationToolPage bunu standalone registry üzerinden render eder.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  VIZE_START_QUESTION,
  type VizeColor,
  getVizeQuestion,
  getVizeResult,
  isVizeResultRef,
  vizeResultIdFromRef,
} from "@/lib/germany-vize-data";

const RESULT_BORDER: Record<VizeColor, string> = {
  blue: "border-blue-500",
  green: "border-green-500",
  yellow: "border-yellow-500",
  orange: "border-orange-500",
  red: "border-red-500",
};

const RESULT_BADGE: Record<VizeColor, string> = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
};

export default function VizeSecimToolPage() {
  const [qId, setQId] = useState(VIZE_START_QUESTION);
  const [history, setHistory] = useState<string[]>([]);
  const [resultId, setResultId] = useState<string | null>(null);

  const question = useMemo(() => getVizeQuestion(qId), [qId]);
  const result = useMemo(() => (resultId ? getVizeResult(resultId) : null), [resultId]);

  const pick = (next: string) => {
    if (isVizeResultRef(next)) {
      setResultId(vizeResultIdFromRef(next));
    } else {
      setHistory((h) => [...h, qId]);
      setQId(next);
    }
  };

  const goBack = () => {
    if (resultId) {
      setResultId(null);
      return;
    }
    if (history.length > 0) {
      setQId(history[history.length - 1]);
      setHistory((h) => h.slice(0, -1));
    }
  };

  const reset = () => {
    setQId(VIZE_START_QUESTION);
    setHistory([]);
    setResultId(null);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 text-center">
        <span className="mb-1 block text-3xl">🛂</span>
        <h1 className="text-2xl font-extrabold text-foreground">Vize Seçimi (Almanya)</h1>
        <p className="text-sm text-muted-foreground">
          Birkaç soruda sana en uygun Almanya vize yolunu bul; gereken belgeleri ve adımları gör.
        </p>
      </div>

      {!result && question && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base leading-snug">{question.text}</CardTitle>
            {question.hint && (
              <p className="text-sm text-muted-foreground">{question.hint}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {question.options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => pick(opt.next)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-accent"
              >
                {opt.label}
              </button>
            ))}
            {history.length > 0 && (
              <button
                onClick={goBack}
                className="mt-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Önceki soruya dön
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className={cn("border-2", RESULT_BORDER[result.color])}>
          <CardHeader>
            <span
              className={cn(
                "mb-2 inline-block w-fit rounded-full px-2 py-1 text-xs font-semibold",
                RESULT_BADGE[result.color],
              )}
            >
              Önerilen Vize Türü
            </span>
            <CardTitle className="text-xl">{result.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{result.subtitle}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Temel Şartlar</h3>
              <ul className="space-y-1.5">
                {result.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-0.5 shrink-0 text-green-600">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-muted/40 p-3">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Sonraki Adımlar</h3>
              <ol className="space-y-1.5">
                {result.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="w-4 shrink-0 font-bold text-muted-foreground">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {result.note && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/40 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">💡 {result.note}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              ⚠️ Sonuç bilgilendirme amaçlıdır; kesin karar için bir göçmenlik danışmanına başvur.
              Kaynak: 2024/2025 Almanya göçmenlik mevzuatı (AufenthG, Fachkräfteeinwanderungsgesetz).
            </p>

            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={goBack}>
                ← Son Soruya Dön
              </Button>
              <Button variant="ghost" onClick={reset}>
                Yeniden Başla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
