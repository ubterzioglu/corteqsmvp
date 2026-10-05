import { BookOpen, Calendar, MessageSquare, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

import type { PublicContentSearchResult } from "@/lib/public-content-search";

type PublicContentSearchResultsProps = {
  results: PublicContentSearchResult[];
  isLoading: boolean;
  error?: string | null;
};

const PublicContentSearchResults = ({ results, isLoading, error }: PublicContentSearchResultsProps) => {
  if (isLoading) {
    return <p className="mb-6 text-sm text-muted-foreground">İçerikler aranıyor...</p>;
  }
  // A16: Arama hatası kullanıcıya gösterilir
  if (error) {
    return (
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-900">{error}</p>
      </div>
    );
  }
  if (results.length === 0) return null;

  return (
    <section className="mb-6 space-y-3" aria-labelledby="public-content-results-title">
      <div>
        <h2 id="public-content-results-title" className="text-base font-semibold text-foreground">
          İçerikler
        </h2>
        <p className="text-xs text-muted-foreground">
          Rehber yazıları ve CorteQS araçları; dizin sıralamasından ayrı gösterilir.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((result) => {
          const Icon = result.type === "tool" ? Wrench : result.type === "event" ? Calendar : result.type === "cadde" ? MessageSquare : BookOpen;
          const typeLabel = result.type === "tool" ? "Araç" : result.type === "event" ? "Etkinlik" : result.type === "cadde" ? "Cadde" : "Rehber yazısı";
          return (
            <Link
              key={`${result.type}-${result.id}`}
              to={result.href}
              className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <span className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Icon className="h-3.5 w-3.5" />
                {typeLabel}
              </span>
              <h3 className="font-semibold text-foreground">{result.title}</h3>
              {result.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{result.description}</p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default PublicContentSearchResults;
