import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Clock3, Flame, Globe2, MapPin, MessageCircle, MessagesSquare, Sparkles, ThumbsUp, UserPlus2 } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
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
  injectSponsoredPlacement,
  joinCaddeCafe,
  listCaddeBillboardCards,
  listCaddeCafes,
  listCaddeCities,
  listCaddeCountries,
  listCaddeFeed,
  parseCaddeFilters,
  serializeCaddeFilters,
  toggleCaddeReaction,
  type CaddeFilterState,
  type CaddePostType,
  type CaddeReactionType,
} from "@/lib/cadde";

const WORLD_CLOCKS = [
  { label: "Istanbul", timezone: "Europe/Istanbul" },
  { label: "Berlin", timezone: "Europe/Berlin" },
  { label: "Londra", timezone: "Europe/London" },
  { label: "New York", timezone: "America/New_York" },
  { label: "Toronto", timezone: "America/Toronto" },
  { label: "Dubai", timezone: "Asia/Dubai" },
] as const;

const REACTION_META: Array<{ key: CaddeReactionType; label: string; icon: typeof ThumbsUp }> = [
  { key: "like", label: "Begendim", icon: ThumbsUp },
  { key: "support", label: "Destek", icon: Sparkles },
  { key: "idea", label: "Fikir", icon: Flame },
];

