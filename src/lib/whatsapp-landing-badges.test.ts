/**
 * G19 · Politika §6 rozet dili — metinler POLİTİKA DOSYASINA karşı kilitli.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. Rozet etiket/tooltip'lerinin yeniden yazılması (hukuki-davranışsal dil:
 *      "Sahibi doğruladı" ≠ "Admin onaylı" — kullanıcıya farklı taahhüt).
 *   2. Eski "Admin onaylı!"/"Üye onaylı!" dilinin geri gelmesi.
 *   3. Filtre ve kart kategori listelerinin ayrışması (politika §5:
 *      "Filtreler ve kartlar aynı listeyi kullanır").
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  approvedGroupBadgeMeta,
  categoryMeta,
  getOwnershipStatusMeta,
  newBadgeMeta,
  ownershipBadgeMeta,
} from "@/lib/whatsapp-landing-presentation";
import { categoryOptions } from "@/lib/whatsapp-landing-options";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

/** Politika §6 tablosunu ayrıştırır: | **Etiket** | Anlamı | */
const policyBadgeRows = (): Record<string, string> => {
  const policy = readFileSync("docs/dijital-gruplar/01_politika_v1.1.md", "utf8");
  // ⚠️ Bölüm sonu AYRI SATIRDAKİ `---` (satır başı) — tablo ayırıcısı
  // `|---|---|` de "---" içerir; düz split tablonun ortasından keser.
  const section = policy.split("## 6. Etiketler ve rozetler")[1]?.split(/\n---/)[0] ?? "";
  const rows: Record<string, string> = {};
  for (const match of section.matchAll(/\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|/g)) {
    rows[match[1]] = match[2];
  }
  return rows;
};

const landing = (overrides: Partial<WhatsAppLanding> = {}): WhatsAppLanding =>
  ({
    id: "g",
    groupName: "G",
    category: "hobi",
    country: "Almanya",
    city: "Berlin",
    mode: "text",
    tagline: "",
    callToActionText: "",
    conditions: "",
    whatsappLink: "",
    createdAt: "2026-10-01T00:00:00Z",
    ...overrides,
  }) as WhatsAppLanding;

describe("G19 · politika §6 etiketleri birebir", () => {
  const rows = policyBadgeRows();

  it("politika tablosu gerçekten okundu (4 etiket)", () => {
    expect(Object.keys(rows).length).toBeGreaterThanOrEqual(4);
  });

  it("Sahibi doğruladı / Üye önerisi / Yeni / Onaylı Grup — tooltip = politika anlamı", () => {
    expect(ownershipBadgeMeta.verified.label).toBe("Sahibi doğruladı");
    expect(ownershipBadgeMeta.verified.tooltip).toBe(rows["Sahibi doğruladı"]);
    expect(ownershipBadgeMeta.suggestion.label).toBe("Üye önerisi");
    expect(ownershipBadgeMeta.suggestion.tooltip).toBe(rows["Üye önerisi"]);
    expect(newBadgeMeta.label).toBe("Yeni");
    expect(newBadgeMeta.tooltip).toBe(rows["Yeni"]);
    expect(approvedGroupBadgeMeta.label).toBe("Onaylı Grup");
    expect(approvedGroupBadgeMeta.tooltip).toBe(rows["Onaylı Grup"]);
  });

  it("eski rozet dili söküldü (Admin onaylı!/Üye onaylı! public modüllerde yok)", () => {
    const presentation = readFileSync("src/lib/whatsapp-landing-presentation.ts", "utf8");
    const badges = readFileSync("src/components/whatsapp/LandingApprovalBadges.tsx", "utf8");
    const card = readFileSync("src/components/whatsapp/LandingCard.tsx", "utf8");

    for (const source of [presentation, badges, card]) {
      const withoutComments = source
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("//") && !line.trimStart().startsWith("*"))
        .join("\n");
      expect(withoutComments).not.toContain("Admin onaylı!");
      expect(withoutComments).not.toContain("Üye onaylı!");
    }
    expect(presentation).not.toContain("export const approvalBadgeMeta");
  });
});

describe("G19 · sahiplik rozeti mantığı", () => {
  it("verified → Sahibi doğruladı", () => {
    expect(getOwnershipStatusMeta(landing({ ownership: "verified" }))).toEqual(
      expect.objectContaining({ label: "Sahibi doğruladı" }),
    );
  });

  it("unclaimed / claim_pending / bilinmeyen → Üye önerisi (varsayılan güvenli taraf)", () => {
    for (const ownership of ["unclaimed", "claim_pending", undefined] as const) {
      expect(getOwnershipStatusMeta(landing({ ownership }))).toEqual(
        expect.objectContaining({ label: "Üye önerisi" }),
      );
    }
  });

  it("eski adminApproved tag'i rozet dilini ETKİLEMEZ (motor alanı tek kaynak)", () => {
    expect(getOwnershipStatusMeta(landing({ adminApproved: true, memberApproved: true }))).toEqual(
      expect.objectContaining({ label: "Üye önerisi" }),
    );
  });
});

describe("G19 · politika §5: filtreler ve kartlar aynı listeyi kullanır", () => {
  it("categoryOptions, categoryMeta'dan TÜRETİLİR — ikinci liste yok", () => {
    const options = readFileSync("src/lib/whatsapp-landing-options.ts", "utf8");

    expect(options).toContain('import { categoryMeta } from "@/lib/whatsapp-landing-presentation"');
    expect(options).toContain("Object.entries(");
    // Elle yazılmış ikinci bir dizi kalmadı:
    expect(options).not.toMatch(/value:\s*"alumni"/);
  });

  it("değerler ve etiketler birebir aynı küme/sırada", () => {
    expect(categoryOptions.map((o) => o.value)).toEqual(Object.keys(categoryMeta));
    expect(categoryOptions.map((o) => o.label)).toEqual(
      Object.values(categoryMeta).map((meta) => meta.label),
    );
  });

  it("CommunityFilters ve LandingCard AYNI kaynaktan besleniyor", () => {
    const filters = readFileSync("src/components/whatsapp/CommunityFilters.tsx", "utf8");
    const card = readFileSync("src/components/whatsapp/LandingCard.tsx", "utf8");

    expect(filters).toContain('from "@/lib/whatsapp-landing-options"');
    // Kart kategori meta'sını presentation'dan alır; options onu türetir → tek kaynak.
    expect(card).toContain('from "@/lib/whatsapp-landing-presentation"');
    const options = readFileSync("src/lib/whatsapp-landing-options.ts", "utf8");
    expect(options).toContain('from "@/lib/whatsapp-landing-presentation"');
  });
});
