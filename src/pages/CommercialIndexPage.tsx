import { FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { publicCommercialDocuments } from "@/lib/commercial-documents";

const CommercialIndexPage = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--section-warm))_52%,hsl(var(--background))_100%)]">
      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] opacity-90"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 10% 18%, hsl(var(--primary) / 0.18), transparent 28%), radial-gradient(circle at 88% 14%, hsl(var(--accent) / 0.14), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0))",
          }}
        />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_30px_80px_rgba(16,24,40,0.08)] backdrop-blur-xl md:p-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Commercial Docs
            </span>
            <h1 className="mt-5 max-w-4xl text-3xl font-black leading-[0.95] tracking-tight text-foreground md:text-5xl">
              Paylaşım ve teklif görüşmeleri için
              <span className="block text-primary">kısa doküman merkezi</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Bu alan, CorteQS rolleri ve iş birliği başlıkları hakkında hızlı bir ön bilgi sunmak için
              hazırlanmıştır. Aşağıdaki başlıklardan ilgili dokümana geçebilirsiniz.
            </p>
          </div>

          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {publicCommercialDocuments.map((document) => (
              <Link
                key={document.slug}
                to={`/commercial/${document.slug}`}
                className="group rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_28px_60px_rgba(15,23,42,0.1)]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <h2
                  className={
                    document.slug === "contributor"
                      ? "text-sm font-bold leading-7 text-foreground"
                      : "text-2xl font-bold text-foreground"
                  }
                >
                  {document.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{document.summary}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">Dokümana git</div>
              </Link>
            ))}
          </section>
        </div>
      </main>

    </div>
  );
};

export default CommercialIndexPage;
