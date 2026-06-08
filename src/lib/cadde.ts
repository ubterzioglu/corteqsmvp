import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export type CaddeContentMode = "demo" | "real";
export type CaddePostType = "text" | "question" | "offer" | "event";
export type CaddeReactionType = "like" | "support" | "idea";
export type CaddeBillboardType = "consultant" | "business" | "event";

type Nullable<T> = T | null;

type CaddeCountryRow = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
};

type CaddeCityRow = {
  id: string;
  country_id: string;
  name: string;
  timezone: string;
  sort_order: number;
};

type CaddePostRow = {
  id: string;
  author_user_id: Nullable<string>;
  author_name_override: Nullable<string>;
  author_role: Nullable<string>;
  author_avatar_url: Nullable<string>;
  content_mode: CaddeContentMode;
  status: "draft" | "published" | "hidden";
  post_type: CaddePostType;
  title: Nullable<string>;
  body: string;
  country_id: Nullable<string>;
  city_id: Nullable<string>;
  is_bridge: boolean;
  pinned: boolean;
  created_at: string;
};

type CaddeReactionRow = {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: CaddeReactionType;
};

type CaddeCommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type CaddeCafeRow = {
  id: string;
  host_user_id: Nullable<string>;
  host_name_override: Nullable<string>;
  title: string;
  summary: string;
  country_id: Nullable<string>;
  city_id: Nullable<string>;
  content_mode: CaddeContentMode;
  status: "draft" | "published" | "hidden";
  is_bridge: boolean;
  is_free: boolean;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
};

type CaddeCafeMemberRow = {
  id: string;
  cafe_id: string;
  user_id: string;
};

type CaddeBillboardRow = {
  id: string;
  card_type: CaddeBillboardType;
  title: string;
  subtitle: Nullable<string>;
  description: string;
  badge_text: Nullable<string>;
  cta_label: string;
  cta_url: string;
  image_url: Nullable<string>;
  content_mode: CaddeContentMode;
  status: "draft" | "published" | "hidden";
  country_id: Nullable<string>;
  city_id: Nullable<string>;
  is_featured: boolean;
  sort_order: number;
};

type CaddeSponsoredRow = {
  id: string;
  placement_key: string;
  title: string;
  description: string;
  badge_text: Nullable<string>;
  cta_label: string;
  cta_url: string;
  image_url: Nullable<string>;
  content_mode: CaddeContentMode;
  status: "draft" | "published" | "hidden";
  country_id: Nullable<string>;
  city_id: Nullable<string>;
  sort_order: number;
};

export type CaddeCountry = {
  id: string;
  code: string;
  name: string;
};

export type CaddeCity = {
  id: string;
  countryId: string;
  name: string;
  timezone: string;
};

export type CaddeFilterState = {
  mode: CaddeContentMode;
  country: string;
  city: string;
  bridge: boolean;
};

