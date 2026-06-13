import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Search } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import WelcomePackOrderForm from "@/components/WelcomePackOrderForm";

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
  const { user, isLoading } = useAuth();
  const [query, setQuery] = useState("");

  // Dizin yalnızca giriş yapmış kullanıcılara açık. Ziyaretçiyi boş bir sonuç
  // sayfasına düşürmek yerine giriş/kayıt akışına yönlendirip aramayı next ile
  // koruyoruz — böylece giriş sonrası doğrudan sonuçlara iner.
  const goToDirectory = (search: string) => {
    const target = search ? `/directory?${search}` : "/directory";
    if (!isLoading && !user) {
      navigate(`/login?next=${encodeURIComponent(target)}`);
      return;
    }
    navigate(target);
  };

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    goToDirectory(`q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    goToDirectory(`q=${encodeURIComponent(term)}`);
  };

  const visitorHint = !isLoading && !user;

  return (
    <section id="diaspora-ara" className="relative scroll-mt-24 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
            🌍 Diasporada <span className="text-gradient-primary">Ara</span>
          </h2>
          <p className="mx-auto mb-5 max-w-xl text-sm text-muted-foreground">
            Şehir, kategori veya hizmet ara; 80+ kategoride binlerce profili keşfet.
          </p>

          {/* Dizin arama çubuğu */}
          <div className="max-w-2xl mx-auto mb-3">
            <div className="relative flex items-center rounded-2xl border border-white/70 bg-white/70 shadow-[0_22px_45px_-28px_rgba(15,23,42,0.26)] px-4 py-3 gap-3 backdrop-blur-xl">
              <label htmlFor="diaspora-search-input" className="sr-only">
                Diasporada ara
              </label>
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                id="diaspora-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Şehir, kategori veya hizmet ara"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
              />
              <button
                onClick={handleSearch}
                disabled={!query.trim()}
                className="shrink-0 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                Ara
              </button>
            </div>
          </div>

          {visitorHint ? (
            <p className="mx-auto mb-6 flex max-w-2xl items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Tam dizin için ücretsiz giriş gerekir — arama, giriş sonrası kaldığın yerden devam eder.
            </p>
          ) : (
            <div className="mb-6" />
          )}

          {/* Hızlı erişim butonları */}
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => handleQuickSearch("Konsolosluk")} className={`${quickPillClass} ${quickPillStyles.blue}`}>
                🏛️ Konsolosluk
              </button>
              <button
                onClick={() => handleQuickSearch("Şehir Elçisi")}
                className={`${quickPillClass} ${quickPillStyles.red}`}
              >
                🏅 Şehir Elçine Ulaş
              </button>
              <button onClick={() => handleQuickSearch("Vize danışmanı")} className={`${quickPillClass} ${quickPillStyles.yellow}`}>
                ✈️ Vize & Göçmenlik
              </button>
              <button onClick={() => handleQuickSearch("İş İlanları")} className={`${quickPillClass} ${quickPillStyles.green}`}>
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
                onClick={() => navigate(visitorHint ? "/login?next=%2Fcadde" : "/cadde")}
                title="Cadde sosyal ağı — giriş gerektirir"
                className={`${quickPillClass} ${quickPillStyles.blue}`}
              >
                🌍 Taşınma Motoru{visitorHint ? " (giriş gerekir)" : ""}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiasporaSearchBar;
