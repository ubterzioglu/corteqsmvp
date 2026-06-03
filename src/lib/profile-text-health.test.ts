import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const suspiciousPatterns = [/\u00C3[\u0080-\u00BF]/u, /\u00C4[\u0080-\u00BF]/u, /\u00C5[\u0080-\u00BF]/u, /\u00E2\u20AC[\u0000-\u00FF]?/u, /\uFFFD/u];

describe("profile text health", () => {
  it("keeps Turkish profile page copy readable", () => {
    const profilePageSource = readFileSync(path.join(projectRoot, "src/pages/ProfilePage.tsx"), "utf8");

    expect(profilePageSource).toContain("@kullanıcıadı veya tam URL");
    expect(profilePageSource).toContain("@kullanıcıadı");
    expect(profilePageSource).toContain("u/kullanıcıadı veya URL");
    expect(suspiciousPatterns.some((pattern) => pattern.test(profilePageSource))).toBe(false);
  });

  it("keeps bireysel role description readable in shared role metadata", () => {
    const profileTypesSource = readFileSync(path.join(projectRoot, "src/lib/profile-types.ts"), "utf8");

    expect(profileTypesSource).toContain("Hizmet almak, etkinliklere katılmak ve diaspora ağınızı keşfetmek için");
    expect(suspiciousPatterns.some((pattern) => pattern.test(profileTypesSource))).toBe(false);
  });
});