export type CaddeComment = {
  id: string;
  postId: string;
  userId: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type CaddePost = {
  id: string;
  mode: CaddeContentMode;
  type: CaddePostType;
  title: string | null;
  body: string;
  authorName: string;
  authorRole: string | null;
  authorAvatarUrl: string | null;
  authorUserId: string | null;
  country: string | null;
  city: string | null;
  isBridge: boolean;
  pinned: boolean;
  createdAt: string;
  reactionCounts: Record<CaddeReactionType, number>;
  totalReactionCount: number;
  commentCount: number;
  comments: CaddeComment[];
  viewerReactions: CaddeReactionType[];
};

export type CaddeFeedPage = {
  items: CaddePost[];
  nextPage: number | null;
};

export type CaddeCafe = {
  id: string;
  title: string;
  summary: string;
  hostName: string;
  country: string | null;
  city: string | null;
  isBridge: boolean;
  isFree: boolean;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  memberCount: number;
  joinedByViewer: boolean;
  mode: CaddeContentMode;
};

export type CaddeBillboardCard = {
  id: string;
  type: CaddeBillboardType;
  title: string;
  subtitle: string | null;
  description: string;
  badgeText: string | null;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string | null;
  isFeatured: boolean;
};

export type CaddeSponsoredPlacement = {
  id: string;
  title: string;
  description: string;
  badgeText: string | null;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string | null;
};

export type CaddePostInput = {
  type: CaddePostType;
  title?: string;
  body: string;
  countryId?: string;
  cityId?: string;
  isBridge: boolean;
};

export type CaddeAdminPostInput = {
  content_mode: CaddeContentMode;
  status: "draft" | "published" | "hidden";
  post_type: CaddePostType;
  title: string | null;
  body: string;
  country_id: string | null;
  city_id: string | null;
  is_bridge: boolean;
  pinned: boolean;
  author_name_override: string | null;
  author_role: string | null;
};

export type CaddeAdminCafeInput = {
  content_mode: CaddeContentMode;
  status: "draft" | "published" | "hidden";
  title: string;
  summary: string;
  country_id: string | null;
  city_id: string | null;
  is_bridge: boolean;
  is_free: boolean;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  host_name_override: string | null;
};

export type CaddeAdminBillboardInput = {
  card_type: CaddeBillboardType;
  title: string;
  subtitle: string | null;
  description: string;
  badge_text: string | null;
  cta_label: string;
  cta_url: string;
  image_url: string | null;
  content_mode: CaddeContentMode;
  status: "draft" | "published" | "hidden";
  country_id: string | null;
  city_id: string | null;
  is_featured: boolean;
  sort_order: number;
};

export type CaddeAdminSponsoredInput = {
  placement_key: string;
  title: string;
  description: string;
  badge_text: string | null;
  cta_label: string;
  cta_url: string;
  image_url: string | null;
  content_mode: CaddeContentMode;
  status: "draft" | "published" | "hidden";
  country_id: string | null;
  city_id: string | null;
  sort_order: number;
};

const DEMO_COUNTRIES: CaddeCountry[] = [
  { id: "country-de", code: "DE", name: "Almanya" },
  { id: "country-nl", code: "NL", name: "Hollanda" },
  { id: "country-gb", code: "GB", name: "Birleşik Krallık" },
  { id: "country-us", code: "US", name: "Amerika Birleşik Devletleri" },
  { id: "country-tr", code: "TR", name: "Türkiye" },
];

const DEMO_CITIES: CaddeCity[] = [
  { id: "city-berlin", countryId: "country-de", name: "Berlin", timezone: "Europe/Berlin" },
  { id: "city-hamburg", countryId: "country-de", name: "Hamburg", timezone: "Europe/Berlin" },
  { id: "city-amsterdam", countryId: "country-nl", name: "Amsterdam", timezone: "Europe/Amsterdam" },
  { id: "city-london", countryId: "country-gb", name: "Londra", timezone: "Europe/London" },
  { id: "city-newyork", countryId: "country-us", name: "New York", timezone: "America/New_York" },
  { id: "city-istanbul", countryId: "country-tr", name: "İstanbul", timezone: "Europe/Istanbul" },
];

const DEMO_POSTS: CaddePost[] = [
  {
    id: "demo-post-1",
    mode: "demo",
    type: "question",
    title: "Berlin'de yaz stajı için topluluk arayışı",
    body: "2 haftadır Berlin'deyim. Hem ürün tarafında hem de etkinliklerde dahil olabileceğim samimi bir çevre arıyorum.",
    authorName: "Elif Demir",
    authorRole: "Yeni Taşınan",
    authorAvatarUrl: null,
    authorUserId: null,
    country: "Almanya",
    city: "Berlin",
    isBridge: false,
    pinned: true,
    createdAt: "2026-05-28T10:00:00.000Z",
    reactionCounts: { like: 8, support: 5, idea: 2 },
    totalReactionCount: 15,
    commentCount: 2,
    comments: [
      { id: "demo-comment-1", postId: "demo-post-1", userId: "demo", body: "Berlin product meetuplarını paylaşabilirim.", authorName: "Mert Koca", createdAt: "2026-05-28T12:00:00.000Z" },
      { id: "demo-comment-2", postId: "demo-post-1", userId: "demo", body: "Cumartesi ortak çalışma buluşmasına bekleriz.", authorName: "Seda Yalçın", createdAt: "2026-05-28T13:00:00.000Z" },
    ],
    viewerReactions: [],
  },
  {
    id: "demo-post-2",
    mode: "demo",
    type: "offer",
    title: "Amsterdam ortak çalışma buluşması",
    body: "Perşembe günü saat 19:00'da merkezde serbest çalışma + networking oturumu yapıyoruz. Ürün, ihracat ve freelancer herkes gelebilir.",
    authorName: "Mert Koca",
    authorRole: "Topluluk Lideri",
    authorAvatarUrl: null,
    authorUserId: null,
    country: "Hollanda",
    city: "Amsterdam",
    isBridge: false,
    pinned: false,
    createdAt: "2026-05-27T16:00:00.000Z",
    reactionCounts: { like: 10, support: 3, idea: 4 },
    totalReactionCount: 17,
    commentCount: 1,
    comments: [{ id: "demo-comment-3", postId: "demo-post-2", userId: "demo", body: "İlk kez gelenler için de uygun.", authorName: "Deniz O.", createdAt: "2026-05-27T18:00:00.000Z" }],
    viewerReactions: [],
  },
  {
    id: "demo-post-3",
    mode: "demo",
    type: "event",
    title: "Londra girişimci kahvesi açıldı",
    body: "Bu hafta sonu Londra'da yatırım, diaspora networkü ve yeni pazar açılışı konularını konuşacağız.",
    authorName: "Seda Yalçın",
    authorRole: "Kurucu",
    authorAvatarUrl: null,
    authorUserId: null,
    country: "Birleşik Krallık",
    city: "Londra",
    isBridge: true,
    pinned: false,
    createdAt: "2026-05-26T09:30:00.000Z",
    reactionCounts: { like: 12, support: 6, idea: 5 },
    totalReactionCount: 23,
    commentCount: 0,
    comments: [],
    viewerReactions: [],
  },
];

const DEMO_CAFES: CaddeCafe[] = [
  {
    id: "demo-cafe-1",
    title: "Berlin Sabah Kahvesi",
    summary: "Yeni gelenler ve uzun süredir burada olanlar için hızlı tanışma odası.",
    hostName: "Ayşe U.",
    country: "Almanya",
    city: "Berlin",
    isBridge: false,
    isFree: true,
    startsAt: "2026-05-29T08:00:00.000Z",
    endsAt: "2026-05-29T11:00:00.000Z",
    isActive: true,
    memberCount: 12,
    joinedByViewer: false,
    mode: "demo",
  },
  {
    id: "demo-cafe-2",
    title: "TR-Köprü Mentor Cafe",
    summary: "Türkiye ile diaspora arasında taşınma ve iş bağlantıları için ortak oda.",
    hostName: "Can E.",
    country: "Türkiye",
    city: "İstanbul",
    isBridge: true,
    isFree: true,
    startsAt: "2026-05-29T09:00:00.000Z",
    endsAt: "2026-05-29T12:00:00.000Z",
    isActive: true,
    memberCount: 18,
    joinedByViewer: false,
    mode: "demo",
  },
];

const DEMO_BILLBOARDS: CaddeBillboardCard[] = [
  {
    id: "demo-board-1",
    type: "consultant",
    title: "Oturum ve Taşınma Danışmanı",
    subtitle: "Berlin",
    description: "Yeni taşınanlar için resmi süreçler, oturum ve ilk 90 gün kontrol listesi.",
    badgeText: "Danışman",
    ctaLabel: "Görüşme Talep Et",
    ctaUrl: "/directory?country=Almanya&city=Berlin",
    imageUrl: null,
    isFeatured: true,
  },
  {
    id: "demo-board-2",
    type: "business",
    title: "Anadolu Taste Kitchen",
    subtitle: "Amsterdam",
    description: "Hafta içi networking masası ve topluluk kampanyalarıyla işletmenizi öne çıkarın.",
    badgeText: "Business",
    ctaLabel: "Mekânı Keşfet",
    ctaUrl: "/commercial/community-leader",
    imageUrl: null,
    isFeatured: false,
  },
  {
    id: "demo-board-3",
    type: "event",
    title: "Londra Diaspora Growth Night",
    subtitle: "Haziran 2026",
    description: "Kurucular, içerik üreticileri ve topluluk liderleri için aksiyon odaklı buluşma.",
    badgeText: "Etkinlik",
    ctaLabel: "Etkinliğe Git",
    ctaUrl: "/anket",
    imageUrl: null,
    isFeatured: true,
  },
];

const DEMO_SPONSORED: CaddeSponsoredPlacement = {
  id: "demo-sponsored-1",
  title: "Sponsorlu Görünüm",
  description: "Danışman, etkinlik veya topluluk teklifinizi Cadde akışında görünür hale getirin.",
  badgeText: "Sponsorlu",
  ctaLabel: "Talep Bırak",
  ctaUrl: "/login?mode=signup",
  imageUrl: null,
};

const FALLBACK_PROFILE_NAME = "CorteQS Üyesi";
const PAGE_SIZE = 20;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const emptyReactions = (): Record<CaddeReactionType, number> => ({ like: 0, support: 0, idea: 0 });

const normalizeFilter = (value: string | null) => value?.trim() ?? "";

export function parseCaddeFilters(searchParams: URLSearchParams): CaddeFilterState {
  const mode = searchParams.get("mode") === "real" ? "real" : "demo";
  return {
    mode,
    country: normalizeFilter(searchParams.get("country")),
    city: normalizeFilter(searchParams.get("city")),
    bridge: searchParams.get("bridge") === "1",
  };
}

export function serializeCaddeFilters(filters: CaddeFilterState) {
  const next = new URLSearchParams();
  if (filters.mode === "real") next.set("mode", "real");
  if (filters.country) next.set("country", filters.country);
  if (filters.city) next.set("city", filters.city);
  if (filters.bridge) next.set("bridge", "1");
  return next;
}

export function injectSponsoredPlacement(posts: CaddePost[], sponsor: CaddeSponsoredPlacement | null, mode: CaddeContentMode) {
  if (mode !== "real" || !sponsor || posts.length < 4) {
    return posts.map((post) => ({ kind: "post" as const, post }));
  }

  const leading = posts.slice(0, 3).map((post) => ({ kind: "post" as const, post }));
  const trailing = posts.slice(3).map((post) => ({ kind: "post" as const, post }));
  return [...leading, { kind: "sponsor" as const, sponsor }, ...trailing];
}

export async function listCaddeCountries(): Promise<CaddeCountry[]> {
  if (!isSupabaseConfigured) return DEMO_COUNTRIES;

  try {
    const { data, error } = await db.from("cadde_countries").select("id, code, name, sort_order").eq("is_active", true).order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as CaddeCountryRow[]).map((row) => ({ id: row.id, code: row.code, name: row.name }));
  } catch {
    return DEMO_COUNTRIES;
  }
}

