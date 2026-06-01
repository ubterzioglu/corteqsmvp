import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useDiaspora } from "@/contexts/DiasporaContext";
import WelcomePackOrderForm from "@/components/WelcomePackOrderForm";
import { searchDiaspora, type DiasporaSearchResult } from "@/lib/diasporaSearch";

const quickPillClass =
  "inline-flex min-w-[168px] items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold shadow-[0_10px_28px_-20px_rgba(15,23,42,0.24)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-22px_rgba(15,23,42,0.3)]";

const quickPillStyles = {
  blue: "border-[#4285F4]/35 bg-[linear-gradient(135deg,rgba(66,133,244,0.12),rgba(66,133,244,0.2))] text-[#185ABC] hover:bg-[linear-gradient(135deg,rgba(66,133,244,0.18),rgba(66,133,244,0.26))]",
  red: "border-[#EA4335]/35 bg-[linear-gradient(135deg,rgba(234,67,53,0.12),rgba(234,67,53,0.2))] text-[#C5221F] hover:bg-[linear-gradient(135deg,rgba(234,67,53,0.18),rgba(234,67,53,0.26))]",
  yellow: "border-[#FBBC05]/45 bg-[linear-gradient(135deg,rgba(251,188,5,0.14),rgba(251,188,5,0.24))] text-[#B06000] hover:bg-[linear-gradient(135deg,rgba(251,188,5,0.2),rgba(251,188,5,0.3))]",
  green: "border-[#34A853]/35 bg-[linear-gradient(135deg,rgba(52,168,83,0.12),rgba(52,168,83,0.2))] text-[#137333] hover:bg-[linear-gradient(135deg,rgba(52,168,83,0.18),rgba(52,168,83,0.26))]",
} as const;

const DiasporaSearchBar = () => {
  const navigate = useNavigate();
  const { selectedCountry } = useDiaspora();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DiasporaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    const country = selectedCountry === "all" ? null : selectedCountry;
    const matchedResults = searchDiaspora(trimmedQuery, country);
    setResults(matchedResults);
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    runSearch(query);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    setLoading(true);
    setHasSearched(true);
    runSearch(term);
    setLoading(false);
  };

  const typeToRoute: Record<string, string> = {
    consultant: "/directory",
    association: "/directory",
    business: "/cadde",
    event: "/radar",
  };

  return (
    <section className="relative py-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
            🌍 Diasporada <span className="text-gradient-primary">Ara</span>
          </h2>
          <p className="text-muted-foreground text-sm font-body mb-6">
            Konsolosluk, doktor, market, iş ilanı ve daha fazlasını anında bul
          </p>

          {/* AI Chat Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative flex items-center rounded-2xl border border-white/70 bg-white/70 shadow-[0_22px_45px_-28px_rgba(15,23,42,0.26)] px-4 py-3 gap-3 backdrop-blur-xl">
              <span className="text-xl">🤖</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ne arıyorsun? Örn: 'En yakın konsolosluk nerede?' veya 'Vize danışmanı bul'"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
              />
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="shrink-0 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ara"}
              </button>
            </div>
          </div>

          {/* Quick CTA Buttons */}
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => handleQuickSearch("Konsolosluk")} className={`${quickPillClass} ${quickPillStyles.blue}`}>
                🏛️ Konsolosluk
              </button>
              <button
                onClick={() => navigate("/directory")}
                className={`${quickPillClass} ${quickPillStyles.red}`}
              >
                🏅 Şehir Elçine Ulaş
              </button>
              <button onClick={() => handleQuickSearch("Vize danışmanı")} className={`${quickPillClass} ${quickPillStyles.yellow}`}>
                ✈️ Vize & Göçmenlik
              </button>
              <button onClick={() => handleQuickSearch("İş ilanları")} className={`${quickPillClass} ${quickPillStyles.green}`}>
                💼 İş İlanları
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <WelcomePackOrderForm
                trigger={
                  <button className={`${quickPillClass} ${quickPillStyles.red}`}>
                    🎁 Hoşgeldin Paketi Oluştur
                  </button>
                }
              />
              <button
                onClick={() => navigate("/cadde")}
                className={`${quickPillClass} ${quickPillStyles.blue}`}
              >
                🌍 Taşınma Motoru
              </button>
            </div>
          </div>

          {/* Search Results */}
          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">AI aranıyor...</span>
            </div>
          )}

          {!loading && hasSearched && results.length > 0 && (
            <div className="max-w-2xl mx-auto mt-6 space-y-3">
              {results.map((r, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const route = typeToRoute[r.type];
                    if (route) navigate(route);
                  }}
                  className="flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3 text-left hover:shadow-md transition-shadow cursor-pointer"
                >
                  <span className="text-2xl mt-0.5">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-foreground">{r.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{r.category}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">📍 {r.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">Sonuç bulunamadı. Farklı bir arama deneyin.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default DiasporaSearchBar;
