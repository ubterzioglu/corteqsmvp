import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Clock3, Flame, Globe2, MapPin, MessageCircle, MessagesSquare, Sparkles, ThumbsUp, UserPlus2 } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import CaddeGeoFilter from "@/components/cadde/CaddeGeoFilter";
import CaddeProfileGate from "@/components/cadde/CaddeProfileGate";
import { useCaddeActorContext } from "@/hooks/cadde/useCaddeActorContext";
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
  createCaddeComment,
  createCaddePost,
  getCaddeSponsoredPlacement,
  joinCaddeCafe,
  listCaddeBillboardCards,
  listCaddeCafes,
  listCaddeCities,
  listCaddeCountries,
  listCaddeFeed,
  listCaddeInterestCatalog,
  toggleCaddeReaction,
} from "@/lib/cadde-api";
import { injectSponsoredPlacement, parseCaddeFilters, serializeCaddeFilters, summarizeCaddeFilters } from "@/lib/cadde-format";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import { toggleInterestSelection } from "@/lib/cadde-targeting";
import type { CaddeFeedPageParam, CaddeFilterState, CaddePostType, CaddeReactionType } from "@/lib/cadde-types";

const WORLD_CLOCKS = [
  { label: "İstanbul", timezone: "Europe/Istanbul" },
  { label: "Berlin", timezone: "Europe/Berlin" },
  { label: "Londra", timezone: "Europe/London" },
  { label: "New York", timezone: "America/New_York" },
  { label: "Toronto", timezone: "America/Toronto" },
  { label: "Dubai", timezone: "Asia/Dubai" },
] as const;

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

