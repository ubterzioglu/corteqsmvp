import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Flag, Globe2, Heart, HelpCircle, Laugh, MapPin, Megaphone, MessageCircle, MessagesSquare, Send, Share2, Sparkles, ThumbsUp, UserPlus2 } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import CaddeComposer from "@/components/cadde/CaddeComposer";
import CaddeEmojiPickerButton from "@/components/cadde/CaddeEmojiPickerButton";
import CaddeCafeIcon from "@/components/cadde/CaddeCafeIcon";
import CaddeBridgeInfo from "@/components/cadde/CaddeBridgeInfo";
import CaddeFeaturedSpotlight from "@/components/cadde/CaddeFeaturedSpotlight";
import CaddeGeoFilter from "@/components/cadde/CaddeGeoFilter";
import CaddeFeedScopeBar from "@/components/cadde/CaddeFeedScopeBar";
import CaddeMediaGallery from "@/components/cadde/CaddeMediaGallery";
import CaddePostBody from "@/components/cadde/CaddePostBody";
import CaddeProfileGate from "@/components/cadde/CaddeProfileGate";
import CaddeTrendingHashtags from "@/components/cadde/CaddeTrendingHashtags";
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
  searchCaddePeople,
  listCaddeCities,
  listCaddeCountries,
  listCaddeFeed,
  listCaddeInterestCatalog,
  listCaddePostComments,
  recordCaddeShare,
  reportCaddeEntity,
  toggleCaddeReaction,
} from "@/lib/cadde-api";
import { listCaddeCafeThemes } from "@/lib/cadde-cafe-api";
import { emptyCaddeComposer } from "@/lib/cadde-composer";
import { caddeNewPostPollInterval, caddeOpenCommentsPollInterval, newestCaddeCreatedAt, nextCaddeZeroStreak } from "@/lib/cadde-feed-polling";
import { injectSponsoredPlacement, interleavePromotions, parseCaddeFilters, serializeCaddeFilters, summarizeCaddeFilters } from "@/lib/cadde-format";
import { isInternalCaddeLink } from "@/lib/cadde-links";
import { listCaddePromotions } from "@/lib/cadde-tanitim-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import { toggleInterestSelection } from "@/lib/cadde-targeting";
import { insertTextAtSelection, type TextSelection } from "@/lib/cadde-text-insert";
import type { CaddeCommentCursor, CaddeFeedPageParam, CaddeFilterState, CaddePostType, CaddeReactionType } from "@/lib/cadde-types";
import { useSeo } from "@/lib/seo";
import { PAGE_SEO } from "@/lib/page-seo";

const REACTION_META: Array<{ key: CaddeReactionType; label: string; icon: typeof ThumbsUp }> = [
  { key: "like", label: "Beğendim", icon: ThumbsUp },
  { key: "love", label: "Kalp", icon: Heart },
  { key: "haha", label: "Gülme", icon: Laugh },
  { key: "support", label: "Destek", icon: Sparkles },
  { key: "unsure", label: "Emin olamadım", icon: HelpCircle },
];

const COMMENT_PAGE_SIZE = 5;

const caddePostShareUrl = (postId: string): string => {
  const url = new URL("/cadde", window.location.origin);
  url.searchParams.set("post", postId);
  return url.toString();
};

