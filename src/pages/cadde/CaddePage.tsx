import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Flag, Flame, Globe2, Heart, MapPin, Megaphone, MessageCircle, MessagesSquare, Sparkles, ThumbsUp, UserPlus2 } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import CaddeComposer from "@/components/cadde/CaddeComposer";
import CaddeGeoFilter from "@/components/cadde/CaddeGeoFilter";
import CaddeFeedScopeBar from "@/components/cadde/CaddeFeedScopeBar";
import CaddeMediaGallery from "@/components/cadde/CaddeMediaGallery";
import CaddePostBody from "@/components/cadde/CaddePostBody";
import CaddeProfileGate from "@/components/cadde/CaddeProfileGate";
import CaddeTrendingHashtags from "@/components/cadde/CaddeTrendingHashtags";
import CaddeWorldClocks from "@/components/cadde/CaddeWorldClocks";
import CarsiGlobalTicker from "@/components/cadde/CarsiGlobalTicker";
import CreateCafeForm from "@/components/cadde/CreateCafeForm";
import NotificationsBell from "@/components/cadde/NotificationsBell";
import PromotionRail from "@/components/cadde/PromotionRail";
import SponsoredFeedCard from "@/components/cadde/SponsoredFeedCard";
import { useCaddeActorContext } from "@/hooks/cadde/useCaddeActorContext";
import { useCaddeDiasporaKey } from "@/hooks/cadde/useCaddeDiasporaKey";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  countCaddePostsSince,
  createCaddeComment,
  createCaddePost,
  getCaddeSponsoredPlacement,
  listCaddeBillboardCards,
  listCaddeCafes,
  listCaddeCities,
  listCaddeCountries,
  listCaddeFeed,
  listCaddeInterestCatalog,
  reportCaddeEntity,
  toggleCaddeReaction,
} from "@/lib/cadde-api";
import { emptyCaddeComposer } from "@/lib/cadde-composer";
import { caddeNewPostPollInterval, newestCaddeCreatedAt, nextCaddeZeroStreak } from "@/lib/cadde-feed-polling";
import { injectSponsoredPlacement, interleavePromotions, parseCaddeFilters, serializeCaddeFilters, summarizeCaddeFilters } from "@/lib/cadde-format";
import { listCaddePromotions } from "@/lib/cadde-tanitim-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import { toggleInterestSelection } from "@/lib/cadde-targeting";
import type { CaddeFeedPageParam, CaddeFilterState, CaddePostType, CaddeReactionType } from "@/lib/cadde-types";
import { useSeo } from "@/lib/seo";
import { PAGE_SEO } from "@/lib/page-seo";

const REACTION_META: Array<{ key: CaddeReactionType; label: string; icon: typeof ThumbsUp }> = [
  { key: "like", label: "Beğendim", icon: ThumbsUp },
  { key: "support", label: "Destek", icon: Sparkles },
  { key: "idea", label: "Fikir", icon: Flame },
];