const formatTimeChip = (timezone: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(new Date());

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const emptyComposer = {
  type: "text" as CaddePostType,
  title: "",
  body: "",
  interests: [] as string[],
};

const CaddePage = () => {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [composer, setComposer] = useState(emptyComposer);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const filters = useMemo(() => parseCaddeFilters(searchParams), [searchParams]);
  const actorContextQuery = useCaddeActorContext(Boolean(session));

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "CorteQS Cadde";
    return () => {
      document.title = previousTitle;
    };
  }, []);

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

  const feedQuery = useInfiniteQuery({
    queryKey: caddeQueryKeys.feed(filters, user?.id ?? null),
    initialPageParam: null as CaddeFeedPageParam,
    queryFn: ({ pageParam }) => listCaddeFeed(filters, pageParam, user?.id ?? null),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const cafesQuery = useQuery({
    queryKey: caddeQueryKeys.cafes(filters, user?.id ?? null),
    queryFn: () => listCaddeCafes(filters, user?.id ?? null),
  });

  const billboardsQuery = useQuery({
    queryKey: caddeQueryKeys.billboards(filters),
    queryFn: () => listCaddeBillboardCards(filters),
  });

  const sponsorQuery = useQuery({
    queryKey: caddeQueryKeys.sponsor(filters),
    queryFn: () => getCaddeSponsoredPlacement(filters),
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
      if (!composer.body.trim()) throw new Error("Paylaşım metni zorunlu.");
      // Çoklu filtre seçiliyken paylaşım hedefi ilk seçimdir; hedef seçici Faz 4'te composer'a taşınacak.
      await createCaddePost({
        type: composer.type,
        title: composer.title,
        body: composer.body,
        countryId: filters.countries[0] ?? "",
        cityId: filters.cities[0] ?? "",
        isBridge: filters.bridge,
        interests: composer.interests,
      });
    },
    onSuccess: async () => {
      setComposer(emptyComposer);
      await invalidateCadde();
      setSearchParams(serializeCaddeFilters({ ...filters, mode: "real" }));
      toast({ title: "Paylaşım Cadde'ye eklendi" });
    },
    onError: (error) => {
      toast({ title: "Paylaşım gönderilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ postId, reactionType, currentlyActive }: { postId: string; reactionType: CaddeReactionType; currentlyActive: boolean }) => {
      if (!user) throw new Error("Bu işlem için giriş yapın.");
      await toggleCaddeReaction(postId, user.id, reactionType, currentlyActive);
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
      await createCaddeComment(postId, user.id, body);
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

  const joinCafeMutation = useMutation({
    mutationFn: async (cafeId: string) => {
      if (!user) throw new Error("Bu işlem için giriş yapın.");
      await joinCaddeCafe(cafeId, user.id);
    },
    onSuccess: invalidateCadde,
    onError: (error) => {
      if (!user) {
        navigate("/login");
        return;
      }
      toast({ title: "Cafe katılımı başarısız", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const updateFilters = (nextPartial: Partial<CaddeFilterState>) => {
    setSearchParams(serializeCaddeFilters({ ...filters, ...nextPartial }));
  };

  const feedItems = useMemo(() => feedQuery.data?.pages.flatMap((page) => page.items) ?? [], [feedQuery.data]);
  const feedWithSponsor = useMemo(() => injectSponsoredPlacement(feedItems, sponsorQuery.data ?? null, filters.mode), [feedItems, sponsorQuery.data, filters.mode]);
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

  return (
    <CaddeProfileGate context={actorContextQuery.data} isLoading={actorContextQuery.isLoading}>
    <main className="cadde-shell min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ec_22%,#f6f8fb_100%)]">
      <section className="border-b border-orange-100/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 lg:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#ffefe0] text-[#9a4b18] hover:bg-[#ffefe0]">CorteQS Cadde MVP</Badge>
            <p className="text-sm text-slate-600">Şehir bazlı diaspora akışı, aktif kafeler ve sponsorlu keşif alanı.</p>
          </div>
          <div className="flex flex-wrap gap-2">
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
        <aside className="space-y-5">
          <Card className="border-orange-100 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Konum</CardTitle>
                  <CardDescription>Global akış, şehir seçimi ve köprü modu</CardDescription>
                </div>
                <Globe2 className="h-5 w-5 text-orange-500" />
              </div>
              <Button className="w-full justify-between rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                Caddeye Çık
                <span className="text-xs uppercase tracking-[0.2em] text-orange-200">{filters.mode}</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Gerçek / Demo</p>
                  <p className="text-xs text-slate-500">{filters.mode === "real" ? "Gerçek: kullanıcı paylaşımları" : "Demo: admin seed içerik"}</p>
                </div>
                <Switch checked={filters.mode === "real"} onCheckedChange={(checked) => updateFilters({ mode: checked ? "real" : "demo" })} />
              </div>

              <div className="space-y-2">
                <Label>Ülke ve Şehir</Label>
                <CaddeGeoFilter
                  countries={countriesQuery.data ?? []}
                  cities={citiesQuery.data ?? []}
                  selectedCountries={filters.countries}
                  selectedCities={filters.cities}
                  onChange={(next) => updateFilters(next)}
                />
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

          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessagesSquare className="h-4 w-4 text-orange-500" />
                People Discovery
              </CardTitle>
              <CardDescription>Mevcut directory deneyimine Cadde filtreleriyle geç.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full justify-between rounded-2xl">
                <Link to={directoryLink}>
                  Directory'ye Git
                  <UserPlus2 className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <CardTitle className="text-base">Aktif Cafe Özeti</CardTitle>
              <CardDescription>Seçili filtre içindeki odalar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(cafesQuery.data ?? []).slice(0, 3).map((cafe) => (
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
              {!cafesQuery.data?.length ? <p className="text-sm text-slate-500">Bu filtrelerde aktif cafe yok.</p> : null}
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-5">
          <Card className="overflow-hidden border-slate-200 bg-white/90">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Diaspora Cadde</CardTitle>
                  <CardDescription>Global Türk topluluğunun şehir bazlı sosyal akışı</CardDescription>
                </div>
                <Badge variant="outline">{summarizeCaddeFilters(filters)}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {WORLD_CLOCKS.map((clock) => (
                  <div key={clock.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <Clock3 className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{clock.label}</span>
                    <span className="text-slate-500">{formatTimeChip(clock.timezone)}</span>
                  </div>
                ))}
              </div>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <CardTitle className="text-lg">Aktif Cafeler</CardTitle>
              <CardDescription>Kısa süreli topluluk odaları ve tema bazlı buluşmalar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(cafesQuery.data ?? []).map((cafe) => (
                  <div key={cafe.id} className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#fff_0%,#f8fafc_100%)] p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{cafe.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{cafe.city ?? "Global"} • {formatDateTime(cafe.startsAt)}</p>
                      </div>
                      {cafe.isBridge ? <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Köprü</Badge> : null}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{cafe.summary}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">Host: {cafe.hostName} • {cafe.memberCount} üye</div>
                      <Button
                        size="sm"
                        variant={cafe.joinedByViewer ? "secondary" : "outline"}
                        onClick={() => {
                          if (!session) {
                            navigate("/login");
                            return;
                          }
                          joinCafeMutation.mutate(cafe.id);
                        }}
                      >
                        {cafe.joinedByViewer ? "Katıldın" : "Katıl"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg">Paylaşım Oluştur</CardTitle>
              <CardDescription>{session ? "Cadde için şehir bazlı paylaşım ekleyebilirsin." : "Paylaşım ve reaksiyonlar için giriş gerekli."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {session ? (
                <>
                  <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                    <div className="space-y-2">
                      <Label>Post tipi</Label>
                      <Select value={composer.type} onValueChange={(value) => setComposer((current) => ({ ...current, type: value as CaddePostType }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Başlık</Label>
                      <Input value={composer.title} onChange={(event) => setComposer((current) => ({ ...current, title: event.target.value }))} placeholder="İsteğe bağlı başlık" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mesaj</Label>
                    <Textarea value={composer.body} onChange={(event) => setComposer((current) => ({ ...current, body: event.target.value }))} placeholder="Şehrindeki ihtiyacını, etkinliğini veya fırsatını paylaş." rows={5} />
                  </div>
                  {(interestCatalogQuery.data ?? []).length > 0 ? (
                    <div className="space-y-2">
                      <Label>Etiketler <span className="font-normal text-slate-500">(en fazla 3 — ilki birincil ihtiyaç sayılır)</span></Label>
                      <div className="flex flex-wrap gap-2">
                        {(interestCatalogQuery.data ?? []).map((interest) => {
                          const selected = composer.interests.includes(interest.key);
                          return (
                            <button
                              key={interest.key}
                              type="button"
                              onClick={() => setComposer((current) => ({ ...current, interests: toggleInterestSelection(current.interests, interest.key) }))}
                              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                selected
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {interest.labelTr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-500">Akış: {filters.mode === "real" ? "Gerçek" : "Demo seçili. Gönderince Gerçek akışa geçeceksin."}</div>
                    <Button onClick={() => postMutation.mutate()} disabled={postMutation.isPending}>
                      {postMutation.isPending ? "Gönderiliyor..." : "Cadde'de Paylaş"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-[24px] border border-dashed border-orange-200 bg-orange-50 p-5">
                  <p className="text-sm leading-relaxed text-slate-700">
                    Ziyaretçiler akışı görebilir. Paylaşım, yorum ve reaksiyon için <Link to="/login" className="font-semibold text-orange-700 underline">giriş yap</Link>.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {feedWithSponsor.map((item) =>
              item.kind === "sponsor" ? (
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
                <Card key={item.post.id} className="border-slate-200 bg-white/95 shadow-sm">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{item.post.authorName}</p>
                          {item.post.authorRole ? <Badge variant="secondary">{item.post.authorRole}</Badge> : null}
                          {item.post.pinned ? <Badge className="bg-slate-900 text-white hover:bg-slate-900">Pinned</Badge> : null}
                          {item.post.isBridge ? <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Köprü</Badge> : null}
                          <Badge variant="outline">{item.post.type}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {[item.post.country, item.post.city].filter(Boolean).join(" • ") || "Global"} • {formatDateTime(item.post.createdAt)}
                        </p>
                      </div>
                    </div>

                    {item.post.title ? <h3 className="text-lg font-semibold text-slate-950">{item.post.title}</h3> : null}
                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.post.body}</p>

                    {item.post.interests.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {item.post.interests.map((key) => (
                          <Badge key={key} variant="outline" className="text-xs font-normal">
                            #{interestLabelByKey.get(key) ?? key}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {REACTION_META.map((reaction) => {
                        const Icon = reaction.icon;
                        const active = item.post.viewerReactions.includes(reaction.key);
                        return (
                          <Button
                            key={reaction.key}
                            variant={active ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (!session) {
                                navigate("/login");
                                return;
                              }
                              reactionMutation.mutate({ postId: item.post.id, reactionType: reaction.key, currentlyActive: active });
                            }}
                            className={active ? "bg-slate-900 text-white hover:bg-slate-800" : ""}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {reaction.label} ({item.post.reactionCounts[reaction.key]})
                          </Button>
                        );
                      })}
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-500">
                        <MessageCircle className="h-4 w-4" />
                        {item.post.commentCount} yorum
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      {item.post.comments.map((comment) => (
                        <div key={comment.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900">{comment.authorName}</p>
                          <p className="mt-1 text-sm text-slate-700">{comment.body}</p>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <Textarea
                          value={commentDrafts[item.post.id] ?? ""}
                          onChange={(event) => setCommentDrafts((current) => ({ ...current, [item.post.id]: event.target.value }))}
                          placeholder={session ? "Yorum yaz" : "Yorum için giriş yap"}
                          rows={2}
                          disabled={!session}
                        />
                        <Button
                          className="self-end"
                          onClick={() => {
                            if (!session) {
                              navigate("/login");
                              return;
                            }
                            commentMutation.mutate({ postId: item.post.id, body: commentDrafts[item.post.id] ?? "" });
                          }}
                        >
                          Gönder
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),
            )}

            {!feedQuery.isLoading && filters.mode === "real" && feedItems.length === 0 ? (
              <Card className="border-dashed border-slate-300 bg-white/90">
                <CardContent className="p-8 text-center text-slate-500">
                  Bu filtrelerde gerçek Cadde içeriği yok. Demo moda geçerek örnek akış görebilirsin.
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

        <aside className="space-y-5">
          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <CardTitle>Billboard</CardTitle>
              <CardDescription>Danışman, işletme ve etkinlik kartları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(billboardsQuery.data ?? []).map((card) => (
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
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-white">Cadde İçinde Görünür Ol</CardTitle>
              <CardDescription className="text-slate-300">Billboard veya sponsorlu akışta yer almak için talep bırak.</CardDescription>
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
