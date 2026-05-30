import type { SurveyQuestion } from "@/lib/surveys";

type ResponseRow = {
  id: string;
  submitted_at: string;
  respondent_name: string | null;
  respondent_email: string | null;
  contact_opt_in: boolean;
  status: string;
  survey_answers: Array<{
    id: string;
    answer_value: unknown;
    survey_questions: SurveyQuestion | null;
  }>;
};

interface SurveyResponsesTableProps {
  responses: ResponseRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function SurveyResponsesTable({ responses, selectedId, onSelect }: SurveyResponsesTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3">Gönderim</th>
            <th className="px-4 py-3">Ad</th>
            <th className="px-4 py-3">E-posta</th>
            <th className="px-4 py-3">İletişim</th>
            <th className="px-4 py-3">Durum</th>
            <th className="px-4 py-3">Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((response) => (
            <tr key={response.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{new Date(response.submitted_at).toLocaleString()}</td>
              <td className="px-4 py-3">{response.respondent_name || "-"}</td>
              <td className="px-4 py-3">{response.respondent_email || "-"}</td>
              <td className="px-4 py-3">{response.contact_opt_in ? "Evet" : "Hayır"}</td>
              <td className="px-4 py-3">{response.status}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className={`rounded border px-3 py-1 text-xs font-semibold ${selectedId === response.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`}
                  onClick={() => onSelect(response.id)}
                >
                  Detay
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { ResponseRow };
