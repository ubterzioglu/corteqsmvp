/**
 * M19 · recommendations-api kaynak kilitleri (desen: events-first-approval.test.ts).
 * Kilitler: YAZMA YALNIZ RPC (doğrudan insert YOK) · userId istemciden GİTMEZ
 * (RPC auth.uid()) · hata resolveRecommendationRpcErrorMessage'den (düz nesne) ·
 * match RPC'si iletişim sızdırmayan M18 fonksiyonunu çağırır.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { createRecommendationInputSchema } from "@/lib/recommendations-schemas";

const API_SOURCE = "src/lib/recommendations-api.ts";
const apiSource = () => readFileSync(API_SOURCE, "utf8");

describe("M19 · yazma yalnız RPC (doğrudan insert YOK)", () => {
  it("createRecommendationRequest RPC çağırır, .insert ÇAĞIRMAZ", () => {
    const src = apiSource();
    expect(src).toContain('supabase.rpc("create_recommendation_request_v1" as never');
    expect(src).not.toMatch(/from\("recommendation_requests"[^)]*\)\s*\.insert/);
    expect(src).not.toMatch(/from\("recommendation_answers"[^)]*\)\s*\.insert/);
  });

  it("answerRecommendation RPC çağırır", () => {
    expect(apiSource()).toContain('supabase.rpc("answer_recommendation_v1" as never');
  });

  it("match RPC'si M18 fonksiyonunu çağırır (iletişim sızdırmayan)", () => {
    expect(apiSource()).toContain('supabase.rpc("match_recommendation_professionals" as never');
  });

  it("hatalar resolveRecommendationRpcErrorMessage'den geçer (düz nesne, instanceof YASAK)", () => {
    const src = apiSource();
    expect(src).toContain("resolveRecommendationRpcErrorMessage");
    expect(src).not.toContain("instanceof Error");
  });
});

describe("M19 · userId istemciden GİTMEZ (RPC auth.uid())", () => {
  it("CreateRecommendationInput şemasında userId/user alanı YOK", () => {
    const shape = createRecommendationInputSchema.shape;
    expect(Object.keys(shape)).not.toContain("userId");
    expect(Object.keys(shape)).not.toContain("user_id");
    expect(Object.keys(shape)).not.toContain("userid");
  });

  it("create payload'ında p_user_id YOK (auth.uid() sunucuda)", () => {
    const src = apiSource();
    const createFn = src.slice(
      src.indexOf("export async function createRecommendationRequest"),
      src.indexOf("export async function answerRecommendation"),
    );
    expect(createFn).not.toContain("p_user_id");
    expect(createFn).not.toContain("user_id:");
  });
});

describe("M19 · okuma herkese açık (doğrudan tablo select)", () => {
  it("liste/detay recommendation_requests/answers'tan select eder (RLS public read)", () => {
    const src = apiSource();
    expect(src).toContain('from("recommendation_requests" as never');
    expect(src).toContain('from("recommendation_answers" as never');
    expect(src).toContain(".select(");
  });

  it("PostgREST 1000 tavanı: liste .range ile sayfalanır", () => {
    expect(apiSource()).toContain(".range(");
  });
});
