import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/components/auth/useAuth";
import { fetchMyFeedback, submitFeedback } from "@/lib/feedback";

/**
 * ⚠️ Anahtar KULLANICIYA bağlıdır: çıkış `queryClient`'i temizlemez, aynı sekmede
 * giren sonraki hesap önceki hesabın geçmişini önbellekten görürdü.
 */
export const myFeedbackKeys = {
  mine: (userId: string | undefined) => ["my-feedback", userId] as const,
};

/** Üyenin kendi geri bildirim geçmişi (`list_my_feedback_v1`) + yeni gönderim. */
export function useMyFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: myFeedbackKeys.mine(userId),
    queryFn: fetchMyFeedback,
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const submitMutation = useMutation({
    mutationFn: ({ body, pagePath }: { body: string; pagePath: string }) => submitFeedback(body, pagePath),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myFeedbackKeys.mine(userId) }),
  });

  return { query, submitMutation };
}
