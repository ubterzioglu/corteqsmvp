import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import DirectoryFilters from "@/components/directory/DirectoryFilters";
import DirectoryResultRow from "@/components/directory/DirectoryResultRow";
import DirectorySearchBar from "@/components/directory/DirectorySearchBar";
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
    <div className="landing-ambient min-h-screen">
      <div className="landing-ambient-orb landing-ambient-orb-one" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-two" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-three" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-four" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-five" aria-hidden="true" />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-10">
        <section className="mb-6 rounded-[32px] border border-white/60 bg-white/55 p-6 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl md:p-8">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
              CorteQS Directory
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Diaspora profillerini ve katalog kayitlarini tek yerde kesfet.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Arama, rol ve lokasyon filtreleriyle dogru kisiye veya dogru kayda hizlica ulas.
            </p>
          </div>
        </section>

        <div className="mb-4 max-w-2xl">
          <DirectorySearchBar
            value={searchText}
            onChange={(value) => updateFilter("q", value || null)}
          />
        </div>

        <div className="mb-6 rounded-[28px] border border-white/60 bg-white/60 p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-5">
          <DirectoryFilters
            roleOptions={roleOptions}
            roleFilter={roleFilter}
            onRoleChange={(value) => updateFilter("role", value)}
            countryFilter={countryFilter}
            cityFilter={cityFilter}
            featuredOnly={featuredOnly}
            countryOptions={(countriesQuery.data ?? []).map((country) => country.name)}
            onCountryChange={(value) => updateFilter("country", value)}
            onCityChange={(value) => updateFilter("city", value)}
            onFeaturedChange={(value) => updateFilter("featured", value ? "1" : null)}
          />
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Directory yukleniyor...</p>
        ) : null}
        {errorMessage ? (
          <p className="py-4 text-center text-sm text-destructive">
            Directory alinamadi: {errorMessage}
          </p>
        ) : null}

        {!isLoading && !errorMessage ? (
          <div className="space-y-3">
            {rows.length > 0 ? (
              rows.map((row) => (
                <DirectoryResultRow key={`${row.recordType}-${row.id}`} row={row} />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Filtrelerine uygun gorunur profil bulunamadi.
              </p>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default DirectoryPage;
