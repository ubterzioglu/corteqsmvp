import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockMaybeSingle, mockFrom, mockChain } = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle,
  };
  const mockFrom = vi.fn().mockReturnValue(mockChain);
  return { mockMaybeSingle, mockFrom, mockChain };
});

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ isLoading: false }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));
vi.mock("@/lib/member-catalog", () => ({
  listMemberCatalogNames: vi.fn().mockResolvedValue(new Map([["user-abc", "Ayşe Demir"]])),
}));

import { usePublicIndividualProfile } from "./usePublicIndividualProfile";

describe("usePublicIndividualProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(mockChain);
    mockChain.select.mockReturnThis();
    mockChain.eq.mockReturnThis();
  });

  it("returns isLoading=false and details=null when targetUserId is undefined", async () => {
    const { result } = renderHook(() => usePublicIndividualProfile(undefined));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.details).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it("returns details=null when no individual_profile_details row exists", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const { result } = renderHook(() => usePublicIndividualProfile("user-abc"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.details).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it("maps and returns details when row exists", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        user_id: "user-abc",
        tagline: "Yazılım mühendisi",
        visibility_status: "open",
        presence_status: "online",
        follower_count: 12,
        following_count: 5,
        event_count: 3,
        front_card: null,
        detail_card: null,
        control_panel: null,
        profile_settings: null,
      },
      error: null,
    });

    const { result } = renderHook(() => usePublicIndividualProfile("user-abc"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.details).not.toBeNull();
    expect(result.current.details?.displayName).toBe("Ayşe Demir");
    expect(result.current.details?.tagline).toBe("Yazılım mühendisi");
    expect(result.current.details?.followerCount).toBe(12);
  });

  it("sets errorMessage when the DB query fails", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: "permission denied" } });

    const { result } = renderHook(() => usePublicIndividualProfile("user-abc"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.errorMessage).toBe("permission denied");
    expect(result.current.details).toBeNull();
  });
});
