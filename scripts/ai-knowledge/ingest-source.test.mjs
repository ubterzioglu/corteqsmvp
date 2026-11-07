import { beforeEach, describe, expect, it, vi } from "vitest";

const { clearSourceMock, pruneSourceMock, upsertDocumentMock } = vi.hoisted(() => ({
  clearSourceMock: vi.fn(),
  pruneSourceMock: vi.fn(),
  upsertDocumentMock: vi.fn(),
}));

vi.mock("./client.mjs", () => ({
  clearSource: clearSourceMock,
  pruneSource: pruneSourceMock,
  upsertDocument: upsertDocumentMock,
}));

import { ingestSource } from "./ingest-source.mjs";
import { findSource } from "./sources.mjs";

const client = {};

function sourceWith(documents, extra = {}) {
  return { key: "test-kaynak", audience: "member", load: async () => documents, ...extra };
}

describe("ingestSource — boş kaynak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSourceMock.mockResolvedValue(94);
    pruneSourceMock.mockResolvedValue(0);
    upsertDocumentMock.mockResolvedValue("inserted");
  });

  it("kitle sınırı kaynağı (allowEmpty) 0 belgede kaynağı BOŞALTIR — eski üye satırı kalmaz", async () => {
    const report = await ingestSource(client, sourceWith([], { allowEmpty: true }), { dryRun: false });
    expect(clearSourceMock).toHaveBeenCalledWith(client, "test-kaynak");
    expect(pruneSourceMock).not.toHaveBeenCalled();
    expect(report).toMatchObject({ documents: 0, deleted: 94 });
  });

  it("allowEmpty kaynağı dry-run'da hiçbir şey silmez", async () => {
    const report = await ingestSource(client, sourceWith([], { allowEmpty: true }), { dryRun: true });
    expect(clearSourceMock).not.toHaveBeenCalled();
    expect(report).toMatchObject({ documents: 0, deleted: 0 });
  });

  it("sıradan kaynak 0 belgede fırlatır ve hiçbir şey silmez (okuma hatası freni)", async () => {
    await expect(ingestSource(client, sourceWith([]), { dryRun: false })).rejects.toThrow(/0 kayit/);
    expect(clearSourceMock).not.toHaveBeenCalled();
    expect(pruneSourceMock).not.toHaveBeenCalled();
  });

  it("belge varken normal budama yolu çalışır", async () => {
    const documents = [{ externalId: "docs/guides/belge-yukleme.md", title: "Belge", url: null, text: "kısa metin" }];
    const report = await ingestSource(client, sourceWith(documents, { allowEmpty: true }), { dryRun: false });
    expect(pruneSourceMock).toHaveBeenCalledWith(client, "test-kaynak", ["docs/guides/belge-yukleme.md"]);
    expect(clearSourceMock).not.toHaveBeenCalled();
    expect(report.documents).toBe(1);
  });
});

describe("kaynak kayıt defteri — kitle sınırı bayrağı", () => {
  it("docs-member allowEmpty taşır (son rehberi geri çekmek budamayı tetiklesin)", () => {
    expect(findSource("docs-member").allowEmpty).toBe(true);
  });

  it.each(["docs-admin", "catalog", "blog", "admin-menu"])(
    "%s allowEmpty TAŞIMAZ (0 kayıt = okuma hatası)",
    (key) => {
      expect(findSource(key).allowEmpty).toBeFalsy();
    },
  );
});
