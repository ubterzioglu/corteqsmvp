// Taşınma dosyasının içerik + ilerleme + sohbet durumunu tek yerde toplar.
//
// RelocationHomePage'i şişirmemek için ayrı dosya: CLAUDE.md "Large files" maddesi
// (800 satır tavanı) ve muhasebe/cadde modüllerindeki hook ayrıştırma deseni.

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteMoveDocument,
  getLivingCosts,
  getMoveDocuments,
  getMoveProgress,
  getRequiredDocuments,
  saveMoveDocument,
  setMoveProgress,
} from "@/lib/relocation-content-api";
import { relocationKeys } from "@/lib/relocation-query-keys";
import { askRelocationAssistant, type RelocationChatMessage } from "@/lib/relocation-chat-api";
import {
  buildRelocationChatContext,
  type RelocationChatProfile,
} from "@/lib/relocation-chat-context";
import type {
  RelocationMoveDocumentType,
  RelocationProgressItemType,
} from "@/lib/relocation-content-types";

interface UseRelocationMoveContentInput {
  moveId: string | null;
  targetCountryCodes: string[];
  targetCountryNames: string[];
  adults: number;
  children: number;
  budgetMonthly: number | null;
  currency: string;
  moveWindowStart: string | null;
  moveWindowEnd: string | null;
  mustHaves: string[];
  onError: (message: string) => void;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Beklenmeyen hata";

export function useRelocationMoveContent(input: UseRelocationMoveContentInput) {
  const queryClient = useQueryClient();
  const { moveId, targetCountryCodes, onError } = input;
  const [chatMessages, setChatMessages] = useState<RelocationChatMessage[]>([]);

  const hasCountries = targetCountryCodes.length > 0;

  const livingCostsQuery = useQuery({
    queryKey: relocationKeys.livingCosts(targetCountryCodes),
    queryFn: () => getLivingCosts(targetCountryCodes),
    enabled: hasCountries,
  });

  const requiredDocumentsQuery = useQuery({
    queryKey: relocationKeys.requiredDocuments(targetCountryCodes),
    queryFn: () => getRequiredDocuments(targetCountryCodes),
    enabled: hasCountries,
  });

  const progressQuery = useQuery({
    queryKey: moveId ? relocationKeys.moveProgress(moveId) : ["relocation", "noop-progress"],
    queryFn: () => getMoveProgress(moveId as string),
    enabled: !!moveId,
  });

  const documentsQuery = useQuery({
    queryKey: moveId ? relocationKeys.moveDocuments(moveId) : ["relocation", "noop-docs"],
    queryFn: () => getMoveDocuments(moveId as string),
    enabled: !!moveId,
  });

  const livingCosts = useMemo(() => livingCostsQuery.data ?? [], [livingCostsQuery.data]);
  const requiredDocuments = useMemo(
    () => requiredDocumentsQuery.data ?? [],
    [requiredDocumentsQuery.data],
  );

  /** Tamamlanmış belge id'leri — panel `Set` ile O(1) sorgular. */
  const doneDocumentKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const row of progressQuery.data ?? []) {
      if (row.item_type === "required_document" && row.is_done) keys.add(row.item_key);
    }
    return keys;
  }, [progressQuery.data]);

  // `moveId as string` derleme zamanı iddiasıdır; çalışma zamanında null geçerse
  // DB'ye `move_id: null` gider ve kullanıcı anlamsız bir Postgres hatası görür.
  // UI zaten engelliyor ama koruma açık olmalı.
  const requireMoveId = (): string => {
    if (!moveId) throw new Error("Taşınma dosyası seçilmedi.");
    return moveId;
  };

  const progressMutation = useMutation({
    mutationFn: (vars: { itemType: RelocationProgressItemType; itemKey: string; isDone: boolean }) =>
      setMoveProgress({ moveId: requireMoveId(), ...vars }),
    onSuccess: () => {
      if (moveId) {
        queryClient.invalidateQueries({ queryKey: relocationKeys.moveProgress(moveId) });
      }
    },
    onError: (error: unknown) => onError(errorMessage(error)),
  });

  const saveDocumentMutation = useMutation({
    mutationFn: (vars: { title: string; content: string; docType: RelocationMoveDocumentType }) =>
      saveMoveDocument({ moveId: requireMoveId(), ...vars }),
    onSuccess: () => {
      if (moveId) {
        queryClient.invalidateQueries({ queryKey: relocationKeys.moveDocuments(moveId) });
      }
    },
    onError: (error: unknown) => onError(errorMessage(error)),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => deleteMoveDocument(documentId),
    onSuccess: () => {
      if (moveId) {
        queryClient.invalidateQueries({ queryKey: relocationKeys.moveDocuments(moveId) });
      }
    },
    onError: (error: unknown) => onError(errorMessage(error)),
  });

  const chatProfile = useMemo(
    (): RelocationChatProfile => ({
      targetCountryCodes: input.targetCountryCodes,
      targetCountryNames: input.targetCountryNames,
      adults: input.adults,
      children: input.children,
      budgetMonthly: input.budgetMonthly,
      currency: input.currency,
      moveWindowStart: input.moveWindowStart,
      moveWindowEnd: input.moveWindowEnd,
      mustHaves: input.mustHaves,
    }),
    [
      input.targetCountryCodes,
      input.targetCountryNames,
      input.adults,
      input.children,
      input.budgetMonthly,
      input.currency,
      input.moveWindowStart,
      input.moveWindowEnd,
      input.mustHaves,
    ],
  );

  const chatMutation = useMutation({
    mutationFn: async (history: RelocationChatMessage[]) => {
      const context = buildRelocationChatContext({
        profile: chatProfile,
        livingCosts,
        requiredDocuments,
      });
      return askRelocationAssistant({
        moveId: moveId ?? undefined,
        context,
        messages: history,
      });
    },
    onSuccess: (answer) => {
      setChatMessages((current) => [...current, { role: "assistant", content: answer }]);
    },
    onError: (error: unknown) => {
      onError(errorMessage(error));
      // Yanıtsız kalan kullanıcı mesajı listede kalır; kullanıcı yeniden deneyebilir.
    },
  });

  // Fonksiyonel güncelleyici: iki çağrı aynı render'da gelirse ikincisi bayat
  // `chatMessages` üzerine yazardı. UI `isSending` ile engelliyor ama korumayı
  // state'in kendisine bağlamak daha sağlam.
  const sendChatMessage = useCallback(
    (text: string) => {
      setChatMessages((current) => {
        const next: RelocationChatMessage[] = [...current, { role: "user", content: text }];
        chatMutation.mutate(next);
        return next;
      });
    },
    [chatMutation],
  );

  const saveChatTranscript = useCallback(() => {
    if (chatMessages.length === 0) return;
    const content = chatMessages
      .map((m) => `${m.role === "user" ? "Siz" : "Asistan"}: ${m.content}`)
      .join("\n\n");
    saveDocumentMutation.mutate({
      title: `Asistan sohbeti — ${new Date().toLocaleDateString("tr-TR")}`,
      content,
      docType: "chat",
    });
  }, [chatMessages, saveDocumentMutation]);

  return {
    livingCosts,
    requiredDocuments,
    isContentLoading: livingCostsQuery.isLoading || requiredDocumentsQuery.isLoading,
    hasPlatformData: livingCosts.length > 0 || requiredDocuments.length > 0,

    doneDocumentKeys,
    toggleDocument: (documentId: string, isDone: boolean) =>
      progressMutation.mutate({ itemType: "required_document", itemKey: documentId, isDone }),
    isProgressSaving: progressMutation.isPending,

    savedDocuments: documentsQuery.data ?? [],
    isDocumentsLoading: documentsQuery.isLoading,
    deleteDocument: (documentId: string) => deleteDocumentMutation.mutate(documentId),
    saveDocument: saveDocumentMutation.mutate,

    chatMessages,
    isChatSending: chatMutation.isPending,
    sendChatMessage,
    saveChatTranscript,
  };
}
