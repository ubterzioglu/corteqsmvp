import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  isSupabaseConfigured: false,
  supabase: {},
}));

describe("geo fallback helpers", () => {
  it("returns generated country seeds when supabase is unavailable", async () => {
    const { listGeoCountries } = await import("@/lib/geo");

    const countries = await listGeoCountries();

    expect(countries.length).toBeGreaterThan(200);
    expect(countries.some((country) => country.name === "Türkiye")).toBe(true);
    expect(countries.some((country) => country.name === "ABD")).toBe(true);
  });

  it("returns fallback Turkish city options for Türkiye", async () => {
    const { listGeoCities } = await import("@/lib/geo");

    const cities = await listGeoCities("Türkiye");

    expect(cities.some((city) => city.name === "İstanbul")).toBe(true);
    expect(cities.some((city) => city.name === "Adana")).toBe(true);
  });
});
