import { BookOpen, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

import type { PublicContentSearchResult } from "@/lib/public-content-search";

type PublicContentSearchResultsProps = {
  results: PublicContentSearchResult[];
  isLoading: boolean;
};

const PublicContentSearchResults = ({ results, isLoading }: PublicContentSearchResultsProps) => {
  if (isLoading) {
    return <p className="mb-6 text-sm text-muted-foreground">İçerikler aranıyor...</p>;
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
          const Icon = result.type === "tool" ? Wrench : BookOpen;
          return (
            <Link
              key={`${result.type}-${result.id}`}
              to={result.href}
              className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <span className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Icon className="h-3.5 w-3.5" />
                {result.type === "tool" ? "Araç" : "Rehber yazısı"}
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
