import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SurveyFormRenderer from "@/components/surveys/SurveyFormRenderer";
import { getPublishedSurveyBySlug, type SurveyWithQuestions } from "@/lib/surveys";
import { SEO_SITE_NAME, useSeo } from "@/lib/seo";

/**
 * Ankete özel açıklama. Anketin kendi `description`'ı varsa o kullanılır; yoksa
 * başlıktan anlamlı bir cümle kurulur. Boş bırakmak yerine üretmenin sebebi:
 * açıklama yoksa arama sonucunda Google sayfadan rastgele bir parça seçer ve
 * anket formunun ham etiketleri çıkar.
 */
function buildSurveyDescription(title: string, description: string | null): string {
  const own = description?.trim();
  if (own) return own.length > 300 ? `${own.slice(0, 297)}...` : own;
  return `${title} anketine katıl — CorteQS Türk diasporası topluluğunun görüş toplama anketi. Katılım ücretsiz, birkaç dakika sürer.`;
}

export default function SurveyDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<SurveyWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const row = await getPublishedSurveyBySlug(slug);
        if (!cancelled) {
          if (!row) {
            setError("Anket bulunamadı veya yayında değil.");
          } else {
            setSurvey(row);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Anket yüklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (slug) {
      void load();
    } else {
      setLoading(false);
      setError("Geçersiz anket bağlantısı.");
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // SEO: anket yüklenene kadar kabuğun genel başlığı durur, yüklenince ankete özel
  // başlık/açıklama yazılır. `canonicalPath` VERİLMEZ — seo.ts o zaman mevcut
  // pathname'i (query/hash olmadan) kullanır, yani her anket kendi adresini kanonik
  // ilan eder. Sabit bir değer yazmak tüm anketleri tek URL'de birleştirirdi.
  // Anket bulunamadıysa `noindex`: yayında olmayan bir anket arama sonucunda
  // görünmemeli (soft-404 sınıfı).
  useSeo(
    survey
      ? {
          title: `${survey.title} | ${SEO_SITE_NAME}`,
          description: buildSurveyDescription(survey.title, survey.description),
          ogType: "article",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: survey.title,
            description: buildSurveyDescription(survey.title, survey.description),
            inLanguage: "tr",
            isPartOf: { "@type": "WebSite", name: SEO_SITE_NAME },
          },
        }
      : error
        ? { robots: "noindex, follow" }
        : {},
    [survey?.slug, survey?.title, survey?.description, error],
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf9_0%,#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {loading ? <p className="text-sm text-slate-600">Yükleniyor...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {survey ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">{survey.title}</h1>
            {survey.description ? <p className="mt-2 text-sm text-slate-600">{survey.description}</p> : null}
            <div className="mt-6">
              <SurveyFormRenderer survey={survey} onSuccess={() => navigate("/anket/tesekkurler")} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
