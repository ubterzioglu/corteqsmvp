import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatCurrencySummary,
  formatDateTR,
  safeMuhasebeHref,
  toIsoDate,
} from "@/lib/muhasebe-format";

describe("muhasebe format helpers", () => {
  it("formats currency with Turkish number separators and optional code", () => {
    expect(formatCurrency(12345.5, "TRY", { showCode: true })).toBe("12.345,50 TRY");
  });

  it("formats multi-currency summaries and hides zero totals by default", () => {
    expect(
      formatCurrencySummary({
        TRY: 1250,
        USD: 300,
        EUR: 0,
        GBP: 0,
        QAR: 0,
      }),
    ).toBe("TRY: 1.250,00 TRY · USD: 300,00 USD");
  });

  it("formats valid ISO dates for tr-TR and leaves invalid input unchanged", () => {
    expect(formatDateTR("2026-04-22")).toBe("22.04.2026");
    expect(formatDateTR("not-a-date")).toBe("not-a-date");
  });

  it("serializes a Date to a local ISO date string", () => {
    expect(toIsoDate(new Date(2026, 3, 22))).toBe("2026-04-22");
  });

  it("only allows http and https hrefs for stored accounting links", () => {
    expect(safeMuhasebeHref(" https://corteqs.net/fatura ")).toBe("https://corteqs.net/fatura");
    expect(safeMuhasebeHref("javascript:alert(1)")).toBeNull();
  });
});
