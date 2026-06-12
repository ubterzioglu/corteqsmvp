// Dünya Kupası kampanya vitrini (/dunya-kupasi) — anonim erişilebilir.
// Onaylı işletmeler list_world_cup_businesses_v1 RPC'sinden okunur (kampanya
// pasifse RPC zaten boş döner); ülke/şehir filtreleri client-side.

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin, PartyPopper, Phone, Trophy, Tv, Users } from "lucide-react";

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

// Görsel yüklemeyen işletmeler için milli takım temalı kart banner'ı (public/world-cup/).
const CARD_PLACEHOLDER_SRC = "/world-cup/card-placeholder.webp";

// Kampanya hero görseli — başlık ve tanıtım metni görselin içinde gömülü.
const HERO_IMAGE_SRC = "/world-cup/hero-kampanya.webp";

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
      {/* ——— Kahraman bölümü: kampanya görseli (başlık/metin görselde gömülü) ——— */}
      <section className="relative mb-12 overflow-hidden rounded-3xl shadow-2xl">
        <h1 className="sr-only">Türkiye Dünya Kupası'nda! Maç yayını yapan işletmeler</h1>
        <img
          src={HERO_IMAGE_SRC}
          alt="Türkiye Dünya Kupası'nda! Diasporada maçları dev ekranda yayınlayan mekânı bul, tezahüratı toplulukla birlikte yap."
          className="h-auto w-full"
        />
        <div className="flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#E30A17] via-[#c00712] to-[#8f040c] px-6 py-5 text-white sm:flex-row">
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
                    {/* Kart hero'su: işletme görseli; yoksa milli takım temalı placeholder illüstrasyonu. */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#E30A17] via-[#c00712] to-[#8f040c]">
                      <img
                        src={imageUrl ?? CARD_PLACEHOLDER_SRC}
                        alt={imageUrl ? business.businessName : ""}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
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
                    <CardContent className="mt-auto flex gap-2">
                      {phoneHref && (
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <a href={phoneHref}>
                            <Phone className="mr-1.5 h-4 w-4" />
                            Ara
                          </a>
                        </Button>
                      )}
                      {mapHref && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 border-[#E30A17]/40 text-[#E30A17] hover:bg-[#E30A17] hover:text-white"
                        >
                          <a href={mapHref} target="_blank" rel="noopener noreferrer">
                            <MapPin className="mr-1.5 h-4 w-4" />
                            Haritada Aç
                          </a>
                        </Button>
                      )}
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
