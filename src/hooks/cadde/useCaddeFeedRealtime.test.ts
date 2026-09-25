import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { useCaddeFeedRealtime } from "./useCaddeFeedRealtime";

describe("useCaddeFeedRealtime", () => {
  let mockSubscribe: ReturnType<typeof vi.fn>;
  let mockRemoveChannel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSubscribe = vi.fn();
    mockRemoveChannel = vi.fn();
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: mockSubscribe,
    };
    vi.doMock("@/integrations/supabase/client", () => ({
      supabase: {
        channel: vi.fn(() => mockChannel),
        removeChannel: mockRemoveChannel,
      },
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("enabled=false iken abonelik açmaz", async () => {
    const { useCaddeFeedRealtime: hook } = await import("./useCaddeFeedRealtime");
    renderHook(() => hook(false));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("enabled=true iken abonelik açar", async () => {
    const { useCaddeFeedRealtime: hook } = await import("./useCaddeFeedRealtime");
    renderHook(() => hook(true));
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it("hasNewPosts başta false", async () => {
    const { useCaddeFeedRealtime: hook } = await import("./useCaddeFeedRealtime");
    const { result } = renderHook(() => hook(true));
    expect(result.current.hasNewPosts).toBe(false);
  });

  it("reset() hasNewPosts'ı false yapar", async () => {
    const { useCaddeFeedRealtime: hook } = await import("./useCaddeFeedRealtime");
    const { result } = renderHook(() => hook(true));
    act(() => result.current.reset());
    expect(result.current.hasNewPosts).toBe(false);
  });

  it("unmount'ta kanal kaldırılır", async () => {
    const { useCaddeFeedRealtime: hook } = await import("./useCaddeFeedRealtime");
    const { unmount } = renderHook(() => hook(true));
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
