// M19 · Tavsiye İste — React Query hook'ları (desen: use-events.ts).
// Liste/detay/eşleşme sorguları + create/answer mutasyonları (başarıda invalidate).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  answerRecommendation,
  createRecommendationRequest,
  fetchRecommendationDetail,
  fetchRecommendations,
  matchRecommendationProfessionals,
  type RecommendationFilters,
} from "@/lib/recommendations-api";
import type { CreateRecommendationInput } from "@/lib/recommendations-schemas";

const LIST_KEY = ["recommendations", "list"] as const;
const detailKey = (id: string) => ["recommendations", "detail", id] as const;
const matchKey = (id: string) => ["recommendations", "match", id] as const;

export function useRecommendations(
  filters?: RecommendationFilters,
  opts?: { limit?: number; offset?: number },
) {
  return useQuery({
    queryKey: [...LIST_KEY, filters ?? {}, opts?.limit ?? 50, opts?.offset ?? 0],
    queryFn: () => fetchRecommendations(filters, opts),
  });
}

export function useRecommendationDetail(id: string) {
  return useQuery({
    queryKey: detailKey(id),
    queryFn: () => fetchRecommendationDetail(id),
    enabled: !!id,
  });
}

export function useMatchedProfessionals(requestId: string, limit?: number) {
  return useQuery({
    queryKey: [...matchKey(requestId), limit ?? 25],
    queryFn: () => matchRecommendationProfessionals(requestId, limit),
    enabled: !!requestId,
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
