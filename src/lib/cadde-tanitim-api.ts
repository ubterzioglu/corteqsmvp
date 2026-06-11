// Tanıtım (sponsorlu görünürlük) API katmanı — Cadde 3.0 Faz 6.
// D-01 kararı: UI adı "Tanıtım"; Çarşı (carsi_*) ile asla birleşmez — bu modül yalnız
// cadde_promotion_* nesneleriyle konuşur. Kampanya oluşturma/onay/analitik security-definer
// RPC'lerden geçer; tüketim (rail/feed) list_cadde_promotions_v1 ile okunur.

import { isSupabaseConfigured } from "@/integrations/supabase/client";

import { db, reportCaddeApiError } from "./cadde-internal";
import { resolveCaddeRpcErrorMessage } from "./cadde-rules";
import { caddePromotionCreateSchema, parseWithUserError } from "./cadde-schemas";
import type {
  CaddePromotionCampaign,
  CaddePromotionCard,
  CaddePromotionCreateInput,
  CaddePromotionPlacementOption,
  CaddePromotionStatus,
  CaddePromotionType,
} from "./cadde-types";

export const CADDE_PROMOTION_STATUS_LABELS: Record<CaddePromotionStatus, string> = {
  draft: "Taslak",
  pending: "Onay bekliyor",
  approved: "Aktif",
  rejected: "Reddedildi",
};

export const CADDE_PROMOTION_TYPE_LABELS: Record<CaddePromotionType, string> = {
  business: "İşletme",
  consultant: "Danışman",
  event: "Etkinlik",
  community: "Topluluk",
  city_highlight: "Şehir Elçisi Öne Çıkarması",
};

export async function listPromotionPlacementOptions(): Promise<CaddePromotionPlacementOption[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await db
      .from("cadde_promotion_placement_catalog")
      .select("key, label_tr, description, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Array<{ key: string; label_tr: string; description: string | null; sort_order: number }>).map((row) => ({
      key: row.key,
      labelTr: row.label_tr,
      description: row.description,
      sortOrder: row.sort_order,
    }));
  } catch (error: unknown) {
    reportCaddeApiError("listPromotionPlacementOptions", error);
    return [];
  }
}

type CampaignRow = {
  id: string;
  campaign_type: CaddePromotionType;
  title: string;
  description: string;
  target_url: string;
  image_url: string | null;
  status: CaddePromotionStatus;
  starts_at: string | null;
  ends_at: string | null;
  review_note: string | null;
  created_at: string;
  owner_user_id: string;
};

async function enrichCampaigns(rows: CampaignRow[]): Promise<CaddePromotionCampaign[]> {
  const campaignIds = rows.map((row) => row.id);
  const [placementsRes, eventsRes] = await Promise.all([
    campaignIds.length > 0
      ? db.from("cadde_promotion_placements").select("campaign_id, placement_key").in("campaign_id", campaignIds)
      : Promise.resolve({ data: [] }),
    campaignIds.length > 0
      ? db.from("cadde_promotion_events").select("campaign_id, event_type").in("campaign_id", campaignIds)
      : Promise.resolve({ data: [] }),
  ]);

  const placementsByCampaign = new Map<string, string[]>();
  for (const row of ((placementsRes.data ?? []) as Array<{ campaign_id: string; placement_key: string }>)) {
    placementsByCampaign.set(row.campaign_id, [...(placementsByCampaign.get(row.campaign_id) ?? []), row.placement_key]);
  }

  const counts = new Map<string, { impression: number; click: number }>();
  for (const row of ((eventsRes.data ?? []) as Array<{ campaign_id: string; event_type: string }>)) {
    const current = counts.get(row.campaign_id) ?? { impression: 0, click: 0 };
    if (row.event_type === "impression") current.impression += 1;
    if (row.event_type === "click") current.click += 1;
    counts.set(row.campaign_id, current);
  }

  return rows.map((row) => ({
    id: row.id,
    campaignType: row.campaign_type,
    title: row.title,
    description: row.description,
    targetUrl: row.target_url,
    imageUrl: row.image_url,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    placementKeys: placementsByCampaign.get(row.id) ?? [],
    impressionCount: counts.get(row.id)?.impression ?? 0,
    clickCount: counts.get(row.id)?.click ?? 0,
  }));
}

const CAMPAIGN_SELECT_COLUMNS =
  "id, owner_user_id, campaign_type, title, description, target_url, image_url, status, starts_at, ends_at, review_note, created_at";

