import type { SurveyQuestion, SurveyQuestionType } from "@/lib/surveys";

const QUESTION_TYPES: SurveyQuestionType[] = ["long_text", "single_choice"];

type EditableQuestion = Partial<SurveyQuestion> & {
  localId: string;
  question: string;
  type: SurveyQuestionType;
  options: string[];
  is_required: boolean;
};

interface SurveyQuestionEditorProps {
  question: EditableQuestion;
  index: number;
  onChange: (next: EditableQuestion) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export type { EditableQuestion };

export default function SurveyQuestionEditor({
  question,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SurveyQuestionEditorProps) {
  const showOptions = question.type === "single_choice" || question.type === "multiple_choice";

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">Soru #{index + 1}</h4>
        <div className="flex gap-2">
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={onMoveUp}>Yukarı</button>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={onMoveDown}>Aşağı</button>
          <button type="button" className="rounded border border-red-300 px-2 py-1 text-xs text-red-700" onClick={onRemove}>Sil</button>
        </div>
      </div>

      <input
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="Soru metni"
        value={question.question}
        onChange={(e) => onChange({ ...question, question: e.target.value })}
      />

      <textarea
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="Açıklama (opsiyonel)"
        value={question.description ?? ""}
        onChange={(e) => onChange({ ...question, description: e.target.value })}
      />

      <input
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="Placeholder (opsiyonel)"
        value={question.placeholder ?? ""}
        onChange={(e) => onChange({ ...question, placeholder: e.target.value })}
      />

      <select
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        value={question.type}
        onChange={(e) => onChange({ ...question, type: e.target.value as SurveyQuestionType })}
      >
        {QUESTION_TYPES.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={question.is_required}
          onChange={(e) => onChange({ ...question, is_required: e.target.checked })}
        />
        Zorunlu
      </label>

      {showOptions ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">Seçenekler (satır satır)</p>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={(question.options ?? []).join("\n")}
            onChange={(e) =>
              onChange({
                ...question,
                options: e.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      ) : null}
    </div>
  );
}
