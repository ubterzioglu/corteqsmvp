import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, Briefcase, Building2, UserPlus, UserCheck, Star, Stethoscope } from "lucide-react";
import MapShareButtons from "@/components/MapShareButtons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import CountryCitySelector from "@/components/CountryCitySelector";
import { useDiaspora } from "@/contexts/DiasporaContext";
import { businesses } from "@/data/mock";
import { useToast } from "@/hooks/use-toast";
import { useFollow } from "@/hooks/useFollow";
import DemoBadge from "@/components/DemoBadge";
import CategoryListingBanner from "@/components/CategoryListingBanner";
import InterestForm from "@/components/InterestForm";

interface SubFilter {
  key: string;
  label: string;
  keywords: string[];
}

interface SectorFilter {
  key: string;
  label: string;
  subs?: SubFilter[];
}

const sectorFilters: SectorFilter[] = [
  { key: "all", label: "Tümü" },
  {
    key: "Yatırım",
    label: "🚀 Yatırım & Girişim",
    subs: [
      { key: "startup", label: "Start-up", keywords: ["startup", "start-up", "girişim"] },
      { key: "vc", label: "Venture Capital (VC)", keywords: ["vc", "venture capital", "risk sermayesi"] },
      { key: "angel", label: "Melek Yatırımcı", keywords: ["angel", "melek yatırımcı", "angel investor"] },
      { key: "incubation", label: "Inkübasyon Merkezleri", keywords: ["incubation", "inkübasyon", "kuluçka"] },
      { key: "accelerator", label: "Hızlandırıcı (Accelerator)", keywords: ["accelerator", "hızlandırıcı"] },
      { key: "private-equity", label: "Private Equity", keywords: ["private equity", "pe", "özel sermaye"] },
      { key: "family-office", label: "Family Office", keywords: ["family office", "aile ofisi"] },
      { key: "crowdfunding", label: "Kitle Fonlama", keywords: ["crowdfunding", "kitle fonlama"] },
      { key: "fintech", label: "Fintech & Yatırım Platformu", keywords: ["fintech", "yatırım platformu"] },
      { key: "m-and-a", label: "M&A / Strateji", keywords: ["m&a", "merger", "acquisition", "strateji"] },
      { key: "coworking", label: "Co-working / Hub", keywords: ["coworking", "co-working", "hub"] },
    ],
  },
  {
    key: "Gastronomi",
    label: "🍽️ Gastronomi",
    subs: [
      { key: "restoran-cocuk", label: "👶 Restoran (Çocuk Dostu)", keywords: ["çocuk", "aile", "kids"] },
      { key: "restoran", label: "Restoran", keywords: ["restoran", "restaurant"] },
      { key: "cafe", label: "Cafe", keywords: ["cafe", "kafe", "kahve"] },
      { key: "turk-mutfagi", label: "Türk Mutfağı", keywords: ["türk mutfağı", "kebap", "lahmacun", "pide"] },
      { key: "fine-dining", label: "Fine Dining", keywords: ["fine dining", "lüks", "gurme"] },
      { key: "fast-food", label: "Fast Food", keywords: ["fast food", "döner", "burger"] },
      { key: "catering", label: "Catering", keywords: ["catering", "ikram"] },
      { key: "bar", label: "Gece Hayatı / Bar", keywords: ["bar", "gece", "club", "lounge"] },
    ],
  },
  {
    key: "Gayrimenkul",
    label: "🏠 Gayrimenkul & Yaşam",
    subs: [
      { key: "emlak", label: "Emlak Ofisleri", keywords: ["emlak", "real estate"] },
      { key: "relocation", label: "Relocation Firmaları", keywords: ["relocation", "taşınma danışman"] },
      { key: "mobilya", label: "Mobilya / Ev Eşyası", keywords: ["mobilya", "ev eşya", "dekorasyon"] },
      { key: "temizlik", label: "Temizlik Hizmetleri", keywords: ["temizlik", "cleaning"] },
      { key: "nakliye", label: "Taşınma / Nakliye", keywords: ["nakliye", "moving", "taşıma"] },
    ],
  },
  {
    key: "Profesyonel",
    label: "💼 Profesyonel Hizmetler",
    subs: [
      { key: "hukuk", label: "Hukuk Büroları", keywords: ["hukuk", "avukat", "law"] },
      { key: "muhasebe", label: "Muhasebe / Mali Müşavir", keywords: ["muhasebe", "mali müşavir", "accounting"] },
      { key: "danismanlik", label: "Danışmanlık Şirketleri", keywords: ["danışmanlık", "consulting"] },
      { key: "hr", label: "HR / İşe Alım", keywords: ["hr", "işe alım", "recruitment", "ik"] },
    ],
  },
  {
    key: "Perakende",
    label: "🛒 Perakende & E-Ticaret",
    subs: [
      { key: "market", label: "Market / Gıda", keywords: ["market", "gıda", "süpermarket"] },
      { key: "turk-urunleri", label: "Türk Ürünleri", keywords: ["türk ürün", "turkish products"] },
      { key: "online-shop", label: "Online Shop", keywords: ["online", "e-ticaret", "e-commerce"] },
      { key: "moda", label: "Moda / Butik", keywords: ["moda", "butik", "giyim", "fashion"] },
      { key: "elektronik", label: "Elektronik", keywords: ["elektronik", "electronics"] },
    ],
  },
  {
    key: "Sağlık",
    label: "🏥 Sağlık & Wellbeing",
    subs: [
      { key: "klinik", label: "Klinikler", keywords: ["klinik", "clinic", "hastane"] },
      { key: "dis", label: "Diş", keywords: ["diş", "dental"] },
      { key: "estetik", label: "Estetik", keywords: ["estetik", "güzellik", "aesthetic"] },
      { key: "psikolog", label: "Psikolog", keywords: ["psikolog", "terapi", "psychology"] },
      { key: "fitness", label: "Spor / Fitness", keywords: ["spor", "fitness", "gym"] },
    ],
  },
  {
    key: "Eğitim",
    label: "🎓 Eğitim",
    subs: [
      { key: "dil-okulu", label: "Dil Okulları", keywords: ["dil okul", "language school"] },
      { key: "egitim-kurum", label: "Eğitim Kurumları", keywords: ["okul", "kolej", "lise"] },
      { key: "egitim-danismanlik", label: "Danışmanlık Firmaları", keywords: ["eğitim danışman", "üniversite başvuru"] },
      { key: "cocuk-egitim", label: "Çocuk Eğitim Merkezleri", keywords: ["çocuk eğitim", "kids learning"] },
    ],
  },
  {
    key: "Aile",
    label: "👶 Aile & Çocuk",
    subs: [
      { key: "kres", label: "Kreş", keywords: ["kreş", "daycare", "anaokul"] },
      { key: "cocuk-aktivite", label: "Çocuk Aktiviteleri", keywords: ["çocuk aktivite", "kids activity"] },
      { key: "oyun-alani", label: "Oyun Alanları", keywords: ["oyun alanı", "playground"] },
      { key: "aile-danismanlik", label: "Aile Danışmanlığı", keywords: ["aile danışman", "family counseling"] },
    ],
  },
  {
    key: "Lojistik",
    label: "🚛 Ulaşım & Araç",
    subs: [
      { key: "arac-kira", label: "Araç Kiralama", keywords: ["araç kira", "rent a car", "car rental"] },
      { key: "arac-satis", label: "Araç Satış", keywords: ["araç sat", "oto galeri"] },
      { key: "lojistik-firma", label: "Lojistik Firmaları", keywords: ["lojistik", "logistics"] },
      { key: "kurye", label: "Kurye", keywords: ["kurye", "courier", "delivery"] },
    ],
  },
  {
    key: "Turizm",
    label: "✈️ Turizm & Seyahat",
    subs: [
      { key: "seyahat-acente", label: "Seyahat Acenteleri", keywords: ["seyahat acente", "travel agency"] },
      { key: "otel", label: "Oteller", keywords: ["otel", "hotel"] },
      { key: "kisa-konaklama", label: "Kısa Dönem Konaklama", keywords: ["airbnb", "kısa dönem", "short stay"] },
      { key: "tur", label: "Tur Organizasyonları", keywords: ["tur", "tour"] },
    ],
  },
  {
    key: "İnşaat",
    label: "🏗️ İnşaat & Hizmet",
    subs: [
      { key: "insaat-firma", label: "İnşaat Firmaları", keywords: ["inşaat", "construction"] },
      { key: "tadilat", label: "Tadilat", keywords: ["tadilat", "renovation"] },
      { key: "usta", label: "Ustalar (Elektrik, Tesisat)", keywords: ["elektrik", "tesisat", "usta", "tamir"] },
    ],
  },
  {
    key: "LojistikTicaret",
    label: "📦 Lojistik & Ticaret",
    subs: [
      { key: "ithalat", label: "İthalat / İhracat", keywords: ["ithalat", "ihracat", "import", "export"] },
      { key: "depolama", label: "Depolama", keywords: ["depo", "warehouse", "storage"] },
      { key: "kargo", label: "Kargo", keywords: ["kargo", "cargo"] },
    ],
  },
  {
    key: "Teknoloji",
    label: "💻 Teknoloji",
    subs: [
      { key: "yazilim", label: "Yazılım Şirketleri", keywords: ["yazılım", "software"] },
      { key: "it-destek", label: "IT Destek", keywords: ["it destek", "it support"] },
      { key: "startup", label: "Startup'lar", keywords: ["startup", "girişim"] },
    ],
  },
  {
    key: "Medya",
    label: "📡 Medya & İçerik",
    subs: [
      { key: "ajans", label: "Ajanslar", keywords: ["ajans", "agency"] },
      { key: "sosyal-medya", label: "Sosyal Medya", keywords: ["sosyal medya", "social media"] },
      { key: "produksiyon", label: "Prodüksiyon", keywords: ["prodüksiyon", "production", "film", "video"] },
      { key: "reklam", label: "Reklam", keywords: ["reklam", "advertising"] },
    ],
  },
  {
    key: "Finans",
    label: "🏦 Finans",
    subs: [
      { key: "banka", label: "Bankalar", keywords: ["banka", "bank"] },
      { key: "finans-danisman", label: "Finans Danışmanları", keywords: ["finans danışman", "financial advisor"] },
      { key: "sigorta", label: "Sigorta", keywords: ["sigorta", "insurance"] },
    ],
  },
  { key: "Tekstil", label: "👕 Tekstil" },
  { key: "Havacılık", label: "✈️ Havacılık" },
  { key: "Telekomünikasyon", label: "📱 Telekom" },
];

