export default function SurveyEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="text-xl font-bold text-slate-900">Şu anda aktif anket bulunmuyor.</h2>
      <p className="mt-2 text-sm text-slate-600">Yeni anketler yakında burada yayınlanacak.</p>
    </div>
  );
}
