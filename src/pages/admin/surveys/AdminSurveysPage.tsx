import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SurveyStatusBadge from "@/components/admin/surveys/SurveyStatusBadge";
import {
  archiveSurvey,
  closeSurvey,
  deleteSurvey,
  getAdminSurveys,
  publishSurvey,
  type AdminSurveyWithResponseCount,
} from "@/lib/surveys";

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<AdminSurveyWithResponseCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminSurveys();
      setSurveys(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anketler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runAction = async (action: () => Promise<unknown>) => {
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Anketler</h1>
        <Link to="/admin/surveys/new" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          Yeni Anket
        </Link>
      </div>

      {loading ? <p className="text-sm text-slate-600">Yükleniyor...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Cevap</th>
              <th className="px-4 py-3">Yayın</th>
              <th className="px-4 py-3">Oluşturma</th>
              <th className="px-4 py-3">Aksiyonlar</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((survey) => (
              <tr key={survey.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3 font-semibold text-slate-900">{survey.title}</td>
                <td className="px-4 py-3 text-slate-700">{survey.slug}</td>
                <td className="px-4 py-3"><SurveyStatusBadge status={survey.status} /></td>
                <td className="px-4 py-3 text-slate-700">{survey.survey_responses?.length ?? 0}</td>
                <td className="px-4 py-3 text-slate-700">{survey.published_at ? new Date(survey.published_at).toLocaleString() : "-"}</td>
                <td className="px-4 py-3 text-slate-700">{new Date(survey.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link className="rounded border px-2 py-1 text-xs" to={`/admin/surveys/${survey.id}/edit`}>Düzenle</Link>
                    <Link className="rounded border px-2 py-1 text-xs" to={`/admin/surveys/${survey.id}/responses`}>Cevapları Gör</Link>
                    <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => runAction(() => publishSurvey(survey.id))}>Yayınla</button>
                    <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => runAction(() => closeSurvey(survey.id))}>Kapat</button>
                    <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => runAction(() => archiveSurvey(survey.id))}>Arşivle</button>
                    <button type="button" className="rounded border border-red-300 px-2 py-1 text-xs text-red-700" onClick={() => runAction(() => deleteSurvey(survey.id))}>Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
