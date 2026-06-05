import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import SearchableCitySelect from "@/components/SearchableCitySelect";
import {
  listDirectoryRoleOptions,
  listUnifiedDirectoryRows,
  type DirectoryRoleOption,
  type UnifiedDirectoryRow,
} from "@/lib/catalog-directory";
import { useGeoCountries } from "@/hooks/useGeo";

const DirectoryPage = () => {
  const countriesQuery = useGeoCountries();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<UnifiedDirectoryRow[]>([]);
  const [roleOptions, setRoleOptions] = useState<DirectoryRoleOption[]>([]);
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

      try {
        const [nextRows, nextRoles] = await Promise.all([
          listUnifiedDirectoryRows({
            searchText,
            roleFilter,
            countryFilter,
            cityFilter,
            featuredOnly,
          }),
          listDirectoryRoleOptions(),
        ]);

        if (!isMounted) return;

        setRows(nextRows);
        setRoleOptions(nextRoles);
        setIsLoading(false);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Bilinmeyen hata");
        setRows([]);
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [cityFilter, countryFilter, featuredOnly, roleFilter, searchText]);

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
                {roleOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SearchableCountrySelect
              value={countryFilter || "all"}
              onChange={(v) => updateFilter("country", v || "all")}
              countries={["all", ...(countriesQuery.data ?? []).map((country) => country.name)]}
              placeholder="Ülke"
              size="sm"
              allowClear={false}
              includeAllOptionLabel="Tüm Ülkeler"
            />
            <SearchableCitySelect
              value={cityFilter || "all"}
              onChange={(v) => updateFilter("city", v || "all")}
              countryName={countryFilter || undefined}
              placeholder={countryFilter ? `Tüm Şehirler - ${countryFilter}` : "Önce ülke seçin"}
              size="sm"
              allowClear={false}
              includeAllOptionLabel={countryFilter ? `Tüm Şehirler - ${countryFilter}` : undefined}
              disabled={!countryFilter}
            />
            <Button variant={featuredOnly ? "default" : "outline"} onClick={() => updateFilter("featured", featuredOnly ? null : "1")}>
              Featured
            </Button>
          </div>

          {isLoading ? <p className="text-sm text-muted-foreground">Directory yükleniyor...</p> : null}
          {errorMessage ? <p className="text-sm text-destructive">Directory alınamadı: {errorMessage}</p> : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <Link key={`${row.recordType}-${row.id}`} to={row.href} className="group">
                <div className="h-full rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{row.title}</p>
                      <p className="text-sm text-muted-foreground">{row.roleLabel}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {row.recordType === "catalog_item" ? <Badge variant="secondary">Claimable</Badge> : null}
                      {row.isFeatured ? <Badge>Featured</Badge> : null}
                      {row.isVerified ? <Badge variant="outline">Onaylı</Badge> : null}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p>{row.description ?? "Henüz kısa açıklama eklenmedi."}</p>
                    <p>
                      {row.country ?? "-"} {row.city ? `• ${row.city}` : ""}
                    </p>
                    {row.specialLabel && row.specialValue ? (
                      <p>
                        <span className="font-medium text-foreground">{row.specialLabel}:</span> {row.specialValue}
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