export async function listCaddeCities(countryName = ""): Promise<CaddeCity[]> {
  if (!isSupabaseConfigured) {
    if (!countryName) return DEMO_CITIES;
    const match = DEMO_COUNTRIES.find((country) => country.name === countryName);
    return match ? DEMO_CITIES.filter((city) => city.countryId === match.id) : [];
  }

  try {
    const countryId = await resolveCountryIdByName(countryName);
    let query = db.from("cadde_cities").select("id, country_id, name, timezone, sort_order").eq("is_active", true).order("sort_order", { ascending: true });
    if (countryId) query = query.eq("country_id", countryId);
    const { data, error } = await query;
    if (error) throw error;
    return (data as CaddeCityRow[]).map((row) => ({ id: row.id, countryId: row.country_id, name: row.name, timezone: row.timezone }));
  } catch {
    return DEMO_CITIES;
  }
}

async function resolveCountryIdByName(countryName: string | null | undefined) {
  const trimmed = countryName?.trim() ?? "";
  if (!trimmed) return null;
  const { data } = await db.from("cadde_countries").select("id").eq("name", trimmed).maybeSingle();
  return data?.id ?? null;
}

async function resolveCityIdByName(cityName: string | null | undefined, countryId: string | null) {
  const trimmed = cityName?.trim() ?? "";
  if (!trimmed) return null;
  let query = db.from("cadde_cities").select("id").eq("name", trimmed);
  if (countryId) query = query.eq("country_id", countryId);
  const { data } = await query.maybeSingle();
  return data?.id ?? null;
}

