import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import DirectoryFilters from "@/components/directory/DirectoryFilters";
import DirectoryResultCard from "@/components/directory/DirectoryResultCard";
import DirectoryResultRow from "@/components/directory/DirectoryResultRow";
import { groupDirectoryResults } from "@/lib/directory-grouping";
import DirectorySearchBar from "@/components/directory/DirectorySearchBar";
import {
  DIRECTORY_PAGE_SIZE,
  getTotalDirectoryCount,
  listDirectoryRoleOptions,
  listUnifiedDirectoryRows,
  type DirectoryRoleOption,
  type UnifiedDirectoryRow,
} from "@/lib/catalog-directory";
import { useGeoCountries } from "@/hooks/useGeo";
import { useSeo } from "@/lib/seo";
import { PAGE_SEO } from "@/lib/page-seo";
const mascot = "/lmaskot.png";

// Supabase RPC errors are plain objects ({ message, code, details }), not Error
// instances. Narrow defensively so the real DB message surfaces instead of a
// generic "Bilinmeyen hata".
function getDirectoryErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Bilinmeyen hata";
}

const DirectoryPage = () => {
  useSeo(PAGE_SEO.directory);
  const { user, isLoading: isAuthLoading } = useAuth();
  const countriesQuery = useGeoCountries();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<UnifiedDirectoryRow[]>([]);
  const [roleOptions, setRoleOptions] = useState<DirectoryRoleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** Dizindeki toplam kayıt (filtresiz) — hero rozeti. */
  const [totalCount, setTotalCount] = useState<number | null>(null);
  /** Aktif filtreye uyan toplam kayıt — sayfalanan `rows.length`'ten FARKLIDIR. */
  const [resultTotal, setResultTotal] = useState<number | null>(null);

  // Kurum kaydı kart, kişi kaydı satır olarak çizilir (revizyon 32ae55b9).
  const { catalogItems, members } = useMemo(() => groupDirectoryResults(rows), [rows]);

  const searchText = searchParams.get("q") ?? "";
  // Uygulanmış (applied) filtreler — veri yüklemesi bunları kaynak alır.
  const roleFilter = searchParams.get("role") ?? "all";
  const countryFilter = searchParams.get("country") ?? "";
  const cityFilter = searchParams.get("city") ?? "";
  const featuredOnly = searchParams.get("featured") === "1";

  // Taslak (draft) filtreler — kullanıcı dropdown'ları değiştirir, "Sonuçları Göster"e
  // basana kadar URL'ye ve sorguya yazılmaz. URL dışarıdan değişirse (quick search,
  // geri/ileri) taslak yeniden senkronlanır.
  const [draftRole, setDraftRole] = useState(roleFilter);
  const [draftCountry, setDraftCountry] = useState(countryFilter);
  const [draftCity, setDraftCity] = useState(cityFilter);
  const [draftFeatured, setDraftFeatured] = useState(featuredOnly);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraftRole(roleFilter);
    setDraftCountry(countryFilter);
    setDraftCity(cityFilter);
    setDraftFeatured(featuredOnly);
  }, [roleFilter, countryFilter, cityFilter, featuredOnly]);

  const hasPendingChanges =
    draftRole !== roleFilter ||
    draftCountry !== countryFilter ||
    draftCity !== cityFilter ||
    draftFeatured !== featuredOnly;

  const hasActiveFilters =
    draftRole !== "all" || Boolean(draftCountry) || Boolean(draftCity) || draftFeatured;

  /**
   * Sayfalama durumu, İÇİNDE bağlı olduğu filtre imzasını taşır.
   *
   * Neden ayrı bir `offset` state'i değil: filtre değişince offset'i ayrı bir
   * effect'te sıfırlamak, aynı render'da ESKİ offset ile bir istek daha
   * attırıyor (effect'ler sırayla koşar, setState bir sonraki render'a düşer).
   * İmzayı state'in içinde tutunca "bu offset artık geçerli değil" bilgisi
   * türetilebilir hale gelir ve boşa istek kalmaz.
   */
  const filterKey = `${searchText}\u0000${roleFilter}\u0000${countryFilter}\u0000${cityFilter}\u0000${featuredOnly}`;
  const [pager, setPager] = useState<{ key: string; offset: number }>({
    key: filterKey,
    offset: 0,
  });
  const activeOffset = pager.key === filterKey ? pager.offset : 0;

  useEffect(() => {
    // Oturum durumu netleşmeden çağırma: `user` bir an null görünüp sonra
    // dolabilir ve aynı sorgu iki kez gider. Sonuçlar ARTIK ziyaretçi için de
    // yüklenir — `search_directory_catalog` anonim çağrılabilir (Batch 0).
    if (isAuthLoading) return;

    let isMounted = true;

    void (async () => {
      if (activeOffset === 0) setIsLoading(true);
      else setIsLoadingMore(true);
      setErrorMessage(null);

      try {
        const [result, nextRoles] = await Promise.all([
          listUnifiedDirectoryRows({
            searchText,
            roleFilter,
            countryFilter,
            cityFilter,
            featuredOnly,
            offset: activeOffset,
            limit: DIRECTORY_PAGE_SIZE,
          }),
          listDirectoryRoleOptions(),
        ]);

        if (!isMounted) return;

        setRows((previous) =>
          activeOffset === 0 ? result.rows : [...previous, ...result.rows],
        );
        setResultTotal(result.totalCount);
        setRoleOptions(nextRoles);
        setIsLoading(false);
        setIsLoadingMore(false);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(getDirectoryErrorMessage(error));
        // "Daha fazla" başarısız olursa eldeki sonuçları SİLME — kullanıcı
        // okuduğu listeyi kaybetmesin, yalnız hata mesajı görsün.
        if (activeOffset === 0) setRows([]);
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [
    activeOffset,
    cityFilter,
    countryFilter,
    featuredOnly,
    isAuthLoading,
    roleFilter,
    searchText,
  ]);

  /**
   * "Daha fazla var mı" sorusu, çekilen SAYFA ilerlemesinden hesaplanır —
   * `rows.length`'ten DEĞİL. Sebep: `rows`, TS tarafındaki yönetici süzgecinden
   * geçmiş listedir; süzgeç bir satır bile elerse `rows.length` sunucunun
   * saydığı toplama asla yetişemez ve buton sonsuza kadar kalır.
   */
  const hasMore = resultTotal !== null && activeOffset + DIRECTORY_PAGE_SIZE < resultTotal;

  // B5 kök nedeni: bu effect'in temizleyicisi YOKTU. Sayım isteği çözülmeden
  // kullanıcı /directory'den ayrılırsa `setTotalCount` sökülmüş bileşen üzerinde
  // çalışıyordu. Test süiti paralel koşarken bu, ortam yıkıldıktan SONRA
  // gerçekleşiyor ve `ReferenceError: window is not defined` şeklinde bir
  // "unhandled rejection" olarak düşüyordu (bkz. DirectoryPage.test.tsx notu).
  // Hemen yukarıdaki effect aynı korumayı zaten taşıyor — burada eksikti.
  useEffect(() => {
    let isMounted = true;

    void getTotalDirectoryCount().then((count) => {
      if (isMounted) setTotalCount(count);
    });

    return () => {
      isMounted = false;
    };
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

  // Taslak filtreleri URL'ye toplu yazar (q korunur) ve sonuç listesine kaydırır.
  const applyDraftFilters = () => {
    const next = new URLSearchParams(searchParams);
    const setOrDelete = (key: string, value: string | null) => {
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
    };
    setOrDelete("role", draftRole);
    setOrDelete("country", draftCountry);
    setOrDelete("city", draftCity);
    setOrDelete("featured", draftFeatured ? "1" : null);
    setSearchParams(next);
    // Sonuç listesi mevcut filtre kartının altında; kullanıcıyı oraya yönlendir.
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const clearDraftFilters = () => {
    setDraftRole("all");
    setDraftCountry("");
    setDraftCity("");
    setDraftFeatured(false);
    const next = new URLSearchParams(searchParams);
    next.delete("role");
    next.delete("country");
    next.delete("city");
    next.delete("featured");
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
        <section className="mb-6 overflow-hidden rounded-[32px] border-4 border-orange-300 bg-gradient-to-br from-white/70 via-white/55 to-primary/5 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl">
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

        {/* Ziyaretçi ARTIK duvara çarpmaz — arama herkese açık (Batch 0).
            Buradaki kart bir engel değil, davet: giriş yapınca iletişime geçme
            ve profil açma gibi işlemler açılır. `next` bu sayfaya döner, böylece
            kullanıcı giriş sonrası aradığı yerden devam eder. */}
        {!isAuthLoading && !user ? (
          <section className="mb-6 rounded-[28px] border border-primary/20 bg-white/70 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h2 className="text-base font-semibold text-foreground">
              Dizinde arama herkese açık.
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Ücretsiz giriş yaptığında profillerle iletişime geçebilir, kendi kaydını
              açabilir ve aramalarını kaydedebilirsin.
            </p>
            <div className="mt-3">
              <Button asChild size="sm">
                <a href={`/login?next=${encodeURIComponent(`/directory?${searchParams.toString()}`)}`}>
                  Giriş Yap
                </a>
              </Button>
            </div>
          </section>
        ) : null}

        <div className="mb-4">
              <DirectorySearchBar
                value={searchText}
                onChange={(value) => updateFilter("q", value || null)}
              />
            </div>

            <div className="mb-6 rounded-[28px] border-4 border-orange-300 bg-white/60 p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-5">
              <DirectoryFilters
                roleOptions={roleOptions}
                roleFilter={draftRole}
                onRoleChange={setDraftRole}
                countryFilter={draftCountry}
                cityFilter={draftCity}
                featuredOnly={draftFeatured}
                countryOptions={(countriesQuery.data ?? []).map((country) => country.name)}
                onCountryChange={(value) => {
                  setDraftCountry(value === "all" ? "" : value);
                  setDraftCity("");
                }}
                onCityChange={(value) => setDraftCity(value === "all" ? "" : value)}
                onFeaturedChange={setDraftFeatured}
                onApply={applyDraftFilters}
                onClear={clearDraftFilters}
                hasPendingChanges={hasPendingChanges}
                hasActiveFilters={hasActiveFilters}
              />
            </div>

            <div ref={resultsRef} className="scroll-mt-24" />

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
                    {/* Sayı RPC'nin `total_count`'undan gelir — sonuç listesiyle
                        AYNI filtreyi paylaşır. `rows.length` yalnız o ana kadar
                        ÇEKİLEN sayfaları gösterir; ikisini karıştırma. */}
                    <p className="pb-1 text-xs font-medium text-muted-foreground">
                      {(resultTotal ?? rows.length).toLocaleString("tr-TR")} sonuç bulundu
                      {resultTotal !== null && rows.length < resultTotal
                        ? ` · ${rows.length.toLocaleString("tr-TR")} tanesi gösteriliyor`
                        : ""}
                    </p>
                    {/* m32ae55b9: kurum kaydı kartta, kişi kaydı satırda. Kurumun
                        taşıdığı bilgi (logo, açıklama, hizmet etiketi) satıra
                        sığmıyordu; kişi ise kartta boş duruyordu. Başlıklar yalnız
                        İKİ grup da doluyken çizilir — tek tip sonuçta gereksiz. */}
                    {catalogItems.length > 0 ? (
                      <section className="space-y-3">
                        {members.length > 0 ? (
                          <h2 className="text-sm font-semibold text-foreground">Kuruluşlar ve işletmeler</h2>
                        ) : null}
                        <div className="grid gap-3 sm:grid-cols-2">
                          {catalogItems.map((row) => (
                            <DirectoryResultCard key={`${row.recordType}-${row.id}`} row={row} />
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {members.length > 0 ? (
                      <section className="space-y-3">
                        {catalogItems.length > 0 ? (
                          <h2 className="pt-2 text-sm font-semibold text-foreground">Kişiler</h2>
                        ) : null}
                        <div className="space-y-3">
                          {members.map((row) => (
                            <DirectoryResultRow key={`${row.recordType}-${row.id}`} row={row} />
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {hasMore ? (
                      <div className="pt-4 text-center">
                        <Button
                          variant="outline"
                          disabled={isLoadingMore}
                          onClick={() =>
                            setPager({ key: filterKey, offset: activeOffset + DIRECTORY_PAGE_SIZE })
                          }
                        >
                          {isLoadingMore ? "Yükleniyor..." : "Daha fazla göster"}
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {roleFilter !== "all"
                      ? "Bu kategoride henüz görünür profil yok. İlk başvurular yakında burada görünecek — dilersen aramayı genişletip diğer kategorilere göz atabilirsin."
                      : "Aramana uygun görünür profil bulunamadı. Farklı bir şehir, kategori veya anahtar kelime deneyebilirsin."}
                  </p>
                )}
              </div>
            ) : null}
      </main>
    </div>
  );
};

export default DirectoryPage;
