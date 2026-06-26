// Sosyal Medya Paylaşım Takip — sayfa seviyesi durum + mutation kancası.
// fetchShareState'i bir kez çeker (React Query), toggle/saveNote mutation'larını
// optimistic update + hata geri alma ile yönetir ve her kalem için hazır bir
// <ShareStatusBar> render eden `renderShareBar(tab, itemId)` döndürür.

import { useCallback, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import {
  fetchShareState,
  saveItemNote,
  shareKey,
  toggleShare,
  type ShareNote,
  type SharePlatform,
  type ShareState,
  type ShareTab,
} from "@/lib/admin-shell/social-share-log";

import { ShareStatusBar } from "./ShareStatusBar";

const QUERY_KEY = ["social-share-state"] as const;
const EMPTY_STATE: ShareState = { badges: {}, notes: {} };

type ToggleArgs = { tab: ShareTab; itemId: string; platform: SharePlatform; shared: boolean };
type NoteArgs = { tab: ShareTab; itemId: string; note: string };

export type ShareTracking = {
  isLoading: boolean;
  isError: boolean;
  /** Bir içerik kalemi için hazır rozet çubuğunu render eder. */
  renderShareBar: (tab: ShareTab, itemId: string) => ReactNode;
};

export function useShareTracking(): ShareTracking {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: QUERY_KEY, queryFn: fetchShareState });
  const state = query.data ?? EMPTY_STATE;

  const toggleMutation = useMutation({
    mutationFn: toggleShare,
    onMutate: async (vars: ToggleArgs) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<ShareState>(QUERY_KEY);
      queryClient.setQueryData<ShareState>(QUERY_KEY, (current) => {
        const base = current ?? EMPTY_STATE;
        const key = shareKey(vars.tab, vars.itemId);
        const itemBadges = { ...(base.badges[key] ?? {}) };
        itemBadges[vars.platform] = {
          shared: vars.shared,
          markedAt: new Date().toISOString(),
          markedBy: itemBadges[vars.platform]?.markedBy ?? null,
        };
        return { ...base, badges: { ...base.badges, [key]: itemBadges } };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
      toast({ title: "Paylaşım durumu kaydedilemedi", variant: "destructive" });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const noteMutation = useMutation({
    mutationFn: saveItemNote,
    onMutate: async (vars: NoteArgs) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<ShareState>(QUERY_KEY);
      queryClient.setQueryData<ShareState>(QUERY_KEY, (current) => {
        const base = current ?? EMPTY_STATE;
        const key = shareKey(vars.tab, vars.itemId);
        const next: ShareNote = {
          note: vars.note,
          markedAt: new Date().toISOString(),
          markedBy: base.notes[key]?.markedBy ?? null,
        };
        return { ...base, notes: { ...base.notes, [key]: next } };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
      toast({ title: "Not kaydedilemedi", variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Not kaydedildi" });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const isMutating = toggleMutation.isPending || noteMutation.isPending;

  const renderShareBar = useCallback(
    (tab: ShareTab, itemId: string): ReactNode => {
      const key = shareKey(tab, itemId);
      return (
        <ShareStatusBar
          tab={tab}
          itemId={itemId}
          badges={state.badges[key] ?? {}}
          note={state.notes[key]}
          pending={isMutating}
          onToggle={(platform, shared) =>
            toggleMutation.mutate({ tab, itemId, platform, shared })
          }
          onSaveNote={(note) => noteMutation.mutate({ tab, itemId, note })}
        />
      );
    },
    [state, isMutating, toggleMutation, noteMutation],
  );

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    renderShareBar,
  };
}
