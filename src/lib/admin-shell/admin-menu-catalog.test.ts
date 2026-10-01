// N03 · Yönetici menü kataloğunun ÜRETİLEN artefaktı + bayatlama kapanı.
//
// `docs/agent/admin-menu.json`, N04'te bot korpusuna (`ai_knowledge_documents`)
// yüklenecek veri setidir. Üretmek için:
//
//     npm run ingest:admin-menu
//
// ⚠️ **ARGUMAN SIRASI ÖNEMLİ — ölçüldü:** script `vitest run <yol> -u` biçimindedir.
// `vitest run -u <yol>` ve `vitest run --update <yol>` yolu YUTAR ve **tüm takımı**
// (380 dosya / 2947 test) snapshot-güncelleme modunda koşturur — başka bir yerdeki
// bayat snapshot sessizce yeniden yazılır. Bayrak DAİMA yolun ARKASINA yazılır.
// (Ölçüm: yol önce → 1 dosya/4 test; bayrak önce → 380 dosya/2947 test.)
//
// ⚠️ **NEDEN SNAPSHOT, NEDEN YENİ BİR SCRIPT DEĞİL:** korpusu besleyen
// `scripts/ai-knowledge/sources.mjs` SAF NODE'dur; `lucide-react` import eden TS
// registry'yi import edemez ve bu repoda `tsx`/`esbuild` **yoktur** (ölçüldü;
// `jiti` yalnız transitif bağımlılık). Artefakt bu yüzden vitest ile üretilir.
//
// ⚠️ **ASIL KAZANÇ BAYATLAMA KAPANI:** bu dosya `npm run test` içinde koştuğu
// için menü değişip artefakt tazelenmezse **test KIRILIR**. `ingest:tools:check`
// bu garantiyi veremiyor — o ne lint'te ne test'te koşuyor ve bu repoda birkaç
// kez sessizce bayatladı. Buradaki desen o sınıfı kapatır.
//
// ⚠️ Dosya `.json` olduğu için `docs-admin` korpusuna İKİNCİ KEZ girmez:
// `classifyDocumentationPath` yalnız `.md|.html` alır (`sources.mjs:27`).
// Uzantıyı `.md` yaparsan menü korpusa iki kez girer ve semantik arama kendi
// kendisiyle yarışır.
import { describe, expect, it } from "vitest";

import { buildAdminMenuCatalog } from "@/lib/admin-shell/admin-menu-numbering";

/** Artefaktın şekli — N04'teki `loadAdminMenuDocuments()` bunu okur. */
function buildArtifact() {
  return {
    // Kaynağı dosyanın İÇİNE yaz: artefaktı elle düzenlemeye kalkan kişi
    // nereden üretildiğini görsün.
    generatedBy: "npm run ingest:admin-menu",
    source: "src/lib/admin-shell/admin-menu-numbering.ts",
    items: buildAdminMenuCatalog().map((entry) => ({
      id: entry.id,
      number: entry.number,
      label: entry.label,
      groupLabel: entry.groupLabel,
      parentId: entry.parentId,
      to: entry.to,
      href: entry.href,
      description: entry.description,
      aliases: entry.aliases,
      isExternal: entry.isExternal,
      isInactive: entry.isInactive,
    })),
  };
}

describe("N03 · docs/agent/admin-menu.json", () => {
  it("artefakt canlı registry ile AYNI — bayatsa bu test kırılır", async () => {
    const artifact = buildArtifact();
    await expect(`${JSON.stringify(artifact, null, 2)}\n`).toMatchFileSnapshot(
      "../../../docs/agent/admin-menu.json",
    );
  });

  it("artefakt bot için gereken alanları taşır", () => {
    const { items } = buildArtifact();
    expect(items.length).toBeGreaterThan(50);

    for (const item of items) {
      expect(item.number, `${item.id} numarasız`).toMatch(/^\d+(\.\d+)?$/);
      expect(item.label?.trim(), `${item.id} etiketsiz`).toBeTruthy();
      expect(item.groupLabel?.trim(), `${item.id} grupsuz`).toBeTruthy();
    }
  });

  it("her öğenin gidilecek bir yeri vardır (iç yol VEYA dış link)", () => {
    // Yalnız ebeveyn olan öğeler `to` taşımayabilir ama o zaman çocukları olmalı.
    const { items } = buildArtifact();
    const parentIds = new Set(items.map((item) => item.parentId).filter(Boolean));

    for (const item of items) {
      const reachable = Boolean(item.to || item.href || parentIds.has(item.id));
      expect(reachable, `${item.id} (${item.number}) hiçbir yere gitmiyor`).toBe(true);
    }
  });

  it("dış linkler `href` taşır, iç yollar `to`", () => {
    const { items } = buildArtifact();
    for (const item of items) {
      if (item.isExternal) {
        expect(item.href, `${item.id} external ama href yok`).toBeTruthy();
      } else if (item.to) {
        expect(item.to.startsWith("/"), `${item.id} iç yolu "/" ile başlamıyor`).toBe(true);
      }
    }
  });
});
