/**
 * G21 birim testleri — sahip paneli istemcisi (`group-owner-panel.ts`).
 *
 * Kilitler: hata haritası üç migration'a karşı çift yönlü (G21 owner + G16
 * post review + G12 status — panelin çağırdığı kapıların TÜM raise kodları) ·
 * "Kurallarını ekle, +15" tasarım dili · rozet SVG'si politika §7 ("Onaylı
 * Grup" + Instagram karesi) · XSS kaçışı (grup adı SVG'ye ham gömülmez).
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  GROUP_OWNER_ERROR_MESSAGES,
  buildApprovedBadgeSvg,
  scoreHints,
  type OwnerScoreState,
} from "@/lib/group-owner-panel";

const readMigration = (name: string) => {
  for (const dir of ["supabase/migrations/applied/", "supabase/migrations/"]) {
    const path = dir + name;
    if (existsSync(path)) return readFileSync(path, "utf8");
  }
  throw new Error(`${name} bulunamadı`);
};

const G21 = readMigration("20261002100000_group_owner_panel.sql");
const G16 = readMigration("20261002060000_group_posts.sql");
const G12 = readMigration("20261002030000_group_status_machine.sql");

const raiseCodes = (sql: string) =>
  new Set([...sql.matchAll(/raise exception '(group_[a-z0-9_]+)'/g)].map((m) => m[1]));

const score = (overrides: Partial<OwnerScoreState> = {}): OwnerScoreState => ({
  score: 80,
  in_grace: false,
  recommendation_count: 0,
  components: { profile: 15, rules: 15, moderation: 15, link: 15, recommendations: 0, reports: 20 },
  ...overrides,
});

describe("G21 · hata haritası üç kapıya karşı çift yönlü", () => {
  it("panelin çağırdığı RPC'lerin owner/post kodları haritada", () => {
    const ownerCodes = [...raiseCodes(G21)].filter((c) => c.startsWith("group_owner") || c === "group_not_found");
    expect(ownerCodes.length).toBeGreaterThanOrEqual(6);
    for (const code of ownerCodes) {
      expect(code in GROUP_OWNER_ERROR_MESSAGES, `eksik: ${code}`).toBe(true);
    }

    // group_post_review (G16) — panelin kuyruk kararları
    for (const code of raiseCodes(G16)) {
      // create yolu kodları panelde çağrılmaz (G16 formunun kapıları)
      if (
        code === "group_post_body_required" ||
        code === "group_post_too_long" ||
        code === "group_not_published"
      ) continue;
      expect(code in GROUP_OWNER_ERROR_MESSAGES, `eksik: ${code}`).toBe(true);
    }
  });

  it("kaldırma yolunun G12 kodları haritada", () => {
    for (const code of ["group_illegal_transition", "group_forbidden", "group_hidden_reason_required"]) {
      expect(G12).toContain(`'${code}'`);
      expect(code in GROUP_OWNER_ERROR_MESSAGES).toBe(true);
    }
  });

  it("haritada üç migration'da da OLMAYAN hayali kod yok", () => {
    const all = new Set([...raiseCodes(G21), ...raiseCodes(G16), ...raiseCodes(G12), "group_not_found"]);
    const phantom = Object.keys(GROUP_OWNER_ERROR_MESSAGES).filter((code) => !all.has(code));
    expect(phantom).toEqual([]);
  });
});

describe("G21 · eksik adım rehberi (tasarım §11 dili)", () => {
  it("'Kurallarını ekle, +15' tasarım ifadesi birebir", () => {
    const hints = scoreHints(score({ components: { ...score().components, rules: 0 } }));

    expect(hints).toContain("Kurallarını ekle, +15");
  });

  it("dolu kalemler için öneri üretilmez; tavsiye eksiği puanıyla yazılır", () => {
    const hints = scoreHints(score());

    expect(hints.some((h) => h.includes("Kurallarını ekle"))).toBe(false);
    expect(hints.some((h) => h.includes("şu an 0 tavsiye, +20 puan"))).toBe(true);
  });

  it("grace döneminde tek mesaj: 7 gün", () => {
    const hints = scoreHints(score({ score: null, in_grace: true }));

    expect(hints).toEqual(["Grup yayında 7 günü doldurduğunda skor hesaplanacak."]);
  });

  it("her kalem doluysa rehber boş kalmaz (rozet paylaşımı önerilir)", () => {
    const hints = scoreHints(
      score({ components: { profile: 15, rules: 15, moderation: 15, link: 15, recommendations: 20, reports: 20 } }),
    );

    expect(hints).toHaveLength(1);
    expect(hints[0]).toContain("rozetini paylaş");
  });
});

describe("G21 · rozet görseli (politika §7)", () => {
  it("'Onaylı Grup' + grup adı + 1080x1080 (Instagram karesi)", () => {
    const svg = buildApprovedBadgeSvg({ groupName: "Berlin Yazılımcıları", score: 84 });

    expect(svg).toContain("Onaylı Grup");
    expect(svg).toContain("Berlin Yazılımcıları");
    expect(svg).toContain('width="1080" height="1080"');
    expect(svg).toContain("84 / 100");
  });

  it("grup adı SVG'ye KAÇIŞLI gömülür (XSS/script enjeksiyonu yok)", () => {
    const svg = buildApprovedBadgeSvg({
      groupName: '</text><script>alert(1)</script><text x="0">',
      score: 71,
    });

    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;");
  });

  it("skor null ise skor satırı çizilmez", () => {
    const svg = buildApprovedBadgeSvg({ groupName: "G", score: null });

    expect(svg).not.toContain("Grup Sağlık Skoru");
  });
});