function applyDemoFilters<T extends { country: string | null; city: string | null; isBridge: boolean; mode: CaddeContentMode }>(
  items: T[],
  filters: CaddeFilterState,
) {
  return items.filter((item) => {
    if (item.mode !== filters.mode) return false;
    if (filters.bridge && !item.isBridge) return false;
    if (filters.country && item.country !== filters.country) return false;
    if (filters.city && item.city !== filters.city) return false;
    return true;
  });
}

export async function listCaddeFeed(filters: CaddeFilterState, page: number, currentUserId: string | null): Promise<CaddeFeedPage> {
  if (!isSupabaseConfigured || filters.mode === "demo") {
    const filtered = applyDemoFilters(DEMO_POSTS, filters);
    const start = (page - 1) * PAGE_SIZE;
    const items = filtered.slice(start, start + PAGE_SIZE);
    return { items, nextPage: start + PAGE_SIZE < filtered.length ? page + 1 : null };
  }

  try {
    const countryId = await resolveCountryIdByName(filters.country);
    const cityId = await resolveCityIdByName(filters.city, countryId);
    let query = db
      .from("cadde_posts")
      .select("id, author_user_id, author_name_override, author_role, author_avatar_url, content_mode, status, post_type, title, body, country_id, city_id, is_bridge, pinned, created_at")
      .eq("status", "published")
      .eq("content_mode", "real")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (filters.bridge) query = query.eq("is_bridge", true);
    if (countryId) query = query.eq("country_id", countryId);
    if (cityId) query = query.eq("city_id", cityId);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as CaddePostRow[];
    const [countries, cities, reactions, comments, authorNames] = await Promise.all([
      fetchCountryMap(),
      fetchCityMap(),
      fetchPostReactions(rows.map((row) => row.id)),
      fetchPostComments(rows.map((row) => row.id)),
      fetchUserNameMap(rows.map((row) => row.author_user_id).filter(Boolean) as string[], currentUserId ? [currentUserId] : []),
    ]);

    const items = rows.map((row) => mapPost(row, countries, cities, reactions, comments, authorNames, currentUserId));
    return { items, nextPage: rows.length === PAGE_SIZE ? page + 1 : null };
  } catch {
    return { items: [], nextPage: null };
  }
}

