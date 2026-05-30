import { Link } from "react-router-dom";

export default function SurveySuccessMessage() {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-3xl font-black text-slate-900">Teşekkürler!</h1>
      <p className="mt-3 text-sm text-slate-600">
        Cevabın başarıyla alındı. CorteQS topluluğunu birlikte geliştirmek için paylaştığın görüşler çok değerli.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          Ana Sayfaya Dön
        </Link>
        <Link to="/anket" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          Diğer Anketleri Gör
        </Link>
      </div>
    </section>
  );
}
