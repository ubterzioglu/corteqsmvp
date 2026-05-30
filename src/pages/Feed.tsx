import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Heart, MapPin, Loader2, Newspaper, Play, MessageCircle, Smile, Share2, Users, Briefcase, Building2, Calendar, Flag, PenLine, Sparkles, UserPlus, Plane, Star, Coffee, Lock, Code2, Stethoscope, GraduationCap, ArrowLeft, Clock, LogIn, Check, X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import CreateCafeForm from "@/components/feed/CreateCafeForm";
import DiasporaPeopleSearch from "@/components/feed/DiasporaPeopleSearch";
import { useActiveCafes, useCafe } from "@/hooks/useCafes";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import MultiCountryCityFilter from "@/components/feed/MultiCountryCityFilter";
import CreatePostForm from "@/components/feed/CreatePostForm";
import { mockPosts, mockAuthors, mockCafeITPosts } from "@/data/mockFeedPosts";
import { useFeedSocial } from "@/hooks/useFeedSocial";
import CaddeProfileGate from "@/components/CaddeProfileGate";
import { useConnections } from "@/hooks/useConnections";

const PAGE_SIZE = 20;
// Türkiye merkezli paylaşımların Global akışa "sızması" için minimum etkileşim eşiği
const TR_GLOBAL_THRESHOLD = 25;

interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  mini_images?: string[];
  country: string | null;
  city: string | null;
  author_role: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

const roleStyles: Record<string, string> = {
  business: "from-emerald-400 to-teal-500",
  consultant: "from-violet-400 to-fuchsia-500",
  ambassador: "from-amber-400 to-orange-500",
  user: "from-sky-400 to-blue-500",
};

