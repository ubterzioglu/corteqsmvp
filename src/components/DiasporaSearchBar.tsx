import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDiaspora } from "@/contexts/DiasporaContext";
import WelcomePackOrderForm from "@/components/WelcomePackOrderForm";

interface SearchResult {
  title: string;
  description: string;
  category: string;
  location: string;
  type: string;
  icon: string;
}

const quickPillClass =
  "inline-flex items-center gap-1.5 rounded-full border border-orange-200/70 bg-[linear-gradient(135deg,rgba(255,243,236,0.92),rgba(255,233,220,0.98))] px-4 py-2 text-xs font-medium text-orange-700 shadow-[0_10px_28px_-20px_rgba(249,115,22,0.28)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,rgba(255,238,228,0.96),rgba(255,225,207,1))] hover:text-orange-800 hover:shadow-[0_16px_36px_-22px_rgba(249,115,22,0.34)]";

const DiasporaSearchBar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedCountry } = useDiaspora();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("diaspora-search", {
        body: { query: query.trim(), country: selectedCountry === "all" ? null : selectedCountry },
      });
      if (error) throw error;
      setResults(data?.results || []);
    } catch (e: any) {
      toast({ title: "Arama hatası", description: e.message || "Bir hata oluştu", variant: "destructive" });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    setLoading(true);
    setHasSearched(true);
    supabase.functions.invoke("diaspora-search", {
      body: { query: term, country: selectedCountry === "all" ? null : selectedCountry },
    }).then(({ data, error }) => {
      if (error) {
        toast({ title: "Arama hatası", description: "Bir hata oluştu", variant: "destructive" });
        setResults([]);
      } else {
        setResults(data?.results || []);
      }
      setLoading(false);
    });
  };

  const typeToRoute: Record<string, string> = {
    consultant: "/consultants",
    association: "/associations",
    business: "/businesses",
    event: "/events",
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
              <button onClick={() => handleQuickSearch("Konsolosluk")} className={quickPillClass}>
                🏛️ Konsolosluk
              </button>
              <button onClick={() => handleQuickSearch("Doktor")} className={quickPillClass}>
                🩺 Doktor
              </button>
              <button onClick={() => handleQuickSearch("Hastane")} className={quickPillClass}>
                🏥 Hastane
              </button>
              <button
                onClick={() => navigate("/consultants?filter=ambassador")}
                className={quickPillClass}
              >
                🏅 Şehir Elçine Ulaş
              </button>
              <button onClick={() => handleQuickSearch("Vize danışmanı")} className={quickPillClass}>
                ✈️ Vize & Göçmenlik
              </button>
              <button onClick={() => handleQuickSearch("Türk marketi")} className={quickPillClass}>
                🛒 Türk Marketi
              </button>
              <button onClick={() => handleQuickSearch("İş ilanları")} className={quickPillClass}>
                💼 İş İlanları
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <WelcomePackOrderForm
                trigger={
                  <button className={quickPillClass}>
                    🎁 Hoşgeldin Paketi Oluştur
                  </button>
                }
              />
              <button
                onClick={() => navigate("/relocation")}
                className={quickPillClass}
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
