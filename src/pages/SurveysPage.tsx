import { useEffect, useState } from "react";
import SurveyCard from "@/components/surveys/SurveyCard";
import SurveyEmptyState from "@/components/surveys/SurveyEmptyState";
import { getPublishedSurveys, type Survey } from "@/lib/surveys";

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const rows = await getPublishedSurveys();
        if (!cancelled) setSurveys(rows);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Anketler yüklenemedi.";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf9_0%,#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">CorteQS Anketleri</h1>
          <p className="mt-2 text-sm text-slate-600">Topluluğumuzu birlikte geliştirmek için görüşlerini paylaş.</p>
        </header>

        {loading ? <p className="text-sm text-slate-600">Yükleniyor...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          surveys.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {surveys.map((survey) => (
                <SurveyCard key={survey.id} survey={survey} />
              ))}
            </div>
          ) : (
            <SurveyEmptyState />
          )
        ) : null}
      </div>
    </main>
  );
}
