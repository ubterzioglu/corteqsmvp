import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
// eslint-disable-next-line no-control-regex -- Mojibake kontrolü C0/Latin-1 bayt aralığını bilerek tarar.
const suspiciousPatterns = [/\u00C3[\u0080-\u00BF]/u, /\u00C4[\u0080-\u00BF]/u, /\u00C5[\u0080-\u00BF]/u, /\u00E2\u20AC[\u0000-\u00FF]?/u, /\uFFFD/u];

/**
 * Profil yüzeyinin mojibake denetimine giren dizinler. `ProfilePage.tsx` tek
 * parçayken tek satır yeterliydi; yüzey modüllere bölündükçe (A07) taşınan
 * metin sessizce denetim dışında kalıyordu — bu liste o boşluğu kapatır.
 *
 * ⚠️ Buradaki doğrulama NEGATİFTİR ("şüpheli desen YOK"). Bir dosya listeden
 * çıkarsa test kırılmaz, yalnız daha azını denetler. Profil yüzeyine yeni bir
 * dizin eklenirse buraya da eklenmelidir.
 */
const PROFILE_SOURCE_DIRS = ["src/components/profile", "src/hooks/profile"] as const;

/** Bir dizin ağacındaki tüm `.ts`/`.tsx` dosyalarını proje köküne göreli döndürür. */
function collectProfileSources(relativeDir: string): string[] {
  const entries = readdirSync(path.join(projectRoot, relativeDir), { withFileTypes: true });

  return entries.flatMap((entry) => {
    const relativePath = `${relativeDir}/${entry.name}`;
    if (entry.isDirectory()) return collectProfileSources(relativePath);
    return /\.tsx?$/.test(entry.name) ? [relativePath] : [];
  });
}

describe("profile text health", () => {
  it("keeps Turkish profile page copy readable", () => {
    const profilePageSource = readFileSync(path.join(projectRoot, "src/pages/ProfilePage.tsx"), "utf8");
    // Sosyal medya placeholder metinleri 2026-09-13 bölünmesinde bu modüle taşındı;
    // aynı üç dize aynı şekilde denetlenir, yalnız kaynak dosya değişti.
    const socialLinksSource = readFileSync(path.join(projectRoot, "src/lib/profile-social-links.ts"), "utf8");

    expect(socialLinksSource).toContain("@kullanıcıadı veya tam URL");
    expect(socialLinksSource).toContain("@kullanıcıadı");
    expect(socialLinksSource).toContain("u/kullanıcıadı veya URL");
    expect(suspiciousPatterns.some((pattern) => pattern.test(socialLinksSource))).toBe(false);
    expect(suspiciousPatterns.some((pattern) => pattern.test(profilePageSource))).toBe(false);
  });

  it("keeps Turkish copy readable across the whole profile module tree", () => {
    const sources = PROFILE_SOURCE_DIRS.flatMap((dir) => collectProfileSources(dir));

    // Ağ boşsa test sessizce geçerdi; taramanın gerçekten dosya bulduğunu kanıtla.
    expect(sources.length).toBeGreaterThan(20);

    const damaged = sources.filter((relativePath) => {
      const source = readFileSync(path.join(projectRoot, relativePath), "utf8");
      return suspiciousPatterns.some((pattern) => pattern.test(source));
    });

    // Kırılınca hangi dosya olduğu görünsün diye dosya listesi karşılaştırılır.
    expect(damaged).toEqual([]);
  });

  it("keeps bireysel role description readable in shared role metadata", () => {
    const profileTypesSource = readFileSync(path.join(projectRoot, "src/lib/profile-types.ts"), "utf8");

    expect(profileTypesSource).toContain("Hizmet almak, etkinliklere katılmak ve diaspora ağınızı keşfetmek için");
    expect(suspiciousPatterns.some((pattern) => pattern.test(profileTypesSource))).toBe(false);
  });
});
