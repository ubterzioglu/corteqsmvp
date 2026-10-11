import { describe, expect, it } from "vitest";

import { isPrerenderUserAgent } from "./prerender-agent";

describe("isPrerenderUserAgent", () => {
  it("prerender.io renderer'ını tanır", () => {
    expect(
      isPrerenderUserAgent(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36 Prerender (+https://github.com/prerender/prerender)",
      ),
    ).toBe(true);
    expect(isPrerenderUserAgent("Mozilla/5.0 HeadlessChrome/131.0.0.0")).toBe(true);
  });

  it("gerçek tarayıcıyı ve botun kendisini prerender saymaz", () => {
    expect(
      isPrerenderUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      ),
    ).toBe(false);
    // Bot HTML'i prerender'dan alır; botun kendi UA'sı tarayıcıda hiç koşmaz.
    expect(isPrerenderUserAgent("GPTBot/1.2")).toBe(false);
    expect(isPrerenderUserAgent("")).toBe(false);
    expect(isPrerenderUserAgent(null)).toBe(false);
  });
});
