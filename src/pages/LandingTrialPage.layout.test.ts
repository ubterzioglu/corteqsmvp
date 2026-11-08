/**
 * Ana sayfa bölüm SIRASI sözleşmesi (L5).
 *
 * Arama bölümü Lovable düzenindeki gibi hero'nun HEMEN altında durur ve `Reveal`
 * ile sarılmaz (eşik %20 / rootMargin -%10 → 1440×900'de ilk ekranda bölüm boş
 * kalıyordu). Sayfayı render etmek 10 bölümü ve ağ çağrılarını çeker; sıra
 * kaynak metinden (yorumlardan arındırılmış) denetlenir.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { stripSourceComments } from "@/test/strip-source-comments";

const source = stripSourceComments(readFileSync("src/pages/LandingTrialPage.tsx", "utf8"));

describe("LandingTrialPage bölüm sırası", () => {
  it("arama bölümü hero'dan HEMEN sonra gelir", () => {
    expect(source).toMatch(/<HeroNetworkSection \/>\s*<DiasporaSearchSection \/>/);
  });

  it("arama bölümü Reveal ile sarılmaz", () => {
    expect(source).not.toMatch(/<Reveal[^>]*>\s*<DiasporaSearchSection/);
  });

  it("manifesto, aramadan SONRA gelir", () => {
    expect(source.indexOf("<DiasporaSearchSection")).toBeGreaterThan(-1);
    expect(source.indexOf("<ManifestoSection")).toBeGreaterThan(source.indexOf("<DiasporaSearchSection"));
  });
});
