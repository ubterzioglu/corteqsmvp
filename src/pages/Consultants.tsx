import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Star, Bot, Video, UserPlus, UserCheck, Home, Plane, Briefcase, Scale, TrendingUp, Heart, Flag, Crown, Stethoscope, Users, GraduationCap, ShieldCheck, Landmark, Truck, Building2, Globe, Baby, Brain, Package, MessageCircle } from "lucide-react";
import MapShareButtons from "@/components/MapShareButtons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import CountryCitySelector from "@/components/CountryCitySelector";
import { useDiaspora } from "@/contexts/DiasporaContext";
import { consultants, cityAmbassadors } from "@/data/mock";
import { countryCities } from "@/data/countryCities";
import { useToast } from "@/hooks/use-toast";
import { useFollow } from "@/hooks/useFollow";
import DemoBadge from "@/components/DemoBadge";
import CategoryListingBanner from "@/components/CategoryListingBanner";
import InterestForm from "@/components/InterestForm";

// Each filter can match by `category` and/or by keywords found in role/specialties/bio.
// `subs` are sub-category chips that appear under the row when this filter is active.
type SubFilter = { key: string; label: string; keywords: string[] };
type CategoryFilter = {
  key: string;
  label: string;
  icon: typeof Home | null;
  category?: string;
  keywords?: string[];
  subs?: SubFilter[];
};