// Map UI sector key to actual data sector value
const sectorDataMap: Record<string, string> = {
  Profesyonel: "Hukuk",
  Aile: "Eğitim",
  LojistikTicaret: "Lojistik",
  Medya: "Teknoloji",
};

const offeringFilters = [
  { key: "all", label: "Tümü" },
  { key: "iş ilanı", label: "💼 İş İlanları" },
  { key: "franchise", label: "🏪 Franchise" },
  { key: "iş fırsatı", label: "🤝 İş Fırsatları" },
];

const offeringColors: Record<string, string> = {
  "iş ilanı": "bg-turquoise/10 text-turquoise border-turquoise/20",
  "franchise": "bg-gold/10 text-gold border-gold/20",
  "iş fırsatı": "bg-primary/10 text-primary border-primary/20",
};

const Businesses = () => {
  const { selectedCountry: country } = useDiaspora();
  const [city, setCity] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [offeringFilter, setOfferingFilter] = useState("all");
  const { isFollowed: isFollowedFn, toggle: toggleFollowState } = useFollow();
  const { toast } = useToast();

  useEffect(() => { setCity("all"); }, [country]);

  const activeFilter = sectorFilters.find((f) => f.key === sectorFilter);
  const activeSubItem = activeFilter?.subs?.find((s) => s.key === activeSub);

  const matchesSector = (b: typeof businesses[number]) => {
    if (sectorFilter === "all") return true;
    const dataSector = sectorDataMap[sectorFilter] || sectorFilter;
    if (b.sector !== dataSector) return false;
    if (!activeSubItem) return true;
    const haystack = `${b.name} ${b.description} ${b.sector}`.toLowerCase();
    return activeSubItem.keywords.some((k) => haystack.includes(k.toLowerCase()));
  };

  const filtered = businesses.filter((b) => {
    const matchesCountry = country === "all" || b.country === country;
    const matchesCity = city === "all" || b.city === city;
    const matchesOffering = offeringFilter === "all" || b.offerings.includes(offeringFilter as any);
    return matchesCountry && matchesCity && matchesSector(b) && matchesOffering;
  });

  const handleSectorClick = (key: string) => {
    setSectorFilter(key);
    setActiveSub(null);
  };

  const toggleFollow = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollowState("business", id, name);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Türk İşletmeleri</h1>
              <p className="text-muted-foreground font-body mt-1">
                {filtered.length} işletme bulundu
              </p>
            </div>
            <div className="shrink-0">
              <CountryCitySelector city={city} onCityChange={setCity} />
            </div>
          </div>

          {/* Sector filter */}
          <div className="flex flex-wrap gap-2 mb-3">
            {sectorFilters.map((f) => (
              <Button
                key={f.key}
                variant={sectorFilter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleSectorClick(f.key)}
                className="text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Sub-category chips */}
          {activeFilter?.subs && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4 pl-3 border-l-2 border-primary/30">
              {activeFilter.subs.map((sub) => {
                const isActive = activeSub === sub.key;
                return (
                  <button
                    key={sub.key}
                    onClick={() => setActiveSub(isActive ? null : sub.key)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Offering filter */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {offeringFilters.map((f) => (
              <Button
                key={f.key}
                variant={offeringFilter === f.key ? "secondary" : "outline"}
                size="sm"
                onClick={() => setOfferingFilter(f.key)}
                className="text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>

          <CategoryListingBanner categoryLabel="İşletmeler" formAnchorId="kayit-form" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {filtered.slice(0, 2).map((b) => {
              const isFollowed = isFollowedFn("business", b.id);
              return (
                <Link
                  to={`/business/${b.id}`}
                  key={b.id}
                  className="group relative bg-card rounded-2xl p-6 pt-9 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:-translate-y-1 block overflow-hidden"
                >
                  <DemoBadge variant="card" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm shrink-0">
                        {b.logo}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground truncate">{b.name}</h3>
                        <p className="text-xs text-muted-foreground font-body">{b.sector}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => toggleFollow(b.id, b.name, e)}
                      className={`p-2 rounded-full transition-colors shrink-0 ${isFollowed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-primary"}`}
                    >
                      {isFollowed ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    </button>
                  </div>

                  <p className="text-sm text-muted-foreground font-body flex items-center gap-1 mb-3">
                    <MapPin className="h-4 w-4 shrink-0" /> {b.city}, {b.country}
                  </p>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="font-body">{b.employees} çalışan</span>
                    </div>
                    {b.openPositions > 0 && (
                      <div className="flex items-center gap-1 text-sm text-turquoise">
                        <Briefcase className="h-4 w-4" />
                        <span className="font-body font-semibold">{b.openPositions} açık pozisyon</span>
                      </div>
                    )}
                  </div>

                   <p className="text-sm text-muted-foreground font-body line-clamp-2 mb-3">{b.description}</p>

                   <MapShareButtons name={b.name} city={b.city} country={b.country} className="mb-3" />

                   <div className="flex flex-wrap gap-1.5 mb-4">
                     {b.offerings.map((o) => (
                       <Badge key={o} variant="outline" className={`text-xs ${offeringColors[o] || ""}`}>
                         {o === "iş ilanı" ? "💼 İş İlanı" : o === "franchise" ? "🏪 Franchise" : "🤝 İş Fırsatı"}
                       </Badge>
                     ))}
                   </div>

                  <div className="flex gap-2">
                    <Link to={`/business/${b.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="default" size="sm" className="w-full">Detay</Button>
                    </Link>
                    {b.sector === "Sağlık" ? (
                      <Link to={`/hospital-appointment/${b.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="w-full gap-1 border-turquoise/30 text-turquoise hover:bg-turquoise/10">
                          <Stethoscope className="h-3 w-3" /> Randevu Al
                        </Button>
                      </Link>
                    ) : b.offerings.includes("franchise") ? (
                      <Link to={`/business/${b.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="w-full gap-1 border-gold/30 text-gold hover:bg-gold/10">🏪 Franchise</Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>Başvur</Button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground font-body">
              Bu filtrelerde işletme bulunamadı.
            </div>
          )}

          <div className="mt-10 max-w-2xl mx-auto" id="kayit-form">
            <InterestForm
              modal={false}
              context="genel"
              defaultCategory="isletme"
              title="İşletme Olarak Ön Kayıt Ol"
              description="Sunum / CV / One-Pager vb. tüm dökümanlarınızı yükleyebilirsiniz. Kategoriyi isterseniz değiştirin."
              source="businesses-listing"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Businesses;
