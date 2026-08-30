import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRelocationToolSession } from "@/hooks/useRelocationToolSession";
import {
  completeSession,
  recordEvent,
  saveAnswer,
  startSession,
} from "@/lib/relocation-tools-api";

vi.mock("@/lib/relocation-tools-api", () => ({
  completeSession: vi.fn(),
  recordEvent: vi.fn(),
  saveAnswer: vi.fn(),
  startSession: vi.fn(),
}));

const startMock = vi.mocked(startSession);
const saveMock = vi.mocked(saveAnswer);
const completeMock = vi.mocked(completeSession);
const eventMock = vi.mocked(recordEvent);

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

describe("useRelocationToolSession", () => {
  beforeEach(() => {
    startMock.mockReset();
    saveMock.mockReset();
    completeMock.mockReset();
    eventMock.mockReset();
    startMock.mockResolvedValue({ session_id: "session-1", tool_key: "test-tool", mode: "detailed" });
    saveMock.mockResolvedValue(undefined);
    eventMock.mockResolvedValue(undefined);
    completeMock.mockResolvedValue({
      result_id: "result-1",
      tool_key: "test-tool",
      result_kind: "score",
      total_score: 80,
      score_bucket: "ready",
      primary_result: {},
      sub_scores: {},
      recommendations: [],
      explanations: [],
      ctas: [],
      location_snapshot: null,
    });
  });

  it("ilk cevapta tek session açar, finalde aynı session'ı kullanır", async () => {
    const { result } = renderHook(
      () => useRelocationToolSession({ toolKey: "test-tool" }),
      { wrapper },
    );

    act(() => {
      result.current.saveProgress({ mode: "detailed", questionKey: "q1", answer: "a" });
    });
    await waitFor(() => expect(saveMock).toHaveBeenCalledWith("session-1", "q1", "a"));

    act(() => {
      result.current.run({ mode: "detailed", answers: { q1: "a", q2: 3 } });
    });
    await waitFor(() => expect(result.current.result?.result_id).toBe("result-1"));

    expect(startMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith("session-1", "q2", 3);
    expect(completeMock).toHaveBeenCalledWith("session-1");
  });

  it("resume edilen session için yeni session açmaz", async () => {
    const { result } = renderHook(
      () => useRelocationToolSession({ toolKey: "test-tool" }),
      { wrapper },
    );

    act(() => {
      result.current.attachSession("existing-session");
      result.current.saveProgress({ mode: "detailed", questionKey: "q2", answer: true });
    });

    await waitFor(() => expect(saveMock).toHaveBeenCalledWith("existing-session", "q2", true));
    expect(startMock).not.toHaveBeenCalled();
  });
});
