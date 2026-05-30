import { useState, useMemo, useEffect } from "react";
import { MapPin, Building2, Users, Store, Navigation, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import CountryCitySelector from "@/components/CountryCitySelector";
import { useDiaspora } from "@/contexts/DiasporaContext";
import { getAllMapEntities, type MapEntity } from "@/lib/mapEntities";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const entityTypes = [
  { key: "all", label: "Tümü" },
  { key: "business", label: "🛒 İşletmeler" },
  { key: "consultant", label: "👤 Danışmanlar" },
  { key: "association", label: "🏛️ Kuruluşlar" },
];

const typeColors: Record<string, string> = {
  business: "bg-turquoise text-primary-foreground",
  association: "bg-primary text-primary-foreground",
  consultant: "bg-secondary text-secondary-foreground",
};

const MapSearch = () => {
  const { selectedCountry: globalCountry } = useDiaspora();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDirections = (e: React.MouseEvent, entity: MapEntity, mapsUrl: string) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Giriş gerekli",
        description: "Yol tarifini WhatsApp'ınıza göndermek için lütfen giriş yapın.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    if (!profile?.phone) {
      toast({
        title: "WhatsApp numarası eksik",
        description: "Profilinize WhatsApp numaranızı ekleyin.",
        variant: "destructive",
      });
      navigate("/profile");
      return;
    }
    const text = `📍 ${entity.name}\n${entity.address}\n${mapsUrl}`;
    const phone = profile.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    toast({ title: "WhatsApp'a gönderildi ✅", description: entity.name });
  };

  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [entityType, setEntityType] = useState("all");
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // All real provider entities from consultants/associations/businesses
  const allEntities = useMemo<MapEntity[]>(() => getAllMapEntities(), []);

  const effectiveCountry = globalCountry && globalCountry !== "all" ? globalCountry : null;

  useEffect(() => {
    setSelectedCity("all");
  }, [effectiveCountry]);

  const entities = useMemo(() => {
    return allEntities.filter((e) => {
      if (effectiveCountry && e.country !== effectiveCountry) return false;
      if (selectedCity !== "all" && e.city !== selectedCity) return false;
      if (entityType !== "all" && e.kind !== entityType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const hay = `${e.name} ${e.category} ${e.city} ${e.country} ${e.address}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allEntities, effectiveCountry, selectedCity, entityType, searchQuery]);

  // Map center: average of filtered entity coords; fallback to first or world
  const center = useMemo(() => {
    if (entities.length === 0) return { lat: 30, lng: 10, zoomBox: 60 };
    const lats = entities.map((e) => e.lat);
    const lngs = entities.map((e) => e.lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      zoomBox: 0,
    };
  }, [entities]);

  const buildMapUrl = () => {
    if (entities.length === 0) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=-15%2C25%2C45%2C60&layer=mapnik`;
    }
    const lats = entities.map((e) => e.lat);
    const lngs = entities.map((e) => e.lng);
    const minLat = Math.min(...lats) - 0.05;
    const maxLat = Math.max(...lats) + 0.05;
    const minLng = Math.min(...lngs) - 0.05;
    const maxLng = Math.max(...lngs) + 0.05;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${center.lat}%2C${center.lng}`;
  };

  const cityDisplayLabel =
    selectedCity === "all"
      ? `Tüm Şehirler${effectiveCountry ? ` - ${effectiveCountry}` : ""}`
      : selectedCity;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
                <MapPin className="h-8 w-8 text-primary" /> Harita Arama
              </h1>
              <p className="text-muted-foreground font-body mt-1">
                Danışman, işletme, kuruluş, konsolosluk ve hastane adreslerini harita üzerinde keşfedin.
                <span className="block text-xs mt-1">
                  📍 Kayıtlar danışman, işletme ve kuruluş dashboardlarındaki adreslerden çekilir. WhatsApp AI bot da bu kayıtları kullanarak DM ile lokasyon paylaşabilir.
                </span>
              </p>
            </div>
            <CountryCitySelector city={selectedCity} onCityChange={setSelectedCity} />
          </div>

          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground flex items-start gap-2">
            <span aria-hidden>🗺️</span>
            <p>
              <strong>Haritalarımız İşletmelerimiz eklendikçe yerini almaya başlayacaklardır.</strong>{" "}
              <span className="text-muted-foreground">İşletmelerimiz eklendikçe haritada görünür konuma gelecekler.</span>
            </p>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Danışman, işletme, kuruluş, konsolosluk, hastane ara..."
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              💡 Aramanızı ülke ve şehir bazında daraltabilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {entityTypes.map((t) => (
              <Button
                key={t.key}
                variant={entityType === t.key ? "default" : "outline"}
                size="sm"
                onClick={() => setEntityType(t.key)}
                className="text-xs"
              >
                {t.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-border">
                <iframe
                  key={`${effectiveCountry || "all"}-${selectedCity}-${entityType}`}
                  title="Harita"
                  src={buildMapUrl()}
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 0 }}
                  loading="lazy"
                />

                {/* City label overlay */}
                <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border shadow-sm z-10">
                  <p className="text-sm font-bold text-foreground">{cityDisplayLabel}</p>
                  <p className="text-[10px] text-muted-foreground">{entities.length} sonuç</p>
                </div>

                <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border z-10">
                  <div className="flex flex-wrap gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-turquoise" /> İşletme</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-secondary" /> Danışman</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-primary" /> Kuruluş</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              <h2 className="font-bold text-foreground text-lg sticky top-0 bg-background py-1 z-10">
                {entities.length} Sonuç
              </h2>
              {entities.length === 0 && (
                <div className="bg-muted/40 border border-dashed border-border rounded-xl p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Bu seçim için kayıt bulunmadı. Üst menüden ülke/şehir değiştirin.
                  </p>
                </div>
              )}
              {entities.map((entity) => {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${entity.lat},${entity.lng}`;
                return (
                  <div
                    key={entity.id}
                    className={`bg-card border rounded-xl p-4 shadow-card transition-all ${
                      hoveredPin === entity.id ? "border-primary bg-primary/5 shadow-card-hover" : "border-border hover:border-primary/30"
                    }`}
                    onMouseEnter={() => setHoveredPin(entity.id)}
                    onMouseLeave={() => setHoveredPin(null)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${typeColors[entity.kind]} flex items-center justify-center shrink-0`}>
                        {entity.kind === "business" ? <Store className="h-5 w-5" /> :
                         entity.kind === "association" ? <Building2 className="h-5 w-5" /> :
                         <Users className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm">{entity.name}</h3>
                        <Badge variant="outline" className="text-[10px] mt-1">{entity.category}</Badge>
                        <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{entity.address}</span>
                        </p>
                        {entity.rating && (
                          <p className="text-xs text-gold mt-1">⭐ {entity.rating}</p>
                        )}
                        <button
                          onClick={(e) => handleDirections(e, entity, mapsUrl)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                        >
                          <Navigation className="h-3 w-3" /> Yol Tarifi (WhatsApp'a gönder)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MapSearch;
