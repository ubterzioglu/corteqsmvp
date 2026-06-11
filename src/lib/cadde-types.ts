// Cadde domain tipleri — Cadde 3.0 Faz 1 modülerleştirmesi.
// Row tipleri Supabase satır şekillerini, diğerleri UI domain modellerini temsil eder.

export type CaddeContentMode = "demo" | "real";
export type CaddePostType = "text" | "question" | "offer" | "event";
export type CaddeReactionType = "like" | "support" | "idea";
export type CaddeBillboardType = "consultant" | "business" | "event";
export type CaddePublishStatus = "draft" | "published" | "hidden";

type Nullable<T> = T | null;

export type CaddeCountryRow = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
};

export type CaddeCityRow = {
  id: string;
  country_id: string;
  name: string;
  timezone: string;
  sort_order: number;
};

export type CaddePostRow = {
  id: string;
  author_user_id: Nullable<string>;
  author_name_override: Nullable<string>;
  author_role: Nullable<string>;
  author_avatar_url: Nullable<string>;
  content_mode: CaddeContentMode;
  status: CaddePublishStatus;
  post_type: CaddePostType;
  title: Nullable<string>;
  body: string;
  country_id: Nullable<string>;
  city_id: Nullable<string>;
  is_bridge: boolean;
  pinned: boolean;
  created_at: string;
  need_category: Nullable<string>;
  engagement_score: number;
  published_at: Nullable<string>;
};

/** list_cadde_feed_v1 RPC öğesi: post satırı + çözülmüş adlar + ranking çıktıları. */
export type CaddeFeedRpcItem = CaddePostRow & {
  country_name: Nullable<string>;
  city_name: Nullable<string>;
  interests: string[];
  band: number;
  score: number;
  rand: number;
};

export type CaddeInterestRow = {
  key: string;
  label_tr: string;
  sort_order: number;
  is_active: boolean;
};

export type CaddeInterest = {
  key: string;
  labelTr: string;
  sortOrder: number;
};

export type CaddeReactionRow = {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: CaddeReactionType;
};

export type CaddeCommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type CaddeCafeEntryMode = "open" | "approval" | "referral";
export type CaddeCafeMemberStatus = "pending" | "approved" | "rejected";

export type CaddeCafeRow = {
  id: string;
  host_user_id: Nullable<string>;
  host_name_override: Nullable<string>;
  title: string;
  summary: string;
  country_id: Nullable<string>;
  city_id: Nullable<string>;
  content_mode: CaddeContentMode;
  status: CaddePublishStatus;
  is_bridge: boolean;
  is_free: boolean;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  slug: Nullable<string>;
  theme_key: Nullable<string>;
  entry_mode: CaddeCafeEntryMode;
  entry_question: Nullable<string>;
  capacity: Nullable<number>;
  external_links: unknown;
  archived_at: Nullable<string>;
};

export type CaddeCafeMemberRow = {
  id: string;
  cafe_id: string;
  user_id: string;
  status: CaddeCafeMemberStatus;
  answer: Nullable<string>;
  joined_at: string;
};

export type CaddeBillboardRow = {
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
  status: CaddePublishStatus;
  country_id: Nullable<string>;
  city_id: Nullable<string>;
  is_featured: boolean;
  sort_order: number;
};

export type CaddeSponsoredRow = {
  id: string;
  placement_key: string;
  title: string;
  description: string;
  badge_text: Nullable<string>;
  cta_label: string;
  cta_url: string;
  image_url: Nullable<string>;
  content_mode: CaddeContentMode;
  status: CaddePublishStatus;
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

// Faz 3: çoklu ülke/şehir filtresi. Değerler cadde_countries/cities ADLARIDIR;
// id çözümlemesi API/RPC katmanında yapılır.
export type CaddeFilterState = {
  mode: CaddeContentMode;
  countries: string[];
  cities: string[];
  bridge: boolean;
};

/** list_cadde_feed_v1 keyset cursor'ı (SQL sıralamasının aynası — bkz. cadde-ranking.ts). */
export type CaddeFeedCursor = {
  band: number;
  score: number;
  rand: number;
  id: string;
};

/**
 * Infinite feed sayfa parametresi: real mod RPC cursor'ı, demo mod sayfa numarası kullanır.
 * İlk sayfa için null verilir.
 */
export type CaddeFeedPageParam = CaddeFeedCursor | number | null;

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
  needCategory: string | null;
  interests: string[];
  reactionCounts: Record<CaddeReactionType, number>;
  totalReactionCount: number;
  commentCount: number;
  comments: CaddeComment[];
  viewerReactions: CaddeReactionType[];
};

export type CaddeFeedPage = {
  items: CaddePost[];
  nextPage: CaddeFeedPageParam;
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
  // Faz 4 alanları (demo verisinde default'lanır)
  slug: string | null;
  themeKey: string | null;
  entryMode: CaddeCafeEntryMode;
  entryQuestion: string | null;
  capacity: number | null;
  archivedAt: string | null;
  hostUserId: string | null;
  viewerMemberStatus: CaddeCafeMemberStatus | null;
};

