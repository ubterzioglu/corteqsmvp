/**
 * İnceleme W9 kilidi — useMatchedProfessionals ANONİMDE AÇILMAZ.
 * match_recommendation_professionals authenticated-only (M18 grant: anon
 * EXECUTE YOK); sayfa herkese açık olduğu için gate hook'ta: enabled
 * `!!requestId && !!user` + izin hatası retry EDİLMEZ (42501 × 4 fırtınası).
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let capturedOptions: Record<string, unknown> | null = null;
let mockUser: { id: string } | null = { id: "u1" };

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: Record<string, unknown>) => {
    capturedOptions = options;
    return { data: undefined, isLoading: false, isError: false };
  },
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/components/auth/useAuth", () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock("@/lib/recommendations-api", () => ({
  answerRecommendation: vi.fn(),
  createRecommendationRequest: vi.fn(),
  fetchRecommendationDetail: vi.fn(),
  fetchRecommendations: vi.fn(),
  matchRecommendationProfessionals: vi.fn(),
}));

import { useMatchedProfessionals } from "./use-recommendations";

describe("useMatchedProfessionals · anon gate (W9)", () => {
  beforeEach(() => {
    capturedOptions = null;
    mockUser = { id: "u1" };
  });

  it("girişli kullanıcıda sorgu açık", () => {
    renderHook(() => useMatchedProfessionals("req-1"));
    expect(capturedOptions?.enabled).toBe(true);
    expect(capturedOptions?.retry).toBe(false);
  });

  it("ANONİMDE sorgu HİÇ açılmaz (enabled=false — 42501 fırtınası yok)", () => {
    mockUser = null;
    renderHook(() => useMatchedProfessionals("req-1"));
    expect(capturedOptions?.enabled).toBe(false);
  });

  it("requestId boşken de kapalı", () => {
    renderHook(() => useMatchedProfessionals(""));
    expect(capturedOptions?.enabled).toBe(false);
  });
});
