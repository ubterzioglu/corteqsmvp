import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { profileTypeOptions } from "@/lib/profile-types";

type DirectoryRow = {
  user_id: string;
  role_key: string;
  role_label: string;
  role_slug: string;
  display_name: string;
  short_bio: string | null;
  country: string | null;
  city: string | null;
  profile_image_url: string | null;
  special_attribute_key: string | null;
  special_attribute_label: string | null;
  special_attribute_value: string | null;
  is_featured: boolean;
  is_verified: boolean;
};

const DirectoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<DirectoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchText = searchParams.get("q") ?? "";
  const roleFilter = searchParams.get("role") ?? "all";
  const countryFilter = searchParams.get("country") ?? "";
  const cityFilter = searchParams.get("city") ?? "";
  const featuredOnly = searchParams.get("featured") === "1";

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);
      const { data, error } = await supabase.rpc("list_public_directory_profiles", {
        search_text: searchText || null,
        role_filter: roleFilter === "all" ? null : roleFilter,
        country_filter: countryFilter || null,
        city_filter: cityFilter || null,
        featured_only: featuredOnly,
        verified_only: false,
      });

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setRows([]);
        setIsLoading(false);
        return;
      }

      setRows((data ?? []) as DirectoryRow[]);
      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [cityFilter, countryFilter, featuredOnly, roleFilter, searchText]);

  const availableCountries = useMemo(() => Array.from(new Set(rows.map((row) => row.country).filter(Boolean))), [rows]);
  const availableCities = useMemo(() => Array.from(new Set(rows.map((row) => row.city).filter(Boolean))), [rows]);

  const updateFilter = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <Card className="border-slate-200 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">CorteQS Directory</CardTitle>
          <CardDescription>
            Onaylı ve görünür profilleri rol, ülke, şehir ve arama filtresiyle keşfet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <Input value={searchText} onChange={(event) => updateFilter("q", event.target.value)} placeholder="İsim, bio veya role özel alan ara" />
            <Select value={roleFilter} onValueChange={(value) => updateFilter("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm roller</SelectItem>
                {profileTypeOptions.map((option) => (
                  <SelectItem key={option.type} value={option.type}>
                    {option.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={countryFilter || "all"} onValueChange={(value) => updateFilter("country", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ülke" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm ülkeler</SelectItem>
                {availableCountries.map((country) => (
                  <SelectItem key={country} value={country ?? ""}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cityFilter || "all"} onValueChange={(value) => updateFilter("city", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Şehir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm şehirler</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city ?? ""}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant={featuredOnly ? "default" : "outline"} onClick={() => updateFilter("featured", featuredOnly ? null : "1")}>
              Featured
            </Button>
          </div>

          {isLoading ? <p className="text-sm text-muted-foreground">Directory yükleniyor...</p> : null}
          {errorMessage ? <p className="text-sm text-destructive">Directory alınamadı: {errorMessage}</p> : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <Link key={row.user_id} to={`/directory/profile/${row.user_id}`} className="group">
                <div className="h-full rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{row.display_name}</p>
                      <p className="text-sm text-muted-foreground">{row.role_label}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {row.is_featured ? <Badge>Featured</Badge> : null}
                      {row.is_verified ? <Badge variant="outline">Onaylı</Badge> : null}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p>{row.short_bio ?? "Henüz kısa açıklama eklenmedi."}</p>
                    <p>
                      {row.country ?? "-"} {row.city ? `• ${row.city}` : ""}
                    </p>
                    {row.special_attribute_label && row.special_attribute_value ? (
                      <p>
                        <span className="font-medium text-foreground">{row.special_attribute_label}:</span> {row.special_attribute_value}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {!isLoading && !errorMessage && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Filtrelerine uygun görünür profil bulunamadı.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectoryPage;
