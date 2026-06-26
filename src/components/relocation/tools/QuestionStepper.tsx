// Generic soru adımlayıcı — moda göre soruları teker teker gösterir, cevap toplar,
// sonunda onComplete(answers) çağırır. İlerleme + zorunlu doğrulama. docs/10tool/00 §UX.

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuestionRenderer } from "@/components/relocation/tools/QuestionRenderer";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import type {
  RelocationToolQuestionRow,
  ToolAnswerValue,
  ToolMode,
} from "@/lib/relocation-tools-types";

interface QuestionStepperProps {
  questions: RelocationToolQuestionRow[];
  mode: ToolMode;
  isSubmitting?: boolean;
  onComplete: (answers: Record<string, ToolAnswerValue>) => void;
}

function questionsForMode(
  questions: RelocationToolQuestionRow[],
  mode: ToolMode,
): RelocationToolQuestionRow[] {
  return [...questions]
    .filter((q) => q.mode === "both" || q.mode === mode)
    .sort((a, b) => a.sort_order - b.sort_order);
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
  mode,
  isSubmitting = false,
  onComplete,
}: QuestionStepperProps) {
  const steps = useMemo(() => questionsForMode(questions, mode), [questions, mode]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ToolAnswerValue>>({});
  const [showError, setShowError] = useState(false);

  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">{TOOLS_UI_COPY.notFound}</p>;
  }

  const question = steps[index];
  const isLast = index === steps.length - 1;
  const value = answers[question.question_key];
  const blocked = question.is_required && isEmpty(value);

  const setAnswer = (v: ToolAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [question.question_key]: v }));
    setShowError(false);
  };

  const next = () => {
    if (blocked) {
      setShowError(true);
      return;
    }
    if (isLast) {
      onComplete(answers);
      return;
    }
    setIndex((i) => i + 1);
  };

  const back = () => {
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

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{question.prompt_tr}</h2>
          {question.help_tr && question.answer_type !== "consent" && (
            <p className="mt-1 text-sm text-muted-foreground">{question.help_tr}</p>
          )}
        </div>

        <QuestionRenderer question={question} value={value} onChange={setAnswer} />

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