const categoryFilters: CategoryFilter[] = [
  { key: "all", label: "Tümü", icon: null },
  { key: "ambassador", label: "Şehir Elçileri", icon: Flag },

  // Main categories with sub-filters
  {
    key: "Gayrimenkul", label: "Gayrimenkul", icon: Home, category: "Gayrimenkul",
    subs: [
      { key: "ev-kiralama", label: "Ev kiralama", keywords: ["kiralama", "kiralık", "rental"] },
      { key: "ev-satin-alma", label: "Ev satın alma", keywords: ["satın alma", "alım", "satılık"] },
      { key: "ticari-gm", label: "Ticari gayrimenkul", keywords: ["ticari", "ofis", "commercial"] },
      { key: "yatirim-gm", label: "Yatırım danışmanlığı", keywords: ["yatırım"] },
      { key: "mortgage-gm", label: "Mortgage / kredi", keywords: ["mortgage", "kredi"] },
      { key: "relocation-housing", label: "Relocation housing", keywords: ["relocation", "konut"] },
    ],
  },
  {
    key: "Vize & Göçmenlik", label: "Vize & Göçmenlik", icon: Plane, category: "Vize & Göçmenlik",
    subs: [
      { key: "ogrenci-vize", label: "Öğrenci vizesi", keywords: ["öğrenci vizesi", "student visa"] },
      { key: "calisma-vize", label: "Çalışma vizesi", keywords: ["çalışma vizesi", "work visa"] },
      { key: "blue-card", label: "Blue Card", keywords: ["blue card", "eu blue card"] },
      { key: "oturum-pr", label: "Oturum & PR", keywords: ["oturum", "permanent"] },
      { key: "vatandaslik", label: "Vatandaşlık", keywords: ["vatandaşlık", "citizenship"] },
      { key: "aile-birlesimi", label: "Aile birleşimi", keywords: ["aile birleşimi", "family reunion"] },
      { key: "iltica", label: "İltica / asylum", keywords: ["iltica", "asylum"] },
      { key: "golden-visa-sub", label: "Golden Visa", keywords: ["golden visa", "yatırımcı vizesi"] },
    ],
  },
  {
    key: "Şirket & İş", label: "Şirket Kuruluşu & İş", icon: Briefcase, category: "Şirket & İş",
    subs: [
      { key: "sirket-kurulus", label: "Şirket kuruluş", keywords: ["şirket kuruluş", "company setup"] },
      { key: "freelance-setup", label: "Freelance / self-employed", keywords: ["freelance", "self-employed", "serbest"] },
      { key: "startup", label: "Startup danışmanlığı", keywords: ["startup", "girişim"] },
      { key: "is-gelistirme", label: "İş geliştirme", keywords: ["iş geliştirme", "business development"] },
      { key: "is-bulma", label: "Yerel iş bulma", keywords: ["iş bulma", "işe alım", "recruit"] },
      { key: "cv-koc", label: "CV / interview koçluğu", keywords: ["cv", "interview", "mülakat"] },
      { key: "networking", label: "Networking", keywords: ["networking", "network"] },
      { key: "free-zone-sub", label: "Free Zone", keywords: ["free zone", "freezone", "mainland"] },
    ],
  },
  {
    key: "Hukuk & Vergi", label: "Hukuk & Vergi", icon: Scale, category: "Hukuk & Vergi",
    subs: [
      { key: "bireysel-vergi", label: "Bireysel vergi", keywords: ["bireysel vergi", "kişisel vergi"] },
      { key: "sirket-vergi", label: "Şirket vergisi", keywords: ["şirket vergisi", "corporate tax"] },
      { key: "uluslararasi-vergi", label: "Uluslararası vergi", keywords: ["uluslararası vergi", "international tax"] },
      { key: "gocmen-hukuku", label: "Göçmen hukuku", keywords: ["göçmen hukuku", "immigration law"] },
      { key: "is-hukuku", label: "İş hukuku", keywords: ["iş hukuku", "labor law"] },
      { key: "sozlesme-hukuku", label: "Sözleşme hukuku", keywords: ["sözleşme", "contract"] },
      { key: "sirket-kurulus-hukuku", label: "Şirket kuruluş hukuku", keywords: ["şirket kuruluş hukuku"] },
    ],
  },
  {
    key: "Finansal", label: "Finansal", icon: TrendingUp, category: "Finansal",
    subs: [
      { key: "banka-hesap", label: "Banka hesabı açma", keywords: ["banka hesabı", "bank account"] },
      { key: "kredi-finans", label: "Kredi & finansman", keywords: ["kredi", "finansman"] },
      { key: "yatirim-fin", label: "Yatırım danışmanlığı", keywords: ["yatırım"] },
      { key: "sigorta-fin", label: "Sigorta danışmanlığı", keywords: ["sigorta", "insurance"] },
      { key: "emeklilik", label: "Emeklilik planlama", keywords: ["emeklilik", "pension"] },
      { key: "butce", label: "Bütçe yönetimi", keywords: ["bütçe", "budget"] },
    ],
  },
  {
    key: "Yaşam & Relocation", label: "Yaşam & Relocation", icon: Heart, category: "Yaşam & Relocation",
    subs: [
      { key: "adaptasyon", label: "Şehre adaptasyon", keywords: ["adaptasyon", "şehre"] },
      { key: "kulturel", label: "Kültürel entegrasyon", keywords: ["kültürel", "entegrasyon"] },
      { key: "dil-okulu", label: "Dil okulları", keywords: ["dil okulu", "language school"] },
      { key: "gunluk-yasam", label: "Günlük yaşam rehberi", keywords: ["günlük yaşam", "rehber"] },
      { key: "burokratik", label: "Bürokratik işlemler", keywords: ["bürokratik", "resmi evrak"] },
      { key: "tasinma-plan", label: "Taşınma planlama", keywords: ["taşınma", "moving"] },
      { key: "doktor-sub", label: "Doktor & Diş", keywords: ["doktor", "diş", "hekim"] },
      { key: "tasimacilik-sub", label: "Taşımacılık", keywords: ["taşımacı", "nakliye", "moving"] },
    ],
  },

  // Strategic cross-cutting quick-access chips
  { key: "doktor", label: "Doktor & Diş Hekimleri", icon: Stethoscope, keywords: ["doktor", "diş", "hekim", "pratisyen", "sağlık"] },
  { key: "ik", label: "İK Profesyonelleri", icon: Users, keywords: ["ik ", "i̇k ", "insan kaynakları", "kariyer", "işe alım", "headhunter", "recruit"] },
  { key: "sigorta", label: "Sağlık Sigortası", icon: ShieldCheck, keywords: ["sigorta", "insurance"] },
  { key: "mortgage", label: "Mortgage & Finans", icon: Landmark, keywords: ["mortgage", "kredi", "finansman"] },

  // Extra differentiator categories
  {
    key: "aile-cocuk", label: "Aile & Çocuk", icon: Baby,
    keywords: ["aile", "çocuk", "kreş", "daycare", "playdate"],
    subs: [
      { key: "okul-secimi", label: "Okul seçimi", keywords: ["okul seçimi"] },
      { key: "kres", label: "Kreş / daycare", keywords: ["kreş", "daycare"] },
      { key: "playdate", label: "Playdate & sosyal çevre", keywords: ["playdate", "sosyal çevre"] },
      { key: "aile-tasinma", label: "Aile taşınma", keywords: ["aile taşınma"] },
    ],
  },
  {
    key: "wellbeing", label: "Psikolog & Koç", icon: Brain,
    keywords: ["psikolog", "terapi", "koç", "göçmen psikolojisi", "stres", "adaptasyon", "wellbeing"],
    subs: [
      { key: "psikolog", label: "Psikolog / terapi", keywords: ["psikolog", "terapi"] },
      { key: "kocluk", label: "Koçluk", keywords: ["koç", "coaching"] },
      { key: "gocmen-psik", label: "Göçmen psikolojisi", keywords: ["göçmen psikolojisi"] },
      { key: "stres", label: "Stres & adaptasyon", keywords: ["stres", "adaptasyon"] },
    ],
  },
  {
    key: "egitim-akademik", label: "Eğitim", icon: GraduationCap,
    keywords: ["üniversite", "denklik", "burs", "kariyer yönlendirme", "akademik", "staj"],
    subs: [
      { key: "uni-basvuru", label: "Üniversite başvuruları", keywords: ["üniversite başvuru", "üniversite"] },
      { key: "denklik", label: "Denklik işlemleri", keywords: ["denklik"] },
      { key: "burs", label: "Burs danışmanlığı", keywords: ["burs"] },
      { key: "kariyer-yon", label: "Kariyer yönlendirme", keywords: ["kariyer yönlendirme"] },
      { key: "staj", label: "Staj", keywords: ["staj", "internship"] },
    ],
  },
  {
    key: "pratik-hayat", label: "Pratik Hayat", icon: Package,
    keywords: ["araç", "ehliyet", "telefon", "internet", "abonelik", "sim"],
    subs: [
      { key: "arac", label: "Araç alım / kiralama", keywords: ["araç alım", "araç kiralama", "araç"] },
      { key: "ehliyet-d", label: "Ehliyet dönüşümü", keywords: ["ehliyet dönüşüm", "ehliyet"] },
      { key: "telefon-net", label: "Telefon / internet setup", keywords: ["telefon", "internet", "sim"] },
      { key: "abonelik", label: "Abonelik işlemleri", keywords: ["abonelik", "subscription"] },
    ],
  },
];

