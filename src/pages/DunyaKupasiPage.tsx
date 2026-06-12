// Dünya Kupası kampanya vitrini (/dunya-kupasi) — anonim erişilebilir.
// Onaylı işletmeler list_world_cup_businesses_v1 RPC'sinden okunur (kampanya
// pasifse RPC zaten boş döner); ülke/şehir filtreleri client-side.

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Flame, MapPin, PartyPopper, Phone, Trophy, Tv, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toMapHref, toSafePhoneHref } from "@/components/directory/public-profile/public-profile-utils";
import {
  fetchWorldCupCampaignSettings,
  getWorldCupImagePublicUrl,
  listWorldCupBusinesses,
} from "@/lib/dunya-kupasi-api";

const ALL_FILTER = "__all__";

// Hero animasyonları sayfaya özel — global stylesheet'i kirletmemek için
// component içinde scope'lanmış keyframe'ler.
const heroStyles = `
@keyframes wc-confetti-fall {
  0% { transform: translateY(-10%) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(1100%) rotate(540deg); opacity: 0; }
}
@keyframes wc-float {
  0%, 100% { transform: translateY(0) rotate(-6deg); }
  50% { transform: translateY(-12px) rotate(6deg); }
}
@keyframes wc-pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.45); }
  70% { box-shadow: 0 0 0 14px rgba(255, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
}
@keyframes wc-shine {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@media (prefers-reduced-motion: reduce) {
  .wc-confetti, .wc-float, .wc-pulse, .wc-shine { animation: none !important; }
}
`;

const CONFETTI_PIECES = [
  { left: "6%", delay: "0s", duration: "5.5s", color: "#ffffff" },
  { left: "16%", delay: "1.4s", duration: "6.5s", color: "#ffd166" },
  { left: "28%", delay: "0.7s", duration: "5s", color: "#ffffff" },
  { left: "41%", delay: "2.1s", duration: "7s", color: "#ffd166" },
  { left: "55%", delay: "0.3s", duration: "6s", color: "#ffffff" },
  { left: "67%", delay: "1.8s", duration: "5.2s", color: "#ffd166" },
  { left: "78%", delay: "0.9s", duration: "6.8s", color: "#ffffff" },
  { left: "90%", delay: "2.5s", duration: "5.6s", color: "#ffd166" },
];

const CrescentStar = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="currentColor">
    <path d="M62 50c0-15.5-12.5-28-28-28 4.8-3 10.5-4.7 16.5-4.7 18.1 0 32.7 14.6 32.7 32.7S68.6 82.7 50.5 82.7c-6 0-11.7-1.7-16.5-4.7 15.5 0 28-12.5 28-28z" />
    <path d="M74.5 38.5l3.6 7.3 8.1 1.2-5.9 5.7 1.4 8.1-7.2-3.8-7.2 3.8 1.4-8.1-5.9-5.7 8.1-1.2z" />
  </svg>
);

