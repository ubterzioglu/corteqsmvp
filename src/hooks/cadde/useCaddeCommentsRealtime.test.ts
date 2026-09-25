import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { useCaddeCommentsRealtime } from "./useCaddeCommentsRealtime";

describe("useCaddeCommentsRealtime", () => {
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
    const { useCaddeCommentsRealtime: hook } = await import("./useCaddeCommentsRealtime");
    renderHook(() => hook("post-1", false));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("postId=null iken abonelik açmaz", async () => {
    const { useCaddeCommentsRealtime: hook } = await import("./useCaddeCommentsRealtime");
    renderHook(() => hook(null, true));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("enabled=true ve postId var iken abonelik açar", async () => {
    const { useCaddeCommentsRealtime: hook } = await import("./useCaddeCommentsRealtime");
    renderHook(() => hook("post-1", true));
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it("hasNewComments başta false", async () => {
    const { useCaddeCommentsRealtime: hook } = await import("./useCaddeCommentsRealtime");
    const { result } = renderHook(() => hook("post-1", true));
    expect(result.current.hasNewComments).toBe(false);
  });

  it("reset() hasNewComments'ı false yapar", async () => {
    const { useCaddeCommentsRealtime: hook } = await import("./useCaddeCommentsRealtime");
    const { result } = renderHook(() => hook("post-1", true));
    act(() => result.current.reset());
    expect(result.current.hasNewComments).toBe(false);
  });

  it("unmount'ta kanal kaldırılır", async () => {
    const { useCaddeCommentsRealtime: hook } = await import("./useCaddeCommentsRealtime");
    const { unmount } = renderHook(() => hook("post-1", true));
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
