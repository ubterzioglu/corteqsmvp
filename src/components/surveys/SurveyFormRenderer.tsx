import { useMemo, useState } from "react";
import type { SurveyWithQuestions } from "@/lib/surveys";
import { submitSurveyResponse } from "@/lib/survey-responses";
import SurveyQuestionRenderer from "@/components/surveys/SurveyQuestionRenderer";

interface SurveyFormRendererProps {
  survey: SurveyWithQuestions;
  onSuccess: () => void;
}

export default function SurveyFormRenderer({ survey, onSuccess }: SurveyFormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactOptIn, setContactOptIn] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [startedAt] = useState(() => new Date().toISOString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const requiredQuestionIds = useMemo(
    () => survey.survey_questions.filter((question) => question.is_required).map((question) => question.id),
    [survey.survey_questions],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const nextFieldErrors: Record<string, string> = {};
    for (const questionId of requiredQuestionIds) {
      const value = answers[questionId];
      const missing =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0);
      if (missing) {
        nextFieldErrors[questionId] = "Bu alan zorunlu.";
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      await submitSurveyResponse({
        surveySlug: survey.slug,
        respondent: {
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          contactOptIn,
        },
        answers: survey.survey_questions.map((question) => ({
          questionId: question.id,
          value: answers[question.id],
        })),
        meta: {
          startedAt,
          honeypot,
        },
      });

      onSuccess();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Gönderim sırasında bir hata oluştu.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {survey.survey_questions.map((question) => (
        <SurveyQuestionRenderer
          key={question.id}
          question={question}
          value={answers[question.id]}
          error={fieldErrors[question.id]}
          onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
        />
      ))}

      <div className="space-y-3 rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-800">İletişim Bilgileri (Opsiyonel)</h3>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Ad Soyad"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          type="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="E-posta"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={contactOptIn} onChange={(event) => setContactOptIn(event.target.checked)} />
          Benimle iletişime geçilebilir.
        </label>
      </div>

      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
      />

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {submitting ? "Gönderiliyor..." : "Cevabımı Gönder"}
      </button>
    </form>
  );
}
