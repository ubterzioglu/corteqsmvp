import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import DirectoryFilters from "@/components/directory/DirectoryFilters";
import DirectoryResultRow from "@/components/directory/DirectoryResultRow";
import DirectorySearchBar from "@/components/directory/DirectorySearchBar";
import {
  getTotalDirectoryCount,
  listDirectoryRoleOptions,
  listUnifiedDirectoryRows,
  type DirectoryRoleOption,
  type UnifiedDirectoryRow,
} from "@/lib/catalog-directory";
import { useGeoCountries } from "@/hooks/useGeo";
const mascot = "/lmaskot.png";

const DirectoryPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const countriesQuery = useGeoCountries();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<UnifiedDirectoryRow[]>([]);
  const [roleOptions, setRoleOptions] = useState<DirectoryRoleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const searchText = searchParams.get("q") ?? "";
  const roleFilter = searchParams.get("role") ?? "all";
  const countryFilter = searchParams.get("country") ?? "";
  const cityFilter = searchParams.get("city") ?? "";
  const featuredOnly = searchParams.get("featured") === "1";

  useEffect(() => {
    if (isAuthLoading || !user) {
      setRows([]);
      setRoleOptions([]);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

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
  }, [cityFilter, countryFilter, featuredOnly, isAuthLoading, roleFilter, searchText, user]);

  useEffect(() => {
    void getTotalDirectoryCount().then(setTotalCount);
  }, []);

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
        {/* Hero card */}
        <section className="mb-6 overflow-hidden rounded-[32px] border-2 border-orange-300 bg-gradient-to-br from-white/70 via-white/55 to-primary/5 shadow-[0_0_80px_-6px_rgba(249,115,22,0.55),0_0_40px_-10px_rgba(251,188,5,0.40),0_30px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-6 p-6 md:p-8">
            {/* Left: text content */}
            <div className="min-w-0 flex-1">

              <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                <span className="bg-[linear-gradient(90deg,#EA4335_0%,#FBBC05_28%,#34A853_52%,#4285F4_76%,#A259FF_100%)] bg-clip-text text-transparent">CorteQS</span>{" "}
                <span>Türk Diaspora Ağı</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                Türk diasporasında ara! 80+ kategoride aradığını bul!
              </p>
              {/* Stats row */}
              <div className="mt-4 flex flex-wrap gap-3">
                {totalCount !== null ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                    {totalCount.toLocaleString("tr-TR")} kayıt
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  80+ kategori
                </span>
              </div>
            </div>
            {/* Right: mascot */}
            <div className="hidden shrink-0 sm:block">
              <img
                src={mascot}
                alt="CorteQS maskot"
                className="h-32 w-auto drop-shadow-xl md:h-40"
              />
            </div>
          </div>
        </section>

        {!isAuthLoading && !user ? (
          <section className="mb-6 rounded-[28px] border border-primary/20 bg-white/70 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-foreground">Tam dizin için giriş gerekiyor.</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Birleşik katalog araması sadece giriş yapmış kullanıcılara açık. Giriş yaptığında bireysel, doktor, avukat, işletme ve kuruluş profillerini aynı kaynaktan görebilirsin.
            </p>
            <div className="mt-4">
              <Button asChild>
                <a href="/login?next=%2Fdirectory">Giriş Yap</a>
              </Button>
            </div>
          </section>
        ) : null}

        {user ? (
          <>
            <div className="mb-4">
              <DirectorySearchBar
                value={searchText}
                onChange={(value) => updateFilter("q", value || null)}
              />
            </div>

            <div className="mb-6 rounded-[28px] border-2 border-orange-300 bg-white/60 p-4 shadow-[0_0_60px_-6px_rgba(249,115,22,0.50),0_0_30px_-8px_rgba(251,188,5,0.38),0_24px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-5">
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
              <p className="py-8 text-center text-sm text-muted-foreground">Dizin yükleniyor...</p>
            ) : null}
            {errorMessage ? (
              <p className="py-4 text-center text-sm text-destructive">
                Dizin alınamadı: {errorMessage}
              </p>
            ) : null}

            {!isLoading && !errorMessage ? (
              <div className="space-y-3">
                {rows.length > 0 ? (
                  <>
                    <p className="pb-1 text-xs font-medium text-muted-foreground">
                      {rows.length.toLocaleString("tr-TR")} sonuç bulundu
                    </p>
                    {rows.map((row) => (
                      <DirectoryResultRow key={`${row.recordType}-${row.id}`} row={row} />
                    ))}
                  </>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Filtrelerine uygun görünür profil bulunamadı.
                  </p>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
};

export default DirectoryPage;
