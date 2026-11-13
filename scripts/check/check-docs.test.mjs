import { describe, expect, it } from "vitest";

import {
  checkDatedName,
  checkIndex,
  extractDocRefs,
  findDuplicateGroups,
  isScannedForRefs,
  refExists,
  supersededTarget,
} from "./check-docs.mjs";

describe("extractDocRefs", () => {
  it("düz yolu ve Türkçe karakterli dosya adını tam yakalar", () => {
    expect(extractDocRefs("bkz. docs/plans/2026-09-20-çıkış-planı.md.")).toEqual([
      "docs/plans/2026-09-20-çıkış-planı.md",
    ]);
  });

  it("URL'nin ve daha uzun yolun parçasını yakalamaz", () => {
    expect(extractDocRefs("https://supabase.com/docs/guides/auth/x")).toEqual([]);
    expect(extractDocRefs("public/commercial-docs/hero.png")).toEqual([]);
  });

  it("yer tutucu, glob, önek ve aralık atıflarını atlar", () => {
    expect(extractDocRefs("docs/plans/2026-10-0X-plan.md docs/10tool/NN-x.md docs/*.md")).toEqual([]);
    expect(extractDocRefs("docs/plans/2026-09-29-ekstre- serisi")).toEqual([]);
    expect(extractDocRefs("docs/catalog-role-afs-rebuild/00-14 arası")).toEqual([]);
  });

  it("'(repoda yok)' işaretli atıf bilinçli kayıttır, atlanır", () => {
    expect(extractDocRefs("`docs/cadde-300/cks-v2.md` (repoda yok)")).toEqual([]);
    expect(extractDocRefs("`docs/cadde-300/cks-v2.md` (taşındı)")).toEqual(["docs/cadde-300/cks-v2.md"]);
  });
});

describe("refExists", () => {
  const files = new Set(["docs/10tool/00-ortak.md", "docs/10tool/README.md", "docs/guides/a.md"]);
  const dirs = new Set(["docs", "docs/10tool", "docs/guides"]);

  it("dosya, dizin ve kısa önek atfı geçerlidir", () => {
    expect(refExists("docs/guides/a.md", files, dirs)).toBe(true);
    expect(refExists("docs/guides", files, dirs)).toBe(true);
    expect(refExists("docs/10tool/00", files, dirs)).toBe(true);
    expect(refExists("docs/10tool/README", files, dirs)).toBe(true);
  });

  it("yok olan hedef ve yarım kelime geçersizdir", () => {
    expect(refExists("docs/guides/b.md", files, dirs)).toBe(false);
    expect(refExists("docs/10tool/0", files, dirs)).toBe(false);
  });

  it("bilinen yerel çıktı dizini (gitignore'lu) var sayılır", () => {
    expect(refExists("docs/commandcenter/todo.md", files, dirs)).toBe(true);
  });

  it("DETERMİNİSTİK: büyük/küçük harf farkı ve yalnız diskte duran yol geçersizdir (Windows ≠ Linux CI)", () => {
    // 2026-11-07: existsSync Windows'ta `docs/Archive`'ı `docs/archive` sandı; CI'da düştü.
    expect(refExists("docs/Guides/a.md", files, dirs)).toBe(false);
    expect(refExists("docs/GUIDES", files, dirs)).toBe(false);
    expect(refExists("referanslovable/README.md", files, dirs)).toBe(false);
  });
});

describe("isScannedForRefs", () => {
  it("tarihsel dizinler, testler, migration'lar ve değişiklik günlüğü taranmaz", () => {
    expect(isScannedForRefs("docs/archive/x.md")).toBe(false);
    expect(isScannedForRefs("docs/history/x.md")).toBe(false);
    expect(isScannedForRefs("src/lib/a.test.ts")).toBe(false);
    expect(isScannedForRefs("supabase/migrations/applied/1_x.sql")).toBe(false);
    expect(isScannedForRefs("src/lib/admin-shell/admin-updates/2026-07.ts")).toBe(false);
  });

  it("yaşayan doküman ve kod taranır", () => {
    expect(isScannedForRefs("docs/plans/2026-11-07-x.md")).toBe(true);
    expect(isScannedForRefs("src/pages/admin/AdminDurumRaporuPage.tsx")).toBe(true);
    expect(isScannedForRefs("CLAUDE.md")).toBe(true);
  });
});

describe("checkIndex", () => {
  it("anılmayan üst dizini ve var olmayan dizin anışını bulur", () => {
    const readme = "| `plans/` | planlar |\n| `eski/` | yok artık |\n| `blog-md/` | alt dizin |";
    const { missing, stale } = checkIndex(["guides", "plans"], readme, new Set(["blog-md"]));
    expect(missing).toEqual(["guides"]);
    expect(stale).toEqual(["eski"]);
  });
});

describe("findDuplicateGroups", () => {
  const e = (blob, path) => ({ blob, path });

  it("iki canlı kopya ihlaldir", () => {
    expect(findDuplicateGroups([e("a", "docs/plans/x.md"), e("a", "docs/plans/y.md")])).toHaveLength(1);
  });

  it("bilinçli kaynağın canlı kopyası ihlaldir (docs/backup ↔ seed girdisi)", () => {
    expect(findDuplicateGroups([e("b", "docs/backup/1.png"), e("b", "docs/social-share-outputs/1.png")])).toHaveLength(
      1,
    );
  });

  it("bilinçli kaynak kendi içinde ve donmuş dizinler kopya sayılmaz", () => {
    expect(
      findDuplicateGroups([e("c", "docs/social-share-outputs/851.png"), e("c", "docs/social-share-outputs/861.png")]),
    ).toEqual([]);
    expect(findDuplicateGroups([e("d", "docs/archive/a.md"), e("d", "docs/plans/a.md")])).toEqual([]);
    expect(findDuplicateGroups([e("f", "docs/history/a.md"), e("f", "docs/history/b.md")])).toEqual([]);
  });
});

describe("checkDatedName", () => {
  it("tarihli tür dizininde kebab-case tarihli ad geçer, büyük harf/boşluk geçmez", () => {
    expect(checkDatedName("docs/plans/2026-11-07-clean-code-plani.md")).toBe(true);
    expect(checkDatedName("docs/kalanlar/2026-09-21-KALANLAR.md")).toBe(false);
    expect(checkDatedName("docs/plans/2026-10-05-A03a-olcum.md")).toBe(false);
  });

  it("tarihsiz ad, README ve alt dizin dosyası kuralın dışındadır", () => {
    expect(checkDatedName("docs/kalanlar/KALANLAR.md")).toBe(true);
    expect(checkDatedName("docs/plans/README.md")).toBe(true);
    expect(checkDatedName("docs/plans/admin-v2/2026-X.md")).toBe(true);
  });
});

describe("supersededTarget", () => {
  it("yerini-aldı + hedef → hedef; hedefsiz → null; aktif → undefined", () => {
    expect(supersededTarget("---\ndurum: yerini-aldı\nyerini_alan: docs/kalanlar/KALANLAR.md\n---\n")).toBe(
      "docs/kalanlar/KALANLAR.md",
    );
    expect(supersededTarget("---\ndurum: yerini-aldı\n---\n")).toBeNull();
    expect(supersededTarget("---\ndurum: aktif\n---\n")).toBeUndefined();
    expect(supersededTarget("# frontmatter yok")).toBeUndefined();
  });
});
