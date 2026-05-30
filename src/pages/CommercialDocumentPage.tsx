import { useEffect } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getCommercialDocumentBySlug } from "@/lib/commercial-documents";

const CommercialDocumentPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const document = slug ? getCommercialDocumentBySlug(slug) : undefined;
  const standalonePath = document?.standalonePath;

  useEffect(() => {
    const isJsdom = typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");

    if (standalonePath && !isJsdom) {
      window.location.replace(standalonePath);
    }
  }, [standalonePath]);

  if (!slug) {
    return <Navigate to="/commercial" replace />;
  }

  if (!document) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--section-warm))_52%,hsl(var(--background))_100%)]">
      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] opacity-90"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 12% 18%, hsl(var(--primary) / 0.2), transparent 26%), radial-gradient(circle at 84% 14%, hsl(var(--accent) / 0.14), transparent 22%), linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0))",
          }}
        />

        <div className="container relative z-10 mx-auto max-w-5xl px-4 py-12 md:py-16">
          <Link
            to="/commercial"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur transition-colors hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Commercial alanına dön
          </Link>

          <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_rgba(16,24,40,0.08)] backdrop-blur-xl md:p-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Commercial Document
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-foreground md:text-5xl">
                {document.title}
              </h1>
              <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
                {document.summary}
              </p>
            </div>

            <div className="mt-8 h-px bg-gradient-to-r from-primary/25 via-accent/25 to-transparent" />

            {standalonePath ? (
              <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
                <p className="text-base leading-8 text-muted-foreground md:text-lg">
                  {document.title} dokümanı bağımsız HTML sayfası olarak açılıyor. Böylece iç scroll
                  olmadan normal sayfa gibi gezebilir ve istersen doğrudan <strong>Save As</strong> ile
                  kaydedebilirsin.
                </p>
                <a
                  href={standalonePath}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
                >
                  Standalone {document.title.toLowerCase()} dokümanını aç
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <article
                className="commercial-prose mt-8"
                dangerouslySetInnerHTML={{ __html: document.html ?? "" }}
              />
            )}
          </section>

          <section className="mt-8 rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">İletişim</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Bu doküman görüşme öncesi hızlı bir çerçeve sunar. Daha detaylı bilgi için doğrudan
                  CorteQS ekibiyle iletişime geçebilirsiniz.
                </p>
              </div>
              <a
                href="mailto:info@corteqs.net"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
              >
                info@corteqs.net
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </section>
        </div>
      </main>

    </div>
  );
};

export default CommercialDocumentPage;
