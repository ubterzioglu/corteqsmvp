interface KadroSummaryProps {
  summary: {
    total: number;
    open: number;
    filled: number;
    criticalOpen: number;
  };
  orphanCount: number;
}

export function KadroSummary({ summary, orphanCount }: KadroSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Toplam</div>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.total}</div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Açık</div>
        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.open}</div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Dolu</div>
        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.filled}</div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Kritik & Açık</div>
        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.criticalOpen}</div>
      </div>

      {orphanCount > 0 && (
        <div className="col-span-2 md:col-span-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-red-800 dark:text-red-200">
              <strong>{orphanCount} veritabanı satırının kodda karşılığı yok.</strong> Bu satırların durumu ekranda görünmüyor. Rol anahtarı değişmiş olabilir.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