async function fetchCountryMap() {
  const { data } = await db.from("cadde_countries").select("id, name");
  return new Map<string, string>((data ?? []).map((row: { id: string; name: string }) => [row.id, row.name]));
}

async function fetchCityMap() {
  const { data } = await db.from("cadde_cities").select("id, name");
  return new Map<string, string>((data ?? []).map((row: { id: string; name: string }) => [row.id, row.name]));
}

async function fetchUserNameMap(authorIds: string[], extraUserIds: string[] = []) {
  const allIds = Array.from(new Set([...authorIds, ...extraUserIds].filter(Boolean)));
  if (allIds.length === 0) return new Map<string, string>();
  const { data } = await db
    .from("user_profile_attributes")
    .select("user_id, value_text, attribute_catalog!inner(key)")
    .in("user_id", allIds)
    .eq("attribute_catalog.key", "full_name");
  return new Map<string, string>((data ?? []).map((row: any) => [row.user_id, row.value_text ?? FALLBACK_PROFILE_NAME]));
}

async function fetchPostReactions(postIds: string[]) {
  if (postIds.length === 0) return [] as CaddeReactionRow[];
  const { data } = await db.from("cadde_post_reactions").select("id, post_id, user_id, reaction_type").in("post_id", postIds);
  return (data ?? []) as CaddeReactionRow[];
}

async function fetchPostComments(postIds: string[]) {
  if (postIds.length === 0) return [] as Array<CaddeCommentRow & { author_name: string }>;
  const { data, error } = await db.from("cadde_post_comments").select("id, post_id, user_id, body, created_at").in("post_id", postIds).order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as CaddeCommentRow[];
  const userMap = await fetchUserNameMap(rows.map((row) => row.user_id));
  return rows.map((row) => ({ ...row, author_name: userMap.get(row.user_id) ?? FALLBACK_PROFILE_NAME }));
}

