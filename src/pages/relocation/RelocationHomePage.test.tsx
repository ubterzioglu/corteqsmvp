// Revizyon 2b1c1960: sayfa relocation_locations'tan gelen ISO kodlarını
// `{ code, label: code }` olarak sihirbaza veriyordu; ekranda "DE"/"GB"/"US" yazıyordu.
// buildCountryOptions artık kodu geo_countries adıyla etiketler — DEĞER kod kalır.

import { describe, expect, it } from "vitest";

import { buildCountryOptions } from "@/lib/relocation-country-options";
import type { GeoCountry } from "@/lib/geo";

const COUNTRIES: GeoCountry[] = [
  { code: "DE", name: "Almanya" },
  { code: "GB", name: "İngiltere" },
  { code: "US", name: "ABD" },
  { code: "NL", name: "Hollanda" },
];

describe("buildCountryOptions", () => {
  it("ISO kodunu ülke adıyla etiketler, değeri kod olarak bırakır", () => {
    expect(buildCountryOptions(["DE", "NL"], COUNTRIES)).toEqual([
      { code: "DE", label: "Almanya" },
      { code: "NL", label: "Hollanda" },
    ]);
  });

  it("katalogda karşılığı olmayan kodu düşürmez, kodu etiket olarak kullanır", () => {
    expect(buildCountryOptions(["ZZ"], COUNTRIES)).toEqual([{ code: "ZZ", label: "ZZ" }]);
  });

  it("etiketleri Türkçe alfabe sırasına göre sıralar", () => {
    const labels = buildCountryOptions(["US", "DE", "GB"], COUNTRIES).map((opt) => opt.label);
    // Türkçe sırada "İngiltere" ("I" sonrası) "Almanya"dan sonra gelir; bare localeCompare
    // İngilizce'de "İngiltere"yi yanlış yere koyardı.
    expect(labels).toEqual(["ABD", "Almanya", "İngiltere"]);
  });

  it("tekrarlanan ve boş kodları temizler", () => {
    expect(buildCountryOptions(["DE", " DE ", "", "  "], COUNTRIES)).toEqual([
      { code: "DE", label: "Almanya" },
    ]);
  });

  it("ülke kataloğu henüz yüklenmediyse kodları kaybetmez", () => {
    expect(buildCountryOptions(["DE", "NL"], [])).toEqual([
      { code: "DE", label: "DE" },
      { code: "NL", label: "NL" },
    ]);
  });
});
