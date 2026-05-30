import type { SurveyQuestion } from "@/lib/surveys";

type SurveyQuestionRendererProps = {
  question: SurveyQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default function SurveyQuestionRenderer({ question, value, onChange, error }: SurveyQuestionRendererProps) {
  const options = Array.isArray(question.options) ? question.options.map((item) => String(item)) : [];

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 p-4">
      <label className="block text-sm font-semibold text-slate-800">
        {question.question}
        {question.is_required ? <span className="ml-1 text-red-600">*</span> : null}
      </label>
      {question.description ? <p className="text-xs text-slate-500">{question.description}</p> : null}

      {question.type === "short_text" || question.type === "email" ? (
        <input
          type={question.type === "email" ? "email" : "text"}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder={question.placeholder || ""}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {question.type === "long_text" ? (
        <textarea
          className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder={question.placeholder || ""}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {question.type === "single_choice" ? (
        <div className="space-y-2">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={question.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      ) : null}

      {question.type === "multiple_choice" ? (
        <div className="space-y-2">
          {options.map((opt) => {
            const current = asStringArray(value);
            const checked = current.includes(opt);
            return (
              <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...current, opt]
                      : current.filter((item) => item !== opt);
                    onChange(next);
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      ) : null}

      {question.type === "rating" ? (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              className={`h-10 w-10 rounded-full border text-sm font-semibold ${
                value === score ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {score}
            </button>
          ))}
        </div>
      ) : null}

      {question.type === "yes_no" ? (
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="radio" name={question.id} checked={value === true} onChange={() => onChange(true)} /> Evet
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="radio" name={question.id} checked={value === false} onChange={() => onChange(false)} /> Hayır
          </label>
        </div>
      ) : null}

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