function mapPost(
  row: CaddePostRow,
  countries: Map<string, string>,
  cities: Map<string, string>,
  reactions: CaddeReactionRow[],
  comments: Array<CaddeCommentRow & { author_name: string }>,
  authorNames: Map<string, string>,
  currentUserId: string | null,
): CaddePost {
  const postReactions = reactions.filter((reaction) => reaction.post_id === row.id);
  const postComments = comments.filter((comment) => comment.post_id === row.id);
  const reactionCounts = emptyReactions();

  for (const reaction of postReactions) {
    reactionCounts[reaction.reaction_type] += 1;
  }

  return {
    id: row.id,
    mode: row.content_mode,
    type: row.post_type,
    title: row.title,
    body: row.body,
    authorName: row.author_name_override ?? (row.author_user_id ? authorNames.get(row.author_user_id) ?? FALLBACK_PROFILE_NAME : FALLBACK_PROFILE_NAME),
    authorRole: row.author_role,
    authorAvatarUrl: row.author_avatar_url,
    authorUserId: row.author_user_id,
    country: row.country_id ? countries.get(row.country_id) ?? null : null,
    city: row.city_id ? cities.get(row.city_id) ?? null : null,
    isBridge: row.is_bridge,
    pinned: row.pinned,
    createdAt: row.created_at,
    reactionCounts,
    totalReactionCount: reactionCounts.like + reactionCounts.support + reactionCounts.idea,
    commentCount: postComments.length,
    comments: postComments.map((comment) => ({
      id: comment.id,
      postId: comment.post_id,
      userId: comment.user_id,
      body: comment.body,
      authorName: comment.author_name,
      createdAt: comment.created_at,
    })),
    viewerReactions: currentUserId ? postReactions.filter((reaction) => reaction.user_id === currentUserId).map((reaction) => reaction.reaction_type) : [],
  };
}

export async function listCaddeCafes(filters: CaddeFilterState, currentUserId: string | null): Promise<CaddeCafe[]> {
  if (!isSupabaseConfigured || filters.mode === "demo") {
    return applyDemoFilters(DEMO_CAFES, filters);
  }

  try {
    const countryId = await resolveCountryIdByName(filters.country);
    const cityId = await resolveCityIdByName(filters.city, countryId);
    let query = db
      .from("cadde_cafes")
      .select("id, host_user_id, host_name_override, title, summary, country_id, city_id, content_mode, status, is_bridge, is_free, starts_at, ends_at, is_active, created_at")
      .eq("content_mode", "real")
      .eq("status", "published")
      .eq("is_active", true)
      .order("starts_at", { ascending: true });
    if (filters.bridge) query = query.eq("is_bridge", true);
    if (countryId) query = query.eq("country_id", countryId);
    if (cityId) query = query.eq("city_id", cityId);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as CaddeCafeRow[];
    const [countries, cities, members, hosts] = await Promise.all([
      fetchCountryMap(),
      fetchCityMap(),
      fetchCafeMembers(rows.map((row) => row.id)),
      fetchUserNameMap(rows.map((row) => row.host_user_id).filter(Boolean) as string[]),
    ]);
    return rows.map((row) => mapCafe(row, countries, cities, members, hosts, currentUserId));
  } catch {
    return [];
  }
}

async function fetchCafeMembers(cafeIds: string[]) {
  if (cafeIds.length === 0) return [] as CaddeCafeMemberRow[];
  const { data } = await db.from("cadde_cafe_members").select("id, cafe_id, user_id").in("cafe_id", cafeIds);
  return (data ?? []) as CaddeCafeMemberRow[];
}

function mapCafe(
  row: CaddeCafeRow,
  countries: Map<string, string>,
  cities: Map<string, string>,
  members: CaddeCafeMemberRow[],
  hosts: Map<string, string>,
  currentUserId: string | null,
): CaddeCafe {
  const cafeMembers = members.filter((member) => member.cafe_id === row.id);
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    hostName: row.host_name_override ?? (row.host_user_id ? hosts.get(row.host_user_id) ?? FALLBACK_PROFILE_NAME : FALLBACK_PROFILE_NAME),
    country: row.country_id ? countries.get(row.country_id) ?? null : null,
    city: row.city_id ? cities.get(row.city_id) ?? null : null,
    isBridge: row.is_bridge,
    isFree: row.is_free,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    memberCount: cafeMembers.length,
    joinedByViewer: currentUserId ? cafeMembers.some((member) => member.user_id === currentUserId) : false,
    mode: row.content_mode,
  };
}

