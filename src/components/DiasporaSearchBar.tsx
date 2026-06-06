import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/directory?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    navigate(`/directory?q=${encodeURIComponent(term)}`);
  };

  return (
    <section className="relative py-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
            🌍 Diasporada <span className="text-gradient-primary">Ara</span>
          </h2>

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
                disabled={!query.trim()}
                className="shrink-0 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                Ara
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
                onClick={() => navigate("/cadde")}
                className={`${quickPillClass} ${quickPillStyles.blue}`}
              >
                🌍 Taşınma Motoru
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiasporaSearchBar;
