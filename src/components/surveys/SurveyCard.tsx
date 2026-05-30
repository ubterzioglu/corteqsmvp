import { Link } from "react-router-dom";
import type { Survey } from "@/lib/surveys";

interface SurveyCardProps {
  survey: Survey;
}

export default function SurveyCard({ survey }: SurveyCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">{survey.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{survey.description || "Topluluk geri bildirimi için kısa bir anket."}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Aktif</span>
        <Link
          to={`/anket/${survey.slug}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          Ankete Katıl
        </Link>
      </div>
    </article>
  );
}
