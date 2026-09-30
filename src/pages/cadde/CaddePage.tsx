import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "@/components/auth/useAuth";
import { CaddeFeedView } from "@/components/cadde/CaddeFeedView";
import CaddeProfileGate from "@/components/cadde/CaddeProfileGate";
import CaddeRightRail from "@/components/cadde/CaddeRightRail";
import { useCaddePageData } from "@/hooks/cadde/useCaddePageData";
import { useCaddeFeedState } from "@/hooks/cadde/useCaddeFeedState";
import { useCaddeFeedRealtime } from "@/hooks/cadde/useCaddeFeedRealtime";
import { useCaddeComposerState } from "@/hooks/cadde/useCaddeComposerState";
import { useCaddePostEngagement } from "@/hooks/cadde/useCaddePostEngagement";
import { useCaddeLayoutState } from "@/hooks/cadde/useCaddeLayoutState";
import { parseCaddeFilters, serializeCaddeFilters } from "@/lib/cadde-format";
import { useCompactHeaderOnScroll } from "@/hooks/useCompactHeaderOnScroll";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { CaddeFilterState } from "@/lib/cadde-types";
import { useSeo } from "@/lib/seo";
import { PAGE_SEO } from "@/lib/page-seo";

// K1 (m156, 13 Eylül karar): tepki seti 5'ten 3'e indirildi. Kalp ve Gülme
// kaldırıldı (canlıda hiç kullanılmamışlardı — ölçüldü, `cadde_post_reactions`'ta
// tek satır bile yok). "unsure" diaspora akışında beğeniden daha değerli bir
// sinyal olduğu için kaldı, yalnız etiketi niyetini söyleyecek şekilde "Soru"
// oldu (eskisi "Emin olamadım" belirsizdi).

// Tepki kartının kapanış gecikmesi (revizyon 55a55bdf). Fare tetikten kartın içine
// geçerken React'in `onPointerLeave`'i tetiklenebiliyor: React bu olayı `pointerout`ın
// `relatedTarget`inden türetir ve relatedTarget çözülemediğinde (jsdom'da HER ZAMAN
// `window` gelir, bazı tarayıcılarda da boş kalır) "her yerden çıkıldı" sayar.
// ANINDA kapatan ilk sürümde bunun sonucu şuydu: kart, üzerine gitmeye çalıştığın anda
// kapanıyor ve tepki butonlarına fareyle HİÇ tıklanamıyordu. Gecikme bu boşluğu
// köprüler; karta girmek bekleyen kapanışı iptal eder (Radix HoverCard'ın `closeDelay`
// fikri). Düşürmeden önce bunu oku — 0'a çekmek hatayı geri getirir.
// m29 (F9): Cadde içindeki tekrar eden ikincil menü (Cadde/İş/Sosyal/Harita/Giriş/Kayıt)
// kaldırıldı — üst ana menü zaten aynı hedefleri taşıyor, cadde login-gated olduğu için
// Giriş/Kayıt linkleri buraya hiç düşmüyordu.


