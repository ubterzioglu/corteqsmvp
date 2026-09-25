import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: rpcMock, from: vi.fn() },
}));

import { getChecklist, getCityRecommendations, getServiceRecommendations } from "@/lib/relocation-api";

describe("relocation-api — RPC dönüşleri API sınırında normalize edilir", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("getCityRecommendations: explanations içermeyen canlı satırı [] ile döndürür", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          entity_id: "l1",
          country_code: "DE",
          city_code: "BER",
          title: "Berlin",
          hard_filter_pass: true,
          rule_score: 0.6,
          final_score: 0.6,
          score_breakdown: { budget_fit: 0.5 },
          source_quality: { official_sources_ratio: 0, freshness_hours: null },
        },
      ],
      error: null,
    });

    const rows = await getCityRecommendations("m1");

    expect(rpcMock).toHaveBeenCalledWith("relocation_rank_locations_v1", { p_move_id: "m1" });
    expect(rows[0].explanations).toEqual([]);
    expect(rows[0].score_breakdown.flight_access).toBe(0);
  });

  it("getCityRecommendations: data null ise boş liste", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    await expect(getCityRecommendations("m1")).resolves.toEqual([]);
  });

  it("getServiceRecommendations: languages eksikse []", async () => {
    rpcMock.mockResolvedValue({
      data: [{ id: "s1", provider_name: "Vodafone", category: "gsm_operator" }],
      error: null,
    });
    const rows = await getServiceRecommendations("m1", "gsm_operator");
    expect(rows[0].languages).toEqual([]);
  });

  it("getChecklist: belge listeleri eksikse []", async () => {
    rpcMock.mockResolvedValue({
      data: [{ id: "b1", name: "Anmeldung", trigger: "after_arrival", sort_order: 1 }],
      error: null,
    });
    const rows = await getChecklist("m1");
    expect(rows[0].required_documents).toEqual([]);
    expect(rows[0].output_artifacts).toEqual([]);
  });

  it("RPC hatasını olduğu gibi fırlatır (normalizasyon hatayı yutmaz)", async () => {
    const rpcError = { message: "permission denied", code: "42501" };
    rpcMock.mockResolvedValue({ data: null, error: rpcError });
    await expect(getCityRecommendations("m1")).rejects.toBe(rpcError);
  });
});