/** Sahibin kendi kampanyaları (panel görünümü; placement + impression/click sayılarıyla). */
export async function listMyPromotionCampaigns(userId: string): Promise<CaddePromotionCampaign[]> {
  if (!isSupabaseConfigured || !userId) return [];

  try {
    const { data, error } = await db
      .from("cadde_promotion_campaigns")
      .select(CAMPAIGN_SELECT_COLUMNS)
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return enrichCampaigns((data ?? []) as CampaignRow[]);
  } catch (error: unknown) {
    reportCaddeApiError("listMyPromotionCampaigns", error);
    return [];
  }
}

/** Admin onay kuyruğu (status=pending; RLS admin'e tümünü açar). */
export async function adminListPendingPromotions(): Promise<CaddePromotionCampaign[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await db
      .from("cadde_promotion_campaigns")
      .select(CAMPAIGN_SELECT_COLUMNS)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return enrichCampaigns((data ?? []) as CampaignRow[]);
  } catch (error: unknown) {
    reportCaddeApiError("adminListPendingPromotions", error);
    return [];
  }
}

export async function createPromotionCampaign(input: CaddePromotionCreateInput): Promise<string> {
  const parsed = parseWithUserError(caddePromotionCreateSchema, input);
  const { data, error } = await db.rpc("create_cadde_promotion_campaign_v1", {
    p_campaign_type: parsed.campaignType,
    p_title: parsed.title,
    p_description: parsed.description,
    p_target_url: parsed.targetUrl,
    p_image_url: parsed.imageUrl ?? null,
    p_starts_at: parsed.startsAt ?? null,
    p_ends_at: parsed.endsAt ?? null,
    p_placements: parsed.placements.map((placement) => ({
      key: placement.key,
      country: placement.country ?? null,
      city: placement.city ?? null,
      themeKeys: placement.themeKeys ?? [],
    })),
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
  return data as string;
}

export async function adminReviewPromotion(campaignId: string, approve: boolean, note?: string): Promise<void> {
  const { error } = await db.rpc("admin_review_cadde_promotion_v1", {
    p_campaign_id: campaignId,
    p_approve: approve,
    p_note: note?.trim() || null,
  });
  if (error) throw new Error(resolveCaddeRpcErrorMessage(error));
}

/** Placement bazlı tüketim kartları (rail / feed-inline / cafe). */
export async function listCaddePromotions(
  placementKey: string,
  filters: { countries: string[]; cities: string[] },
  limit = 5,
): Promise<CaddePromotionCard[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await db.rpc("list_cadde_promotions_v1", {
      p_placement_key: placementKey,
      p_filters: { countries: filters.countries, cities: filters.cities },
      p_limit: limit,
    });
    if (error) throw error;
    return (data ?? []) as CaddePromotionCard[];
  } catch (error: unknown) {
    reportCaddeApiError("listCaddePromotions", error);
    return [];
  }
}

// Frequency cap (spec §11.4 / §15.4): aynı kampanyanın impression'ı oturumda 1 kez kaydedilir.
const SESSION_IMPRESSION_PREFIX = "cadde.promotion.impression.";

/**
 * Impression/click kaydı — fire-and-forget: analitik hatası UX'i asla kırmaz
 * (yalnız console telemetrisi). DB tarafında ayrıca saatlik abuse limiti vardır.
 */
export function recordPromotionEvent(campaignId: string, placementKey: string, eventType: "impression" | "click"): void {
  if (!isSupabaseConfigured) return;

  if (eventType === "impression") {
    const sessionKey = `${SESSION_IMPRESSION_PREFIX}${campaignId}.${placementKey}`;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // sessionStorage kapalıysa (private mod) cap'i DB limiti üstlenir.
    }
  }

  void db
    .rpc("record_cadde_promotion_event_v1", {
      p_campaign_id: campaignId,
      p_placement_key: placementKey,
      p_event_type: eventType,
    })
    .then(({ error }: { error: unknown }) => {
      if (error) console.error("[cadde_api_error] recordPromotionEvent", error);
    });
}

/** Dış URL mi? React Router Link yalnız internal path'lerde kullanılır (spec §15.4). */
export function isExternalPromotionUrl(targetUrl: string): boolean {
  return targetUrl.startsWith("http://") || targetUrl.startsWith("https://");
}