export async function listCaddeBillboardCards(filters: CaddeFilterState): Promise<CaddeBillboardCard[]> {
  if (!isSupabaseConfigured || filters.mode === "demo") {
    return DEMO_BILLBOARDS;
  }

  try {
    const countryId = await resolveCountryIdByName(filters.country);
    const cityId = await resolveCityIdByName(filters.city, countryId);
    let query = db
      .from("cadde_billboard_cards")
      .select("id, card_type, title, subtitle, description, badge_text, cta_label, cta_url, image_url, content_mode, status, country_id, city_id, is_featured, sort_order")
      .eq("content_mode", "real")
      .eq("status", "published")
      .order("sort_order", { ascending: true });
    if (countryId) query = query.or(`country_id.is.null,country_id.eq.${countryId}`);
    if (cityId) query = query.or(`city_id.is.null,city_id.eq.${cityId}`);
    const { data, error } = await query;
    if (error) throw error;
    return (data as CaddeBillboardRow[]).map((row) => ({
      id: row.id,
      type: row.card_type,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      badgeText: row.badge_text,
      ctaLabel: row.cta_label,
      ctaUrl: row.cta_url,
      imageUrl: row.image_url,
      isFeatured: row.is_featured,
    }));
  } catch {
    return [];
  }
}

export async function getCaddeSponsoredPlacement(filters: CaddeFilterState): Promise<CaddeSponsoredPlacement | null> {
  if (!isSupabaseConfigured || filters.mode === "demo") {
    return DEMO_SPONSORED;
  }

  try {
    const countryId = await resolveCountryIdByName(filters.country);
    const cityId = await resolveCityIdByName(filters.city, countryId);
    let query = db
      .from("cadde_sponsored_placements")
      .select("id, placement_key, title, description, badge_text, cta_label, cta_url, image_url, content_mode, status, country_id, city_id, sort_order")
      .eq("content_mode", "real")
      .eq("status", "published")
      .eq("placement_key", "feed-inline")
      .order("sort_order", { ascending: true })
      .limit(1);
    if (countryId) query = query.or(`country_id.is.null,country_id.eq.${countryId}`);
    if (cityId) query = query.or(`city_id.is.null,city_id.eq.${cityId}`);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as CaddeSponsoredRow;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      badgeText: row.badge_text,
      ctaLabel: row.cta_label,
      ctaUrl: row.cta_url,
      imageUrl: row.image_url,
    };
  } catch {
    return null;
  }
}

export async function createCaddePost(input: CaddePostInput, userId: string) {
  const countryId = await resolveCountryIdByName(input.countryId ?? "");
  const cityId = await resolveCityIdByName(input.cityId ?? "", countryId);
  const payload = {
    author_user_id: userId,
    content_mode: "real" as const,
    status: "published" as const,
    post_type: input.type,
    title: input.title?.trim() || null,
    body: input.body.trim(),
    country_id: countryId,
    city_id: cityId,
    is_bridge: input.isBridge,
  };
  const { error } = await db.from("cadde_posts").insert(payload);
  if (error) throw error;
}

export async function toggleCaddeReaction(postId: string, userId: string, reactionType: CaddeReactionType, currentlyActive: boolean) {
  if (currentlyActive) {
    const { error } = await db.from("cadde_post_reactions").delete().eq("post_id", postId).eq("user_id", userId).eq("reaction_type", reactionType);
    if (error) throw error;
    return;
  }

  const { error } = await db.from("cadde_post_reactions").insert({
    post_id: postId,
    user_id: userId,
    reaction_type: reactionType,
  });
  if (error) throw error;
}

export async function createCaddeComment(postId: string, userId: string, body: string) {
  const { error } = await db.from("cadde_post_comments").insert({
    post_id: postId,
    user_id: userId,
    body: body.trim(),
  });
  if (error) throw error;
}

