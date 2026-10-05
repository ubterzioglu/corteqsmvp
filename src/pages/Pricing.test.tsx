/**
 * Pricing sayfası sözleşme testi — CV/ilan görüntüleme satırları her tipte var.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Pricing — CV/ilan görüntüleme satırları", () => {
  it("her kullanıcı tipinde CV ve ilan satırları tanımlı olmalı", () => {
    const content = readFileSync(
      resolve(process.cwd(), "src/pages/Pricing.tsx"),
      "utf-8"
    );

    // Her 3 tipte de "CV görüntüleme" olmalı (6 kez: 3 freemium + 3 premium)
    const cvMatches = content.match(/CV görüntüleme/g);
    expect(cvMatches?.length).toBe(6);

    // Her 3 tipte de "iş ilanı görüntüleme" olmalı (6 kez: 3 freemium + 3 premium)
    const ilanMatches = content.match(/[İi]ş ilanı görüntüleme/g);
    expect(ilanMatches?.length).toBe(6);

    // Premium'da "Sınırsız iş ilanı görüntüleme" olmalı (3 kez)
    const sinirsizMatches = content.match(/Sınırsız iş ilanı görüntüleme/g);
    expect(sinirsizMatches?.length).toBe(3);

    // Freemium'da "5 ilan" sınırı olmalı (3 kez)
    const besIlanMatches = content.match(/5 ilan/g);
    expect(besIlanMatches?.length).toBe(3);
  });
});
