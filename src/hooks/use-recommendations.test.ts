/**
 * İnceleme W9 + F10 kilitleri — use-recommendations hook sözleşmesi.
 *
 *   W9: useMatchedProfessionals ANONİMDE AÇILMAZ. match_recommendation_
 *   professionals authenticated-only (M18 grant: anon EXECUTE YOK); sayfa
 *   herkese açık olduğu için gate hook'ta: enabled `!!requestId && !!user` +
 *   izin hatası retry EDİLMEZ (42501 × 4 fırtınası).
 *
 *   F10: App.tsx'teki QueryClient ÇIPLAK (defaultOptions yok → staleTime 0 +
 *   refetchOnWindowFocus true). Açık pencere taşımayan her sorgu HER sekme
 *   odağında yeniden çekilir (cadde-query-cache B4 dersi) — match RPC tam
 *   üye kataloğunu tarar. Bu test HER sorgunun açık staleTime taşıdığını
 *   kilitler (staleTime'sız sorgu eklenirse düşer).
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const capturedOptions: Array<Record<string, unknown>> = [];
let mockUser: { id: string } | null = { id: "u1" };

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: Record<string, unknown>) => {
    capturedOptions.push(options);
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

import {
  useMatchedProfessionals,
  useRecommendationDetail,
  useRecommendations,
} from "./use-recommendations";

const lastOptions = () => capturedOptions[capturedOptions.length - 1];

describe("useMatchedProfessionals · anon gate (W9)", () => {
  beforeEach(() => {
    capturedOptions.length = 0;
    mockUser = { id: "u1" };
  });

  it("girişli kullanıcıda sorgu açık + izin hatası retry edilmez", () => {
    renderHook(() => useMatchedProfessionals("req-1"));
    expect(lastOptions().enabled).toBe(true);
    expect(lastOptions().retry).toBe(false);
  });

  it("ANONİMDE sorgu HİÇ açılmaz (enabled=false — 42501 fırtınası yok)", () => {
    mockUser = null;
    renderHook(() => useMatchedProfessionals("req-1"));
    expect(lastOptions().enabled).toBe(false);
  });

  it("requestId boşken de kapalı", () => {
    renderHook(() => useMatchedProfessionals(""));
    expect(lastOptions().enabled).toBe(false);
  });
});

describe("F10 · her sorgu açık staleTime taşır (çıplak QueryClient dersi)", () => {
  beforeEach(() => {
    capturedOptions.length = 0;
    mockUser = { id: "u1" };
  });

  it("liste/detay/eşleşme — üçü de staleTime'lı (odak fırtınası yok)", () => {
    renderHook(() => {
      useRecommendations({ status: "open" });
      useRecommendationDetail("req-1");
      useMatchedProfessionals("req-1");
    });

    expect(capturedOptions).toHaveLength(3);
    for (const options of capturedOptions) {
      expect(typeof options.staleTime, JSON.stringify(options.queryKey)).toBe("number");
      expect(options.staleTime as number).toBeGreaterThan(0);
    }
  });

  it("eşleşme sorgusu liste/detaydan UZUN pencere taşır (tam katalog taraması)", () => {
    renderHook(() => {
      useRecommendations({ status: "open" });
      useMatchedProfessionals("req-1");
    });
    const list = capturedOptions[0].staleTime as number;
    const match = capturedOptions[1].staleTime as number;
    expect(match).toBeGreaterThan(list);
  });
});
