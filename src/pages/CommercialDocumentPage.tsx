import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getCommercialDocumentBySlug } from "@/lib/commercial-documents";

const documentLoaders = import.meta.glob<string>("../content/commercial/*.html", {
  query: "?raw",
  import: "default",
});

const getDocumentLoader = (slug: string) =>
  documentLoaders[`../content/commercial/${slug}.html`];

const CommercialDocumentPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const document_ = slug ? getCommercialDocumentBySlug(slug) : undefined;
  const loader = slug ? getDocumentLoader(slug) : undefined;

  const [html, setHtml] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!loader) {
      return;
    }

    let cancelled = false;
    setHtml(null);
    setLoadFailed(false);

    loader()
      .then((content) => {
        if (!cancelled) {
          setHtml(content);
        }
      })
      .catch((error: unknown) => {
        console.error("Commercial document could not be loaded", error);
        if (!cancelled) {
          setLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loader]);

  useEffect(() => {
    if (document_) {
      document.title = `CorteQS | ${document_.title}`;
    }
  }, [document_]);

  if (!slug) {
    return <Navigate to="/commercial" replace />;
  }

  if (!document_ || !loader) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 pt-6">
        <Link
          to="/commercial"
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Commercial alanına dön
        </Link>
      </div>

      {loadFailed ? (
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <p className="text-base text-muted-foreground">
            {document_.title} dokümanı yüklenemedi. Lütfen sayfayı yenileyin veya daha sonra tekrar
            deneyin.
          </p>
        </div>
      ) : html ? (
        <article aria-label={document_.title} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <p className="text-base text-muted-foreground">Doküman yükleniyor…</p>
        </div>
      )}
    </div>
  );
};

export default CommercialDocumentPage;