export async function joinCaddeCafe(cafeId: string, userId: string) {
  const { error } = await db.from("cadde_cafe_members").upsert(
    { cafe_id: cafeId, user_id: userId },
    { onConflict: "cafe_id,user_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function listAdminCaddePosts() {
  const { data, error } = await db.from("cadde_posts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CaddePostRow[];
}

export async function saveAdminCaddePost(id: string | null, payload: CaddeAdminPostInput) {
  const countryId = await resolveCountryIdByName(payload.country_id);
  const cityId = await resolveCityIdByName(payload.city_id, countryId);
  const normalizedPayload = { ...payload, country_id: countryId, city_id: cityId };
  if (id) {
    const { data, error } = await db.from("cadde_posts").update(normalizedPayload).eq("id", id).select("*").single();
    if (error) throw error;
    return data as CaddePostRow;
  }
  const { data, error } = await db.from("cadde_posts").insert(normalizedPayload).select("*").single();
  if (error) throw error;
  return data as CaddePostRow;
}

export async function deleteAdminCaddePost(id: string) {
  const { error } = await db.from("cadde_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function listAdminCaddeCafes() {
  const { data, error } = await db.from("cadde_cafes").select("*").order("starts_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CaddeCafeRow[];
}

export async function saveAdminCaddeCafe(id: string | null, payload: CaddeAdminCafeInput) {
  const countryId = await resolveCountryIdByName(payload.country_id);
  const cityId = await resolveCityIdByName(payload.city_id, countryId);
  const normalizedPayload = { ...payload, country_id: countryId, city_id: cityId };
  if (id) {
    const { data, error } = await db.from("cadde_cafes").update(normalizedPayload).eq("id", id).select("*").single();
    if (error) throw error;
    return data as CaddeCafeRow;
  }
  const { data, error } = await db.from("cadde_cafes").insert(normalizedPayload).select("*").single();
  if (error) throw error;
  return data as CaddeCafeRow;
}

export async function deleteAdminCaddeCafe(id: string) {
  const { error } = await db.from("cadde_cafes").delete().eq("id", id);
  if (error) throw error;
}

export async function listAdminCaddeBillboardCards() {
  const { data, error } = await db.from("cadde_billboard_cards").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CaddeBillboardRow[];
}

export async function saveAdminCaddeBillboardCard(id: string | null, payload: CaddeAdminBillboardInput) {
  const countryId = await resolveCountryIdByName(payload.country_id);
  const cityId = await resolveCityIdByName(payload.city_id, countryId);
  const normalizedPayload = { ...payload, country_id: countryId, city_id: cityId };
  if (id) {
    const { data, error } = await db.from("cadde_billboard_cards").update(normalizedPayload).eq("id", id).select("*").single();
    if (error) throw error;
    return data as CaddeBillboardRow;
  }
  const { data, error } = await db.from("cadde_billboard_cards").insert(normalizedPayload).select("*").single();
  if (error) throw error;
  return data as CaddeBillboardRow;
}

export async function deleteAdminCaddeBillboardCard(id: string) {
  const { error } = await db.from("cadde_billboard_cards").delete().eq("id", id);
  if (error) throw error;
}

export async function listAdminCaddeSponsoredPlacements() {
  const { data, error } = await db.from("cadde_sponsored_placements").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CaddeSponsoredRow[];
}

export async function saveAdminCaddeSponsoredPlacement(id: string | null, payload: CaddeAdminSponsoredInput) {
  const countryId = await resolveCountryIdByName(payload.country_id);
  const cityId = await resolveCityIdByName(payload.city_id, countryId);
  const normalizedPayload = { ...payload, country_id: countryId, city_id: cityId };
  if (id) {
    const { data, error } = await db.from("cadde_sponsored_placements").update(normalizedPayload).eq("id", id).select("*").single();
    if (error) throw error;
    return data as CaddeSponsoredRow;
  }
  const { data, error } = await db.from("cadde_sponsored_placements").insert(normalizedPayload).select("*").single();
  if (error) throw error;
  return data as CaddeSponsoredRow;
}

export async function deleteAdminCaddeSponsoredPlacement(id: string) {
  const { error } = await db.from("cadde_sponsored_placements").delete().eq("id", id);
  if (error) throw error;
}
