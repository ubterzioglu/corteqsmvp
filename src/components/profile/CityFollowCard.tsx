// M26 · CityFollowCard — haftalık şehir özeti takip yönetimi.
//
// 🔴 DÜRÜST UI (dark pattern yok): kullanıcının özet AÇ/KAPASI takip listesinin
// kendisidir — takip varsa özet var, takip yoksa özet YOK (M25: içeriği olmayana
// satır açılmaz). Çalışmayan sahte toggle UYDURULMAZ; platform geneli anahtar
// (email.weekly_city_digest.enabled) şu an KAPALI ve bu kartta AÇIKÇA yazar
// (M27 canlı kanıtından sonra İNSAN kararıyla açılacak — G22/G17 dersi).
// 🔴 Şehir geo_cities'ten (FK city_id) — serbest metin YOK; filtre İSTEMCİDE
// (filterByQuery, Türkçe katlamalı) — sunucuda 76.992 satır taranmaz.
// 🔴 Tavan 10 (CITY_FOLLOWS_MAX_PER_USER, M24 seed aynası) — doluyken ekleme pasif.
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, MapPin, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listGeoCountries } from "@/lib/geo";
import {
  CITY_FOLLOWS_MAX_PER_USER,
  addCityFollow,
  fetchMyCityFollows,
  filterCityOptions,
  listCityOptionsForCountry,
  removeCityFollow,
} from "@/lib/city-follows-api";

const MINE_KEY = ["city-follows", "mine"] as const;
const COUNTRIES_KEY = ["city-follows", "countries"] as const;
const citiesKey = (country: string) => ["city-follows", "cities", country] as const;

export function CityFollowCard() {
  const queryClient = useQueryClient();
  const [country, setCountry] = useState("");
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const followsQuery = useQuery({ queryKey: MINE_KEY, queryFn: fetchMyCityFollows });
  const countriesQuery = useQuery({ queryKey: COUNTRIES_KEY, queryFn: listGeoCountries });
  const citiesQuery = useQuery({
    queryKey: citiesKey(country),
    queryFn: () => listCityOptionsForCountry(country),
    enabled: country !== "",
  });

  // `?? []` her render'da YENİ dizi üretir → useMemo bağımlılığı kayardı (lint
  // exhaustive-deps uyarısı); data referansına sabitlenir.
  const follows = useMemo(() => followsQuery.data ?? [], [followsQuery.data]);
  const followedIds = useMemo(() => new Set(follows.map((f) => f.city_id)), [follows]);
  const atMax = follows.length >= CITY_FOLLOWS_MAX_PER_USER;

  const visibleCities = useMemo(() => {
    const options = citiesQuery.data ?? [];
    const filtered = filterCityOptions(options, query);
    return filtered.filter((option) => !followedIds.has(option.id)).slice(0, 8);
  }, [citiesQuery.data, query, followedIds]);

  const invalidateMine = () => queryClient.invalidateQueries({ queryKey: MINE_KEY });
  const addMutation = useMutation({
    mutationFn: (cityId: string) => addCityFollow(cityId),
    onSuccess: () => {
      setActionError(null);
      invalidateMine();
    },
    onError: (error: unknown) =>
      setActionError(error instanceof Error ? error.message : "Şehir takibi eklenemedi."),
  });
  const removeMutation = useMutation({
    mutationFn: (cityId: string) => removeCityFollow(cityId),
    onSuccess: () => {
      setActionError(null);
      invalidateMine();
    },
    onError: (error: unknown) =>
      setActionError(error instanceof Error ? error.message : "Şehir takibi kaldırılamadı."),
  });

  return (
    <Card data-testid="city-follow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Haftalık şehir özeti
        </CardTitle>
        <CardDescription>
          Takip ettiğin şehirlerde yeni etkinlik veya tavsiye talebi olduğunda haftada en fazla
          bir özet mail alırsın. Takip ettiğin şehir yoksa özet de gelmez — aç/kapa budur.
          (Platform geneli gönderim şu an doğrulama aşamasında KAPALI; açıldığında yalnız
          takip ettiğin şehirler için gönderilir.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Takip edilenler */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Takip edilen şehirler ({follows.length}/{CITY_FOLLOWS_MAX_PER_USER})
          </p>
          {followsQuery.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Yükleniyor…
            </p>
          ) : follows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz şehir takibi yok.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {follows.map((follow) => (
                <li
                  key={follow.city_id}
                  className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-sm"
                  data-testid={`city-follow-chip-${follow.city_id}`}
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  {follow.city_name ?? follow.city_id}
                  {follow.country_name ? (
                    <span className="text-xs text-muted-foreground">{follow.country_name}</span>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`${follow.city_name ?? follow.city_id} takibini kaldır`}
                    className="ml-1 rounded-full p-0.5 text-muted-foreground hover:text-destructive"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(follow.city_id)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {atMax ? (
            <p className="text-xs text-amber-700">
              Takip tavanına ulaştın ({CITY_FOLLOWS_MAX_PER_USER} şehir). Yeni şehir eklemek için
              bir takibi kaldır.
            </p>
          ) : null}
        </div>

        {/* Ekleme: ülke → şehir (istemci filtresi) */}
        {!atMax ? (
          <div className="space-y-2 border-t pt-3">
            <label htmlFor="city-follow-country" className="text-sm font-medium">
              Şehir ekle
            </label>
            <select
              id="city-follow-country"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                setQuery("");
              }}
            >
              <option value="">Ülke seç…</option>
              {(countriesQuery.data ?? []).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>

            {country ? (
              <>
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Şehir ara (örn. Münih)…"
                  aria-label="Şehir ara"
                />
                {citiesQuery.isLoading ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Şehirler yükleniyor…
                  </p>
                ) : visibleCities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Uygun şehir bulunamadı.</p>
                ) : (
                  <ul className="space-y-1">
                    {visibleCities.map((option) => (
                      <li key={option.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm">{option.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={addMutation.isPending}
                          onClick={() => addMutation.mutate(option.id)}
                          data-testid={`city-follow-add-${option.id}`}
                        >
                          Takip et
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : null}
          </div>
        ) : null}

        {actionError ? (
          <p role="alert" className="text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default CityFollowCard;
