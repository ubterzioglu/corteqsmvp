// Dünya Kupası kampanya vitrini (/dunya-kupasi) — anonim erişilebilir.
// Onaylı işletmeler list_world_cup_businesses_v1 RPC'sinden okunur (kampanya
// pasifse RPC zaten boş döner); ülke/şehir filtreleri client-side.

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin, Trophy, Tv } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchWorldCupCampaignSettings,
  listWorldCupBusinesses,
} from "@/lib/dunya-kupasi-api";

const ALL_FILTER = "__all__";

const DunyaKupasiPage = () => {
  const [countryFilter, setCountryFilter] = useState(ALL_FILTER);
  const [cityFilter, setCityFilter] = useState(ALL_FILTER);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Dünya Kupası Maç Yayını Yapan İşletmeler | CorteQS";
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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <Trophy className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h1 className="text-4xl font-bold">Dünya Kupası'nı Birlikte İzleyelim</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Diasporada Dünya Kupası maçlarını canlı yayınlayan işletmeleri keşfedin. Şehrinizdeki
          mekânı bulun, maç keyfini toplulukla yaşayın.
        </p>
        {campaignActive && (
          <Button asChild className="mt-6">
            <Link to="/dunya-kupasi/kayit">
              <Tv className="mr-2 h-4 w-4" />
              Maç Yayını Yapıyorum — İşletmemi Kaydet
            </Link>
          </Button>
        )}
      </div>

      {!campaignActive && !isLoading ? (
        <Card>
          <CardHeader className="text-center">
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
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
            <p className="text-center text-muted-foreground">Yükleniyor...</p>
          ) : filteredBusinesses.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Henüz listelenen işletme yok</CardTitle>
                <CardDescription>
                  {businesses.length === 0
                    ? "Onaylanan işletmeler burada görünecek. İlk kaydolan siz olun!"
                    : "Seçtiğiniz filtreye uyan işletme bulunamadı."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBusinesses.map((business) => (
                <Card key={business.registrationId} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{business.businessName}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{business.categoryLabel}</Badge>
                      <Badge variant="outline" className="border-amber-400 text-amber-600">
                        <Tv className="mr-1 h-3 w-3" />
                        Maç Yayını
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {business.city}, {business.country}
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/directory/profile/${business.userId}`}>Profili Gör</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DunyaKupasiPage;
