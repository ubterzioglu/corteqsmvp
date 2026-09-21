import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  fetchKadroRoleEvents, 
  fetchKadroCandidates, 
  saveKadroRoleState,
  createKadroCandidate,
  updateKadroCandidate,
  deleteKadroCandidate
} from "@/lib/kadro/kadro-api";
import { KADRO_QUERY_KEY } from "./useKadroBoard";
import type { KadroRoleState, KadroCandidateDraft } from "@/lib/kadro/kadro-types";

export function useKadroRoleDetail(roleKey: string | null) {
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["kadro", "events", roleKey],
    queryFn: () => fetchKadroRoleEvents(roleKey!),
    enabled: !!roleKey,
  });

  const candidatesQuery = useQuery({
    queryKey: ["kadro", "candidates", roleKey],
    queryFn: () => fetchKadroCandidates(roleKey!),
    enabled: !!roleKey,
  });

  const saveStateMutation = useMutation({
    mutationFn: async (state: Partial<KadroRoleState>) => {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id ?? "";
      return saveKadroRoleState(roleKey!, state, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KADRO_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["kadro", "events", roleKey] });
    },
  });

  const createCandidateMutation = useMutation({
    mutationFn: async (draft: KadroCandidateDraft) => {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id ?? "";
      return createKadroCandidate(roleKey!, draft, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kadro", "candidates", roleKey] });
    },
  });

  const updateCandidateMutation = useMutation({
    mutationFn: ({ candidateId, draft }: { candidateId: string; draft: KadroCandidateDraft }) =>
      updateKadroCandidate(candidateId, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kadro", "candidates", roleKey] });
    },
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: (candidateId: string) => deleteKadroCandidate(candidateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kadro", "candidates", roleKey] });
    },
  });

  const saveState = (state: Partial<KadroRoleState>) => {
    saveStateMutation.mutate(state);
  };

  const createCandidate = (draft: KadroCandidateDraft) => {
    createCandidateMutation.mutate(draft);
  };

  const updateCandidate = (candidateId: string, draft: KadroCandidateDraft) => {
    updateCandidateMutation.mutate({ candidateId, draft });
  };

  const deleteCandidate = (candidateId: string) => {
    if (!confirm("Bu adayı silmek istediğinizden emin misiniz?")) return;
    deleteCandidateMutation.mutate(candidateId);
  };

  return {
    events: eventsQuery.data ?? [],
    candidates: candidatesQuery.data ?? [],
    isLoadingEvents: eventsQuery.isLoading,
    isLoadingCandidates: candidatesQuery.isLoading,
    isSaving: saveStateMutation.isPending,
    saveState,
    createCandidate,
    updateCandidate,
    deleteCandidate,
  };
}
