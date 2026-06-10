import { describe, expect, it } from "vitest";

import {
  formatLocationLabel,
  getInitials,
  resolveProfileAccent,
  toMapHref,
  toSafeExternalUrl,
  toSafeMailHref,
  toSafePhoneHref,
} from "./public-profile-utils";

describe("toSafeExternalUrl", () => {
  it("accepts https URLs", () => {
    expect(toSafeExternalUrl("https://corteqs.net/profil")).toBe("https://corteqs.net/profil");
  });

  it("accepts http URLs", () => {
    expect(toSafeExternalUrl("http://example.com")).toBe("http://example.com/");
  });

  it("rejects javascript URLs", () => {
    expect(toSafeExternalUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects data URLs", () => {
    expect(toSafeExternalUrl("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
  });

  it("rejects relative and malformed values", () => {
    expect(toSafeExternalUrl("/relative/path")).toBeNull();
    expect(toSafeExternalUrl("not a url")).toBeNull();
    expect(toSafeExternalUrl(null)).toBeNull();
    expect(toSafeExternalUrl(undefined)).toBeNull();
  });
});

describe("toSafePhoneHref", () => {
  it("normalizes phone values into tel hrefs", () => {
    expect(toSafePhoneHref("+49 (231) 818-687")).toBe("tel:+49231818687");
  });

  it("returns null when no digits remain", () => {
    expect(toSafePhoneHref("yok")).toBeNull();
    expect(toSafePhoneHref("")).toBeNull();
    expect(toSafePhoneHref(null)).toBeNull();
  });
});

describe("toSafeMailHref", () => {
  it("returns mailto for valid addresses", () => {
    expect(toSafeMailHref(" info@corteqs.net ")).toBe("mailto:info@corteqs.net");
  });

  it("rejects invalid addresses", () => {
    expect(toSafeMailHref("not-an-email")).toBeNull();
    expect(toSafeMailHref("a@b")).toBeNull();
    expect(toSafeMailHref(null)).toBeNull();
  });
});

describe("toMapHref", () => {
  it("encodes the query", () => {
    expect(toMapHref(["Hansastraße 1", "Dortmund", "Almanya"])).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Hansastraße 1, Dortmund, Almanya")}`,
    );
  });

  it("returns null when all parts are empty", () => {
    expect(toMapHref([null, undefined, " "])).toBeNull();
  });
});

describe("getInitials", () => {
  it("uses the first letters of the first two words", () => {
    expect(getInitials("Arkin Kara")).toBe("AK");
  });

  it("uses two letters for single-word titles", () => {
    expect(getInitials("CorteQS")).toBe("CO");
  });

  it("upper-cases Turkish characters correctly", () => {
    expect(getInitials("ışık ızgara")).toBe("II");
    expect(getInitials("inci yıldız")).toBe("İY");
  });

  it("falls back for empty titles", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials(null)).toBe("?");
  });
});

describe("resolveProfileAccent", () => {
  it("is deterministic for the same seed", () => {
    expect(resolveProfileAccent("Healthcare_Doctor")).toBe(resolveProfileAccent("Healthcare_Doctor"));
  });

  it("falls back to blue without a seed", () => {
    expect(resolveProfileAccent(null)).toBe("blue");
    expect(resolveProfileAccent(undefined)).toBe("blue");
  });
});

describe("formatLocationLabel", () => {
  it("joins city and country label", () => {
    expect(formatLocationLabel("Dortmund", "Almanya", "DE")).toBe("Dortmund • Almanya");
  });

  it("falls back to the country code when no label exists", () => {
    expect(formatLocationLabel("Dortmund", null, "DE")).toBe("Dortmund • DE");
  });

  it("returns null when nothing is available", () => {
    expect(formatLocationLabel(null, null, null)).toBeNull();
  });
});
