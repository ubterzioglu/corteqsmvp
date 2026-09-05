// Generic soru adımlayıcı — tüm soruları (mode='both') teker teker gösterir, cevap toplar,
// sonunda onComplete(answers) çağırır. Her soru cevaplanmadan ilerlenemez (is_required'dan
// bağımsız; DB'deki flag yalnız metadata). docs/10tool/00 §UX.
// NOT: Hızlı/detaylı mod ayrımı kaldırıldı — her araç sabit 20 soruluk tek akış kullanır;
// `mode` prop'u yalnızca oturum RPC çağrısına (session start) geçirilen sabit değer içindir.

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  QuestionRenderer,
  SCALE_DEFAULT_VALUE,
} from "@/components/relocation/tools/QuestionRenderer";
import { cityScopeFromAnswers } from "@/lib/relocation-city-scope";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import type { RelocationToolQuestionRow, ToolAnswerValue } from "@/lib/relocation-tools-types";

interface QuestionStepperProps {
  questions: RelocationToolQuestionRow[];
  initialAnswers?: Record<string, ToolAnswerValue>;
  isSubmitting?: boolean;
  onAnswerStart?: () => void;
  onAnswerChange?: (questionKey: string, answer: ToolAnswerValue) => void;
  onComplete: (answers: Record<string, ToolAnswerValue>) => void;
}

function sortedQuestions(questions: RelocationToolQuestionRow[]): RelocationToolQuestionRow[] {
  return [...questions].sort((a, b) => a.sort_order - b.sort_order);
}

// Ölçek (1-5) sorularında ekranda bir şık zaten ön-seçili görünür; kullanıcı hiç dokunmadan
// ilerlerse o görünen değer kaydedilir. Diğer tiplerde cevapsız ilerleme yok.
function effectiveAnswer(
  question: RelocationToolQuestionRow,
  value: ToolAnswerValue | undefined,
): ToolAnswerValue | undefined {
  if (value === undefined && question.answer_type === "scale") return SCALE_DEFAULT_VALUE;
  return value;
}

function isEmpty(value: ToolAnswerValue | undefined): boolean {
  if (value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "boolean") return value === false;
  return false;
}

export function QuestionStepper({
  questions,
  initialAnswers = {},
  isSubmitting = false,
  onAnswerStart,
  onAnswerChange,
  onComplete,
}: QuestionStepperProps) {
  const steps = useMemo(() => sortedQuestions(questions), [questions]);
  const [index, setIndex] = useState(() => {
    const firstMissing = steps.findIndex((step) => initialAnswers[step.question_key] === undefined);
    return firstMissing === -1 ? Math.max(0, steps.length - 1) : firstMissing;
  });
  const [answers, setAnswers] = useState<Record<string, ToolAnswerValue>>(initialAnswers);
  const [showError, setShowError] = useState(false);
  // Single sorularda şık seçilince otomatik ilerleme için bekleyen timeout.
  const pendingAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingAdvance = () => {
    if (pendingAdvanceRef.current !== null) {
      clearTimeout(pendingAdvanceRef.current);
      pendingAdvanceRef.current = null;
    }
  };

  // Component unmount olursa bekleyen otomatik ilerlemeyi iptal et.
  useEffect(() => clearPendingAdvance, []);

  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">{TOOLS_UI_COPY.notFound}</p>;
  }

  const question = steps[index];
  const isLast = index === steps.length - 1;
  const value = answers[question.question_key];
  const committedValue = effectiveAnswer(question, value);
  const blocked = isEmpty(committedValue);

  const setAnswer = (v: ToolAnswerValue) => {
    onAnswerStart?.();
    onAnswerChange?.(question.question_key, v);
    setAnswers((prev) => ({ ...prev, [question.question_key]: v }));
    setShowError(false);
    // Tek seçimlik soruda (son soru değilse) şık seçimini kısa süre göster, sonra otomatik ilerle.
    // Hızlı yeni seçim önceki bekleyeni iptal eder; back/manuel next de iptal eder.
    clearPendingAdvance();
    if (question.answer_type === "single" && !isLast && !isSubmitting && !isEmpty(v)) {
      pendingAdvanceRef.current = setTimeout(() => {
        pendingAdvanceRef.current = null;
        setIndex((i) => Math.min(steps.length - 1, i + 1));
      }, 250);
    }
  };

  const next = () => {
    clearPendingAdvance();
    if (blocked) {
      setShowError(true);
      return;
    }
    // Dokunulmamış ölçek sorusunda görünen varsayılanı gerçek cevaba dönüştür.
    const nextAnswers =
      committedValue === value
        ? answers
        : { ...answers, [question.question_key]: committedValue };
    if (nextAnswers !== answers) setAnswers(nextAnswers);
    if (isLast) {
      onComplete(nextAnswers);
      return;
    }
    setIndex((i) => i + 1);
  };

  const back = () => {
    clearPendingAdvance();
    setShowError(false);
    setIndex((i) => Math.max(0, i - 1));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Progress value={((index + 1) / steps.length) * 100} className="h-2" />
        <p className="text-right text-xs text-muted-foreground">
          {index + 1} / {steps.length}
        </p>
      </div>

      <div className="space-y-4 min-h-[300px] sm:min-h-[340px]">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{question.prompt_tr}</h2>
          {question.help_tr && question.answer_type !== "consent" && (
            <p className="mt-1 text-sm text-muted-foreground">{question.help_tr}</p>
          )}
        </div>

        {/* Şehir sorusu, kullanıcının daha önce `target_countries`'e verdiği cevabı
            görmelidir; cevaplar burada tutulduğu için kapsamı stepper türetir. Cevap
            torbasının tamamı DEĞİL, yalnız türetilmiş kod listesi geçirilir. */}
        <QuestionRenderer
          question={question}
          value={value}
          onChange={setAnswer}
          scopeCountryCodes={cityScopeFromAnswers(answers)}
        />

        {showError && blocked && (
          <p className="text-sm text-destructive">{TOOLS_UI_COPY.required}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={index === 0 || isSubmitting}>
          {TOOLS_UI_COPY.back}
        </Button>
        <Button onClick={next} disabled={isSubmitting}>
          {isSubmitting
            ? TOOLS_UI_COPY.submitting
            : isLast
              ? TOOLS_UI_COPY.finish
              : TOOLS_UI_COPY.next}
        </Button>
      </div>
    </div>
  );
}
