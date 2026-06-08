import { describe, expect, it } from "vitest";

import {
  toCountryCode,
} from "@/lib/catalog-directory";

describe("catalog-directory", () => {
  it("maps known country labels and codes to catalog country filters", () => {
    expect(toCountryCode("Almanya")).toBe("DE");
    expect(toCountryCode("de")).toBe("DE");
    expect(toCountryCode("Fransa")).toBe("FR");
  });
});
