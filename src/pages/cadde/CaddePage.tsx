import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, ChevronDown, Globe2, MapPin, Megaphone, MessagesSquare, Sparkles, UserPlus2 } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { CaddeFeedView } from "@/components/cadde/CaddeFeedView";
import CaddeCafesPanel from "@/components/cadde/CaddeCafesPanel";
import CaddeComingSoon from "@/components/cadde/CaddeComingSoon";
import CaddeBridgeInfo from "@/components/cadde/CaddeBridgeInfo";
import CaddeFeaturedSpotlight from "@/components/cadde/CaddeFeaturedSpotlight";
import CaddeGeoFilter from "@/components/cadde/CaddeGeoFilter";
import CaddeProfileGate from "@/components/cadde/CaddeProfileGate";
import CaddeReachCard from "@/components/cadde/CaddeReachCard";
import CaddeTrendingHashtags from "@/components/cadde/CaddeTrendingHashtags";
import CarsiGlobalTicker from "@/components/cadde/CarsiGlobalTicker";
import PromotionRail from "@/components/cadde/PromotionRail";
import { useCaddePageData } from "@/hooks/cadde/useCaddePageData";
import { useCaddeFeedState } from "@/hooks/cadde/useCaddeFeedState";
import { useCaddeFeedRealtime } from "@/hooks/cadde/useCaddeFeedRealtime";
import { useCaddeComposerState } from "@/hooks/cadde/useCaddeComposerState";
import {
  CADDE_REACTION_CLOSE_DELAY_MS,
  useCaddePostEngagement,
} from "@/hooks/cadde/useCaddePostEngagement";
import { useCaddeLayoutState } from "@/hooks/cadde/useCaddeLayoutState";
import CaddeBadge from "@/components/cadde/CaddeBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { parseCaddeFilters, serializeCaddeFilters } from "@/lib/cadde-format";
import { useCompactHeaderOnScroll } from "@/hooks/useCompactHeaderOnScroll";
import { isInternalCaddeLink } from "@/lib/cadde-links";
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
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const {
    activeCafes,
    asideRhythm,
    cafeLocationLabel,
    cafesOpen,
    cafeThemeLabelByKey,
    clockTarget,
    coldRailOpen,
    directoryLink,
    geoFilterOpen,
    hasAnyBillboard,
    hasGeoSelection,
    interestLabelByKey,
    isColdStart,
    listedBillboards,
    promotionCtaLabel,
    promotionCtaTarget,
    setCafesOpenOverride,
    setColdRailOpen,
    setGeoFilterOpenOverride,
    setShowAllCafes,
    showAllCafes,
    sparseContentHint,
    spotlightBillboard,
  } = layout;

  const scrollToComposer = () => {
    document.getElementById("cadde-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <CaddeProfileGate context={actorContextQuery.data} isLoading={actorContextQuery.isLoading}>
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

        <aside data-testid="cadde-right-rail" className={`order-3 lg:order-none ${asideRhythm}`}>
          {/* Konum + Aktif Cafeler + İnsanları Keşfet 05.08.2026'da bu kolona alındı
              (günün üçüncü ve son yerleşim revizyonu — bkz. ızgara yorumu).

              Üçü de aşağıdaki soğuk başlangıç katlamasının (cadde-right-rail-content)
              DIŞINDA durur; bu bilinçlidir ve iki nedeni vardır:
              1) O kapağın etiketi "Yakında gelenler ve tanıtım" — konum filtresini ve
                 cafe listesini o etiketin arkasına saklamak yanlış adlandırma olur.
              2) B1 kuralı: akışı daraltan bir seçim varken filtre GÖRÜNÜR kalmalıdır,
                 çünkü akışın neden boş olduğunu gösterebilecek tek kontrol odur.

              Kartların iç düzeni zaten dar kolon için kurulmuştu (eski 290px sol kolon),
              320px'te olduğu gibi çalışır. Tek düzeltme: başlık butonlarındaki
              `sm:w-auto` kaldırıldı — viewport tabanlı olduğu için dar kolonda da
              devreye girip başlıkla aynı satıra sıkışıyordu. */}
          <Card className="cadde-panel">
            <CardHeader className="pb-3">
              {/* 09.09.2026 (H2): başlıktaki siyah "Caddeye Çık" pill'i KALDIRILDI.
                  Kullanıcı zaten Cadde'de ve buton yalnız scrollToComposer çağırıyordu —
                  composer aynı sayfada, birkaç ekran yukarıda duruyor; yani buton hiçbir
                  yere götürmüyordu (bkz. docs/cadde-300/2026-08-27-ux-degerlendirme.md §2).
                  DİKKAT: scrollToComposer ÖLÜ KOD DEĞİLDİR — boş akış kartındaki
                  "İlk paylaşımı yap" birincil eylemi aynı fonksiyonu kullanır ve
                  CaddePage.test.tsx'teki "gives the empty feed a first action that jumps
                  to the composer" testi onu kilitler. Silme.
                  Buton gidince dış flex sarmalayıcısı (justify-between) tek çocuklu ve
                  işlevsiz kalıyordu; başlık ikon+metin hizası bozulmasın diye sarmalayıcı
                  da kaldırıldı, iç hizalama satırı olduğu gibi korundu. */}
              <div className="flex min-w-0 items-center gap-2">
                <Globe2 className="h-5 w-5 shrink-0 text-orange-500" />
                <div className="min-w-0">
                  <CardTitle className="font-display text-lg">Konum</CardTitle>
                  <CardDescription>Global akış, şehir seçimi ve köprü modu</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* B1: filtre kutusu soğuk başlangıçta KAPALI açılır — filtrelenecek
                  içerik yokken sayfanın üst köşesini bir ayar paneli tutuyordu.
                  Kapatmak filtreyi SIFIRLAMAZ: burada yalnız görünürlük değişir,
                  updateFilters çağrılmaz, URL search-param'a dokunulmaz. */}
              <Collapsible open={geoFilterOpen} onOpenChange={setGeoFilterOpenOverride}>
                <CollapsibleTrigger
                  data-testid="cadde-geo-toggle"
                  className="flex w-full items-center justify-between gap-2 rounded-lg text-sm font-medium text-slate-700 transition hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  Ülke ve Şehir
                  <ChevronDown
                    aria-hidden
                    className={`h-4 w-4 text-slate-500 transition-transform ${geoFilterOpen ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <CaddeGeoFilter
                    countries={countriesQuery.data ?? []}
                    cities={citiesQuery.data ?? []}
                    selectedCountries={filters.countries}
                    selectedCities={filters.cities}
                    onChange={(next) => updateFilters(next)}
                  />
                  <p className="text-xs leading-relaxed text-slate-500">
                    Şehrini göremiyorsan ülke geneli akışı keşfedebilir veya ilk paylaşımı sen yapabilirsin.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {/* m35: tek satırlık tanım yetmiyordu — dört hedef kitle bilgi balonunda. */}
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-950">
                      Köprü
                      <CaddeBridgeInfo />
                    </p>
                    <p className="text-xs leading-relaxed text-emerald-700">TR-Diaspora arasında taşınma, iş ve mentorluk akışı.</p>
                  </div>
                  <Switch
                    checked={filters.bridge}
                    onCheckedChange={(checked) => updateFilters({ bridge: checked })}
                    className="shrink-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Görünürlük kapısının kullanıcıya anlatıldığı tek yer. Konum kartının hemen
              ALTINDA durur: üstteki kart akışı daraltan seçimi yapar, bu kart o seçimin
              sonucunu ("paylaşımın kaç üyeye ulaşır") söyler. Soğuk başlangıç
              katlamasının DIŞINDA — akış boşken cevabı en çok bu kart veriyor. */}
          <CaddeReachCard />

          {/* m84: "Aktif Cafeler" orta kolondan sol kolona, oradan üst bloğa gitmişti;
              05.08.2026'da sağ kolona yerleşti. Panelin başlık satırı ve kafe satırları
              esnek — dar kolonda da okunuyor, bu yüzden bileşene dokunulmadı. */}
          <CaddeCafesPanel
            cafes={activeCafes}
            themeLabelByKey={cafeThemeLabelByKey}
            hasSession={Boolean(session)}
            locationLabel={cafeLocationLabel}
            sparseContentHint={sparseContentHint}
            open={cafesOpen}
            onOpenChange={setCafesOpenOverride}
            showAll={showAllCafes}
            onShowAll={() => setShowAllCafes(true)}
          />

          {/* `hidden lg:block` KORUNDU: kart mobilde eskiden de çizilmiyordu, taşınma
              bunu değiştirmemeli. */}
          <Card className="hidden border-slate-200 bg-white/90 lg:block">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <MessagesSquare className="h-4 w-4 text-orange-500" />
                    İnsanları Keşfet
                  </CardTitle>
                  <CardDescription>İsimle ara ya da dizinde gezin.</CardDescription>
                </div>
                <Button asChild variant="outline" className="cadde-secondary-action w-full justify-between rounded-lg">
                  <Link to={directoryLink}>
                    Kişileri Keşfet
                    <UserPlus2 className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* m38: tüm kayıtlı üyeler isimle aranabilir (kapsam kararı: açık profil tam
                  satır + ad-onaylı kapalı üye yalnız isim/şehir, tıklanamaz). */}
              <Input
                value={peopleQueryText}
                onChange={(event) => setPeopleQueryText(event.target.value)}
                placeholder="İsimle ara (en az 2 harf)"
                aria-label="Kişi ara"
                className="h-9 rounded-lg"
              />
              {peopleSearch.data && peopleSearch.data.length > 0 ? (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white" data-testid="cadde-people-results">
                  {peopleSearch.data.map((person) =>
                    person.hasProfile ? (
                      <li key={person.userId}>
                        <Link
                          to={`/directory/profile/${person.userId}`}
                          className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-50"
                        >
                          <span className="truncate font-medium">{person.fullName}</span>
                          <span className="shrink-0 text-xs text-slate-500">
                            {[person.city, person.country].filter(Boolean).join(" • ")}
                          </span>
                        </Link>
                      </li>
                    ) : (
                      <li
                        key={person.userId}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-500"
                        title="Profil henüz açık değil"
                      >
                        <span className="truncate">{person.fullName}</span>
                        <span className="shrink-0 text-xs">{person.city ?? "—"}</span>
                      </li>
                    ),
                  )}
                </ul>
              ) : debouncedPeopleQuery.length >= 2 && !peopleSearch.isFetching ? (
                <p className="px-1 text-xs text-slate-500">Eşleşen üye bulunamadı.</p>
              ) : null}
            </CardContent>
          </Card>

          {/* B10 — mobil soğuk başlangıç. `lg` altında sıra composer → akış → SAĞ
              KOLON'dur; içerik yokken kullanıcı akışın sonunda uzun bir kart
              kaydırmasına giriyordu.

              Katlama YALNIZ mobilde ve YALNIZ soğuk başlangıçta geçerlidir. Viewport
              bilerek JS ile ölçülmüyor: `useIsMobile` 768px'te ve ilk render'da
              `undefined` döndüğü için mobilde önce açık çizilip sonra göz önünde
              katlanırdı (B1'de kaçındığımız jank'in aynısı). Bunun yerine tetik
              `lg:hidden`, içerik `lg:block` — masaüstünde React durumu ne olursa olsun
              CSS kazanır ve kolon her zaman açıktır. İçerik DOM'dan da sökülmez. */}
          {isColdStart ? (
            <button
              type="button"
              data-testid="cadde-right-rail-toggle"
              aria-expanded={coldRailOpen}
              aria-controls="cadde-right-rail-content"
              onClick={() => setColdRailOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 lg:hidden"
            >
              Yakında gelenler ve tanıtım
              <ChevronDown
                aria-hidden
                className={`h-4 w-4 text-slate-500 transition-transform ${coldRailOpen ? "rotate-180" : ""}`}
              />
            </button>
          ) : null}

          <div
            id="cadde-right-rail-content"
            className={`${asideRhythm} ${isColdStart && !coldRailOpen ? "hidden lg:block" : ""}`}
          >
          {/* m30: Çarşı ticker'ı tanıtım kolonunda yaşıyor (F10 bunu "Çarşı yakında"
              teaser'ına çevirecek). */}
          <CarsiGlobalTicker filters={filters} />

          {/* m41: statik "CorteQS Panosu / Bugün caddede öne çıkanlar" kartı kaldırıldı;
              yerini panelden Featured işaretlenen kayıt aldı (yoksa hiç çizilmez). */}
          {spotlightBillboard ? (
            <CaddeFeaturedSpotlight card={spotlightBillboard} />
          ) : hasAnyBillboard ? (
            <Card
              data-testid="cadde-featured-empty-state"
              className="cadde-featured overflow-hidden"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  Caddede Öne Çık
                </CardTitle>
                <CardDescription>İlk featured alanı profilinden başlat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="text-sm leading-relaxed text-slate-600">
                  Danışmanlık, etkinlik veya işletme duyurunu sağ kolondaki seçkili alana taşı.
                </p>
                <Button asChild variant="outline" className="cadde-secondary-action w-full rounded-lg">
                  <Link to={promotionCtaTarget}>
                    {promotionCtaLabel}
                    <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* Panosu kartından KORUNAN iki parça: maskot selamı ve beta geri bildirimi.
              Geri bildirim WhatsApp yerine kendi /feedback formumuza gider (kayıt altına
              alınır, /admin/feedback'ten takip edilir); kaynak=cadde ile ayrışır. */}
          <Card className="border-slate-200 bg-white/90">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <img src="/lmaskot.png" alt="CorteQS maskot" className="h-12 w-auto shrink-0 drop-shadow" />
                <p className="text-sm leading-relaxed text-slate-600">
                  Şehrindeki Türk topluluğunu büyütmeye yardım et — paylaş, sor, destek ol.
                </p>
              </div>
              <Link
                to="/feedback?kaynak=cadde"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                Beta geri bildirimi ver
                <Megaphone className="h-4 w-4 text-orange-500" />
              </Link>
            </CardContent>
          </Card>

          <CaddeTrendingHashtags />

          {/* m88: çalışmayan fonksiyonlar kendi yüzeylerinde disabled durmuyor,
              hepsi burada toplanıyor. */}
          <CaddeComingSoon />

          <PromotionRail filters={filters} hideWhenEmpty={isColdStart} />

          {/* Hiç billboard kaydı yokken bu kartın TEK içeriği kendi boş-durum kutusu
              olurdu; aşağıdaki koyu davet kartı zaten aynı şeyi söylüyor. Bu yüzden
              soğuk başlangıçta kart tamamen çizilmiyor (bkz. hasAnyBillboard). */}
          {hasAnyBillboard ? (
          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <CardTitle className="font-display text-lg">Şehrinden Öne Çıkanlar</CardTitle>
              <CardDescription>Danışman, işletme ve etkinlik kartları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* m44: kartın TAMAMI hedefe (cta_url → profil/katalog sayfası) gider.
                  CTA artık iç içe <a> üretmemek için görsel bir şerit; dış bağlantılar
                  yeni sekmede açılır (isInternalCaddeLink ayrımı). */}
              {listedBillboards.length > 0 ? listedBillboards.map((card) => {
                const cardBody = (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <CaddeBadge tone="kategori">{card.type}</CaddeBadge>
                      {card.isFeatured ? <CaddeBadge tone="durum" intent="neutral">Öne Çıkan</CaddeBadge> : null}
                      {card.badgeText ? <CaddeBadge tone="kategori">{card.badgeText}</CaddeBadge> : null}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{card.title}</h3>
                    {card.subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{card.subtitle}</p> : null}
                    <p className="mt-3 text-sm leading-6 text-slate-700">{card.description}</p>
                    <span className="cadde-tertiary-action mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition">
                      {card.ctaLabel}
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </>
                );
                const cardClassName = "cadde-card group block rounded-lg p-4";

                return isInternalCaddeLink(card.ctaUrl) ? (
                  <Link key={card.id} to={card.ctaUrl} className={cardClassName}>
                    {cardBody}
                  </Link>
                ) : (
                  <a key={card.id} href={card.ctaUrl} target="_blank" rel="noreferrer noopener" className={cardClassName}>
                    {cardBody}
                  </a>
                );
              }) : (
                <div
                  data-testid="cadde-billboards-empty-state"
                  className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5"
                >
                  {/* 05.09.2026 revizyon c1a3aaf0 ("Sağdaki billboard bölgesine maskot
                      görseli konsun"): boş billboard kutusu düz metindi. Maskot DEKORATİF —
                      `alt=""` + `aria-hidden` ile erişilebilirlik ağacından çıkarılır, çünkü
                      metnin söylemediği hiçbir şeyi söylemiyor; ekran okuyucuya "CorteQS
                      maskot" diye okutmak gürültüden ibaret olurdu.
                      Boyut ÖLÇÜLÜ ve iki eksende de sabit (`h-16 w-16` + `object-contain`):
                      sağ kolon 320px, `w-auto` bırakılsaydı görselin en/boy oranı metni
                      ezebilirdi. `shrink-0` metin sütununun daralmasına izin verir. */}
                  <div className="flex items-center gap-3">
                    <img
                      src="/lmaskot.png"
                      alt=""
                      aria-hidden="true"
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-16 shrink-0 object-contain drop-shadow"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">Şehrinden öne çıkan ilk kart burada görünecek.</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        Danışman, işletme ve etkinlik keşfi için alan hazır. {sparseContentHint}
                      </p>
                    </div>
                  </div>
                  {/* m43: boş reklam yüzeyi potansiyel müşteriye "burayı alabilirsin" der.
                      Hemen altındaki koyu kart ana CTA olduğu için bu ince bir bağlantı —
                      aynı hedefe giden üç kalın buton üst üste yığılmıyor. */}
                  <Link
                    to={promotionCtaTarget}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 underline-offset-4 hover:underline"
                  >
                    Reklamını buraya verebilirsin
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          ) : null}

          <Card data-testid="cadde-promotion-invite" className="border-slate-200 bg-slate-900 text-white">
            <CardHeader>
              {/* text-balance: "Ol" tek başına ikinci satıra düşmesin (dar sidebar'da kırılıyordu). */}
              <CardTitle className="text-balance font-display text-[clamp(1rem,2.2vw,1.25rem)] leading-snug text-white">
                Cadde İçinde Görünür Ol
              </CardTitle>
              {/* m45: "talep bırak" kalktı — kullanıcı kendi profilinden bütçe verip
                  tanıtımını yayınlıyor (Facebook/Instagram modeli), aracı adım yok. */}
              <CardDescription className="text-balance text-slate-500">
                Billboard ve sponsorlu akış alanlarını profilindeki tanıtım panelinden kendin açarsın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-white/10 p-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                <p className="text-sm text-slate-200">Danışman, etkinlik ve topluluk kampanyalarını şehir bazlı yayınlayabilirsin.</p>
              </div>
              <Button asChild variant="outline" className="cadde-secondary-action w-full rounded-lg">
                <Link to={promotionCtaTarget}>{promotionCtaLabel}</Link>
              </Button>
            </CardContent>
          </Card>
          </div>
        </aside>
      </section>
    </main>
    </CaddeProfileGate>
  );
};

export default CaddePage;



