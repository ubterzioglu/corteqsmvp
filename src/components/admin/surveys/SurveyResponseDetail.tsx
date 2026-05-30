import type { ResponseRow } from "@/components/admin/surveys/SurveyResponsesTable";

export default function SurveyResponseDetail({ response }: { response: ResponseRow | null }) {
  if (!response) {
    return <p className="text-sm text-slate-500">Detay görmek için bir yanıt seç.</p>;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-base font-bold text-slate-900">Yanıt Detayı</h3>
      <div className="grid gap-2 text-sm text-slate-700">
        <p><span className="font-semibold">Gönderim:</span> {new Date(response.submitted_at).toLocaleString()}</p>
        <p><span className="font-semibold">Ad:</span> {response.respondent_name || "-"}</p>
        <p><span className="font-semibold">E-posta:</span> {response.respondent_email || "-"}</p>
        <p><span className="font-semibold">İletişim izni:</span> {response.contact_opt_in ? "Evet" : "Hayır"}</p>
      </div>

      <div className="space-y-3">
        {response.survey_answers.map((answer) => (
          <div key={answer.id} className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-800">{answer.survey_questions?.question || "Soru"}</p>
            <pre className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{JSON.stringify(answer.answer_value, null, 2)}</pre>
          </div>
        ))}
      </div>
    </section>
  );
}
