import type { SurveyStatus } from "@/lib/surveys";

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-slate-200 text-slate-800",
  published: "bg-emerald-200 text-emerald-900",
  closed: "bg-amber-200 text-amber-900",
  archived: "bg-slate-400 text-white",
};

export default function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[status] ?? STATUS_CLASS.draft}`}>
      {status}
    </span>
  );
}