const roleEmoji: Record<string, string> = {
  business: "🏢",
  consultant: "💼",
  ambassador: "🤝",
  user: "✨",
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "şimdi";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün`;
  return d.toLocaleDateString("tr-TR");
};

const Feed = () => {
  const { user, onboardingCompleted, profile } = useAuth();
  const { canMessage, requestConnection } = useConnections();
  const isTRUser = (profile?.country === "Türkiye") ||
    (!!profile?.phone && (profile.phone.replace(/\s|-/g, "").startsWith("+90") || profile.phone.replace(/\s|-/g, "").startsWith("0090")));
  const { cafeId } = useParams<{ cafeId?: string }>();
  const navigate = useNavigate();
  const isDemoCafe = cafeId === "demo-it";
  const { cafe: realCafe, isMember: realIsMember, approved: realApproved, join: joinCafe } = useCafe(isDemoCafe ? undefined : cafeId);
  const demoCafe = useMemo(
    () =>
      isDemoCafe
        ? ({
            id: "demo-it",
            name: "Berlin IT Cafe ☕",
            theme: "IT",
            country: "Almanya",
            city: "Berlin",
            linkedin_url: "",
            extra_links: null,
            created_by: "demo",
            opens_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            closes_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            duration_hours: 2,
            created_at: new Date().toISOString(),
            kind: "community" as const,
            open_entry: true,
            entry_question: null,
            capacity: 40,
            member_count: 24,
          } as any)
        : null,
    [isDemoCafe],
  );
  const cafe = isDemoCafe ? demoCafe : realCafe;
  const isMember = isDemoCafe ? true : realIsMember;
  const approved = isDemoCafe ? true : realApproved;
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinAnswer, setJoinAnswer] = useState("");
  const [pendingMembers, setPendingMembers] = useState<Array<{ id: string; user_id: string; answer: string | null; full_name?: string | null }>>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [authorMap, setAuthorMap] = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<Record<string, { thumb: number; laugh: number; party: number; mine: Set<string> }>>({});
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentsMap, setCommentsMap] = useState<Record<string, { id: string; author: string; text: string; created_at: string }[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const { cafes: activeCafes, refresh: refreshCafes } = useActiveCafes({
    countries: selectedCountries,
    cities: selectedCities,
  });
  const [showAllCafeCities, setShowAllCafeCities] = useState(false);
  const inCafe = !!cafeId && !!cafe;
  const cafeOpen = inCafe && new Date(cafe!.closes_at) > new Date();

  const categoryAccountLink = !user
    ? "/auth"
    : !onboardingCompleted
      ? "/onboarding"
      : "/profile";

  const loadDemoData = useCallback(() => {
    setDemoMode(true);
    let filtered = [...mockPosts];
    const apply = (list: FeedPost[]) => {
      setPosts(list);
      setHasMore(false);
      setAuthorMap(
        Object.fromEntries(
          Object.entries(mockAuthors).map(([id, a]) => [id, { full_name: a.full_name, avatar_url: a.avatar_url }]),
        ),
      );
    };
    if (selectedCities.length > 0) {
      filtered = filtered.filter((p) => p.city && selectedCities.includes(p.city));
      apply(filtered);
    } else if (selectedContinent) {
      import("@/data/continents").then(({ continents }) => {
        const countries = continents[selectedContinent] || [];
        const list = mockPosts.filter((p) => p.country && countries.includes(p.country));
        apply(list);
      });
    } else if (selectedCountries.length > 0) {
      filtered = filtered.filter((p) => p.country && selectedCountries.includes(p.country));
      apply(filtered);
    } else {
      apply(filtered);
    }
  }, [selectedCountries, selectedCities, selectedContinent]);

  const fetchPosts = useCallback(
    async (reset = false) => {
      if (demoMode) return; // Don't fetch DB when in demo mode
      if (isDemoCafe) {
        // Inject mock posts as the "chat feed" of the demo cafe
        setPosts(mockCafeITPosts as any);
        setHasMore(false);
        setAuthorMap(
          Object.fromEntries(
            Object.entries(mockAuthors).map(([id, a]) => [id, { full_name: a.full_name, avatar_url: a.avatar_url }]),
          ),
        );
        return;
      }
      setLoading(true);
      const from = reset ? 0 : page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query: any = supabase
        .from("feed_posts")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (cafeId) {
        query = query.eq("cafe_id", cafeId);
      } else {
        query = query.is("cafe_id", null);
        if (selectedCities.length > 0) {
          query = query.in("city", selectedCities);
        } else if (selectedContinent) {
          const { continents } = await import("@/data/continents");
          query = query.in("country", continents[selectedContinent] || []);
        } else if (selectedCountries.length > 0) {
          query = query.in("country", selectedCountries);
        } else {
          // Global akış: Türkiye paylaşımları yalnızca yüksek etkileşimde sızar
          query = query.or(`country.is.null,country.neq.Türkiye,like_count.gte.${TR_GLOBAL_THRESHOLD}`);
        }
      }

      const { data, error } = await query;
      setLoading(false);
      if (error) {
        toast({ title: "Cadde yüklenemedi", description: error.message, variant: "destructive" });
        return;
      }

      const newPosts = (data as FeedPost[]) || [];

      // Fallback: gerçek paylaşım yoksa mock akışı göster (ilk yüklemede)
      if (reset && newPosts.length === 0 && !cafeId) {
        loadDemoData();
        return;
      }

      setHasMore(newPosts.length === PAGE_SIZE);
      setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));

      const ids = Array.from(new Set(newPosts.map((p) => p.user_id))).filter(
        (id) => !authorMap[id],
      );
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", ids);
        if (profs) {
          setAuthorMap((prev) => {
            const next = { ...prev };
            profs.forEach((p: any) => {
              next[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
            });
            return next;
          });
        }
      }

      if (user && newPosts.length > 0) {
        const { data: likes } = await supabase
          .from("feed_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", newPosts.map((p) => p.id));
        if (likes) {
          setLikedIds((prev) => {
            const next = new Set(prev);
            likes.forEach((l: any) => next.add(l.post_id));
            return next;
          });
        }
      }
    },
    [page, selectedCountries, selectedCities, selectedContinent, user, authorMap, demoMode, cafeId],
  );

  // Reset & refetch when filters or cafe change
  useEffect(() => {
    setPage(0);
    setPosts([]);
    setHasMore(true);
    setDemoMode(false);
    fetchPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountries, selectedCities, selectedContinent, cafeId]);

  // Load more pages
  useEffect(() => {
    if (page > 0) fetchPosts(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Load pending members when current user owns the cafe
  useEffect(() => {
    if (!cafe || !user || cafe.created_by !== user.id) {
      setPendingMembers([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("cafe_memberships" as any)
        .select("id, user_id, answer")
        .eq("cafe_id", cafe.id)
        .eq("approved", false);
      const rows = (data as any[]) || [];
      if (rows.length === 0) {
        setPendingMembers([]);
        return;
      }
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", rows.map((r) => r.user_id));
      const nameMap = Object.fromEntries((profs || []).map((p: any) => [p.id, p.full_name]));
      setPendingMembers(rows.map((r) => ({ ...r, full_name: nameMap[r.user_id] })));
    })();
  }, [cafe, user]);

  const toggleLike = async (post: FeedPost) => {
    if (!user && !demoMode) {
      toast({ title: "Beğenmek için giriş yapın", variant: "destructive" });
      return;
    }
    const liked = likedIds.has(post.id);
    setLikedIds((prev) => {
      const next = new Set(prev);
      liked ? next.delete(post.id) : next.add(post.id);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, like_count: p.like_count + (liked ? -1 : 1) } : p,
      ),
    );
    if (demoMode) return; // Skip DB write in demo mode
    if (liked) {
      await supabase.from("feed_likes").delete().eq("post_id", post.id).eq("user_id", user!.id);
    } else {
      await supabase.from("feed_likes").insert({ post_id: post.id, user_id: user!.id });
    }
  };

  const toggleComments = (id: string) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addComment = (postId: string) => {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    const post = posts.find((p) => p.id === postId);
    // TR kullanıcı, başka ülkedeki paylaşıma yorum yazmak için karşı tarafla bağlantı (connect) olmalı
    if (post && isTRUser && post.country && post.country !== "Türkiye" && post.country !== "Köprü" && !demoMode) {
      const isOwn = user?.id === post.user_id;
      if (!isOwn && !canMessage(post.user_id)) {
        toast({
          title: "Yorum için bağlantı gerekli",
          description: "Yurt dışındaki kullanıcılara yorum yazabilmek için önce bağlantı (connect) iste.",
          variant: "destructive",
        });
        requestConnection(post.user_id, authorMap[post.user_id]?.full_name || undefined);
        return;
      }
    }
    const c = {
      id: (typeof crypto !== "undefined" && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `c-${Date.now()}`,
      author: (user as any)?.email?.split("@")[0] || "Sen",
      text,
      created_at: new Date().toISOString(),
    };
    setCommentsMap((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), c] }));
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)));
  };

  const sharePost = async (p: FeedPost) => {
    const url = `${window.location.origin}${window.location.pathname}#post-${p.id}`;
    const shareData = { title: "Diaspora Cadde", text: p.content.slice(0, 120), url };
    if ((navigator as any).share) {
      try {
        await (navigator as any).share(shareData);
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Bağlantı kopyalandı", description: "Paylaşmak için yapıştırabilirsin." });
    } catch {
      toast({ title: "Paylaşım başarısız", variant: "destructive" });
    }
  };

  const scopeLabel = useMemo(() => {
    if (selectedCities.length > 0) return `${selectedCities.length} şehir`;
    if (selectedContinent) return selectedContinent;
    if (selectedCountries.length > 0) return `${selectedCountries.length} ülke`;
    return "Global";
  }, [selectedCountries, selectedCities, selectedContinent]);

  const platformLinks = [
    { to: "/consultants", icon: Users, label: "Danışmanlar", color: "text-violet-500", bg: "bg-violet-500/10" },
    { to: "/businesses", icon: Building2, label: "İşletmeler", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { to: "/associations", icon: Flag, label: "Kuruluşlar", color: "text-sky-500", bg: "bg-sky-500/10" },
    { to: "/events", icon: Calendar, label: "Etkinlikler", color: "text-amber-500", bg: "bg-amber-500/10" },
    { to: "/bloggers", icon: PenLine, label: "V/Bloggers", color: "text-rose-500", bg: "bg-rose-500/10" },
    { to: "/whatsapp-groups", icon: MessageCircle, label: "Gruplar", color: "text-teal-500", bg: "bg-teal-500/10" },
  ];

  // Theme → icon/renk mapping (cafes tablosundan gelen theme alanı)
  const themeStyle = (theme: string) => {
    switch (theme) {
      case "IT": return { icon: Code2, color: "text-cyan-500", bg: "bg-cyan-500/10" };
      case "Hekimler": return { icon: Stethoscope, color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case "Profesyoneller": return { icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-500/10" };
      case "İşletmeler": return { icon: Building2, color: "text-amber-500", bg: "bg-amber-500/10" };
      case "Kuruluşlar": return { icon: Flag, color: "text-sky-500", bg: "bg-sky-500/10" };
      case "Blogger/Vlogger": return { icon: PenLine, color: "text-rose-500", bg: "bg-rose-500/10" };
      default: return { icon: Coffee, color: "text-amber-600", bg: "bg-amber-500/10" };
    }
  };

  const formatRemaining = (closesAt: string) => {
    const ms = new Date(closesAt).getTime() - Date.now();
    if (ms <= 0) return "kapandı";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
  };

  const { following, suggestions, follow } = useFeedSocial();

  const renderPost = (p: FeedPost) => {
    const author = authorMap[p.user_id];
    const liked = likedIds.has(p.id);
    const role = p.author_role || "user";
    const ringGradient = roleStyles[role] || roleStyles.user;
    const initial = (author?.full_name || "?").slice(0, 1).toUpperCase();
    const minis = p.mini_images && p.mini_images.length > 0
      ? p.mini_images
      : p.image_url ? [p.image_url] : [];

    return (
      <article key={p.id} className="py-4 group">
        <header className="flex items-start gap-3 mb-2">
          <div className={`p-[2px] rounded-full bg-gradient-to-br ${ringGradient} shrink-0`}>
            <div className="h-10 w-10 rounded-full bg-card flex items-center justify-center overflow-hidden">
              {author?.avatar_url ? (
                <img src={author.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-foreground/80">{initial}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap leading-tight">
              <span className="font-semibold text-sm">{author?.full_name || "Anonim"}</span>
              <span className="text-sm">{roleEmoji[role]}</span>
              <span className="text-xs text-muted-foreground">· {formatTime(p.created_at)}</span>
            </div>
            {(p.country || p.city) && (
              <div className="flex items-center gap-1 text-[11px] mt-0.5 flex-wrap">
                {p.city && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-turquoise/10 text-turquoise font-semibold">
                    @{p.city}
                  </span>
                )}
                {p.country && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    @{p.country}
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        <p className="text-[15px] whitespace-pre-wrap leading-relaxed text-foreground/90 pl-[52px]">
          {p.content}
        </p>

        {minis.length > 0 && (
          <div className="pl-[52px] mt-2.5 flex gap-1.5 flex-wrap">
            {minis.slice(0, 4).map((src, i) => (
              <button key={i} type="button" className="relative overflow-hidden rounded-xl ring-1 ring-border/60 hover:ring-primary/40 transition-all">
                <img src={src} alt="" loading="lazy" className="h-20 w-20 object-cover hover:scale-105 transition-transform" />
              </button>
            ))}
          </div>
        )}

        <footer className="mt-2.5 pl-[44px] flex items-center gap-0.5">
          <Button variant="ghost" size="sm" onClick={() => toggleLike(p)} className={`gap-1.5 h-8 px-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 ${liked ? "text-rose-500" : "text-muted-foreground"}`}>
            <Heart className={`h-4 w-4 transition-transform ${liked ? "fill-rose-500 scale-110" : ""}`} />
            <span className="text-xs font-medium">{p.like_count}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggleComments(p.id)} className={`gap-1.5 h-8 px-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-500/10 ${openComments.has(p.id) ? "text-sky-500" : "text-muted-foreground hover:text-sky-500"}`}>
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-medium">{p.comment_count}</span>
          </Button>
          {(["thumb", "laugh", "party"] as const).map((kind) => {
            const emoji = kind === "thumb" ? "👍" : kind === "laugh" ? "😄" : "🎉";
            const r = reactions[p.id] || { thumb: 0, laugh: 0, party: 0, mine: new Set<string>() };
            const active = r.mine.has(kind);
            return (
              <Button
                key={kind}
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!user && !demoMode) {
                    toast({ title: "Reaksiyon için giriş yapın", variant: "destructive" });
                    return;
                  }
                  setReactions((prev) => {
                    const cur = prev[p.id] || { thumb: 0, laugh: 0, party: 0, mine: new Set<string>() };
                    const mine = new Set(cur.mine);
                    const next = { ...cur, mine };
                    if (mine.has(kind)) { mine.delete(kind); next[kind] = Math.max(0, cur[kind] - 1); }
                    else { mine.add(kind); next[kind] = cur[kind] + 1; }
                    return { ...prev, [p.id]: next };
                  });
                }}
                className={`h-8 px-2 rounded-full hover:bg-amber-50 dark:hover:bg-amber-500/10 ${active ? "text-amber-600 bg-amber-500/10" : "text-muted-foreground hover:text-amber-500"}`}
                title={kind === "thumb" ? "Beğen" : kind === "laugh" ? "Güldür" : "Kutla"}
              >
                <span className="text-sm leading-none">{emoji}</span>
                {r[kind] > 0 && <span className="text-[11px] font-medium ml-1">{r[kind]}</span>}
              </Button>
            );
          })}
          <Button variant="ghost" size="sm" onClick={() => sharePost(p)} className="ml-auto h-8 px-2 rounded-full text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-500">
            <Share2 className="h-4 w-4" />
          </Button>
        </footer>

        {openComments.has(p.id) && (
          <div className="mt-3 ml-[52px] rounded-xl border border-border bg-muted/30 p-3 space-y-2">
            {(commentsMap[p.id] || []).length === 0 && (
              <p className="text-[11px] text-muted-foreground italic">Henüz yorum yok. İlk yorumu sen yap.</p>
            )}
            {(commentsMap[p.id] || []).map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {c.author.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold">{c.author}</span>
                    <span className="text-[10px] text-muted-foreground">· {formatTime(c.created_at)}</span>
                  </div>
                  <p className="text-xs text-foreground/85 whitespace-pre-wrap break-words">{c.text}</p>
                </div>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addComment(p.id);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <Input
                value={commentDrafts[p.id] || ""}
                onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                placeholder="Yorum yaz..."
                className="h-8 text-xs"
              />
              <Button type="submit" size="sm" className="h-8 px-3 text-xs" disabled={!(commentDrafts[p.id] || "").trim()}>
                Gönder
              </Button>
            </form>
          </div>
        )}
      </article>
    );
  };

  return (
    <CaddeProfileGate>
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Rainbow banner — paletten */}
      <div className="pt-16">
        <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 via-sky-400 to-violet-500" />
      </div>

      <main className="pt-6 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_300px] gap-6">

            {/* LEFT SIDEBAR */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1">
              {/* Filtre */}
              <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold">Konum</h3>
                  <Badge variant="secondary" className="ml-auto text-[10px]">{scopeLabel}</Badge>
                </div>
                {/* Global — demo toggle: gerçek feed boşsa demo aç, doluysa demoyu kapat */}
                <button
                  onClick={() => {
                    setSelectedContinent(null);
                    setSelectedCountries([]);
                    setSelectedCities([]);
                    if (demoMode) {
                      // Demo aktifse kapat ve gerçek feed'e dön
                      setDemoMode(false);
                      setPosts([]);
                      setHasMore(true);
                      setPage(0);
                      fetchPosts(true);
                      toast({ title: "Demo kapatıldı", description: "Gerçek akış yükleniyor." });
                    } else if (posts.length === 0) {
                      // Gerçek feed boşsa demoyu aç
                      loadDemoData();
                      toast({ title: "Demo açıldı", description: "Henüz gerçek akış yok — örnek içerik gösteriliyor." });
                    } else {
                      toast({ title: "Global akış", description: "Gerçek kullanıcı akışı zaten aktif." });
                    }
                  }}
                  className={`w-full mb-3 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                    demoMode
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-sm"
                      : scopeLabel === "Global"
                      ? "bg-gradient-to-r from-sky-500 to-violet-500 text-white border-transparent shadow-sm"
                      : "bg-card text-foreground border-border hover:border-primary/40"
                  }`}
                  title={demoMode ? "Demoyu kapat" : "Global akış / boşsa demo aç"}
                >
                  🌍 {demoMode ? "Demo Aktif — Kapat" : "Global — Tüm Ülkeler"}
                </button>
                <MultiCountryCityFilter
                  selectedCountries={selectedCountries}
                  selectedCities={selectedCities}
                  selectedContinent={selectedContinent}
                  onCountriesChange={setSelectedCountries}
                  onCitiesChange={setSelectedCities}
                  onContinentChange={setSelectedContinent}
                />
              </section>

              {/* Cafe'ler — aktif topluluklar (DB) */}
              <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-amber-600" />
                    Cafe'ler
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">{activeCafes.length}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3 leading-snug">
                  Aktif cafe'ler — açılış 2 saat, Premium 4 saat. Günde 1 katılım.
                </p>
                {(() => {
                  // Group cafes by city, rank cities by total member_count
                  const cityMap = new Map<string, { city: string; country: string; total: number; cafes: typeof activeCafes }>();
                  for (const c of activeCafes) {
                    const key = `${c.city || "Global"}|${c.country || ""}`;
                    const entry = cityMap.get(key) || { city: c.city || "Global", country: c.country || "", total: 0, cafes: [] };
                    entry.total += c.member_count || 0;
                    entry.cafes.push(c);
                    cityMap.set(key, entry);
                  }
                  const ranked = Array.from(cityMap.values()).sort((a, b) => b.total - a.total);
                  const TOP_N = 7;
                  const visibleCities = showAllCafeCities ? ranked : ranked.slice(0, TOP_N);
                  const visibleCafes = visibleCities.flatMap((g) => g.cafes.sort((a, b) => (b.member_count || 0) - (a.member_count || 0)));
                  const hiddenCount = ranked.length - visibleCities.length;
                  return (
                    <>
                      {ranked.length > 0 && (
                        <div className="text-[10px] text-muted-foreground mb-2 px-1">
                          🔥 En dolu {visibleCities.length} şehir gösteriliyor
                        </div>
                      )}
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                   {/* Demo / örnek cafe — her zaman görünür */}
                  <Link
                    to="/cadde/demo-it"
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg border border-dashed border-amber-500/30 transition-colors ${cafeId === "demo-it" ? "bg-amber-500/10" : "bg-amber-500/5 hover:bg-amber-500/10"}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Coffee className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate flex items-center gap-1">
                        Berlin IT Cafe ☕
                        <Badge variant="secondary" className="text-[9px] h-3.5 px-1">Demo</Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">Berlin · 👥 24/40</div>
                    </div>
                    <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">1s 23dk</Badge>
                  </Link>
                  <div className="px-2 pb-1">
                    <Link to={categoryAccountLink} className="block text-[10px] text-primary font-semibold hover:underline text-center py-1">
                      ☕ Kendi cafe'ni aç →
                    </Link>
                  </div>
                  {activeCafes.length === 0 && (
                    <p className="text-[11px] text-muted-foreground py-2 text-center">
                      Şu an başka aktif cafe yok.
                    </p>
                  )}
                  {visibleCafes.map((c) => {
                    const st = themeStyle(c.theme);
                    const Icon = st.icon;
                    return (
                      <Link
                        key={c.id}
                        to={`/cadde/${c.id}`}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${
                          cafeId === c.id ? "bg-muted/80" : "hover:bg-muted/60"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-full ${st.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4 w-4 ${st.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate flex items-center gap-1">
                            {c.name}
                            {c.kind === "relocation" && <span title="Relocation Cafe">🌍</span>}
                            {c.kind === "expo" && <span title="Expo Cafe">🛍️</span>}
                            {c.kind === "community" && c.open_entry && <span title="Serbest giriş" className="text-emerald-500">🟢</span>}
                            {c.kind === "community" && !c.open_entry && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1.5">
                            <span className="truncate">{[c.city, c.country].filter(Boolean).join(" · ") || c.theme}</span>
                            <span className="shrink-0">· 👥 {c.member_count}{c.capacity ? `/${c.capacity}` : ""}</span>
                          </div>
                        </div>
                        {c.kind === "community" ? (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
                            {formatRemaining(c.closes_at)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">∞</Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCafeCities(true)}
                    className="mt-2 w-full text-[11px] text-primary font-semibold hover:underline py-1"
                  >
                    +{hiddenCount} şehir daha göster ↓
                  </button>
                )}
                {showAllCafeCities && ranked.length > TOP_N && (
                  <button
                    type="button"
                    onClick={() => setShowAllCafeCities(false)}
                    className="mt-2 w-full text-[11px] text-muted-foreground hover:underline py-1"
                  >
                    Daralt ↑
                  </button>
                )}
                    </>
                  );
                })()}
                {user ? (
                  <div className="mt-3">
                    <CreateCafeForm onCreated={refreshCafes} />
                  </div>
                ) : (
                  <Link to={categoryAccountLink} className="mt-3 block text-[10px] text-primary font-semibold hover:underline">
                    Kategori hesabı aç →
                  </Link>
                )}
              </section>

              {/* Diasporada İnsanları Ara — CTA card linking to LP */}
              <Link
                to="/diaspora-people"
                className="block rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-violet-500/10 p-4 shadow-sm hover:shadow-md hover:border-sky-500/50 transition-all"
              >
                <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                  <Users className="h-4 w-4 text-sky-500" />
                  Diasporada İnsanları Ara
                </h3>
                <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
                  Ülke/şehir + meslek + iş arayan, taşınacak filtreleri ile tüm diasporayı keşfet.
                </p>
                <span className="text-[11px] font-semibold text-sky-600 hover:underline">
                  Keşfet →
                </span>
              </Link>


              {/* Takip ettiklerin — gerçek veri */}
              {user && (
                <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-500" />
                    Takip Ettiklerin
                  </h3>
                  {following.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Henüz kimseyi takip etmiyorsun. Aşağıdaki önerilerden başla.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {following.map((u) => (
                        <Link key={u.id} to={`/profile/${u.id}`} className="flex items-center gap-2.5 group">
                          <div className="p-[1.5px] rounded-full bg-gradient-to-br from-rose-400 via-amber-400 to-violet-500">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover bg-card" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-card flex items-center justify-center text-xs font-bold">
                                {(u.full_name || "?").slice(0, 1).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold truncate group-hover:text-primary">{u.full_name || "Anonim"}</div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {[u.city, u.country].filter(Boolean).join(" · ") || u.profession || "Diaspora"}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Tanıyor olabilirsin — benzerlik algoritması (ülke/şehir/meslek/okul) */}
              {user && suggestions.length > 0 && (
                <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-sky-500" />
                    Tanıyor olabilirsin
                  </h3>
                  <div className="space-y-2.5">
                    {suggestions.map((u) => (
                      <div key={u.id} className="flex items-center gap-2.5">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                            {(u.full_name || "?").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate">{u.full_name || "Anonim"}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {u.reasons.slice(0, 2).join(" · ")}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[10px]"
                          onClick={() => follow(u.id)}
                        >
                          + Ekle
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </aside>

            {/* CENTER FEED */}
            <div className="min-w-0">
              {inCafe ? (
                <>
                  <Link to="/cadde" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-2">
                    <ArrowLeft className="h-3.5 w-3.5" /> Genel Cadde'ye Dön
                  </Link>
                  <header className="mb-4 rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      {(() => {
                        const st = themeStyle(cafe!.theme);
                        const Icon = st.icon;
                        return (
                          <div className={`h-12 w-12 rounded-2xl ${st.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`h-6 w-6 ${st.color}`} />
                          </div>
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-extrabold truncate flex items-center gap-2 flex-wrap">
                          ☕ {cafe!.name}
                          {cafe!.kind === "relocation" && <Badge className="bg-sky-500/15 text-sky-600 border-0 text-[10px]">🌍 Relocation</Badge>}
                          {cafe!.kind === "expo" && <Badge className="bg-amber-500/15 text-amber-600 border-0 text-[10px]">🛍️ Expo</Badge>}
                          {cafe!.kind === "community" && cafe!.open_entry && <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px]">🟢 Serbest</Badge>}
                          {cafe!.kind === "community" && !cafe!.open_entry && <Badge variant="outline" className="text-[10px]"><Lock className="h-2.5 w-2.5 mr-1" />Onaylı</Badge>}
                          {!cafeOpen && cafe!.kind === "community" && <Badge variant="destructive" className="text-[10px]">Kapalı</Badge>}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cafe!.theme} · {[cafe!.city, cafe!.country].filter(Boolean).join(" · ") || "Global"} · 👥 {cafe!.member_count}{cafe!.capacity ? `/${cafe!.capacity}` : " (sınırsız)"}
                        </p>
                        {cafe!.kind === "community" && (
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-emerald-500" />
                              Açılış: {new Date(cafe!.opens_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-rose-500" />
                              Kapanış: {new Date(cafe!.closes_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {cafeOpen && (
                              <Badge variant="secondary" className="text-[10px]">Kalan: {formatRemaining(cafe!.closes_at)}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                      {cafeOpen && !isMember && user && (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (cafe!.open_entry) joinCafe();
                            else setJoinDialogOpen(true);
                          }}
                          className="gap-1.5"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          {cafe!.open_entry ? "Cafe'ye Gir" : "Başvur"}
                        </Button>
                      )}
                      {isMember && approved && <Badge className="bg-emerald-500/15 text-emerald-600 border-0">Üyesin</Badge>}
                      {isMember && !approved && <Badge variant="secondary" className="text-[10px]">Onay Bekliyor</Badge>}
                    </div>
                  </header>
                </>
              ) : (
                <header className="mb-4">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Newspaper className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-extrabold text-gradient-primary">Diaspora Cadde</h1>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sol panelden kıta, ülke veya şehir seç. Akışın anında daralır. Paylaşırken @Şehir veya @Ülke etiketleyebilirsin.
                  </p>
                </header>
              )}

              {(!inCafe || (cafeOpen && isMember && approved)) && (
                <div className="mb-4">
                  <CreatePostForm cafeId={inCafe ? cafeId : undefined} onCreated={() => { setPage(0); fetchPosts(true); }} />
                </div>
              )}
              {inCafe && cafeOpen && !isMember && user && (
                <div className="mb-4 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  {cafe?.open_entry
                    ? "Paylaşım yapmak için önce cafe'ye gir. (Günde 1 community cafe katılım hakkı)"
                    : "Bu cafe onaylı giriş — başvur ve sahip onayını bekle."}
                </div>
              )}
              {inCafe && isMember && !approved && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 p-4 text-center text-xs">
                  ⏳ Başvurun cafe sahibinin onayını bekliyor. Onaylanınca paylaşım yapabilirsin.
                </div>
              )}

              {/* Cafe owner pending approvals */}
              {inCafe && cafe && user && cafe.created_by === user.id && pendingMembers.length > 0 && (
                <div className="mb-4 rounded-2xl border border-border bg-card p-4">
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-500" /> Onay Bekleyen Üyeler ({pendingMembers.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingMembers.map((m) => (
                      <div key={m.id} className="flex items-start gap-2 text-xs border-b border-border/50 pb-2 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{m.full_name || "Anonim"}</div>
                          {m.answer && <div className="text-muted-foreground italic mt-0.5">"{m.answer}"</div>}
                        </div>
                        <Button size="sm" variant="outline" className="h-7 px-2 gap-1"
                          onClick={async () => {
                            await supabase.from("cafe_memberships" as any).update({ approved: true }).eq("id", m.id);
                            setPendingMembers((prev) => prev.filter((x) => x.id !== m.id));
                            toast({ title: "Onaylandı" });
                          }}>
                          <Check className="h-3 w-3" /> Onayla
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-rose-500"
                          onClick={async () => {
                            await supabase.from("cafe_memberships" as any).delete().eq("id", m.id);
                            setPendingMembers((prev) => prev.filter((x) => x.id !== m.id));
                            toast({ title: "Reddedildi" });
                          }}>
                          <X className="h-3 w-3" /> Sil
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card px-5">
                {posts.length === 0 && !loading && (
                  <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-4">
                    <p className="text-muted-foreground">
                      Bu kapsam için henüz paylaşım yok. İlk paylaşan sen ol.
                    </p>
                    <Button variant="outline" size="sm" onClick={loadDemoData} className="gap-1.5">
                      <Play className="h-3.5 w-3.5" />
                      Demo Verilerini Yükle
                    </Button>
                  </div>
                )}

                {demoMode && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Badge variant="outline" className="text-[10px] h-5 border-amber-400 text-amber-600">
                      Demo Modu — Gerçek veri gelince otomatik değişir
                    </Badge>
                  </div>
                )}

                <div className="divide-y divide-border/60">
                  {posts.slice(0, 3).map(renderPost)}

                  {posts.length >= 3 && (
                    <div className="py-4">
                      <a
                        href="https://www.turkishairlines.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 text-white p-5 hover:shadow-elevated transition-shadow"
                      >
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,white,transparent_50%)]" />
                        <div className="relative flex items-center gap-4">
                          <div className="h-14 w-14 rounded-full bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                            <Plane className="h-7 w-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-white/20 text-white border-0 text-[10px] hover:bg-white/30">Sponsorlu</Badge>
                              <span className="text-[10px] uppercase tracking-wider opacity-80">Türk Hava Yolları</span>
                            </div>
                            <h4 className="font-bold text-base leading-tight">Diasporaya özel: %20 indirim 🇹🇷</h4>
                            <p className="text-xs opacity-90 mt-0.5">Vatana dönüş biletlerinde Miles&Smiles üyelerine ekstra mil.</p>
                          </div>
                          <Button size="sm" className="bg-white text-rose-600 hover:bg-white/90 font-bold shrink-0 hidden sm:flex">
                            Keşfet
                          </Button>
                        </div>
                      </a>
                    </div>
                  )}

                  {posts.slice(3).map(renderPost)}
                </div>

                {hasMore && posts.length > 0 && (
                  <div className="flex justify-center pt-4 pb-2">
                    <Button variant="outline" size="sm" disabled={loading} onClick={() => setPage((p) => p + 1)} className="gap-1.5">
                      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                      Daha fazla yükle
                    </Button>
                  </div>
                )}

                {loading && posts.length === 0 && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR — Sponsorlu */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pl-1 hidden lg:block">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">
                ÇIFIT <span className="text-muted-foreground/70 normal-case font-medium">(Sponsorlu)</span>
              </div>

              {/* Sponsorlu Danışman */}
              <Link to="/consultants" className="block rounded-2xl overflow-hidden border border-border bg-card hover:shadow-card-hover transition-shadow">
                <div className="h-10 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 relative">
                  <Badge className="absolute top-1 right-2 bg-white/20 text-white border-0 text-[10px] backdrop-blur">Premium</Badge>
                </div>
                <div className="p-3 -mt-4">
                  <img src="https://i.pravatar.cc/160?img=68" alt="" className="h-14 w-14 rounded-full ring-4 ring-card object-cover object-top mb-2" />
                  <h4 className="text-sm font-bold">Berk Kural</h4>
                  <p className="text-[11px] text-muted-foreground">💼 Almanya Vize & Oturum</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-semibold">4.9</span>
                    <span className="text-[10px] text-muted-foreground">· 218 müşteri</span>
                  </div>
                  <Button size="sm" className="w-full mt-2.5 h-7 text-[11px]">Görüşme Al</Button>
                </div>
              </Link>

              {/* Sponsorlu İşletme */}
              <Link to="/businesses" className="block rounded-2xl overflow-hidden border border-border bg-card hover:shadow-card-hover transition-shadow">
                <div className="h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 relative">
                  <Badge className="absolute top-1 right-2 bg-white/20 text-white border-0 text-[10px] backdrop-blur">Premium</Badge>
                </div>
                <div className="p-3 -mt-4">
                  <div className="h-14 w-14 rounded-2xl ring-4 ring-card bg-card flex items-center justify-center mb-2">
                    <Building2 className="h-7 w-7 text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-bold">Anadolu Restaurant</h4>
                  <p className="text-[11px] text-muted-foreground">🥙 Berlin · Türk Mutfağı</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-semibold">4.7</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1.5">-15%</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-2.5 h-7 text-[11px]">Kuponu Al</Button>
                </div>
              </Link>

              {/* Sponsorlu Etkinlik */}
              <Link to="/events" className="block rounded-2xl overflow-hidden border border-border bg-card hover:shadow-card-hover transition-shadow">
                <div className="h-12 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 relative flex items-end p-2">
                  <Badge className="absolute top-1 right-2 bg-white/20 text-white border-0 text-[10px] backdrop-blur">Featured</Badge>
                  <Calendar className="h-5 w-5 text-white/90" />
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-bold leading-tight">Avrupa Türk Girişimciler Zirvesi</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">📍 Amsterdam · 24 Mayıs</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex -space-x-2">
                      {[10, 25, 33].map((i) => (
                        <img key={i} src={`https://i.pravatar.cc/24?img=${i}`} className="h-5 w-5 rounded-full ring-2 ring-card" alt="" />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">+247 katılımcı</span>
                  </div>
                  <Button size="sm" className="w-full mt-2.5 h-7 text-[11px] bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 border-0">Bilet Al</Button>
                </div>
              </Link>

              <div className="text-[10px] text-muted-foreground text-center px-2 leading-relaxed">
                Sen de buraya çıkmak ister misin? <Link to="/pricing" className="text-primary font-semibold hover:underline">Premium ile öne çık →</Link>
              </div>
            </aside>

          </div>
        </div>
      </main>

      {/* Join with question dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" /> Cafe'ye Başvur
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Bu cafe sahibinin onayı ile katılım kabul ediyor. Aşağıdaki soruyu cevapla:
            </p>
            <div className="rounded-lg bg-muted/50 p-3 text-sm font-medium">
              {cafe?.entry_question || "Neden bu cafe'ye katılmak istiyorsun?"}
            </div>
            <Textarea
              value={joinAnswer}
              onChange={(e) => setJoinAnswer(e.target.value)}
              placeholder="Cevabın..."
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setJoinDialogOpen(false)}>İptal</Button>
            <Button
              disabled={!joinAnswer.trim()}
              onClick={async () => {
                const ok = await joinCafe(joinAnswer.trim());
                if (ok) {
                  setJoinDialogOpen(false);
                  setJoinAnswer("");
                }
              }}
            >
              Başvuruyu Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </CaddeProfileGate>
  );
};

interface CategoryLink { to: string; label: string; icon: any; bg: string; color: string; }
const CategorySearch = ({ links }: { links: CategoryLink[] }) => {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => links.filter((l) => l.label.toLowerCase().includes(q.trim().toLowerCase())),
    [q, links]
  );
  return (
    <>
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kategori ara..."
          className="h-8 pl-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        {filtered.length === 0 && (
          <p className="text-[11px] text-muted-foreground py-2 text-center">Eşleşme yok.</p>
        )}
        {filtered.map((l) => (
          <Link key={l.to} to={l.to} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/60 transition-colors">
            <div className={`h-8 w-8 rounded-full ${l.bg} flex items-center justify-center`}>
              <l.icon className={`h-4 w-4 ${l.color}`} />
            </div>
            <span className="text-sm font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
};

export default Feed;

