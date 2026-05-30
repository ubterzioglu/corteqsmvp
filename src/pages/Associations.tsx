import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, MapPin, Calendar as CalendarIcon, GraduationCap, Radio, Tv, Music, Landmark, Stethoscope } from "lucide-react";
import MapShareButtons from "@/components/MapShareButtons";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import CountryCitySelector from "@/components/CountryCitySelector";
import { useDiaspora } from "@/contexts/DiasporaContext";
import { associations } from "@/data/mock";
import DemoBadge from "@/components/DemoBadge";
import CategoryListingBanner from "@/components/CategoryListingBanner";
import InterestForm from "@/components/InterestForm";

const typeFilters = [
  { key: "all", label: "Tümü" },
  { key: "dernek", label: "Dernekler & Vakıflar" },
  { key: "oda", label: "🏢 Odalar & Konseyler" },
  { key: "akademik", label: "🎓 Akademik Birimler" },
  { key: "egitim", label: "📚 Eğitim Kuruluşları" },
  { key: "medya", label: "📺 Türk Medya Kuruluşları" },
  { key: "diplomatik", label: "🏛️ Büyükelçilik & Konsolosluk" },
  { key: "hastane", label: "🏥 Sağlık Kuruluşları" },
  { key: "dijital", label: "💬 Dijital Topluluklar" },
];

const Associations = () => {
  const { selectedCountry: country } = useDiaspora();
  const [city, setCity] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Reset city when country changes
  useEffect(() => { setCity("all"); }, [country]);

  const filtered = associations.filter((a) => {
    const matchesCountry = country === "all" || a.country === country;
    const matchesCity = city === "all" || a.city === city;
    const matchesType = typeFilter === "all"
      || (typeFilter === "dernek" && ["Dernek", "Vakıf", "İş Örgütü", "Sosyal Örgüt"].includes(a.type))
      || (typeFilter === "oda" && ["Oda", "Konsey", "İş Örgütü"].includes(a.type))
      || (typeFilter === "akademik" && ["Akademik", "Üniversite"].includes(a.type))
      || (typeFilter === "egitim" && a.type === "Okul")
      || (typeFilter === "medya" && ["TV Kanalı", "Radyo"].includes(a.type))
      || (typeFilter === "diplomatik" && ["Büyükelçilik", "Konsolosluk"].includes(a.type))
      || (typeFilter === "hastane" && a.type === "Hastane")
      || (typeFilter === "dijital" && ["Dijital Topluluk", "WhatsApp Grubu", "Telegram Grubu", "Discord Topluluğu", "Online Topluluk"].includes(a.type));
    return matchesCountry && matchesCity && matchesType;
  });

  const typeColors: Record<string, string> = {
    "Dernek": "bg-primary/10 text-primary",
    "Vakıf": "bg-turquoise/10 text-turquoise",
    "İş Örgütü": "bg-gold/10 text-gold",
    "Sosyal Örgüt": "bg-primary/10 text-primary",
    "Okul": "bg-success/10 text-success",
    "Radyo": "bg-purple-500/10 text-purple-600",
    "TV Kanalı": "bg-destructive/10 text-destructive",
    "Büyükelçilik": "bg-secondary text-secondary-foreground",
    "Konsolosluk": "bg-secondary text-secondary-foreground",
    "Hastane": "bg-turquoise/10 text-turquoise",
    "Dijital Topluluk": "bg-success/10 text-success",
    "WhatsApp Grubu": "bg-success/10 text-success",
    "Telegram Grubu": "bg-primary/10 text-primary",
    "Discord Topluluğu": "bg-purple-500/10 text-purple-600",
    "Online Topluluk": "bg-turquoise/10 text-turquoise",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Kuruluşlar</h1>
              <p className="text-muted-foreground font-body mt-1">
                {filtered.length} kuruluş bulundu
              </p>
            </div>
          </div>

          {/* Type filter tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {typeFilters.map((f) => (
              <Button
                key={f.key}
                variant={typeFilter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(f.key)}
                className="text-xs"
              >
                {f.label}
              </Button>
            ))}
            <div className="ml-auto">
              <CountryCitySelector city={city} onCityChange={setCity} />
            </div>
          </div>

          <CategoryListingBanner categoryLabel="Kuruluşlar" formAnchorId="kayit-form" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {filtered.slice(0, 2).map((a) => (
              <Link
                to={`/association/${a.id}`}
                key={a.id}
                className="group relative bg-card rounded-2xl p-6 pt-9 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:-translate-y-1 block overflow-hidden"
              >
                <DemoBadge variant="card" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm shrink-0">
                    {a.logo}
                  </div>
                  <div className="min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1 ${typeColors[a.type] || "bg-primary/10 text-primary"}`}>
                      {a.type}
                    </span>
                    <h3 className="font-bold text-foreground truncate">{a.name}</h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground font-body flex items-center gap-1 mb-3">
                  <MapPin className="h-4 w-4 shrink-0" /> {a.city}, {a.country}
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="font-body">{a.members.toLocaleString()} {a.type === "Radyo" || a.type === "TV Kanalı" ? "dinleyici" : "üye"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="font-body">{a.events} etkinlik</span>
                  </div>
                </div>

                 <p className="text-sm text-muted-foreground font-body line-clamp-2 mb-3">{a.description}</p>

                 <MapShareButtons name={a.name} city={a.city} country={a.country} className="mb-3" />

                 <div className="flex gap-2">
                  <Link to={`/association/${a.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="default" size="sm" className="w-full">Detay</Button>
                  </Link>
                  {a.type === "Radyo" ? (
                    <Link to={`/radio/${a.id}/song-request`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="w-full gap-1">
                        <Music className="h-3 w-3" /> İstek Parça
                      </Button>
                    </Link>
                  ) : a.type === "Hastane" ? (
                    <Link to={`/hospital-appointment/${a.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="w-full gap-1 border-turquoise/30 text-turquoise hover:bg-turquoise/10">
                        <Stethoscope className="h-3 w-3" /> Randevu Al
                      </Button>
                    </Link>
                  ) : ["Büyükelçilik", "Konsolosluk"].includes(a.type) ? (
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <CalendarIcon className="h-3 w-3" /> Randevu Al
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      {a.type === "TV Kanalı" ? "İzle" : "Etkinlikler"}
                    </Button>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground font-body">
              Bu filtrelerde kuruluş bulunamadı.
            </div>
          )}

          <div className="mt-10 max-w-2xl mx-auto" id="kayit-form">
            <InterestForm
              modal={false}
              context="genel"
              defaultCategory="kurulus"
              title="Kuruluş Olarak Ön Kayıt Ol"
              description="Sunum / CV / One-Pager vb. tüm dökümanlarınızı yükleyebilirsiniz. Kategori sabitlenmedi — istediğinizi seçin."
              source="associations-listing"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Associations;