const CaddePage = () => {
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  // Y2 (m153): scroll'da header daralır. Anahtar documentElement'e yazılır, SiteHeader'a
  // hiç dokunulmaz — küçültmeyi src/index.css yapar. Hook'u ÇAĞIRAN sayfa küçülmeyi alır;
  // bugün yalnız /cadde çağırıyor, kritiğin şikâyeti oradaydı (~300px yığın).
  useCompactHeaderOnScroll();

  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseCaddeFilters(searchParams), [searchParams]);
  const {
    actorContextQuery,
    allCitiesQuery,
    billboardsQuery,
    cafeThemesQuery,
    cafesQuery,
    citiesQuery,
    countriesQuery,
    debouncedPeopleQuery,
    diasporaKey,
    feedPromotionsQuery,
    feedQuery,
    feedQueryKey,
    interestCatalogQuery,
    peopleQueryText,
    peopleSearch,
    setPeopleQueryText,
    sponsorQuery,
  } = useCaddePageData({
    filters,
    hasSession: Boolean(session),
    currentUserId: user?.id ?? null,
  });
  const registeredCountry = actorContextQuery.data?.country?.trim() ?? "";
  const registeredCity = actorContextQuery.data?.city?.trim() ?? "";

  // m89: Yeni paylaşım geldiğinde "Yeni paylaşımlar var" butonu göster
  const { hasNewPosts, reset: resetNewPosts } = useCaddeFeedRealtime(Boolean(session));

  useSeo(PAGE_SEO.cadde);

  const invalidateCadde = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: caddeQueryKeys.feedRoot }),
      queryClient.invalidateQueries({ queryKey: caddeQueryKeys.cafesRoot }),
    ]);
  };

  // A06b: hook sonuçları ARTIK PARÇALANMADAN da tutuluyor. Alt bileşenlere tek
  // tek 50 prop geçmek yerine bu gruplu nesneler geçiliyor; parçalama aşağıda
  // duruyor çünkü bu dosyada kalan JSX eski adları kullanmaya devam ediyor.
  const composerState = useCaddeComposerState({
    canPost: Boolean(user),
    diasporaKey,
    registeredCountry,
    registeredCity,
    onPublished: async () => {
      await invalidateCadde();
      setSearchParams(serializeCaddeFilters({ ...filters, mode: "real" }));
    },
  });
  const { composer, defaultComposerLocationLabel, postMutation, setComposer } = composerState;

  const engagement = useCaddePostEngagement({
    currentUserId: user?.id ?? null,
    feedQueryKey,
    onInvalidateCadde: invalidateCadde,
  });
  const {
    commentDrafts,
    commentMutation,
    commentTextareaRef,
    commentsQuery,
    expandedComments,
    expandedCommentPostId,
    insertCommentEmoji,
    openReactionsPostId,
    reactionCloseTimerRef,
    reactionMutation,
    reactionOpenedByHoverRef,
    reactionPointerDownRef,
    reportMutation,
    setCommentDrafts,
    setExpandedCommentPostId,
    setOpenReactionsPostId,
    shareMutation,
    syncCommentSelection,
  } = engagement;

  const updateFilters = (nextPartial: Partial<CaddeFilterState>) => {
    setSearchParams(serializeCaddeFilters({ ...filters, ...nextPartial }));
  };

  const feedState = useCaddeFeedState({
    filters,
    currentUserId: user?.id ?? null,
    diasporaKey,
    feedPages: feedQuery.data?.pages,
    isFeedLoading: feedQuery.isLoading,
    isFeedError: feedQuery.isError,
    countries: countriesQuery.data,
    cities: citiesQuery.data,
    allCities: allCitiesQuery.data,
    sponsor: sponsorQuery.data ?? null,
    promotions: feedPromotionsQuery.data ?? [],
  });
  const {
    canWiden,
    feedItems,
    feedWithSponsor,
    newPostCount,
    newPostsQuery,
    newestLoadedAt,
    widenedCount,
    widenedPage,
    widenTarget,
  } = feedState;

  const layout = useCaddeLayoutState({
    filters,
    registeredCity,
    allCities: allCitiesQuery.data ?? [],
    interests: interestCatalogQuery.data ?? [],
    cafeThemes: cafeThemesQuery.data ?? [],
    cafes: cafesQuery.data ?? [],
    billboards: billboardsQuery.data ?? [],
    feedItemCount: feedItems.length,
    isFeedLoading: feedQuery.isLoading,
    isFeedError: feedQuery.isError,
    isCafesLoading: cafesQuery.isLoading,
    canWiden,
    widenTarget,
    isAuthenticated: Boolean(user),
  });
  // A06c: layout sonucu ARTIK PARÇALANMIYOR — sağ kolon `CaddeRightRail`'e
  // gruplu nesne olarak geçer (A06b dersi), akış kolonu zaten `layout` alıyordu.

  const scrollToComposer = () => {
    document.getElementById("cadde-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <CaddeProfileGate
      context={actorContextQuery.data}
      isLoading={actorContextQuery.isLoading}
      isError={actorContextQuery.isError}
      onRetry={() => void actorContextQuery.refetch()}
      isRetrying={actorContextQuery.isFetching}
    >
    <main className="cadde-shell">
      {/* Y1 (m151, 09.09.2026): kimlik şeridi KALDIRILDI.
          Kritik "logo bandı ile sayfa başlığını birleştir" diyordu, ama ölçünce
          birleştirilecek bir şey olmadığı çıktı: şeridin yüksekliğini metin değil
          ZİL belirliyordu (h-11 = 44px + kart py-3 + kenarlık). Yani başlığı paylaşılan
          SiteHeader'a taşımak ~0px kazandırır, kart yerinde kalırdı — üstelik zil
          Cadde'ye özgü bir widget (realtime abonelik + feature gate) ve onu header'a
          koymak 61 rotayı etkilerdi.
          Şeritteki her şey ya kopyaydı ya dekor: ikinci logo (header'da zaten var),
          "Diaspora Cadde" (SEO başlığı zaten söylüyor), "CorteQS Cadde" rozeti,
          tanıtım cümlesi. Tek işlevsel öge zildi ve kapsam şeridine taşındı.
          ⚠️ Akışın üstüne yeni bir tam genişlik bloğu ekleme — aşağıdaki 05.08.2026
          notunu oku. */}
      {/* Sayfanın ilk ve tek h1'i. Bugüne kadar /cadde'de HİÇ h1 yoktu (başlık bir
          CardTitle = h3'tü); şerit kalkarken bu a11y/SEO açığı 0px maliyetle kapandı. */}
      <h1 className="sr-only">Diaspora Cadde</h1>

      {/* Izgara 2 kolon: akış + sağ kolon. Akışın ÜSTÜNDE hiçbir tam genişlik bloğu
          yoktur — kullanıcı kararı 05.08.2026 (üçüncü ve son revizyon): akış doğrudan
          ilk sırada gelir. Konum + Aktif Cafeler + İnsanları Keşfet günün ilk iki
          denemesinde (önce üç satır, sonra üç kolon) akışın üstündeydi; ikisi de
          paylaşım kutusunu katlamanın altında bıraktı. Üçüncü denemede üçü de SAĞ
          kolona alındı, akışın üstü tamamen boşaldı.
          09.09.2026 (Y1): kimlik şeridi de kalktı, artık üstte gerçekten hiçbir şey yok.
          Buraya yeni bir tam genişlik bloğu eklemeden önce bu geçmişi oku: akışın
          üstüne konan her blok katlama sorununu geri getirir.
          pt-4/pb-5: şerit gidince üstteki 20px boşluk fazla kaldı, 16px'e indi. */}
      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-5 pt-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-6">
        {/* m85: orta kolon = paylaşım kutusu + akış, başka hiçbir şey. Buradaki
            "Diaspora Cadde" başlık kartı üst şeridin birebir kopyasıydı, akışı bir kart
            aşağı itiyordu — silindi, filtre özeti üst şeritte duruyor. */}
        <CaddeFeedView
          composerState={composerState}
          engagement={engagement}
          feedState={feedState}
          layout={layout}
          filters={filters}
          updateFilters={updateFilters}
          scrollToComposer={scrollToComposer}
          feedQuery={feedQuery}
          countriesQuery={countriesQuery}
          allCitiesQuery={allCitiesQuery}
          hasNewPosts={hasNewPosts}
          resetNewPosts={resetNewPosts}
          setSearchParams={setSearchParams}
        />

        {/* A06c: sağ kolon BİREBİR taşındı — CaddeRightRail.tsx. Sıra/konum
            değişmedi (K01'e bağlı değil); prop'lar gruplu (A06b dersi). */}
        <CaddeRightRail
          layout={layout}
          filters={filters}
          updateFilters={updateFilters}
          countriesQuery={countriesQuery}
          citiesQuery={citiesQuery}
          cafesQuery={cafesQuery}
          peopleSearch={peopleSearch}
          debouncedPeopleQuery={debouncedPeopleQuery}
          peopleQueryText={peopleQueryText}
          setPeopleQueryText={setPeopleQueryText}
          hasSession={Boolean(session)}
        />
      </section>
    </main>
    </CaddeProfileGate>
  );
};

export default CaddePage;