const DunyaKupasiPage = () => {
  const [countryFilter, setCountryFilter] = useState(ALL_FILTER);
  const [cityFilter, setCityFilter] = useState(ALL_FILTER);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Türkiye Dünya Kupası'nda! Maç Yayını Yapan İşletmeler | CorteQS";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const settingsQuery = useQuery({
    queryKey: ["world-cup", "settings"],
    queryFn: fetchWorldCupCampaignSettings,
  });

  const businessesQuery = useQuery({
    queryKey: ["world-cup", "businesses"],
    queryFn: () => listWorldCupBusinesses(),
  });

  const businesses = useMemo(() => businessesQuery.data ?? [], [businessesQuery.data]);

  const countryOptions = useMemo(
    () => [...new Set(businesses.map((item) => item.country))].sort((a, b) => a.localeCompare(b, "tr")),
    [businesses],
  );

  const cityOptions = useMemo(
    () =>
      [
        ...new Set(
          businesses
            .filter((item) => countryFilter === ALL_FILTER || item.country === countryFilter)
            .map((item) => item.city),
        ),
      ].sort((a, b) => a.localeCompare(b, "tr")),
    [businesses, countryFilter],
  );

  const filteredBusinesses = useMemo(
    () =>
      businesses.filter(
        (item) =>
          (countryFilter === ALL_FILTER || item.country === countryFilter) &&
          (cityFilter === ALL_FILTER || item.city === cityFilter),
      ),
    [businesses, cityFilter, countryFilter],
  );

  const campaignActive = settingsQuery.data?.isActive ?? false;
  const isLoading = settingsQuery.isLoading || businessesQuery.isLoading;
  const countryCount = countryOptions.length;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <style>{heroStyles}</style>

      {/* ——— Kahraman bölümü: Türkiye Dünya Kupası'nda! ——— */}
      <section className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-[#E30A17] via-[#c00712] to-[#8f040c] px-6 py-14 text-center text-white shadow-2xl sm:px-12">
        {/* Stadyum ışığı */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(ellipse 40% 30% at 85% 110%, rgba(255,209,102,0.25), transparent 70%)",
          }}
        />
        {/* Dev ay-yıldız filigranı */}
        <CrescentStar className="pointer-events-none absolute -left-10 top-1/2 h-64 w-64 -translate-y-1/2 text-white/10 sm:h-80 sm:w-80" />
        <CrescentStar className="pointer-events-none absolute -right-14 -top-10 h-44 w-44 rotate-12 text-white/10" />

        {/* Konfeti */}
        {CONFETTI_PIECES.map((piece, index) => (
          <span
            key={index}
            className="wc-confetti pointer-events-none absolute top-0 h-2.5 w-1.5 rounded-sm"
            style={{
              left: piece.left,
              backgroundColor: piece.color,
              animation: `wc-confetti-fall ${piece.duration} linear ${piece.delay} infinite`,
            }}
          />
        ))}

        <div className="relative">
          <Badge className="wc-pulse mb-5 border-white/40 bg-white/15 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-white backdrop-blur" style={{ animation: "wc-pulse-ring 2s ease-out infinite" }}>
            <Flame className="mr-1.5 h-4 w-4" />
            Milliler sahada!
          </Badge>

          <Trophy
            className="wc-float mx-auto mb-4 h-16 w-16 text-amber-300 drop-shadow-[0_0_18px_rgba(255,209,102,0.6)]"
            style={{ animation: "wc-float 3.5s ease-in-out infinite" }}
          />

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Türkiye{" "}
            <span
              className="wc-shine bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-clip-text text-transparent"
              style={{ backgroundSize: "200% auto", animation: "wc-shine 3s linear infinite" }}
            >
              Dünya Kupası'nda!
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-red-50/90 sm:text-xl">
            Ay-yıldızlılar bu sene Dünya Kupası'nda ter dökecek — sen de gurbette yalnız izleme!
            Diasporada maçları dev ekranda yayınlayan mekânı bul, tezahüratı toplulukla birlikte yap. 🇹🇷
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {campaignActive && (
              <Button
                asChild
                size="lg"
                className="bg-white text-[#E30A17] shadow-lg transition-transform hover:scale-105 hover:bg-amber-50"
              >
                <Link to="/dunya-kupasi/kayit">
                  <Tv className="mr-2 h-5 w-5" />
                  Maç Yayını Yapıyorum — İşletmemi Kaydet
                </Link>
              </Button>
            )}
            {!isLoading && businesses.length > 0 && (
              <span className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                <Users className="h-4 w-4 text-amber-300" />
                {businesses.length} mekân, {countryCount} ülkede maç coşkusuna hazır
              </span>
            )}
          </div>
        </div>
      </section>

      {!campaignActive && !isLoading ? (
        <Card className="border-2 border-dashed">
          <CardHeader className="text-center">
            <PartyPopper className="mx-auto mb-2 h-8 w-8 text-[#E30A17]" />
            <CardTitle>Kampanya sona erdi</CardTitle>
            <CardDescription>
              Dünya Kupası işletme kampanyası şu anda aktif değil. Kayıtlı işletmeleri{" "}
              <Link to="/directory" className="underline">
                dizinde
              </Link>{" "}
              bulabilirsiniz.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-3 text-center">
            <h2 className="text-2xl font-bold">
              Maçı nerede izleyeceksin? <span className="text-[#E30A17]">Mekânını seç!</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ülke ve şehir filtreleriyle sana en yakın tribünü bul.
            </p>
          </div>

          <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Select
              value={countryFilter}
              onValueChange={(value) => {
                setCountryFilter(value);
                setCityFilter(ALL_FILTER);
              }}
            >
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Ülke" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>Tüm ülkeler</SelectItem>
                {countryOptions.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Şehir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>Tüm şehirler</SelectItem>
                {cityOptions.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground">Tribünler hazırlanıyor...</p>
          ) : filteredBusinesses.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardHeader className="text-center">
                <Trophy className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                <CardTitle>Henüz listelenen işletme yok</CardTitle>
                <CardDescription>
                  {businesses.length === 0
                    ? "Onaylanan işletmeler burada görünecek. İlk kaydolan siz olun — tribün lideri sizin mekânınız olsun!"
                    : "Seçtiğiniz filtreye uyan işletme bulunamadı."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBusinesses.map((business) => {
                const imageUrl = getWorldCupImagePublicUrl(business.imagePath);
                const phoneHref = toSafePhoneHref(business.phone);
                const mapHref = toMapHref([
                  business.businessName,
                  business.address,
                  business.city,
                  business.country,
                ]);

                return (
                  <Card
                    key={business.registrationId}
                    className="group flex flex-col overflow-hidden border-t-4 border-t-[#E30A17] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Kart hero'su: işletme görseli; yoksa marka renkli placeholder. */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#E30A17] via-[#c00712] to-[#8f040c]">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={business.businessName}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <>
                          <CrescentStar className="absolute -right-4 -top-4 h-24 w-24 rotate-12 text-white/15" />
                          <Tv className="absolute bottom-3 left-3 h-7 w-7 text-white/70" />
                        </>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg transition-colors group-hover:text-[#E30A17]">
                        {business.businessName}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{business.categoryLabel}</Badge>
                        <Badge variant="outline" className="border-[#E30A17]/50 text-[#E30A17]">
                          <Tv className="mr-1 h-3 w-3" />
                          Canlı Maç Yayını
                        </Badge>
                      </div>
                      <span className="flex items-center gap-1 pt-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {business.city}, {business.country}
                      </span>
                    </CardHeader>
                    <CardContent className="mt-auto space-y-2">
                      <div className="flex gap-2">
                        {phoneHref && (
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <a href={phoneHref}>
                              <Phone className="mr-1.5 h-4 w-4" />
                              Ara
                            </a>
                          </Button>
                        )}
                        {mapHref && (
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <a href={mapHref} target="_blank" rel="noopener noreferrer">
                              <MapPin className="mr-1.5 h-4 w-4" />
                              Haritada Aç
                            </a>
                          </Button>
                        )}
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full border-[#E30A17]/40 text-[#E30A17] hover:bg-[#E30A17] hover:text-white"
                      >
                        <Link to={`/directory/profile/${business.userId}`}>Profili Gör</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DunyaKupasiPage;