const matchesFilter = (
  c: { category: string; role: string; specialties?: string[]; bio?: string },
  filter: CategoryFilter | undefined,
  subKeywords?: string[],
): boolean => {
  if (!filter || filter.key === "all") return true;
  let mainMatch = false;
  if (filter.category && c.category === filter.category) mainMatch = true;
  if (!mainMatch && filter.keywords?.length) {
    const hay = [c.role, c.bio ?? "", ...(c.specialties ?? [])].join(" ").toLowerCase();
    mainMatch = filter.keywords.some((kw) => hay.includes(kw.toLowerCase()));
  }
  if (!mainMatch) return false;
  if (subKeywords?.length) {
    const hay = [c.role, c.bio ?? "", ...(c.specialties ?? [])].join(" ").toLowerCase();
    return subKeywords.some((kw) => hay.includes(kw.toLowerCase()));
  }
  return true;
};

// Mock: IDs of consultants who purchased "Kategori Vitrini"
const showcasePurchasedIds = new Set([
  "ayse-kara", "elif-demir", "zeynep-arslan", "selin-yildiz", "derya-emlak", "osman-vize"
]);

const Consultants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCountry: country } = useDiaspora();
  const [city, setCity] = useState("all");
  const filterParam = searchParams.get("filter");
  const [category, setCategory] = useState(filterParam || "all");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const { toast } = useToast();
  const { isFollowed: isFollowedFn, toggle: toggleFollowState } = useFollow();

  useEffect(() => {
    setCategory(filterParam || "all");
    setActiveSub(null);
  }, [filterParam]);

  // Reset city when country changes
  useEffect(() => {
    setCity("all");
  }, [country]);

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory);
    setActiveSub(null);
    const nextParams = new URLSearchParams(searchParams);
    if (nextCategory === "all") {
      nextParams.delete("filter");
    } else {
      nextParams.set("filter", nextCategory);
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Only show cities when a country is selected
  const activeCities = useMemo(() => {
    if (country === "all") return [];
    return countryCities[country] || [];
  }, [country]);

  const activeFilter = categoryFilters.find((f) => f.key === category);
  const activeSubFilter = activeFilter?.subs?.find((s) => s.key === activeSub);
  const filtered = consultants.filter((c) => {
    const matchesCountry = country === "all" || c.country === country;
    const matchesCity = city === "all" || c.city === city;
    const matchesCategory = category === "ambassador" ? false : matchesFilter(c, activeFilter, activeSubFilter?.keywords);
    return matchesCountry && matchesCity && matchesCategory;
  });

  // Sort: showcase purchasers first
  const sortedFiltered = [...filtered].sort((a, b) => {
    const aShowcase = showcasePurchasedIds.has(a.id) ? 0 : 1;
    const bShowcase = showcasePurchasedIds.has(b.id) ? 0 : 1;
    return aShowcase - bShowcase;
  });

  const filteredAmbassadors = cityAmbassadors.filter((a) => {
    const matchesCountry = country === "all" || a.country === country;
    const matchesCity = city === "all" || a.city === city;
    return matchesCountry && matchesCity;
  });

  const toggleFollow = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollowState("consultant", id, name);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Danışmanlar</h1>
              <p className="text-muted-foreground font-body mt-1">
                {category === "ambassador"
                  ? `${filteredAmbassadors.length} şehir elçisi bulundu`
                  : `${sortedFiltered.length} danışman bulundu`}
              </p>
            </div>
            {/* City dropdown - top right, aligned with title */}
            <div className="shrink-0">
              <CountryCitySelector city={city} onCityChange={setCity} />
            </div>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {categoryFilters.map((f) => {
              const isActive = category === f.key;
              const Icon = f.icon;
              return (
                <Button
                  key={f.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(f.key)}
                  className="gap-1.5 text-xs"
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {f.label}
                </Button>
              );
            })}
          </div>

          {/* Sub-category chips - shown when active filter has subs */}
          {activeFilter?.subs && activeFilter.subs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-8 pl-3 border-l-2 border-primary/30 animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="text-xs text-muted-foreground mr-1">Alt kategoriler:</span>
              {activeFilter.subs.map((sub) => {
                const isActive = activeSub === sub.key;
                return (
                  <button
                    key={sub.key}
                    onClick={() => setActiveSub(isActive ? null : sub.key)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-accent hover:border-primary/40"
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          )}

          {!activeFilter?.subs && <div className="mb-5" />}

          {/* MVP: Sadece 4 demo danışman (Şehir Elçisi / Doktor / Emlakçı / Vizeci) */}
          {(() => {
            const amb = cityAmbassadors[0];
            const demoCards = [
              {
                id: amb.id,
                name: amb.name,
                role: "Şehir Elçisi",
                city: amb.city,
                country: amb.country,
                photo: amb.photo,
                rating: amb.rating,
                reviews: amb.usersOnboarded,
                specialties: amb.specialties?.slice(0, 2) || [],
                isAmbassador: true,
              },
              ...["dr-hasan-turk", "ayse-kara", "mehmet-yilmaz"]
                .map((id) => consultants.find((c) => c.id === id))
                .filter(Boolean)
                .map((c: any) => ({ ...c, isAmbassador: false })),
            ];

            return (
              <>
                <CategoryListingBanner categoryLabel="Danışmanlık" formAnchorId="kayit-form" />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                  {demoCards.map((c: any) => {
                    const linkTo = c.isAmbassador ? `/ambassador/${c.id}` : `/consultant/${c.id}`;
                    const isFollowed = isFollowedFn(c.isAmbassador ? "ambassador" : "consultant", c.id);
                    return (
                      <Link
                        to={linkTo}
                        key={c.id}
                        className="group relative bg-card rounded-2xl p-6 pt-9 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 block overflow-hidden border border-border"
                      >
                        <DemoBadge variant="card" />
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={c.photo} alt={c.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                            <div className="min-w-0">
                              <h3 className="font-bold text-foreground truncate">{c.name}</h3>
                              <p className="text-xs text-muted-foreground font-body truncate flex items-center gap-1">
                                {c.isAmbassador && <Flag className="h-3 w-3 text-gold" />}
                                {c.role}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => toggleFollow(c.id, c.name, e)}
                            className={`p-2 rounded-full transition-colors shrink-0 ${isFollowed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-primary"}`}
                          >
                            {isFollowed ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                          </button>
                        </div>

                        <p className="text-sm text-muted-foreground font-body mb-2">📍 {c.city}, {c.country}</p>

                        <div className="flex items-center gap-1 mb-3">
                          <Star className="h-4 w-4 text-gold fill-gold" />
                          <span className="text-sm font-semibold text-foreground">{c.rating}</span>
                          <span className="text-xs text-muted-foreground">({c.reviews})</span>
                        </div>

                        <p className="text-[10px] text-success font-semibold mb-2">🎁 İlk 10 dk ücretsiz</p>
                        <div className="flex gap-1.5" onClick={(e) => e.preventDefault()}>
                          <Button variant="default" size="sm" className="flex-1 gap-1 text-[11px] px-1.5">
                            <Video className="h-3 w-3" /> Canlı €2/dk
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 gap-1 text-[11px] px-1.5">
                            <Bot className="h-3 w-3" /> AI €1/dk
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-[11px] px-2 border-success/40 text-success hover:bg-success/10"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open("https://wa.me/", "_blank"); }}
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            );
          })()}

          <div className="mt-10 max-w-2xl mx-auto" id="kayit-form">
            <InterestForm
              modal={false}
              context="genel"
              defaultCategory="danisman"
              title="Danışman Olarak Ön Kayıt Ol"
              description="Sunum / CV / One-Pager vb. tüm dökümanlarınızı yükleyebilirsiniz. Kategoriyi isterseniz değiştirin."
              source="consultants-listing"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Consultants;
