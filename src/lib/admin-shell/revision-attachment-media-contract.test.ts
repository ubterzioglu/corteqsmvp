// Revizyon ekleri — bucket ↔ istemci AYNA sözleşmesi (A09a/A09b).
//
// Bucket `revision-attachments` 29.09'da 11 MIME'a genişletildi (A09a,
// applied/20260929120000). İstemci sabitleri TEK modülden türer
// (revision-attachment-media.ts); bu test üç ayrışmayı kilitler:
//   1. SQL'deki MIME listesi ↔ istemci MIME listesi BİREBİR aynı
//   2. Boyut tavanı 15 MB iki tarafta aynı (m94 dersi)
//   3. İki bileşen de `accept`'i sabitten alır — elle "image/*" yazılamaz
//
// ⚠️ Test yalnız SQL METNİNİ denetler, canlı durumu değil (desen:
// event-media-contract.test.ts).

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  formatRevisionAttachmentSize,
  isRevisionAttachmentImage,
  REVISION_ATTACHMENT_ACCEPT,
  REVISION_ATTACHMENT_EXTENSIONS,
  REVISION_ATTACHMENT_MAX_BYTES,
  REVISION_ATTACHMENT_MIME_TYPES,
  revisionAttachmentExtension,
} from "./revision-attachment-media";

const sql = readFileSync(
  "supabase/migrations/applied/20260929120000_revision_attachments_document_mimes.sql",
  "utf8",
);

describe("revision-attachments bucket'ı istemci denetimiyle hizada (A09b)", () => {
  it("boyut tavanı istemcideki 15 MB ile AYNI", () => {
    expect(sql).toContain("15728640");
    expect(REVISION_ATTACHMENT_MAX_BYTES).toBe(15728640);
    expect(REVISION_ATTACHMENT_MAX_BYTES).toBe(15 * 1024 * 1024);
  });

  it("bucket'ın izin verdiği MIME listesi istemciyle BİREBİR aynı", () => {
    for (const mime of REVISION_ATTACHMENT_MIME_TYPES) {
      expect(sql, `${mime} SQL'de yok`).toContain(`'${mime}'`);
    }
    // Ters yön: SQL'de istemcinin tanımadığı bir tür OLMAMALI — yoksa sunucu,
    // istemcinin reddettiği dosyayı kabul eder ve kullanıcı anlamaz.
    const sqlMimes = sql.match(/'(?:image|application)\/[a-z0-9+.-]+'/g) ?? [];
    const uniqueSqlMimes = [...new Set(sqlMimes.map((raw) => raw.replaceAll("'", "")))];
    expect(uniqueSqlMimes.sort()).toEqual([...REVISION_ATTACHMENT_MIME_TYPES].sort());
  });

  it("uzantı kümesi MIME listesiyle aynı haritadan türer", () => {
    // 11 MIME ↔ 12 uzantı (jpeg/jpg aynı MIME'ı paylaşır).
    expect(REVISION_ATTACHMENT_MIME_TYPES).toHaveLength(11);
    expect(REVISION_ATTACHMENT_EXTENSIONS.size).toBe(12);
    for (const ext of ["jpg", "jpeg", "png", "webp", "gif", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"]) {
      expect(REVISION_ATTACHMENT_EXTENSIONS.has(ext), ext).toBe(true);
    }
    // Tehlikeli türler dışarıda kalır.
    for (const ext of ["exe", "js", "sh", "html", "docm", "svg"]) {
      expect(REVISION_ATTACHMENT_EXTENSIONS.has(ext), ext).toBe(false);
    }
  });

  it("ACCEPT tek kaynaktan türetilir, elle yazılmaz", () => {
    expect(REVISION_ATTACHMENT_ACCEPT).toBe(REVISION_ATTACHMENT_MIME_TYPES.join(","));
  });
});

// İki kabul noktası da sabiti kullanmak ZORUNDA (A09b kuralı: "iki yere elle yazma").
// Desen: service-attachment-security.test.ts kaynak metnini okur.
describe("kabul noktaları sabiti kullanıyor", () => {
  const sources = [
    "src/components/admin/revision/RevisionAttachmentGrid.tsx",
    "src/components/admin/revision/RevisionCommentThread.tsx",
  ].map((path) => [path, readFileSync(path, "utf8")] as const);

  it.each(sources)("%s accept'i REVISION_ATTACHMENT_ACCEPT'ten alır", (_path, source) => {
    expect(source).toContain("accept={REVISION_ATTACHMENT_ACCEPT}");
    expect(source).not.toContain('accept="image/*"');
  });
});

describe("A09c yardımcıları — görsel/belge ayrımı ve boyut etiketi", () => {
  it("content_type ile türü ayırt eder", () => {
    expect(isRevisionAttachmentImage("image/png", "x.png")).toBe(true);
    expect(isRevisionAttachmentImage("image/gif", "x.gif")).toBe(true);
    expect(isRevisionAttachmentImage("application/pdf", "x.pdf")).toBe(false);
    expect(
      isRevisionAttachmentImage(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "x.xlsx",
      ),
    ).toBe(false);
  });

  it("content_type null ise uzantıdan sezilir (eski satırlar)", () => {
    expect(isRevisionAttachmentImage(null, "foto.jpeg")).toBe(true);
    expect(isRevisionAttachmentImage(null, "belge.pdf")).toBe(false);
    expect(isRevisionAttachmentImage(null, "uzantisiz")).toBe(false);
  });

  it("uzantı etiketi teknik büyük harfe çevrilir", () => {
    expect(revisionAttachmentExtension("belge.PDF")).toBe("PDF");
    expect(revisionAttachmentExtension("tablo.xlsx")).toBe("XLSX");
    expect(revisionAttachmentExtension("uzantisiz")).toBe("");
  });

  it("boyut etiketi KB/MB gösterir, null'da boş döner", () => {
    expect(formatRevisionAttachmentSize(20480)).toBe("20 KB");
    expect(formatRevisionAttachmentSize(1258291)).toBe("1.2 MB");
    expect(formatRevisionAttachmentSize(500)).toBe("1 KB");
    expect(formatRevisionAttachmentSize(null)).toBe("");
  });
});
