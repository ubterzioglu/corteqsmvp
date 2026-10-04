// M19 · Tavsiye İste — veri katmanı (RPC çağrıları + okuma). Desen: events-api.ts / careers-api.ts.
//
// 🔴 YAZMA YALNIZ RPC (M17): createRecommendationRequest / answerRecommendation
// security-definer RPC'leri çağırır; doğrudan `.insert` YOK (tabloda write grant'ı
// zaten yok — RPC-only). userId İSTEMCİDEN GİTMEZ (RPC auth.uid() kullanır).
// 🔴 Okuma herkese açık (M17 RLS select) — liste/detay doğrudan tablodan.
// ⚠️ types.ts regen BORCU (G12): recommendation_* tabloları/RPC'leri üretilmiş
// tiplerde YOK — `as never` deseni bilinçli (emsal: events/careers).
// ⚠️ RPC hataları DÜZ NESNE — tip daraltması (instanceof) YASAK; resolveRecommendationRpcErrorMessage.
import { supabase } from "@/integrations/supabase/client";
import {
  RECOMMENDATION_MATCH_DEFAULT_LIMIT,
  resolveRecommendationRpcErrorMessage,
} from "@/lib/recommendations-rules";
import type {
  CreateRecommendationInput,
  MatchedProfessional,
  RecommendationAnswerRow,
  RecommendationRequestRow,
} from "@/lib/recommendations-schemas";

// F15 (inceleme borcu): diasporaKey/categorySlug/country/city filtre dalları
// ÇAĞIRANSIZDI (iki üretim tüketicisi de yalnız `status` geçiriyor) — ölü yüzey
// budandı. Filtre UI'ı gelirse dallar GERÇEK tüketiciyle birlikte geri gelir
// (M17'nin diaspora/category indeksleri o güne kadar boşta durur, zararsız).
export type RecommendationFilters = {
  status?: string;
};

/**
 * Yeni tavsiye talebi açar (RPC-only yazma). dönen id.
 * Hata: `resolveRecommendationRpcErrorMessage` düz nesneden Türkçe üretir.
 */
export async function createRecommendationRequest(input: CreateRecommendationInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_recommendation_request_v1" as never, {
    p_title: input.title,
    p_body: input.body,
    p_category_slug: input.category_slug ?? null,
    p_country: input.country ?? null,
    p_city: input.city ?? null,
    p_diaspora_key: input.diaspora_key ?? "tr",
  } as never);

  if (error) throw new Error(resolveRecommendationRpcErrorMessage(error));
  return String(data);
}

/** Talebe yanıt verir (RPC-only yazma). is_professional SUNUCUDA türetilir (istemci göndermez). */
export async function answerRecommendation(requestId: string, body: string): Promise<string> {
  const { data, error } = await supabase.rpc("answer_recommendation_v1" as never, {
    p_request_id: requestId,
    p_body: body,
  } as never);

  if (error) throw new Error(resolveRecommendationRpcErrorMessage(error));
  return String(data);
}

/**
 * Talep listesi (herkese açık okuma). PostgREST 1000 satır tavanı → `.range` ile
 * sayfala (limit/offset). Varsayılan: açık+yanıtlanmış, yeni önce.
 */
export async function fetchRecommendations(
  filters?: RecommendationFilters,
  opts?: { limit?: number; offset?: number },
): Promise<RecommendationRequestRow[]> {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from("recommendation_requests" as never)
    .select("*" as never)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status" as never, filters.status as never);
  }
  // F15: diaspora/category/country/city dalları budandı (çağıransız ölü yüzey —
  // filtre UI'ı gelirse gerçek tüketiciyle birlikte geri gelir).

  const { data, error } = await query;
  if (error) throw new Error(resolveRecommendationRpcErrorMessage(error));
  return ((data ?? []) as unknown) as RecommendationRequestRow[];
}

/** Tek talep + yanıtları (detay sayfası). */
export async function fetchRecommendationDetail(
  requestId: string,
): Promise<{ request: RecommendationRequestRow | null; answers: RecommendationAnswerRow[] }> {
  const { data: reqRow, error: reqError } = await supabase
    .from("recommendation_requests" as never)
    .select("*" as never)
    .eq("id" as never, requestId as never)
    .maybeSingle();
  if (reqError) throw new Error(resolveRecommendationRpcErrorMessage(reqError));

  const { data: answers, error: ansError } = await supabase
    .from("recommendation_answers" as never)
    .select("*" as never)
    .eq("request_id" as never, requestId as never)
    .order("created_at", { ascending: true });
  if (ansError) throw new Error(resolveRecommendationRpcErrorMessage(ansError));

  return {
    request: reqRow ? (((reqRow as unknown) as RecommendationRequestRow)) : null,
    answers: ((answers ?? []) as unknown) as RecommendationAnswerRow[],
  };
}

/**
 * Talep için eşleşen profesyoneller (M18 match RPC). 🔴 Dönen satırlarda İLETİŞİM
 * YOK (search_text okunmaz — M18 K5). Skor sıralı (eler değil sıralar).
 */
export async function matchRecommendationProfessionals(
  requestId: string,
  limit: number = RECOMMENDATION_MATCH_DEFAULT_LIMIT,
): Promise<MatchedProfessional[]> {
  const { data, error } = await supabase.rpc("match_recommendation_professionals" as never, {
    p_request_id: requestId,
    p_limit: limit,
  } as never);

  if (error) throw new Error(resolveRecommendationRpcErrorMessage(error));
  return ((data ?? []) as unknown) as MatchedProfessional[];
}
