import { describe, expect, it } from "vitest";

import { classifyDocumentationPath } from "./sources.mjs";

describe("documentation knowledge-source classification", () => {
  it("exposes guides to members, keeps other docs admin-only, and skips blog exports", () => {
    expect(classifyDocumentationPath("docs/guides/claim.html")).toBe("member");
    expect(classifyDocumentationPath("docs/plans/internal.md")).toBe("admin");
    expect(classifyDocumentationPath("docs/exports/blog-md/article.md")).toBeNull();
  });
});
