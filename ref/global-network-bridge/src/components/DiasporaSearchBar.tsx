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
    <section className="py-12 bg-muted/30">
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
            <div className="relative flex items-center bg-card border border-border rounded-2xl shadow-card px-4 py-3 gap-3">
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
                className="shrink-0 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ara"}
              </button>
            </div>
          </div>

          {/* Quick CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => handleQuickSearch("Konsolosluk")} className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              🏛️ Konsolosluk
            </button>
            <button onClick={() => handleQuickSearch("Doktor")} className="px-3 py-1.5 text-xs font-medium rounded-full bg-turquoise/10 text-turquoise hover:bg-turquoise/20 transition-colors">
              🩺 Doktor
            </button>
            <button onClick={() => handleQuickSearch("Hastane")} className="px-3 py-1.5 text-xs font-medium rounded-full bg-turquoise/10 text-turquoise hover:bg-turquoise/20 transition-colors">
              🏥 Hastane
            </button>
            <WelcomePackOrderForm
              trigger={
                <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
                  🎁 Hoşgeldin Paketi Oluştur
                </button>
              }
            />
            <button
              onClick={() => navigate("/relocation")}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors border border-secondary/20"
            >
              🌍 Taşınma Motoru
            </button>
            <button
              onClick={() => navigate("/consultants?filter=ambassador")}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition-colors border border-gold/20"
            >
              🏅 Şehir Elçine Ulaş
            </button>
            <button onClick={() => handleQuickSearch("Vize danışmanı")} className="px-3 py-1.5 text-xs font-medium rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition-colors">
              ✈️ Vize & Göçmenlik
            </button>
            <button onClick={() => handleQuickSearch("Türk marketi")} className="px-3 py-1.5 text-xs font-medium rounded-full bg-success/10 text-success hover:bg-success/20 transition-colors">
              🛒 Türk Marketi
            </button>
            <button onClick={() => handleQuickSearch("İş ilanları")} className="px-3 py-1.5 text-xs font-medium rounded-full bg-accent/10 text-accent-foreground hover:bg-accent/20 transition-colors">
              💼 İş İlanları
            </button>
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

          {/* Sponsor */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground font-body mb-2">Sponsor</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">✈️</span>
              <span className="text-sm font-semibold text-foreground">Türk Hava Yolları</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiasporaSearchBar;