export type CaddeCafeMember = {
  id: string;
  userId: string;
  status: CaddeCafeMemberStatus;
  answer: string | null;
  joinedAt: string;
  displayName: string;
};

export type CaddeCafeCreateInput = {
  title: string;
  summary: string;
  themeKey: string;
  country?: string;
  city?: string;
  isBridge: boolean;
  entryMode: CaddeCafeEntryMode;
  referralCode?: string;
  entryQuestion?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
  externalLinks?: string[];
};

export type CaddeCafeJoinResult = {
  memberId: string;
  status: CaddeCafeMemberStatus;
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

export type CaddeFeedListItem =
  | { kind: "post"; post: CaddePost }
  | { kind: "sponsor"; sponsor: CaddeSponsoredPlacement }
  | { kind: "promotion"; promotion: CaddePromotionCard };

// ── Çarşı (Faz 5) — U2U marketplace; Tanıtım/sponsorlu görünürlükten AYRI (D-01) ──

export type CarsiItemStatus = "draft" | "published" | "paused" | "expired";
export type CarsiContactMode = "platform" | "phone" | "email";

export type CarsiCategoryRow = {
  key: string;
  label_tr: string;
  sort_order: number;
  is_active: boolean;
};

export type CarsiCategory = {
  key: string;
  labelTr: string;
  sortOrder: number;
};

export type CarsiItemRow = {
  id: string;
  owner_user_id: string;
  category_key: string;
  title: string;
  description: string;
  price_amount: Nullable<number>;
  price_currency: Nullable<string>;
  country_id: Nullable<string>;
  city_id: Nullable<string>;
  image_urls: string[];
  contact_mode: CarsiContactMode;
  status: CarsiItemStatus;
  moderation_status: string;
  expires_at: Nullable<string>;
  created_at: string;
};

export type CarsiItem = {
  id: string;
  ownerUserId: string;
  ownerName: string;
  categoryKey: string;
  categoryLabel: string;
  title: string;
  description: string;
  priceAmount: number | null;
  priceCurrency: string | null;
  country: string | null;
  city: string | null;
  imageUrls: string[];
  contactMode: CarsiContactMode;
  status: CarsiItemStatus;
  expiresAt: string | null;
  createdAt: string;
};

export type CarsiItemCreateInput = {
  categoryKey: string;
  title: string;
  description: string;
  priceAmount?: number;
  priceCurrency?: string;
  country?: string;
  city?: string;
  imageUrls?: string[];
  contactMode?: CarsiContactMode;
};

// ── Tanıtım (Faz 6, D-01: UI adı "Tanıtım") — sponsorlu görünürlük; Çarşı'dan AYRI ──

export type CaddePromotionStatus = "draft" | "pending" | "approved" | "rejected";
export type CaddePromotionType = "business" | "consultant" | "event" | "community" | "city_highlight";

export type CaddePromotionPlacementOption = {
  key: string;
  labelTr: string;
  description: string | null;
  sortOrder: number;
};

/** Sahip panelindeki kampanya görünümü. */
export type CaddePromotionCampaign = {
  id: string;
  campaignType: CaddePromotionType;
  title: string;
  description: string;
  targetUrl: string;
  imageUrl: string | null;
  status: CaddePromotionStatus;
  startsAt: string | null;
  endsAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  placementKeys: string[];
  impressionCount: number;
  clickCount: number;
};

/** Rail/feed tüketim kartı (list_cadde_promotions_v1 çıktısı). */
export type CaddePromotionCard = {
  campaignId: string;
  placementKey: string;
  campaignType: CaddePromotionType;
  title: string;
  description: string;
  targetUrl: string;
  imageUrl: string | null;
};

export type CaddePromotionPlacementInput = {
  key: string;
  country?: string;
  city?: string;
  themeKeys?: string[];
};

export type CaddePromotionCreateInput = {
  campaignType: CaddePromotionType;
  title: string;
  description: string;
  targetUrl: string;
  imageUrl?: string;
  startsAt?: string;
  endsAt?: string;
  placements: CaddePromotionPlacementInput[];
};

// NOT: countryId/cityId alanları tarihsel olarak ülke/şehir ADI taşır (filtre değerleri);
// id çözümlemesi API katmanında yapılır. Faz 2'de RPC'ye geçerken yeniden adlandırılacak.
export type CaddePostInput = {
  type: CaddePostType;
  title?: string;
  body: string;
  countryId?: string;
  cityId?: string;
  isBridge: boolean;
  /** Birincil ihtiyaç kategorisi (cadde_interest_catalog anahtarı); boşsa ilk etiket kullanılır. */
  needCategory?: string;
  /** 0-3 etiket (cadde_interest_catalog anahtarları). */
  interests?: string[];
  /** Cafe-içi paylaşım: hedef cafe id'si (geo cafe'den miras alınır, visibility='cafe'). */
  cafeId?: string;
};

export type CaddeAdminPostInput = {
  content_mode: CaddeContentMode;
  status: CaddePublishStatus;
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
  status: CaddePublishStatus;
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
  status: CaddePublishStatus;
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
  status: CaddePublishStatus;
  country_id: string | null;
  city_id: string | null;
  sort_order: number;
};
