// Relocation Tools — oturum yaşam döngüsü hook'u.
// ilk cevapta start → incremental save → complete. RPC'leri tek bir kuyrukta sarar.
// Sözleşme: docs/10tool/00 §"Ortak UX akışı".

import { useCallback, useRef, useState } from "react";
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

interface SaveProgressArgs {
  mode: ToolMode;
  questionKey: string;
  answer: ToolAnswerValue;
  sourceMoveId?: string;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Beklenmeyen hata";
}

/**
 * İlk cevapta oturum açılır ve her değişiklik sırayla kaydedilir. Final mutasyonu
 * bekleyen kayıtları tamamlar, bütün cevapları idempotent upsert eder ve skoru üretir.
 */
export function useRelocationToolSession({ toolKey, onError }: UseRelocationToolSessionArgs) {
  const [result, setResult] = useState<RelocationToolResultPayload | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startPromiseRef = useRef<Promise<string> | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const ensureSession = useCallback(async (mode: ToolMode, sourceMoveId?: string) => {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (!startPromiseRef.current) {
      startPromiseRef.current = startSession(toolKey, mode, sourceMoveId).then((session) => {
        sessionIdRef.current = session.session_id;
        setSessionId(session.session_id);
        return session.session_id;
      });
    }
    try {
      return await startPromiseRef.current;
    } finally {
      startPromiseRef.current = null;
    }
  }, [toolKey]);

  const saveProgress = useCallback(({ mode, questionKey, answer, sourceMoveId }: SaveProgressArgs) => {
    const operation = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const activeSessionId = await ensureSession(mode, sourceMoveId);
        await saveAnswer(activeSessionId, questionKey, answer);
      });
    saveQueueRef.current = operation;
    void operation.catch((error: unknown) => onError?.(errorMessage(error)));
  }, [ensureSession, onError]);

  const attachSession = useCallback((existingSessionId: string) => {
    sessionIdRef.current = existingSessionId;
    setSessionId(existingSessionId);
  }, []);

  const runMutation = useMutation({
    mutationFn: async ({ mode, answers, sourceMoveId }: RunArgs) => {
      await saveQueueRef.current;
      const activeSessionId = await ensureSession(mode, sourceMoveId);
      for (const [questionKey, value] of Object.entries(answers)) {
        await saveAnswer(activeSessionId, questionKey, value);
      }
      return completeSession(activeSessionId);
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
    sessionIdRef.current = null;
    startPromiseRef.current = null;
    saveQueueRef.current = Promise.resolve();
    runMutation.reset();
  }, [runMutation]);

  return {
    result,
    sessionId,
    isRunning: runMutation.isPending,
    run: runMutation.mutate,
    saveProgress,
    attachSession,
    reset,
  };
}
