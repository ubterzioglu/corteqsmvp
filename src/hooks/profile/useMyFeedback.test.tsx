import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useAuthMock, fetchMyFeedbackMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  fetchMyFeedbackMock: vi.fn(),
}));

vi.mock("@/components/auth/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/lib/feedback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feedback")>();
  return { ...actual, fetchMyFeedback: fetchMyFeedbackMock };
});

import { myFeedbackKeys, useMyFeedback } from "@/hooks/profile/useMyFeedback";

function wrapperFor(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMyFeedbackMock.mockResolvedValue([]);
});

describe("useMyFeedback — kullanıcıya özel önbellek", () => {
  it("anahtar kullanıcı başına farklıdır", () => {
    expect(myFeedbackKeys.mine("a")).toEqual(["my-feedback", "a"]);
    expect(myFeedbackKeys.mine("a")).not.toEqual(myFeedbackKeys.mine("b"));
  });

  it("oturum yoksa sorgu çalışmaz", () => {
    useAuthMock.mockReturnValue({ user: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(() => useMyFeedback(), { wrapper: wrapperFor(client) });

    expect(fetchMyFeedbackMock).not.toHaveBeenCalled();
  });

  it("aynı QueryClient'ta hesap değişince önceki hesabın önbelleği kullanılmaz", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    fetchMyFeedbackMock.mockResolvedValueOnce([
      { id: "1", body: "A'nın notu", pagePath: "/", status: "yeni", createdAt: "2026-11-01T00:00:00.000Z" },
    ]);
    useAuthMock.mockReturnValue({ user: { id: "a" } });
    const first = renderHook(() => useMyFeedback(), { wrapper: wrapperFor(client) });
    await waitFor(() => expect(first.result.current.query.data).toHaveLength(1));
    first.unmount();

    fetchMyFeedbackMock.mockResolvedValueOnce([]);
    useAuthMock.mockReturnValue({ user: { id: "b" } });
    const second = renderHook(() => useMyFeedback(), { wrapper: wrapperFor(client) });

    expect(second.result.current.query.data).toBeUndefined();
    await waitFor(() => expect(second.result.current.query.data).toEqual([]));
    expect(client.getQueryData(myFeedbackKeys.mine("a"))).toHaveLength(1);
  });
});
