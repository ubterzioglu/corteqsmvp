import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Cloud, TrendingUp, Briefcase, Newspaper, MapPin, Search, Globe, BookOpen, FileText, Library, Radio, ExternalLink, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cityMeta, categoryConfig, getFilteredNews, searchAllNews, getDiasporaMedia, type NewsCategory, type DiasporaMediaItem } from "@/data/cityNewsData";
import CityWeatherWidget from "@/components/city-news/CityWeatherWidget";
import NewsCard from "@/components/city-news/NewsCard";
import CountryCitySelector from "@/components/CountryCitySelector";
import { useDiaspora } from "@/contexts/DiasporaContext";
import { getDiasporaBlogLinks } from "@/lib/diasporaBlogLinks";

const mediaTypeMeta = {
  magazine: { label: "Dergi", icon: BookOpen, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
  newspaper: { label: "Gazete", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  book: { label: "Kitap", icon: Library, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
} as const;

type ExtCategory = NewsCategory | "diaspora";

const CityNews = () => {
  const { selectedCountry: country } = useDiaspora();
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState<ExtCategory>("all");
  const [keyword, setKeyword] = useState("");

  // Reset city when country changes
  useEffect(() => { setCity("all"); }, [country]);

  // Filter cityMeta by selected country & city
  const filteredCityMetas = useMemo(() => {
    return cityMeta.filter(c => {
      const matchesCountry = country === "all" || c.country === country;
      const matchesCity = city === "all" || c.city === city;
      return matchesCountry && matchesCity;
    });
  }, [country, city]);

  // If a specific city is selected, use that; otherwise show first matching city for weather
  const currentMeta = useMemo(() => {
    if (city !== "all") return cityMeta.find(c => c.city === city) || cityMeta[0];
    if (country !== "all") return cityMeta.find(c => c.country === country) || cityMeta[0];
    return cityMeta[0];
  }, [city, country]);

  // Get news for all matching cities
  const { allLocal, allInternational } = useMemo(() => {
    const cities = filteredCityMetas.map(c => c.city);
    let localNews: ReturnType<typeof getFilteredNews>["local"] = [];
    let intlNews: ReturnType<typeof getFilteredNews>["international"] = [];
    cities.forEach(cityName => {
      const newsCat: NewsCategory = category === "diaspora" ? "all" : category;
      const { local, international } = getFilteredNews(cityName, newsCat, keyword);
      localNews = [...localNews, ...local];
      intlNews = [...intlNews, ...international];
    });
    return { allLocal: localNews, allInternational: intlNews };
  }, [filteredCityMetas, category, keyword]);

  // Cross-city keyword search results (cities NOT in current filter)
  const crossCityResults = useMemo(() => {
    if (!keyword.trim()) return [];
    const currentCities = filteredCityMetas.map(c => c.city);
    const newsCat: NewsCategory = category === "diaspora" ? "all" : category;
    return searchAllNews(newsCat, keyword).filter(n => !currentCities.includes(n.city));
  }, [keyword, category, filteredCityMetas]);

  // Diaspora media (magazines, newspapers, books) for current country/city scope
  const diasporaMedia = useMemo(() => {
    return getDiasporaMedia(city !== "all" ? city : undefined, country !== "all" ? country : undefined);
  }, [city, country]);

  const mediaByType = useMemo(() => {
    return {
      magazine: diasporaMedia.filter(m => m.type === "magazine"),
      newspaper: diasporaMedia.filter(m => m.type === "newspaper"),
      book: diasporaMedia.filter(m => m.type === "book"),
    };
  }, [diasporaMedia]);

  const blogLinks = useMemo(() => {
    const items = getDiasporaBlogLinks(city !== "all" ? city : undefined, country !== "all" ? country : undefined);
    const kw = keyword.toLowerCase().trim();
    if (!kw) return items;
    return items.filter(b =>
      b.title.toLowerCase().includes(kw) ||
      (b.description || "").toLowerCase().includes(kw) ||
      b.author.toLowerCase().includes(kw)
    );
  }, [city, country, keyword]);

  const locationLabel = city !== "all" ? city : country !== "all" ? country : "Tüm Şehirler";
  const isDiasporaOnly = category === "diaspora";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Newspaper className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Şehrinizden Haberler</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
            Diaspora Şehir Haberleri
          </h1>
          <p className="text-muted-foreground font-body">Yaşadığınız şehirden güncel hava durumu, ekonomi ve kariyer haberleri</p>
        </div>

        {/* Search + Category Filters + City Dropdown (right) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Anahtar kelime ile ara..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(categoryConfig) as [NewsCategory, typeof categoryConfig["all"]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    category === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </button>
              );
            })}
            <button
              onClick={() => setCategory("diaspora")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                category === "diaspora"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              Türk Diaspora Medyası
            </button>
          </div>
          <div className="sm:ml-auto">
            <CountryCitySelector city={city} onCityChange={setCity} />
          </div>
        </div>

        {/* Weather Widget - show for specific city */}
        {city !== "all" && (
          <CityWeatherWidget city={currentMeta.city} weather={currentMeta.weather} />
        )}

        {/* Local Sources Bar */}
        {city !== "all" && currentMeta && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">Yerel Kaynaklar:</span>
            {currentMeta.localSources.map((s) => (
              <Badge key={s.name} variant="secondary" className="text-xs gap-1">
                <Newspaper className="h-3 w-3" />
                {s.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Local News Section */}
        {!isDiasporaOnly && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {locationLabel} Yerel Haberler
            </h2>
            {allLocal.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allLocal.map((news) => (
                  <NewsCard key={news.id} news={news} showCity={city === "all"} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Newspaper className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Bu filtrede yerel haber bulunamadı.</p>
              </div>
            )}
          </div>
        )}

        {/* Türk Diaspora Medyası — Blogger Linkleri */}
        {isDiasporaOnly && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <PenLine className="h-5 w-5 text-primary" />
                {locationLabel} — Blogger & Yazar Yazıları
                <span className="text-xs font-normal text-muted-foreground ml-1">Türk Diaspora Medyası</span>
              </h2>
              <Badge variant="secondary" className="text-xs">{blogLinks.length} yazı</Badge>
            </div>
            {blogLinks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {blogLinks.map((b) => (
                  <a
                    key={b.id}
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1">
                        <Radio className="h-3 w-3" /> Diaspora Blog
                      </Badge>
                      {b.city && <Badge variant="outline" className="text-[10px]">{b.city}</Badge>}
                    </div>
                    <h3 className="font-bold text-foreground leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">{b.title}</h3>
                    <p className="text-xs text-primary font-medium mb-2">{b.author}</p>
                    {b.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{b.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" /> Yazıyı Aç
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <PenLine className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Bu lokasyonda henüz yayınlanmış blog yazısı yok.</p>
              </div>
            )}
          </div>
        )}

        {/* Diaspora Medya — Dergi · Gazete · Kitap */}
        {diasporaMedia.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Library className="h-5 w-5 text-primary" />
                {locationLabel} Diaspora Medyası
                <span className="text-xs font-normal text-muted-foreground ml-1">Dergi · Gazete · Kitap</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="gap-1"><BookOpen className="h-3 w-3" />{mediaByType.magazine.length} Dergi</Badge>
                <Badge variant="secondary" className="gap-1"><FileText className="h-3 w-3" />{mediaByType.newspaper.length} Gazete</Badge>
                <Badge variant="secondary" className="gap-1"><Library className="h-3 w-3" />{mediaByType.book.length} Kitap</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {diasporaMedia.map((m) => {
                const meta = mediaTypeMeta[m.type];
                const Icon = meta.icon;
                return (
                  <article key={m.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all">
                    {m.cover && (
                      <div className="aspect-[16/9] overflow-hidden bg-muted">
                        <img src={m.cover} alt={m.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.bg} ${meta.color}`}>
                          <Icon className="h-3 w-3" />{meta.label}
                        </span>
                        {m.frequency && <Badge variant="outline" className="text-[10px]">{m.frequency}</Badge>}
                        {m.language && <Badge variant="outline" className="text-[10px]">{m.language}</Badge>}
                        {m.year && <Badge variant="outline" className="text-[10px]">{m.year}</Badge>}
                      </div>
                      <h3 className="font-bold text-foreground leading-snug mb-1 line-clamp-2">{m.title}</h3>
                      <p className="text-xs text-primary font-medium mb-2">{m.publisher}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{m.description}</p>
                      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{m.city}, {m.country}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* International News Section */}
        {!isDiasporaOnly && allInternational.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Uluslararası Basında {locationLabel}
              <span className="text-xs font-normal text-muted-foreground ml-1">BBC · CNN · Reuters</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {allInternational.map((news) => (
                <NewsCard key={news.id} news={news} isInternational showCity={city === "all"} />
              ))}
            </div>
          </div>
        )}

        {/* Cross-city keyword results */}
        {!isDiasporaOnly && crossCityResults.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Diğer Şehirlerde "{keyword}" ile İlgili Haberler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {crossCityResults.slice(0, 6).map((news) => (
                <NewsCard key={news.id} news={news} showCity />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CityNews;
