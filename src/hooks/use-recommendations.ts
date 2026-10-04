// M19 · Tavsiye İste — React Query hook'ları (desen: use-events.ts).
// Liste/detay/eşleşme sorguları + create/answer mutasyonları (başarıda invalidate).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/components/auth/useAuth";
import {
  answerRecommendation,
  createRecommendationRequest,
  fetchRecommendationDetail,
  fetchRecommendations,
  matchRecommendationProfessionals,
  type RecommendationFilters,
} from "@/lib/recommendations-api";
import { RECOMMENDATION_MATCH_DEFAULT_LIMIT } from "@/lib/recommendations-rules";
import type { CreateRecommendationInput } from "@/lib/recommendations-schemas";

const LIST_KEY = ["recommendations", "list"] as const;
const detailKey = (id: string) => ["recommendations", "detail", id] as const;
const matchKey = (id: string) => ["recommendations", "match", id] as const;

// F10 (inceleme borcu): App.tsx'teki QueryClient ÇIPLAK (defaultOptions yok →
// staleTime 0 + refetchOnWindowFocus true) — açık pencere taşımayan her sorgu
// HER sekme odağında yeniden çekilir (cadde-query-cache.ts B4 dersi: "tek bir
// alt+tab bunların hepsini tetikliyordu"). Her sorgu penceresini AÇIKÇA taşır;
// kilit: use-recommendations.test.ts (staleTime'sız sorgu bırakılmaz).
/** Liste/detay — dakikalar ölçeğinde değişen topluluk içeriği. */
const LIST_STALE_MS = 60_000;
/** Eşleşme — talep başına deterministik + match RPC tam üye kataloğunu tarar. */
const MATCH_STALE_MS = 5 * 60_000;

export function useRecommendations(
  filters?: RecommendationFilters,
  opts?: { limit?: number; offset?: number },
) {
  return useQuery({
    queryKey: [...LIST_KEY, filters ?? {}, opts?.limit ?? 50, opts?.offset ?? 0],
    queryFn: () => fetchRecommendations(filters, opts),
    staleTime: LIST_STALE_MS,
  });
}

export function useRecommendationDetail(id: string) {
  return useQuery({
    queryKey: detailKey(id),
    queryFn: () => fetchRecommendationDetail(id),
    enabled: !!id,
    staleTime: LIST_STALE_MS,
  });
}

export function useMatchedProfessionals(requestId: string, limit?: number) {
  // 🔴 match RPC authenticated-only (anon EXECUTE YOK — M18 grant ölçümü):
  // anonim ziyaretçide sorgu HİÇ AÇILMAZ. Aksi halde her anonim /tavsiye/:id
  // görüntülemesi garantili 42501 × retry fırtınası üretiyordu (inceleme WARNING).
  // İzin hatası retry edilmez (retry:false).
  const { user } = useAuth();
  return useQuery({
    // F16: queryKey varsayılanı SABİTTEN (çıplak 25 literal'i sabit kayarsa
    // anahtarı yalan söylerdi — cache çatallanması).
    queryKey: [...matchKey(requestId), limit ?? RECOMMENDATION_MATCH_DEFAULT_LIMIT],
    queryFn: () => matchRecommendationProfessionals(requestId, limit),
    enabled: !!requestId && !!user,
    retry: false,
    staleTime: MATCH_STALE_MS,
  });
}

export function useCreateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecommendationInput) => createRecommendationRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useAnswerRecommendation(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => answerRecommendation(requestId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailKey(requestId) });
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}
