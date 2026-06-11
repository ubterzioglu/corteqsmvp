import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  isSupabaseConfigured: true,
  supabase: { from: (table: string) => fromMock(table) },
}));

import { listGeoCities } from "@/lib/geo";

type QueryResult = { data: unknown[]; error: null };

function makeCountryBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (resolve: (value: QueryResult) => void) => resolve(result);
  return builder;
}

function makeCityBuilder(allRows: Array<{ name: string; country_id: string; sort_order: number }>) {
  let rangeFrom = 0;
  let rangeTo = 0;
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  const rangeMock = vi.fn((from: number, to: number) => {
    rangeFrom = from;
    rangeTo = to;
    return builder;
  });
  builder.range = rangeMock;
  builder.then = (resolve: (value: QueryResult) => void) =>
    resolve({ data: allRows.slice(rangeFrom, rangeTo + 1), error: null });
  return { builder, rangeMock };
}

describe("listGeoCities pagination", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("fetches all pages when a country has more than 1000 cities", async () => {
    const countryRow = { id: "c1", code: "DE", name: "Almanya", sort_order: 10 };
    const cityRows = Array.from({ length: 2500 }, (_, index) => ({
      name: `Şehir ${index + 1}`,
      country_id: "c1",
      sort_order: (index + 1) * 10,
    }));

    const countryBuilder = makeCountryBuilder({ data: [countryRow], error: null });
    const { builder: cityBuilder, rangeMock } = makeCityBuilder(cityRows);

    fromMock.mockImplementation((table: string) =>
      table === "geo_countries" ? countryBuilder : cityBuilder,
    );

    const cities = await listGeoCities("Almanya");

    expect(cities).toHaveLength(2500);
    expect(rangeMock).toHaveBeenCalledTimes(3);
    expect(rangeMock).toHaveBeenNthCalledWith(1, 0, 999);
    expect(rangeMock).toHaveBeenNthCalledWith(2, 1000, 1999);
    expect(rangeMock).toHaveBeenNthCalledWith(3, 2000, 2999);
    expect(cities[0]).toEqual({ countryCode: "DE", countryName: "Almanya", name: "Şehir 1" });
    expect(cities[2499].name).toBe("Şehir 2500");
  });

  it("stops after a single page when the result is smaller than the page size", async () => {
    const countryRow = { id: "c2", code: "AT", name: "Avusturya", sort_order: 20 };
    const cityRows = Array.from({ length: 12 }, (_, index) => ({
      name: `City ${index + 1}`,
      country_id: "c2",
      sort_order: (index + 1) * 10,
    }));

    const countryBuilder = makeCountryBuilder({ data: [countryRow], error: null });
    const { builder: cityBuilder, rangeMock } = makeCityBuilder(cityRows);

    fromMock.mockImplementation((table: string) =>
      table === "geo_countries" ? countryBuilder : cityBuilder,
    );

    const cities = await listGeoCities("AT");

    expect(cities).toHaveLength(12);
    expect(rangeMock).toHaveBeenCalledTimes(1);
  });
});
