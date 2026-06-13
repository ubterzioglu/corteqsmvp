import { describe, expect, it } from "vitest";

import { buildQueries } from "./queries.js";
import type { ProfessionTemplate, ServiceFinderJob } from "./schemas.js";

function makeJob(overrides: Partial<ServiceFinderJob> = {}): ServiceFinderJob {
  return {
    id: "job-1",
    title: "Dortmund Türkçe konuşan doktorlar",
    status: "running",
    role_key: "Healthcare_Doctor",
    item_type: "advisor",
    category_slug: "advisor-healthcare-doctor",
    template_id: "tpl-1",
    search_provider_id: null,
    extract_provider_id: null,
    classifier_provider_id: null,
    location_label: "Dortmund, Nordrhein-Westfalen, Germany",
    country_code: "DE",
    region: "Nordrhein-Westfalen",
    city: "Dortmund",
    language_code: "tr",
    freeform_topic: null,
    must_include_terms: [],
    must_exclude_terms: [],
    seed_queries: [],
    max_queries: 12,
    max_source_urls: 40,
    max_extract_urls: 25,
    max_candidates: 100,
    soft_cap_usd: 1.5,
    hard_cap_usd: 3,
    cost_total_usd: 0,
    attempts: 1,
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<ProfessionTemplate> = {}): ProfessionTemplate {
  return {
    id: "tpl-1",
    template_key: "healthcare-doctor",
    label: "Doktor",
    role_key: "Healthcare_Doctor",
    item_type: "advisor",
    category_slug: "advisor-healthcare-doctor",
    language_terms: ["Türkçe", "Türkisch"],
    location_terms: [],
    must_include_terms: [],
    must_exclude_terms: [],
    query_templates: ["türkischer Arzt {{city}}", "{{language_term}} doktor {{city}}"],
    ...overrides,
  };
}

describe("buildQueries", () => {
  it("şablon kalıplarındaki yer tutucuları doldurur", () => {
    const queries = buildQueries(makeJob(), makeTemplate());
    expect(queries).toContain("türkischer Arzt Dortmund");
    expect(queries).toContain("Türkçe doktor Dortmund");
  });

  it("seed sorguları şablon sorgularından önce gelir", () => {
    const queries = buildQueries(
      makeJob({ seed_queries: ["özel sorgu {{city}}"] }),
      makeTemplate(),
    );
    expect(queries[0]).toBe("özel sorgu Dortmund");
  });

  it("max_queries sınırını aşmaz", () => {
    const queries = buildQueries(makeJob({ max_queries: 2 }), makeTemplate());
    expect(queries.length).toBeLessThanOrEqual(2);
  });

  it("aynı sorguyu tekrarlamaz (büyük/küçük harf duyarsız)", () => {
    const queries = buildQueries(
      makeJob({ seed_queries: ["türkischer Arzt Dortmund", "TÜRKISCHER ARZT DORTMUND"] }),
      makeTemplate(),
    );
    const lowered = queries.map((query) => query.toLowerCase());
    expect(new Set(lowered).size).toBe(lowered.length);
  });

  it("şablonsuz işte varsayılan kalıplar kullanılır", () => {
    const queries = buildQueries(makeJob({ freeform_topic: "kardiyolog" }), null);
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.some((query) => query.includes("kardiyolog"))).toBe(true);
  });

  it("şehir yoksa location_label kullanılır", () => {
    const queries = buildQueries(makeJob({ city: null }), makeTemplate());
    expect(queries.some((query) => query.includes("Dortmund, Nordrhein-Westfalen, Germany"))).toBe(true);
  });
});