const SECONDARY_NAV = [
  { label: "Cadde", to: "/cadde" },
  { label: "Is", to: "/commercial" },
  { label: "Sosyal", to: "/directory" },
  { label: "Harita", href: "https://globe.corteqs.net" },
  { label: "Giris Yap", to: "/login" },
  { label: "Kayit Ol", to: "/form" },
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

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "CorteQS Cadde";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const countriesQuery = useQuery({
    queryKey: ["cadde", "countries"],
    queryFn: listCaddeCountries,
  });

  const citiesQuery = useQuery({
    queryKey: ["cadde", "cities", filters.country],
    queryFn: () => listCaddeCities(filters.country),
  });

  const feedQuery = useInfiniteQuery({
    queryKey: ["cadde", "feed", filters, user?.id ?? null],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listCaddeFeed(filters, pageParam, user?.id ?? null),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const cafesQuery = useQuery({
    queryKey: ["cadde", "cafes", filters, user?.id ?? null],
    queryFn: () => listCaddeCafes(filters, user?.id ?? null),
  });

  const billboardsQuery = useQuery({
    queryKey: ["cadde", "billboards", filters],
    queryFn: () => listCaddeBillboardCards(filters),
  });

  const sponsorQuery = useQuery({
    queryKey: ["cadde", "sponsor", filters],
    queryFn: () => getCaddeSponsoredPlacement(filters),
  });

  const invalidateCadde = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["cadde", "feed"] }),
      queryClient.invalidateQueries({ queryKey: ["cadde", "cafes"] }),
    ]);
  };

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Bu islem icin giris yapin.");
      if (!composer.body.trim()) throw new Error("Paylasim metni zorunlu.");
      await createCaddePost(
        {
          type: composer.type,
          title: composer.title,
          body: composer.body,
          countryId: filters.country,
          cityId: filters.city,
          isBridge: filters.bridge,
        },
        user.id,
      );
    },
    onSuccess: async () => {
      setComposer(emptyComposer);
      await invalidateCadde();
      setSearchParams(serializeCaddeFilters({ ...filters, mode: "real" }));
      toast({ title: "Paylasim Cadde'ye eklendi" });
    },
    onError: (error) => {
      toast({ title: "Paylasim gonderilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ postId, reactionType, currentlyActive }: { postId: string; reactionType: CaddeReactionType; currentlyActive: boolean }) => {
      if (!user) throw new Error("Bu islem icin giris yapin.");
      await toggleCaddeReaction(postId, user.id, reactionType, currentlyActive);
    },
    onSuccess: invalidateCadde,
    onError: (error) => {
      if (!user) {
        navigate("/login");
        return;
      }
      toast({ title: "Reaksiyon guncellenemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ postId, body }: { postId: string; body: string }) => {
      if (!user) throw new Error("Bu islem icin giris yapin.");
      if (!body.trim()) throw new Error("Yorum bos olamaz.");
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
      toast({ title: "Yorum gonderilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const joinCafeMutation = useMutation({
    mutationFn: async (cafeId: string) => {
      if (!user) throw new Error("Bu islem icin giris yapin.");
      await joinCaddeCafe(cafeId, user.id);
    },
    onSuccess: invalidateCadde,
    onError: (error) => {
      if (!user) {
        navigate("/login");
        return;
      }
      toast({ title: "Cafe katilimi basarisiz", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const updateFilters = (nextPartial: Partial<CaddeFilterState>) => {
    const next = { ...filters, ...nextPartial };
    if (next.country !== filters.country && !nextPartial.city) {
      next.city = "";
    }
    setSearchParams(serializeCaddeFilters(next));
  };

  const feedItems = useMemo(() => feedQuery.data?.pages.flatMap((page) => page.items) ?? [], [feedQuery.data]);
  const feedWithSponsor = useMemo(() => injectSponsoredPlacement(feedItems, sponsorQuery.data ?? null, filters.mode), [feedItems, sponsorQuery.data, filters.mode]);
  const directoryLink = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.country) params.set("country", filters.country);
    if (filters.city) params.set("city", filters.city);
    return `/directory${params.toString() ? `?${params.toString()}` : ""}`;
  }, [filters.country, filters.city]);

  return (
    <main className="cadde-shell min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ec_22%,#f6f8fb_100%)]">
      <section className="border-b border-orange-100/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 lg:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#ffefe0] text-[#9a4b18] hover:bg-[#ffefe0]">CorteQS Cadde MVP</Badge>
            <p className="text-sm text-slate-600">Sehir bazli diaspora akisi, aktif kafeler ve sponsorlu kesif alani.</p>
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
                  <CardDescription>Global akis, sehir secimi ve kopru modu</CardDescription>
                </div>
                <Globe2 className="h-5 w-5 text-orange-500" />
              </div>
              <Button className="w-full justify-between rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                Caddeye Cik
                <span className="text-xs uppercase tracking-[0.2em] text-orange-200">{filters.mode}</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Gercek / Demo</p>
                  <p className="text-xs text-slate-500">{filters.mode === "real" ? "Gercek: kullanici paylasimlari" : "Demo: admin seed icerik"}</p>
                </div>
                <Switch checked={filters.mode === "real"} onCheckedChange={(checked) => updateFilters({ mode: checked ? "real" : "demo" })} />
              </div>

              <div className="space-y-2">
                <Label>Ulke</Label>
                <Select value={filters.country || "__all__"} onValueChange={(value) => updateFilters({ country: value === "__all__" ? "" : value, city: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ulke sec" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tum ulkeler</SelectItem>
                    {(countriesQuery.data ?? []).map((country) => (
                      <SelectItem key={country.id} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sehir</Label>
                <Select value={filters.city || "__all__"} onValueChange={(value) => updateFilters({ city: value === "__all__" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sehir sec" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tum sehirler</SelectItem>
                    {(citiesQuery.data ?? []).map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">Kopru</p>
                    <p className="text-xs leading-relaxed text-emerald-700">TR-Diaspora arasinda tasinma, is ve mentorluk akisi.</p>
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
              <CardDescription>Mevcut directory deneyimine Cadde filtreleriyle gec.</CardDescription>
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
              <CardTitle className="text-base">Aktif Cafe Ozeti</CardTitle>
              <CardDescription>Secili filtre icindeki odalar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(cafesQuery.data ?? []).slice(0, 3).map((cafe) => (
                <div key={cafe.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{cafe.title}</p>
                      <p className="text-xs text-slate-500">{cafe.city ?? "Global"} • {cafe.memberCount} uye</p>
                    </div>
                    {cafe.isBridge ? <Badge variant="secondary">Kopru</Badge> : null}
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
                  <CardDescription>Global Turk toplulugunun sehir bazli sosyal akisi</CardDescription>
                </div>
                <Badge variant="outline">{filters.city || filters.country || "Global Akis"}</Badge>
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
              <CardDescription>Kisa sureli topluluk odalari ve tema bazli bulusmalar</CardDescription>
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
                      {cafe.isBridge ? <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Kopru</Badge> : null}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{cafe.summary}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">Host: {cafe.hostName} • {cafe.memberCount} uye</div>
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
                        {cafe.joinedByViewer ? "Katildin" : "Katil"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg">Paylasim Olustur</CardTitle>
              <CardDescription>{session ? "Cadde icin sehir bazli paylasim ekleyebilirsin." : "Paylasim ve reaksiyonlar icin giris gerekli."}</CardDescription>
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
                      <Label>Baslik</Label>
                      <Input value={composer.title} onChange={(event) => setComposer((current) => ({ ...current, title: event.target.value }))} placeholder="Istege bagli baslik" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mesaj</Label>
                    <Textarea value={composer.body} onChange={(event) => setComposer((current) => ({ ...current, body: event.target.value }))} placeholder="Sehrindeki ihtiyacini, etkinligini veya firsatini paylas." rows={5} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-500">Akis: {filters.mode === "real" ? "Gercek" : "Demo secili. Gonderince Gercek akisa gececeksin."}</div>
                    <Button onClick={() => postMutation.mutate()} disabled={postMutation.isPending}>
                      {postMutation.isPending ? "Gonderiliyor..." : "Cadde'de Paylas"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-[24px] border border-dashed border-orange-200 bg-orange-50 p-5">
                  <p className="text-sm leading-relaxed text-slate-700">
                    Ziyaretciler akisi gorebilir. Paylasim, yorum ve reaksiyon icin <Link to="/login" className="font-semibold text-orange-700 underline">giris yap</Link>.
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
                          {item.post.isBridge ? <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Kopru</Badge> : null}
                          <Badge variant="outline">{item.post.type}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {[item.post.country, item.post.city].filter(Boolean).join(" • ") || "Global"} • {formatDateTime(item.post.createdAt)}
                        </p>
                      </div>
                    </div>

                    {item.post.title ? <h3 className="text-lg font-semibold text-slate-950">{item.post.title}</h3> : null}
                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.post.body}</p>

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
                          placeholder={session ? "Yorum yaz" : "Yorum icin giris yap"}
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
                          Gonder
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
                  Bu filtrelerde gercek Cadde icerigi yok. Demo moda gecerek ornek akis gorebilirsin.
                </CardContent>
              </Card>
            ) : null}

            {feedQuery.hasNextPage ? (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => feedQuery.fetchNextPage()} disabled={feedQuery.isFetchingNextPage}>
                  {feedQuery.isFetchingNextPage ? "Yukleniyor..." : "Daha Fazla Yukle"}
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-5">
          <Card className="border-slate-200 bg-white/90">
            <CardHeader>
              <CardTitle>Billboard</CardTitle>
              <CardDescription>Danisman, isletme ve etkinlik kartlari</CardDescription>
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
              <CardTitle className="text-white">Cadde Icinde Gorunur Ol</CardTitle>
              <CardDescription className="text-slate-300">Billboard veya sponsorlu akista yer almak icin talep birak.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                <p className="text-sm text-slate-200">Danisman, etkinlik ve topluluk kampanyalarini sehir bazli yayinlayabilirsin.</p>
              </div>
              <Button asChild className="w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                <Link to="/form">Basvuru Gonder</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
};

export default CaddePage;