const SECONDARY_NAV = [
  { label: "Cadde", to: "/cadde" },
  { label: "İş", to: "/commercial" },
  { label: "Sosyal", to: "/directory" },
  { label: "Harita", href: "https://globe.corteqs.net" },
  { label: "Giriş Yap", to: "/login" },
  { label: "Kayıt Ol", to: "/login?mode=signup" },
] as const;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const CaddePage = () => {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [composer, setComposer] = useState(emptyCaddeComposer);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedCommentPostId, setExpandedCommentPostId] = useState<string | null>(null);
  const filters = useMemo(() => parseCaddeFilters(searchParams), [searchParams]);
  const diasporaKey = useCaddeDiasporaKey();
  const actorContextQuery = useCaddeActorContext(Boolean(session));

  useSeo(PAGE_SEO.cadde);

  const countriesQuery = useQuery({
    queryKey: caddeQueryKeys.countries(),
    queryFn: listCaddeCountries,
  });

  const citiesQuery = useQuery({
    queryKey: caddeQueryKeys.cities(filters.countries),
    queryFn: () => listCaddeCities(filters.countries),
  });

  const interestCatalogQuery = useQuery({
    queryKey: caddeQueryKeys.interestCatalog,
    queryFn: listCaddeInterestCatalog,
    staleTime: 1000 * 60 * 60,
  });

  // Composer hedef şehri seçilen hedef ülkeye göre kapsamlanır (filtreden bağımsız).
  const composerCitiesQuery = useQuery({
    queryKey: caddeQueryKeys.cities(composer.country ? [composer.country] : ["__composer-none__"]),
    queryFn: () => listCaddeCities(composer.country ? [composer.country] : []),
    enabled: Boolean(session && composer.country),
  });

  const feedQuery = useInfiniteQuery({
    queryKey: caddeQueryKeys.feed(filters, user?.id ?? null, diasporaKey),
    initialPageParam: null as CaddeFeedPageParam,
    queryFn: ({ pageParam }) => listCaddeFeed(filters, pageParam, user?.id ?? null, diasporaKey),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const cafesQuery = useQuery({
    queryKey: caddeQueryKeys.cafes(filters, user?.id ?? null, diasporaKey),
    queryFn: () => listCaddeCafes(filters, user?.id ?? null, diasporaKey),
  });

  const billboardsQuery = useQuery({
    queryKey: caddeQueryKeys.billboards(filters),
    queryFn: () => listCaddeBillboardCards(filters),
  });

  const sponsorQuery = useQuery({
    queryKey: caddeQueryKeys.sponsor(filters),
    queryFn: () => getCaddeSponsoredPlacement(filters),
  });

  const feedPromotionsQuery = useQuery({
    queryKey: caddeQueryKeys.promotions("cadde-feed-inline", { countries: filters.countries, cities: filters.cities, diaspora: diasporaKey }),
    queryFn: () => listCaddePromotions("cadde-feed-inline", { countries: filters.countries, cities: filters.cities, diaspora: diasporaKey }, 5),
  });

  const invalidateCadde = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: caddeQueryKeys.feedRoot }),
      queryClient.invalidateQueries({ queryKey: caddeQueryKeys.cafesRoot }),
    ]);
  };

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Bu işlem için giriş yapın.");
      // Gövde boş olabilir — salt görsel/video paylaşımı meşru (şema + RPC aynı kuralı uygular).
      if (!composer.body.trim() && composer.media.length === 0) {
        throw new Error("Paylaşım metni veya en az bir görsel/video ekle.");
      }
      // Hedef: composer'daki açık seçim; boşsa aktif filtredeki ilk seçim.
      await createCaddePost({
        type: composer.type,
        title: composer.title,
        body: composer.body,
        countryId: composer.country || filters.countries[0] || "",
        cityId: composer.country ? composer.city : filters.cities[0] ?? "",
        isBridge: filters.bridge,
        interests: composer.interests,
        diasporaKey,
        media: composer.media,
      });
    },
    onSuccess: async () => {
      setComposer(emptyCaddeComposer);
      await invalidateCadde();
      setSearchParams(serializeCaddeFilters({ ...filters, mode: "real" }));
      toast({ title: "Paylaşım Cadde'ye eklendi" });
    },
    onError: (error) => {
      toast({ title: "Paylaşım gönderilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: CaddeReactionType }) => {
      if (!user) throw new Error("Bu işlem için giriş yapın.");
      await toggleCaddeReaction(postId, reactionType);
    },
    onSuccess: invalidateCadde,
    onError: (error) => {
      if (!user) {
        navigate("/login");
        return;
      }
      toast({ title: "Reaksiyon güncellenemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ postId, body }: { postId: string; body: string }) => {
      if (!user) throw new Error("Bu işlem için giriş yapın.");
      if (!body.trim()) throw new Error("Yorum boş olamaz.");
      await createCaddeComment(postId, body);
    },
    onSuccess: async (_data, variables) => {
      setCommentDrafts((current) => ({ ...current, [variables.postId]: "" }));
      await invalidateCadde();
    },
    onError: (error) => {
      if (!user) {
        navigate("/login");
        return;
      }
      toast({ title: "Yorum gönderilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Bu işlem için giriş yapın.");
      const reason = window.prompt("Şikayet sebebini kısaca yaz (3-200 karakter):");
      if (reason === null) return false;
      await reportCaddeEntity("post", postId, reason);
      return true;
    },
    onSuccess: (submitted) => {
      if (submitted) toast({ title: "Şikayetin moderasyona iletildi" });
    },
    onError: (error) => {
      toast({ title: "Şikayet gönderilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const updateFilters = (nextPartial: Partial<CaddeFilterState>) => {
    setSearchParams(serializeCaddeFilters({ ...filters, ...nextPartial }));
  };

  // "Yeni post" chip'i (spec §17.3): stream yok; hafif sayım, tıklayınca invalidate.
  // Adaptif aralık (cadde-feed-polling): 0 sonuç sürdükçe 60sn→2dk→5dk, chip görünürken
  // polling durur; odağa dönüşte anında tek kontrol yapılıp taban aralığa dönülür.
  // Taban = yüklü sayfaların EN YENİ createdAt'i (m16): feed CKS-sıralı olduğundan
  // ilk öğe pinned/eski olabilir — ilk öğeden alınan taban chip'i söndürmüyordu.
  const newestLoadedAt = useMemo(
    () => newestCaddeCreatedAt(feedQuery.data?.pages),
    [feedQuery.data],
  );
  const zeroStreakRef = useRef(0);
  useEffect(() => {
    zeroStreakRef.current = 0;
  }, [newestLoadedAt]);
  useEffect(() => {
    const resetStreak = () => {
      zeroStreakRef.current = 0;
    };
    window.addEventListener("focus", resetStreak);
    return () => window.removeEventListener("focus", resetStreak);
  }, []);
  const newPostsQuery = useQuery({
    queryKey: ["cadde", "new-posts-since", newestLoadedAt],
    queryFn: async () => {
      const count = await countCaddePostsSince(newestLoadedAt ?? "");
      zeroStreakRef.current = nextCaddeZeroStreak(count, zeroStreakRef.current);
      return count;
    },
    enabled: filters.mode === "real" && Boolean(newestLoadedAt),
    refetchInterval: (query) => caddeNewPostPollInterval(query.state.data ?? 0, zeroStreakRef.current),
    refetchOnWindowFocus: "always",
  });
  const newPostCount = newPostsQuery.data ?? 0;

  const feedItems = useMemo(() => feedQuery.data?.pages.flatMap((page) => page.items) ?? [], [feedQuery.data]);
  const feedWithSponsor = useMemo(
    () =>
      interleavePromotions(
        injectSponsoredPlacement(feedItems, sponsorQuery.data ?? null, filters.mode),
        feedPromotionsQuery.data ?? [],
        filters.mode,
      ),
    [feedItems, sponsorQuery.data, feedPromotionsQuery.data, filters.mode],
  );
  const directoryLink = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.countries[0]) params.set("country", filters.countries[0]);
    if (filters.cities[0]) params.set("city", filters.cities[0]);
    return `/directory${params.toString() ? `?${params.toString()}` : ""}`;
  }, [filters.countries, filters.cities]);

  const interestLabelByKey = useMemo(
    () => new Map((interestCatalogQuery.data ?? []).map((interest) => [interest.key, interest.labelTr])),
    [interestCatalogQuery.data],
  );
  const hasGeoSelection = filters.countries.length > 0 || filters.cities.length > 0;
  const sparseContentHint = hasGeoSelection
    ? "Bu bölgede içerik azsa ülke geneli ve global akış da devreye girer."
    : "İçerik az olduğunda global akışla başlayıp ilk hareketi sen başlatabilirsin.";
  const activeCafes = cafesQuery.data ?? [];
  const billboardCards = billboardsQuery.data ?? [];

  return (
    <CaddeProfileGate context={actorContextQuery.data} isLoading={actorContextQuery.isLoading}>
    <main className="cadde-shell min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ec_22%,#f6f8fb_100%)]">
      <section className="border-b border-orange-100/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 lg:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#ffefe0] text-[#9a4b18] hover:bg-[#ffefe0]">CorteQS Cadde</Badge>
            <p className="text-sm text-slate-600">Şehrindeki Türklerle tanış, sor, paylaş ve fırsatları keşfet.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NotificationsBell />
            {SECONDARY_NAV.map((item) =>
              "href" in item ? (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.to} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[290px_minmax(0,1fr)_320px] lg:px-6">
        <aside className="order-2 space-y-5 lg:order-none">
          <CarsiGlobalTicker filters={filters} />

          <Card className="border-orange-100 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Konum</CardTitle>
                  <CardDescription>Global akış, şehir seçimi ve köprü modu</CardDescription>
                </div>
                <Globe2 className="h-5 w-5 text-orange-500" />
              </div>
              <Button
                onClick={() => {
                  document.getElementById("cadde-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="w-full justify-between rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
              >
                Caddeye Çık
                <Megaphone className="h-4 w-4 text-orange-200" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ülke ve Şehir</Label>
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
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">Köprü</p>
                    <p className="text-xs leading-relaxed text-emerald-700">TR-Diaspora arasında taşınma, iş ve mentorluk akışı.</p>
                  </div>
                  <Switch checked={filters.bridge} onCheckedChange={(checked) => updateFilters({ bridge: checked })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hidden border-slate-200 bg-white/90 lg:block">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessagesSquare className="h-4 w-4 text-orange-500" />
                İnsanları Keşfet
              </CardTitle>
              <CardDescription>Seçtiğin şehirdeki kişi ve işletmeleri keşfet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full justify-between rounded-2xl">
                <Link to={directoryLink}>
                  Kişileri Keşfet
                  <UserPlus2 className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <CardTitle className="text-base">
                {hasGeoSelection ? `Cafeler (${summarizeCaddeFilters(filters)})` : "Cafeler"}
              </CardTitle>
              <CardDescription>Seçili filtre içindeki odalar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeCafes.slice(0, 3).map((cafe) => (
                <div key={cafe.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{cafe.title}</p>
                      <p className="text-xs text-slate-500">{cafe.city ?? "Global"} • {cafe.memberCount} üye</p>
                    </div>
                    {cafe.isBridge ? <Badge variant="secondary">Köprü</Badge> : null}
                  </div>
                </div>
              ))}
              {!activeCafes.length ? <p className="text-sm text-slate-500">Bu filtrelerde aktif cafe yok.</p> : null}
            </CardContent>
          </Card>
        </aside>

        <section className="order-1 space-y-5 lg:order-none">
          <Card className="overflow-hidden border-slate-200 bg-white/90">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Diaspora Cadde</CardTitle>
                  <CardDescription>Global Türk topluluğunun şehir bazlı sosyal akışı</CardDescription>
                </div>
                <Badge variant="outline">{summarizeCaddeFilters(filters)}</Badge>
              </div>
              <CaddeWorldClocks
                viewerCity={actorContextQuery.data?.city ?? null}
                filterCity={filters.cities[0] ?? null}
                cities={citiesQuery.data ?? []}
              />
            </CardHeader>
          </Card>

          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Aktif Cafeler</CardTitle>
                  <CardDescription>Kısa süreli topluluk odaları ve tema bazlı buluşmalar</CardDescription>
                </div>
                {session ? <CreateCafeForm trigger={<Button size="sm" variant="outline" className="rounded-2xl">+ Cafe Aç</Button>} /> : null}
              </div>
            </CardHeader>
            <CardContent>
              {activeCafes.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {activeCafes.map((cafe) => (
                    <div key={cafe.id} className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#fff_0%,#f8fafc_100%)] p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{cafe.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{cafe.city ?? "Global"} • {formatDateTime(cafe.startsAt)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {cafe.isBridge ? <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Köprü</Badge> : null}
                          {cafe.entryMode !== "open" ? <Badge variant="outline">{cafe.entryMode === "approval" ? "Onaylı" : "Davetli"}</Badge> : null}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{cafe.summary}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">Host: {cafe.hostName} • {cafe.memberCount} üye</div>
                        <Button size="sm" variant={cafe.joinedByViewer ? "secondary" : "outline"} asChild>
                          <Link to={`/cadde/cafe/${cafe.id}`}>
                            {cafe.joinedByViewer ? "Odaya Gir" : cafe.viewerMemberStatus === "pending" ? "Onay Bekliyor" : "İncele & Katıl"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  data-testid="cadde-cafes-empty-state"
                  className="rounded-[28px] border border-dashed border-orange-200 bg-[linear-gradient(180deg,#fffaf4_0%,#fff4ea_100%)] p-6"
                >
                  <p className="text-sm font-semibold text-slate-900">Henüz aktif bir cafe açılmadı.</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Şehir sohbetleri, tema bazlı odalar ve kısa buluşmalar burada görünür. {sparseContentHint}
                  </p>
                  {session ? (
                    <div className="mt-4">
                      <CreateCafeForm trigger={<Button size="sm" variant="outline" className="rounded-2xl">İlk Cafe'yi Aç</Button>} />
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {session ? (
            <CaddeComposer
              value={composer}
              onChange={setComposer}
              onSubmit={() => postMutation.mutate()}
              isSubmitting={postMutation.isPending}
              countries={countriesQuery.data ?? []}
              cities={composerCitiesQuery.data ?? []}
              filterCountryLabel={filters.countries[0] || "Global"}
              onError={(message) => toast({ title: "Ek eklenemedi", description: message, variant: "destructive" })}
            />
          ) : (
            <Card id="cadde-composer" className="scroll-mt-24 border-slate-200 bg-white/95">
              <CardContent className="p-5">
                <div className="rounded-[24px] border border-dashed border-orange-200 bg-orange-50 p-5">
                  <p className="text-sm leading-relaxed text-slate-700">
                    Ziyaretçiler akışı görebilir. Paylaşım, yorum ve reaksiyon için{" "}
                    <Link to="/login" className="font-semibold text-orange-700 underline">giriş yap</Link>.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <CaddeFeedScopeBar
            scope={filters.scope}
            hashtag={filters.hashtag}
            onScopeChange={(scope) => updateFilters({ scope })}
            onClearHashtag={() => updateFilters({ hashtag: "" })}
          />

          <div className="space-y-4">
            {newPostCount > 0 ? (
              <div className="flex justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full shadow"
                  onClick={async () => {
                    // m16: chip tıklamayla ANINDA söner — eski taban anahtarındaki sayaç
                    // sıfırlanır; feed yenilenince taban (max createdAt) ilerler ve yeni
                    // queryKey temiz sayımla başlar. Eski anahtarı yeniden fetch etmek
                    // bayat pozitif sayıyı geri getiriyordu — kaldırıldı.
                    queryClient.setQueryData(["cadde", "new-posts-since", newestLoadedAt], 0);
                    await queryClient.invalidateQueries({ queryKey: caddeQueryKeys.feedRoot });
                  }}
                >
                  {newPostCount} yeni paylaşım — yenile
                </Button>
              </div>
            ) : null}

            {feedWithSponsor.map((item, itemIndex) =>
              item.kind === "promotion" ? (
                <SponsoredFeedCard key={`promo-${item.promotion.campaignId}-${itemIndex}`} promotion={item.promotion} />
              ) : item.kind === "sponsor" ? (
                <Card key={item.sponsor.id} className="border-orange-200 bg-[linear-gradient(135deg,#fff7e8_0%,#fff1d6_100%)]">
                  <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <Badge className="bg-orange-500 text-white hover:bg-orange-500">{item.sponsor.badgeText ?? "Sponsorlu"}</Badge>
                      <h3 className="text-lg font-semibold text-slate-900">{item.sponsor.title}</h3>
                      <p className="text-sm text-slate-700">{item.sponsor.description}</p>
                    </div>
                    <Button asChild className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                      <Link to={item.sponsor.ctaUrl}>{item.sponsor.ctaLabel}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card
                  key={item.post.id}
                  data-testid="cadde-feed-card"
                  className="overflow-hidden rounded-[28px] border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
                >
                  <CardContent className="space-y-4 p-5 sm:p-6">
                    {/* m18 forum hiyerarşisi: konu (varsa) büyük ve EN ÜSTTE, yazar küçük,
                        altında ülke•şehir•tarih. m17: tip rozeti ("soru"/"ilan") kaldırıldı. */}
                    <div className="space-y-1">
                      {item.post.title ? (
                        <h3 className="text-lg font-semibold leading-snug text-slate-950">{item.post.title}</h3>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-700">{item.post.authorName}</p>
                        {item.post.authorRole ? <Badge variant="secondary">{item.post.authorRole}</Badge> : null}
                        {item.post.pinned ? <Badge className="bg-slate-900 text-white hover:bg-slate-900">Pinned</Badge> : null}
                        {item.post.isBridge ? <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Köprü</Badge> : null}
                      </div>
                      <p className="text-xs text-slate-500">
                        {[item.post.country, item.post.city].filter(Boolean).join(" • ") || "Global"} • {formatDateTime(item.post.createdAt)}
                      </p>
                    </div>

                    <CaddePostBody body={item.post.body} mentions={item.post.mentions} />

                    <CaddeMediaGallery media={item.post.media} contextLabel={item.post.authorName} />

                    {/* Küratörlü etiketler (ranking'i besler) ve serbest hashtag'ler ayrı görünür:
                        ilki rozet, ikincisi tıklanabilir mavi link. */}
                    {item.post.interests.length > 0 || item.post.hashtags.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.post.interests.map((key) => (
                          <Badge key={key} variant="outline" className="text-xs font-normal">
                            {interestLabelByKey.get(key) ?? key}
                          </Badge>
                        ))}
                        {item.post.hashtags.map((hashtag) => (
                          <Link
                            key={hashtag.tag}
                            to={`/cadde?etiket=${encodeURIComponent(hashtag.tag)}`}
                            className="text-xs font-medium text-sky-700 hover:underline"
                          >
                            #{hashtag.displayTag}
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                      {(() => {
                        const totalReactions = REACTION_META.reduce(
                          (sum, reaction) => sum + (item.post.reactionCounts[reaction.key] ?? 0),
                          0,
                        );
                        const viewerReacted = item.post.viewerReactions.length > 0;
                        return (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={viewerReacted ? "default" : "outline"}
                                size="sm"
                                aria-label="Tepki ver"
                                className={viewerReacted ? "bg-slate-900 text-white hover:bg-slate-800" : ""}
                              >
                                <Heart className={`mr-2 h-4 w-4 ${viewerReacted ? "fill-current" : ""}`} />
                                Tepki Ver{totalReactions > 0 ? ` (${totalReactions})` : ""}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-auto p-1.5">
                              <div className="flex items-center gap-1">
                                {REACTION_META.map((reaction) => {
                                  const Icon = reaction.icon;
                                  const active = item.post.viewerReactions.includes(reaction.key);
                                  return (
                                    <Button
                                      key={reaction.key}
                                      variant={active ? "default" : "ghost"}
                                      size="sm"
                                      aria-label={`${reaction.label} (${item.post.reactionCounts[reaction.key] ?? 0})`}
                                      onClick={() => {
                                        if (!session) {
                                          navigate("/login");
                                          return;
                                        }
                                        reactionMutation.mutate({ postId: item.post.id, reactionType: reaction.key });
                                      }}
                                      className={active ? "bg-slate-900 text-white hover:bg-slate-800" : ""}
                                    >
                                      <Icon className="mr-1.5 h-4 w-4" />
                                      {reaction.label}
                                      <span className="ml-1 text-xs text-muted-foreground">{item.post.reactionCounts[reaction.key] ?? 0}</span>
                                    </Button>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })()}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid="cadde-comment-toggle"
                        className="rounded-full"
                        onClick={() =>
                          setExpandedCommentPostId((current) => (current === item.post.id ? null : item.post.id))
                        }
                      >
                        <MessageCircle className="mr-1.5 h-4 w-4" />
                        {item.post.commentCount > 0 ? `${item.post.commentCount} yorum` : "Yorum yaz"}
                      </Button>
                      {session && item.post.authorUserId !== user?.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-red-600"
                          onClick={() => reportMutation.mutate(item.post.id)}
                          disabled={reportMutation.isPending}
                          aria-label="Paylaşımı şikayet et"
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>

                    <Separator />

                    <div
                      data-testid="cadde-comment-panel"
                      className="rounded-[24px] border border-slate-200/90 bg-slate-50/80 p-4"
                    >
                      <div className="space-y-3">
                        {(expandedCommentPostId === item.post.id ? item.post.comments : item.post.comments.slice(0, 2)).map((comment) => (
                          <div key={comment.id} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                            <p className="text-sm font-semibold text-slate-900">{comment.authorName}</p>
                            <p className="mt-1 text-sm text-slate-700">{comment.body}</p>
                          </div>
                        ))}

                        {expandedCommentPostId !== item.post.id && item.post.comments.length > 2 ? (
                          <p className="text-xs text-slate-500">
                            +{item.post.comments.length - 2} yorum daha var. Tümünü görmek için yorumları aç.
                          </p>
                        ) : null}

                        {expandedCommentPostId === item.post.id ? (
                          session ? (
                            <div className="space-y-3">
                              {item.post.comments.length === 0 ? (
                                <p className="text-sm text-slate-500">İlk yorumu sen bırak ve konuşmayı başlat.</p>
                              ) : null}
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Textarea
                                  value={commentDrafts[item.post.id] ?? ""}
                                  onChange={(event) => setCommentDrafts((current) => ({ ...current, [item.post.id]: event.target.value }))}
                                  placeholder="Yorum yaz"
                                  rows={2}
                                  className="min-h-[88px] bg-white"
                                />
                                <Button
                                  className="self-end sm:min-w-[112px]"
                                  onClick={() => {
                                    commentMutation.mutate({ postId: item.post.id, body: commentDrafts[item.post.id] ?? "" });
                                  }}
                                >
                                  Gönder
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-4 py-4 text-sm text-slate-600">
                              Yorum yazmak için <Link to="/login" className="font-semibold text-orange-700 underline">giriş yap</Link>.
                            </div>
                          )
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),
            )}

            {!feedQuery.isLoading && filters.mode === "real" && feedItems.length === 0 ? (
              <Card
                data-testid="cadde-feed-empty-state"
                className="border-dashed border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#fff7ee_100%)]"
              >
                <CardContent className="p-8 text-center text-slate-500">
                  <p className="text-base font-semibold text-slate-900">Bu akış henüz sessiz.</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    İlk paylaşımı sen yapabilir, ülke genelindeki konuşmaları izleyebilir veya köprü moduyla daha geniş akışı keşfedebilirsin.
                  </p>
                  <p className="mt-3 text-xs text-slate-500">{sparseContentHint}</p>
                </CardContent>
              </Card>
            ) : null}

            {feedQuery.hasNextPage ? (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => feedQuery.fetchNextPage()} disabled={feedQuery.isFetchingNextPage}>
                  {feedQuery.isFetchingNextPage ? "Yükleniyor..." : "Daha Fazla Yükle"}
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="order-3 space-y-5 lg:order-none">
          {/* CorteQS Panosu — topluluk panosu / maskot teaser'ı */}
          <Card className="overflow-hidden border-orange-100 bg-[linear-gradient(160deg,#fff7ec_0%,#ffffff_60%)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">CorteQS Panosu</CardTitle>
              <CardDescription>Bugün Caddede öne çıkanlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white/70 p-3">
                <img src="/lmaskot.png" alt="CorteQS maskot" className="h-14 w-auto shrink-0 drop-shadow" />
                <p className="text-sm leading-relaxed text-slate-600">
                  Şehrindeki Türk topluluğunu büyütmeye yardım et — paylaş, sor, destek ol.
                </p>
              </div>
              {/* Geri bildirim WhatsApp yerine kendi /feedback formumuza gider (kayıt altına alınır,
                  /admin/feedback'ten takip edilir). kaynak=cadde ile nereden geldiği ayrılır. */}
              <Link
                to="/feedback?kaynak=cadde"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                Beta geri bildirimi ver
                <Megaphone className="h-4 w-4 text-orange-500" />
              </Link>
            </CardContent>
          </Card>

          <CaddeTrendingHashtags />

          <PromotionRail filters={filters} />

          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <CardTitle>Şehrinden Öne Çıkanlar</CardTitle>
              <CardDescription>Danışman, işletme ve etkinlik kartları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {billboardCards.length > 0 ? billboardCards.map((card) => (
                <div key={card.id} className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{card.type}</Badge>
                    {card.badgeText ? <Badge className="bg-orange-100 text-orange-900 hover:bg-orange-100">{card.badgeText}</Badge> : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{card.title}</h3>
                  {card.subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{card.subtitle}</p> : null}
                  <p className="mt-3 text-sm leading-6 text-slate-700">{card.description}</p>
                  <Button asChild className="mt-4 w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                    <Link to={card.ctaUrl}>{card.ctaLabel}</Link>
                  </Button>
                </div>
              )) : (
                <div
                  data-testid="cadde-billboards-empty-state"
                  className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5"
                >
                  <p className="text-sm font-semibold text-slate-900">Şehrinden öne çıkan ilk kart burada görünecek.</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Danışman, işletme ve etkinlik keşfi için alan hazır. {sparseContentHint}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-900 text-white">
            <CardHeader>
              {/* text-balance: "Ol" tek başına ikinci satıra düşmesin (dar sidebar'da kırılıyordu). */}
              <CardTitle className="text-balance text-[clamp(1rem,2.2vw,1.25rem)] leading-snug text-white">
                Cadde İçinde Görünür Ol
              </CardTitle>
              <CardDescription className="text-balance text-slate-300">
                Billboard veya sponsorlu akışta yer almak için talep bırak.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                <p className="text-sm text-slate-200">Danışman, etkinlik ve topluluk kampanyalarını şehir bazlı yayınlayabilirsin.</p>
              </div>
              <Button asChild className="w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                <Link to="/login?mode=signup">Başvuru Gönder</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
    </CaddeProfileGate>
  );
};

export default CaddePage;
