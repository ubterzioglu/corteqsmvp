/**
 * KR04 sözleşmeleri: saat bandı + sayfa iskeleti.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. Saati elle UTC kaydırmasıyla hesaplamak — yaz saati geçişleri ülkeden
 *      ülkeye farklı tarihlerde olduğu için yılda iki kez bir saat yanlış
 *      gösterir ve hiçbir test/derleme bunu yakalamaz.
 *   2. Base64 görselin koda gömülmesi — 246 KB'lik kaynak HTML'in çoğu bu
 *      veridir; bundle'a girerse her sayfa yüklemesinde taşınır.
 *   3. `useSeo`'nun açık `deps` almaması (`use-seo-deps-contract.test.ts`).
 */
import { readFileSync } from "node:fs";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CareerClockBand from "@/components/career/CareerClockBand";
import { CAREER_CLOCK_CITIES, FOUNDER_LETTERS } from "@/components/career/career-content";

const sourceOf = (path: string) => readFileSync(path, "utf8");

describe("kariyer saat bandı", () => {
  it("8 şehri çizer ve İstanbul vurgulanır", () => {
    render(<CareerClockBand />);

    expect(CAREER_CLOCK_CITIES).toHaveLength(8);
    for (const city of CAREER_CLOCK_CITIES) {
      expect(screen.getByText(city.label)).toBeInTheDocument();
    }
    expect(CAREER_CLOCK_CITIES.filter((city) => city.primary)).toHaveLength(1);
  });

  it("her şehir geçerli bir IANA saat dilimi taşır", () => {
    for (const city of CAREER_CLOCK_CITIES) {
      expect(city.timeZone).toMatch(/^[A-Za-z]+\/[A-Za-z_]+$/);
      expect(() => new Intl.DateTimeFormat("tr-TR", { timeZone: city.timeZone })).not.toThrow();
    }
  });

  it("saat `Intl` ile hesaplanır — elle UTC kaydırması YOK", () => {
    const source = sourceOf("src/components/career/CareerClockBand.tsx");

    expect(source).toContain('new Intl.DateTimeFormat("tr-TR"');
    // Elle kaydırmanın tipik izleri: getTimezoneOffset, saat cinsinden sabit toplama.
    expect(source).not.toContain("getTimezoneOffset");
    expect(source).not.toMatch(/\+\s*\d+\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
    expect(source).not.toMatch(/utcOffset|offsetHours/);
  });

  it("biçimlendirme Türkçe yerel ayarla yapılır", () => {
    // `toLocaleTimeString()` yerelsiz çağrılırsa tarayıcı diline göre değişir;
    // gün adı İngilizce çıkar.
    const source = sourceOf("src/components/career/CareerClockBand.tsx");

    expect(source).not.toMatch(/toLocaleTimeString\(\)|toLocaleDateString\(\)/);
  });
});

describe("kariyer sayfa iskeleti", () => {
  it("kurucu fotoğrafları gerçek dosyadır, base64 DEĞİL", () => {
    const content = sourceOf("src/components/career/career-content.ts");

    expect(content).not.toContain("data:image");
    for (const letter of FOUNDER_LETTERS) {
      expect(letter.photo).toMatch(/^\/career\/[a-z-]+\.(jpg|png|webp)$/);
    }
  });

  it("sayfa yeni bölümleri kullanıyor ve `useSeo` açık deps alıyor", () => {
    const page = sourceOf("src/pages/Career.tsx");

    for (const component of ["CareerHero", "CareerClockBand", "FounderLetters", "ParticipationModels"]) {
      expect(page).toContain(`<${component} />`);
    }
    // opts sabit olduğu için açık boş dizi zorunlu — varsayılan deps ile SEO
    // ilk render'da donar.
    expect(page).toContain("useSeo(PAGE_SEO.career, [])");
  });

  it("mektup metinleri Türkçe harflerini korur", () => {
    const joined = FOUNDER_LETTERS.flatMap((letter) => [letter.name, ...letter.paragraphs]).join(" ");

    expect(joined).toContain("Umut Barış Terzioğlu");
    expect(joined).toContain("Burak Akçakanat");
    expect(joined).toContain("yapay zekâ");
  });
});
