// Relocation Tools — oturum yaşam döngüsü hook'u.
// start (lazy) → save answers → complete. Lokal cevap state'i tutar; RPC'leri sarar.
// Sözleşme: docs/10tool/00 §"Ortak UX akışı".

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  completeSession,
  recordEvent,
  saveAnswer,
  startSession,
} from "@/lib/relocation-tools-api";
import type {
  RelocationToolResultPayload,
  ToolAnswerValue,
  ToolMode,
} from "@/lib/relocation-tools-types";

interface UseRelocationToolSessionArgs {
  toolKey: string;
  onError?: (message: string) => void;
}

interface RunArgs {
  mode: ToolMode;
  answers: Record<string, ToolAnswerValue>;
  sourceMoveId?: string;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Beklenmeyen hata";
}

/**
 * Tüm akışı tek mutasyonda yürütür: start → her cevabı save → complete.
 * Cevaplar generic stepper'dan toplu gelir; resumable senaryolar için ileride
 * incremental save eklenebilir (answers tablosu zaten upsert destekler).
 */
export function useRelocationToolSession({ toolKey, onError }: UseRelocationToolSessionArgs) {
  const [result, setResult] = useState<RelocationToolResultPayload | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const runMutation = useMutation({
    mutationFn: async ({ mode, answers, sourceMoveId }: RunArgs) => {
      const session = await startSession(toolKey, mode, sourceMoveId);
      setSessionId(session.session_id);
      for (const [questionKey, value] of Object.entries(answers)) {
        await saveAnswer(session.session_id, questionKey, value);
      }
      return completeSession(session.session_id);
    },
    onSuccess: (payload) => {
      setResult(payload);
      void recordEvent(null, "result_view", { tool_key: toolKey }).catch(() => {
        /* analitik kritik değil */
      });
    },
    onError: (err: unknown) => onError?.(errorMessage(err)),
  });

  const reset = useCallback(() => {
    setResult(null);
    setSessionId(null);
    runMutation.reset();
  }, [runMutation]);

  return {
    result,
    sessionId,
    isRunning: runMutation.isPending,
    run: runMutation.mutate,
    reset,
  };
}
