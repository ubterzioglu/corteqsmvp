import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(file, "utf8");

describe("public asset sınırı", () => {
  it("dahili Stripe rehberini public kökten çıkarır ama arşivde korur", () => {
    expect(existsSync("public/burak-stripe-rehberi.html")).toBe(false);
    expect(existsSync("docs/archive/private/burak-stripe-rehberi.html")).toBe(true);
  });

  it("referanssız büyük videoları public dağıtımdan çıkarır", () => {
    for (const file of [
      "public/videos/footer-community.mp4",
      "public/landing-assets/hero-people.mp4",
      "public/landing-assets/earth-night.webm",
    ]) {
      expect(existsSync(file), file).toBe(false);
    }
  });

  it("tutulan büyük videoların üretim kodunda kullanım kanıtı vardır", () => {
    expect(read("src/components/home-trial/HeroNetworkSection.tsx")).toContain(
      "/landing-assets/hero-network.mp4",
    );
    expect(read("src/components/CorteqsWhatIsAccordion.tsx")).toContain("/whatmaskot.mp4");
    expect(read("src/components/HeroSection.tsx")).toContain("/herovideo.mp4");
    expect(read("src/pages/LoginPage.tsx")).toContain("/herovideo.mp4");
  });
});

