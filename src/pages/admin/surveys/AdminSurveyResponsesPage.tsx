import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SurveyResponseDetail from "@/components/admin/surveys/SurveyResponseDetail";
import SurveyResponsesTable, { type ResponseRow } from "@/components/admin/surveys/SurveyResponsesTable";
import { getSurveyById } from "@/lib/surveys";
import { getSurveyResponses, updateResponseStatus } from "@/lib/survey-responses";

export default function AdminSurveyResponsesPage() {
  const { id = "" } = useParams();
  const [title, setTitle] = useState("");
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => responses.find((response) => response.id === selectedId) ?? null,
    [responses, selectedId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const survey = await getSurveyById(id);
      setTitle(survey.title);
      const rows = (await getSurveyResponses(id)) as ResponseRow[];
      setResponses(rows);
      if (!selectedId && rows.length > 0) {
        setSelectedId(rows[0].id);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cevaplar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [id, selectedId]);

  useEffect(() => {
    if (id) {
      void load();
    }
  }, [id, load]);

  const setStatus = async (status: "reviewed" | "archived") => {
    if (!selected) return;
    try {
      await updateResponseStatus(selected.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Durum güncellenemedi.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Anket Cevapları {title ? `- ${title}` : ""}</h1>
        <div className="flex gap-2">
          <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={() => void setStatus("reviewed")} disabled={!selected}>Reviewed</button>
          <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={() => void setStatus("archived")} disabled={!selected}>Archived</button>
        </div>
      </div>

      {loading ? <p className="text-sm text-slate-600">Yükleniyor...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <SurveyResponsesTable responses={responses} selectedId={selectedId} onSelect={setSelectedId} />
          <SurveyResponseDetail response={selected} />
        </div>
      ) : null}
    </div>
  );
}
