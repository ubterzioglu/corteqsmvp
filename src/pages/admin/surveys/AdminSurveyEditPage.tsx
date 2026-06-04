import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import SurveyBuilder from "@/components/admin/surveys/SurveyBuilder";
import { getSurveyById, type SurveyWithQuestions } from "@/lib/surveys";

export default function AdminSurveyEditPage() {
  const { id = "" } = useParams();
  const [survey, setSurvey] = useState<SurveyWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const row = await getSurveyById(id);
        if (!cancelled) setSurvey(row);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Anket yüklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (id) {
      void load();
    } else {
      setLoading(false);
      setError("Geçersiz anket id.");
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Anket Düzenle</h1>
      {loading ? <p className="text-sm text-slate-600">Yükleniyor...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && survey ? <SurveyBuilder initial={survey} onSaved={() => void 0} /> : null}
    </div>
  );
}