// m29 (F9): Cadde içindeki tekrar eden ikincil menü (Cadde/İş/Sosyal/Harita/Giriş/Kayıt)
// kaldırıldı — üst ana menü zaten aynı hedefleri taşıyor, cadde login-gated olduğu için
// Giriş/Kayıt linkleri buraya hiç düşmüyordu.

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
  const [commentSelections, setCommentSelections] = useState<Record<string, TextSelection>>({});
  const [expandedCommentPostId, setExpandedCommentPostId] = useState<string | null>(null);
  const filters = useMemo(() => parseCaddeFilters(searchParams), [searchParams]);
  const diasporaKey = useCaddeDiasporaKey();
  const actorContextQuery = useCaddeActorContext(Boolean(session));
  const registeredCountry = actorContextQuery.data?.country?.trim() ?? "";
  const registeredCity = actorContextQuery.data?.city?.trim() ?? "";
  const defaultComposerLocationLabel = [registeredCountry, registeredCity].filter(Boolean).join(" / ") || "profil konumun";

  useSeo(PAGE_SEO.cadde);

  const countriesQuery = useQuery({
    queryKey: caddeQueryKeys.countries(),
    queryFn: listCaddeCountries,
  });

  const citiesQuery = useQuery({
    queryKey: caddeQueryKeys.cities(filters.countries),
    queryFn: () => listCaddeCities(filters.countries),
  });

  // m38: İnsanları Keşfet araması — 300ms debounce, 2 karakter altı sorgu atılmaz
  // (RPC tarafında da aynı sınır var; enumerasyon koruması çift katman).
  const [peopleQueryText, setPeopleQueryText] = useState("");
  const [debouncedPeopleQuery, setDebouncedPeopleQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPeopleQuery(peopleQueryText.trim()), 300);
    return () => clearTimeout(timer);
  }, [peopleQueryText]);
  const peopleSearch = useQuery({
    queryKey: ["cadde", "people-search", debouncedPeopleQuery],
    queryFn: () => searchCaddePeople(debouncedPeopleQuery),
    enabled: debouncedPeopleQuery.length >= 2,
    placeholderData: (previous) => previous,
  });

  const interestCatalogQuery = useQuery({
    queryKey: caddeQueryKeys.interestCatalog,
    queryFn: listCaddeInterestCatalog,
    staleTime: 1000 * 60 * 60,
  });

  // Composer ek hedefleri ülke değiştikçe yerelde süzmek için tüm aktif şehirleri taşır.
  const allCitiesQuery = useQuery({
    queryKey: caddeQueryKeys.cities(["__all__"]),
    queryFn: () => listCaddeCities([]),
    enabled: Boolean(session),
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

  const commentsZeroStreakRef = useRef(0);
  const commentsSignatureRef = useRef<string | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsQuery = useInfiniteQuery({
    queryKey: caddeQueryKeys.postComments(expandedCommentPostId),
    initialPageParam: null as CaddeCommentCursor,
    queryFn: ({ pageParam }) => listCaddePostComments(expandedCommentPostId ?? "", COMMENT_PAGE_SIZE, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(expandedCommentPostId),
    refetchInterval: () =>
      expandedCommentPostId ? caddeOpenCommentsPollInterval(commentsZeroStreakRef.current) : false,
    refetchOnWindowFocus: "always",
  });
  const expandedComments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [commentsQuery.data],
  );
  const commentsSignature = useMemo(
    () => expandedComments.map((comment) => `${comment.id}:${comment.createdAt}`).join("|"),
    [expandedComments],
  );
  useEffect(() => {
    commentsZeroStreakRef.current = 0;
    commentsSignatureRef.current = null;
  }, [expandedCommentPostId]);
  useEffect(() => {
    if (!expandedCommentPostId || !commentsQuery.dataUpdatedAt) return;
    if (commentsSignatureRef.current === null) {
      commentsSignatureRef.current = commentsSignature;
      commentsZeroStreakRef.current = 0;
      return;
    }
    if (commentsSignatureRef.current === commentsSignature) {
      commentsZeroStreakRef.current += 1;
      return;
    }
    commentsSignatureRef.current = commentsSignature;
    commentsZeroStreakRef.current = 0;
  }, [commentsQuery.dataUpdatedAt, commentsSignature, expandedCommentPostId]);

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
      // Hedef: composer'daki açık seçim; boşsa kayıtlı profil konumu. Akış filtresi post hedefi değildir.
      const primaryCountry = composer.country || registeredCountry;
      const primaryCity = composer.country ? composer.city : registeredCity;
      const targets = [
        { country: primaryCountry, city: primaryCity },
        ...composer.targets
          .filter((target) => target.country.trim())
          .map((target) => ({ country: target.country.trim(), city: target.city?.trim() ?? "" })),
      ];
      await createCaddePost({
        type: composer.type,
        title: composer.title,
        body: composer.body,
        countryId: primaryCountry,
        cityId: primaryCity,
        targets,
        isBridge: false,
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
      await Promise.all([
        invalidateCadde(),
        queryClient.invalidateQueries({ queryKey: caddeQueryKeys.postComments(variables.postId) }),
      ]);
    },
    onError: (error) => {
      if (!user) {
        navigate("/login");
        return;
      }
      toast({ title: "Yorum gönderilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const syncCommentSelection = (postId: string, event: SyntheticEvent<HTMLTextAreaElement>) => {
    setCommentSelections((current) => ({
      ...current,
      [postId]: {
        start: event.currentTarget.selectionStart ?? 0,
        end: event.currentTarget.selectionEnd ?? event.currentTarget.selectionStart ?? 0,
      },
    }));
  };

  const insertCommentEmoji = (postId: string, emoji: string) => {
    const body = commentDrafts[postId] ?? "";
    const next = insertTextAtSelection(body, emoji, commentSelections[postId] ?? { start: body.length, end: body.length });
    setCommentDrafts((current) => ({ ...current, [postId]: next.value }));
    setCommentSelections((current) => ({ ...current, [postId]: { start: next.caret, end: next.caret } }));
    requestAnimationFrame(() => {
      commentTextareaRef.current?.focus();
      commentTextareaRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const shareMutation = useMutation({
    mutationFn: async ({ postId, title, body }: { postId: string; title: string | null; body: string }) => {
      if (!user) throw new Error("Bu işlem için giriş yapın.");
      const url = caddePostShareUrl(postId);
      const text = body.trim().slice(0, 180);
      if (typeof navigator.share === "function") {
        await navigator.share({ title: title ?? "CorteQS Cadde", text, url });
        await recordCaddeShare(postId, "web_share");
        return "web_share" as const;
      }
      if (!navigator.clipboard?.writeText) throw new Error("Paylaşım bağlantısı kopyalanamadı.");
      await navigator.clipboard.writeText(url);
      await recordCaddeShare(postId, "copy_link");
      return "copy_link" as const;
    },
    onSuccess: async (channel) => {
      await invalidateCadde();
      toast({ title: channel === "copy_link" ? "Bağlantı kopyalandı" : "Paylaşım kaydedildi" });
    },
    onError: (error) => {
      if (!user) {
        navigate("/login");
        return;
      }
      toast({ title: "Paylaşım yapılamadı", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
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

  // m4: kart başlığında tema Türkçe etiketiyle görünsün (themeKey ham anahtar taşır).
  const cafeThemesQuery = useQuery({
    queryKey: ["cadde", "cafe-themes"],
    queryFn: listCaddeCafeThemes,
    staleTime: 60 * 60_000,
  });
  const cafeThemeLabelByKey = useMemo(
    () => new Map((cafeThemesQuery.data ?? []).map((theme) => [theme.key, theme.labelTr])),
    [cafeThemesQuery.data],
  );
  const hasGeoSelection = filters.countries.length > 0 || filters.cities.length > 0;
  const sparseContentHint = hasGeoSelection
    ? "Bu bölgede içerik azsa ülke geneli ve global akış da devreye girer."
    : "İçerik az olduğunda global akışla başlayıp ilk hareketi sen başlatabilirsin.";
  const activeCafes = cafesQuery.data ?? [];
  const billboardCards = billboardsQuery.data ?? [];
  // m41: sağ kolonun tepesindeki statik "CorteQS Panosu" yerine featured kayıt geçer.
  // m44: liste de featured kayıtlara ayrılır; hiç featured yoksa yayındaki diğer kartlar
  // gösterilir (yüzey boş kalmasın). Spotlight'a çıkan kart listede tekrar etmez.
  const featuredBillboards = billboardCards.filter((card) => card.isFeatured);
  const spotlightBillboard = featuredBillboards[0] ?? null;
  const listedBillboards = (featuredBillboards.length > 0 ? featuredBillboards : billboardCards).filter(
    (card) => card.id !== spotlightBillboard?.id,
  );
  // m45: "talep bırak / başvuru gönder" akışı bitti — kullanıcı kendi profilindeki
  // tanıtım panelinden bütçe verip reklamını çıkarıyor. Hedef sabit "bireysel" değil:
  // /profile kullanıcının profil tipine yönlenir, hash redirect'te korunur (F14 fix).
  const promotionCtaTarget = user ? "/profile#cadde-tanitim" : "/login?mode=signup";
  const promotionCtaLabel = user ? "Profilinden İlk Tanıtımını Yap" : "Profil Aç ve Tanıtıma Başla";

  return (
    <CaddeProfileGate context={actorContextQuery.data} isLoading={actorContextQuery.isLoading}>
    <main className="cadde-shell">
      <section>
        <div className="mx-auto w-full max-w-7xl px-4 pt-5 lg:px-6">
          <div className="cadde-card flex flex-col gap-4 rounded-[20px] px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-3">
              {/* Bildirim zili kartın en solunda durur, ardından dikey ayraç gelir. */}
              <NotificationsBell />
              <Separator orientation="vertical" className="h-8 shrink-0" />
              <Badge className="cadde-chip-brand shrink-0">CorteQS Cadde</Badge>
              <p className="min-w-0 flex-1 truncate text-sm text-slate-600">
                Şehrindeki Türklerle tanış, sor, paylaş ve fırsatları keşfet.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="font-display text-xl">Diaspora Cadde</CardTitle>
                <CardDescription>Global Türk topluluğunun şehir bazlı sosyal akışı</CardDescription>
              </div>
              <Badge variant="outline">{summarizeCaddeFilters(filters)}</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[290px_minmax(0,1fr)_320px] lg:px-6">
        {/* m30 (F9): sol kolon = yalnız Konum + İnsanları Keşfet (bu sırayla).
            Çarşı ticker'ı sağ (tanıtım) kolonuna taşındı; Cafeler özet kartı m31 ile
            kaldırıldı (tek kaynak: orta kolondaki "Aktif Cafeler").
            Not: workshop'un "akordeon kart denemesi" bilinçli atlandı — kolon 2 karta
            indiği için akordeonun çözeceği kalabalık kalmadı (commit gerekçesinde). */}
        <aside className="order-2 space-y-5 lg:order-none">
          <Card className="cadde-panel">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-lg">Konum</CardTitle>
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

          <Card className="hidden border-slate-200 bg-white/90 lg:block">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <MessagesSquare className="h-4 w-4 text-orange-500" />
                İnsanları Keşfet
              </CardTitle>
              <CardDescription>İsimle ara ya da dizinde gezin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* m38: tüm kayıtlı üyeler isimle aranabilir (kapsam kararı: açık profil tam
                  satır + ad-onaylı kapalı üye yalnız isim/şehir, tıklanamaz). */}
              <Input
                value={peopleQueryText}
                onChange={(event) => setPeopleQueryText(event.target.value)}
                placeholder="İsimle ara (en az 2 harf)"
                aria-label="Kişi ara"
                className="h-9 rounded-2xl"
              />
              {peopleSearch.data && peopleSearch.data.length > 0 ? (
                <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white" data-testid="cadde-people-results">
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
              <Button asChild variant="outline" className="w-full justify-between rounded-2xl">
                <Link to={directoryLink}>
                  Kişileri Keşfet
                  <UserPlus2 className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

        </aside>

        <section className="order-1 space-y-5 lg:order-none">
          <Card className="overflow-hidden border-slate-200 bg-white/90">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-xl">Diaspora Cadde</CardTitle>
                  <CardDescription>Global Türk topluluğunun şehir bazlı sosyal akışı</CardDescription>
                </div>
                <Badge variant="outline">{summarizeCaddeFilters(filters)}</Badge>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-lg">Aktif Cafeler</CardTitle>
                  <CardDescription>Kısa süreli topluluk odaları ve tema bazlı buluşmalar</CardDescription>
                </div>
                {session ? <CreateCafeForm trigger={<Button size="sm" variant="outline" className="rounded-2xl">+ Cafe Aç</Button>} /> : null}
              </div>
            </CardHeader>
            <CardContent>
              {activeCafes.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {/* m3: çay bardağı ikonu = kafe kartının imzası. m4: ad bold + tema normal.
                      Satır satır (tek kolon) liste — kart başlıkları artık kısaltılmıyor. */}
                  {activeCafes.map((cafe) => (
                    <div key={cafe.id} className="cadde-card flex flex-col rounded-[22px] p-4">
                      <div className="flex items-start gap-2.5">
                        <CaddeCafeIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate">
                            <span className="font-semibold text-slate-900">{cafe.title}</span>
                            {cafe.themeKey && cafeThemeLabelByKey.get(cafe.themeKey) ? (
                              <span className="ml-1.5 font-normal text-slate-500">
                                {cafeThemeLabelByKey.get(cafe.themeKey)}
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">{cafe.city ?? "Global"} • {formatDateTime(cafe.startsAt)}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {cafe.isBridge ? <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Köprü</Badge> : null}
                        {cafe.entryMode !== "open" ? <Badge variant="outline">{cafe.entryMode === "approval" ? "Onaylı" : "Davetli"}</Badge> : null}
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{cafe.summary}</p>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                        <div className="min-w-0 truncate text-xs text-slate-500">Host: {cafe.hostName} • {cafe.memberCount} üye</div>
                        <Button size="sm" variant={cafe.joinedByViewer ? "secondary" : "outline"} asChild className="shrink-0">
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
                  className="cadde-empty rounded-[28px] border border-dashed p-6"
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
              cities={allCitiesQuery.data ?? []}
              defaultLocationLabel={defaultComposerLocationLabel}
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
                <Card key={item.sponsor.id} className="cadde-sponsored">
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
              ) : (() => {
                const isCommentsExpanded = expandedCommentPostId === item.post.id;
                const visibleComments = isCommentsExpanded ? expandedComments : [];
                const shareCount = item.post.shareCount ?? 0;

                return (
                <Card
                  key={item.post.id}
                  data-testid="cadde-feed-card"
                  className="cadde-card overflow-hidden rounded-[28px]"
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

                    <div className="flex flex-wrap items-center gap-1.5">
                      {REACTION_META.map((reaction) => {
                        const Icon = reaction.icon;
                        const active = item.post.viewerReactions.includes(reaction.key);
                        const count = item.post.reactionCounts[reaction.key] ?? 0;
                        return (
                          <Button
                            key={reaction.key}
                            variant={active ? "default" : "outline"}
                            size="sm"
                            aria-label={`${reaction.label} (${count})`}
                            onClick={() => {
                              if (!session) {
                                navigate("/login");
                                return;
                              }
                              reactionMutation.mutate({ postId: item.post.id, reactionType: reaction.key });
                            }}
                            className={`min-h-10 rounded-full px-3 ${
                              active ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white/80"
                            }`}
                          >
                            <Icon className={`mr-1.5 h-4 w-4 ${active && reaction.key === "love" ? "fill-current" : ""}`} />
                            <span className="text-xs font-medium sm:text-sm">{reaction.label}</span>
                            <span className={`ml-1 text-xs ${active ? "text-white/80" : "text-muted-foreground"}`}>{count}</span>
                          </Button>
                        );
                      })}
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={`Paylaş (${shareCount})`}
                        className="rounded-full bg-white/80"
                        disabled={shareMutation.isPending}
                        onClick={() => {
                          if (!session) {
                            navigate("/login");
                            return;
                          }
                          shareMutation.mutate({ postId: item.post.id, title: item.post.title, body: item.post.body });
                        }}
                      >
                        <Share2 className="mr-1.5 h-4 w-4" />
                        <span className="text-xs font-medium sm:text-sm">Paylaş</span>
                        <span className="ml-1 text-xs text-muted-foreground">{shareCount}</span>
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
                      className="rounded-[20px] border border-slate-200/90 bg-slate-50/80 p-3"
                    >
                      <div className="space-y-2">
                        {visibleComments.map((comment) => (
                          <div key={comment.id} data-testid="cadde-comment-card" className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <p className="text-sm font-semibold text-slate-900">{comment.authorName}</p>
                              <p className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</p>
                            </div>
                            <p className="mt-0.5 text-sm leading-5 text-slate-700">{comment.body}</p>
                          </div>
                        ))}

                        {isCommentsExpanded && commentsQuery.isLoading ? (
                          <p className="text-sm text-slate-500">Yorumlar yükleniyor...</p>
                        ) : null}

                        {isCommentsExpanded ? (
                          session ? (
                            <div className="space-y-3">
                              {!commentsQuery.isLoading && visibleComments.length === 0 ? (
                                <p className="text-sm text-slate-500">İlk yorumu sen bırak ve konuşmayı başlat.</p>
                              ) : null}
                              {commentsQuery.hasNextPage ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void commentsQuery.fetchNextPage()}
                                  disabled={commentsQuery.isFetchingNextPage}
                                >
                                  {commentsQuery.isFetchingNextPage ? "Yükleniyor..." : "Devamını yükle"}
                                </Button>
                              ) : null}
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="flex min-w-0 flex-1 items-end gap-2">
                                  <Textarea
                                    ref={commentTextareaRef}
                                    value={commentDrafts[item.post.id] ?? ""}
                                    onChange={(event) => {
                                      syncCommentSelection(item.post.id, event);
                                      setCommentDrafts((current) => ({ ...current, [item.post.id]: event.target.value }));
                                    }}
                                    onClick={(event) => syncCommentSelection(item.post.id, event)}
                                    onKeyUp={(event) => syncCommentSelection(item.post.id, event)}
                                    onSelect={(event) => syncCommentSelection(item.post.id, event)}
                                    onKeyDown={(event) => {
                                      if (event.key !== "Enter" || event.shiftKey) return;
                                      event.preventDefault();
                                      const body = commentDrafts[item.post.id] ?? "";
                                      if (!body.trim()) return;
                                      commentMutation.mutate({ postId: item.post.id, body });
                                    }}
                                    placeholder="Yorum yaz"
                                    rows={2}
                                    className="min-h-[64px] bg-white"
                                  />
                                  <CaddeEmojiPickerButton onSelect={(emoji) => insertCommentEmoji(item.post.id, emoji)} className="mb-0.5" />
                                </div>
                                <Button
                                  className="self-end whitespace-nowrap sm:min-w-[112px]"
                                  onClick={() => {
                                    commentMutation.mutate({ postId: item.post.id, body: commentDrafts[item.post.id] ?? "" });
                                  }}
                                >
                                  <Send className="mr-1.5 h-4 w-4" />
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
                );
              })(),
            )}

            {!feedQuery.isLoading && filters.mode === "real" && feedItems.length === 0 ? (
              <Card
                data-testid="cadde-feed-empty-state"
                className="cadde-empty border-dashed"
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
          {/* m30: Çarşı ticker'ı tanıtım kolonunda yaşıyor (F10 bunu "Çarşı yakında"
              teaser'ına çevirecek). */}
          <CarsiGlobalTicker filters={filters} />

          {/* m41: statik "CorteQS Panosu / Bugün caddede öne çıkanlar" kartı kaldırıldı;
              yerini panelden Featured işaretlenen kayıt aldı (yoksa hiç çizilmez). */}
          {spotlightBillboard ? (
            <CaddeFeaturedSpotlight card={spotlightBillboard} />
          ) : (
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
                <Button asChild variant="outline" className="w-full rounded-2xl border-orange-200 bg-white text-orange-800 hover:bg-orange-50">
                  <Link to={promotionCtaTarget}>
                    {promotionCtaLabel}
                    <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

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
                      <Badge variant="outline">{card.type}</Badge>
                      {card.isFeatured ? <Badge className="bg-orange-100 text-orange-900 hover:bg-orange-100">Öne Çıkan</Badge> : null}
                      {card.badgeText ? <Badge variant="secondary">{card.badgeText}</Badge> : null}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{card.title}</h3>
                    {card.subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{card.subtitle}</p> : null}
                    <p className="mt-3 text-sm leading-6 text-slate-700">{card.description}</p>
                    <span className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition group-hover:bg-slate-800">
                      {card.ctaLabel}
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </>
                );
                const cardClassName = "cadde-card group block rounded-[24px] p-4";

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
                  className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5"
                >
                  <p className="text-sm font-semibold text-slate-900">Şehrinden öne çıkan ilk kart burada görünecek.</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Danışman, işletme ve etkinlik keşfi için alan hazır. {sparseContentHint}
                  </p>
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

          <Card className="border-slate-200 bg-slate-900 text-white">
            <CardHeader>
              {/* text-balance: "Ol" tek başına ikinci satıra düşmesin (dar sidebar'da kırılıyordu). */}
              <CardTitle className="text-balance font-display text-[clamp(1rem,2.2vw,1.25rem)] leading-snug text-white">
                Cadde İçinde Görünür Ol
              </CardTitle>
              {/* m45: "talep bırak" kalktı — kullanıcı kendi profilinden bütçe verip
                  tanıtımını yayınlıyor (Facebook/Instagram modeli), aracı adım yok. */}
              <CardDescription className="text-balance text-slate-300">
                Billboard ve sponsorlu akış alanlarını profilindeki tanıtım panelinden kendin açarsın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                <p className="text-sm text-slate-200">Danışman, etkinlik ve topluluk kampanyalarını şehir bazlı yayınlayabilirsin.</p>
              </div>
              <Button asChild className="w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                <Link to={promotionCtaTarget}>{promotionCtaLabel}</Link>
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
