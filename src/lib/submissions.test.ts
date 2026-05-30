import { describe, expect, it } from "vitest";

import {
  buildSubmissionSearchText,
  formatBytes,
  getCategoryLabel,
  getFormTypeLabel,
  getSubmissionDocuments,
  getSubmissionDocumentsBucketLevel,
  getStatusLabel,
  type UploadedDocument,
  toSubmissionInsert,
  validateSubmissionDocuments,
} from "@/lib/submissions";

describe("submission helpers", () => {
  it("builds register inserts with default review status", () => {
    const submission = toSubmissionInsert(
      {
        category: "danisman",
        fullname: "Ada Lovelace",
        country: "Germany",
        city: "Berlin",
        business: "",
        field: "AI",
        email: "ada@example.com",
        phone: "+49 555",
        offers_needs: "Danışmanlık veriyorum",
      },
      "register",
      true,
    );

    expect(submission.form_type).toBe("register");
    expect(submission.category).toBe("danisman");
    expect(submission.status).toBe("new");
    expect(submission.consent).toBe(true);
    expect(submission.business).toBeNull();
    expect(submission.referral_source).toBeNull();
    expect(submission.referral_detail).toBeNull();
    expect(submission.referral_code).toBeNull();
    expect(submission.referral_code_id).toBeNull();
    expect(submission.offers_needs).toBe("Danışmanlık veriyorum");
    expect(submission.documents).toEqual([]);
  });

  it("normalizes referral fields consistently", () => {
    const documents: UploadedDocument[] = [{ url: null, path: "uploads/cv.pdf", name: "cv.pdf" }];
    const submission = toSubmissionInsert(
      {
        category: "danisman",
        fullname: "Ada Lovelace",
        country: "Germany",
        city: "Berlin",
        business: "",
        field: "AI",
        email: "ada@example.com",
      phone: "+49 555",
      referral_source: "whatsapp",
      referral_detail: "Berlin Diaspora",
      referral_code: " abc42 ",
        document_url: "",
        document_name: "cv.pdf",
        documents: documents as unknown as FormDataEntryValue,
      },
      "register",
    );

    expect(submission.referral_source).toBe("whatsapp");
    expect(submission.referral_detail).toBe("Berlin Diaspora");
    expect(submission.referral_code).toBe("ABC42");
    expect(submission.document_name).toBe("cv.pdf");
  });

  it("renders labels and search text consistently", () => {
    expect(getCategoryLabel("sehir-elcisi")).toBe("Şehir Elçisi");
    expect(getFormTypeLabel("support")).toBe("Destek");
    expect(getStatusLabel("contacted")).toBe("İletişime geçildi");

    const haystack = buildSubmissionSearchText({
      id: "1",
      form_type: "register",
      category: "sehir-elcisi",
      fullname: "Ada Lovelace",
      country: "Germany",
      city: "Berlin",
      business: null,
      field: "Technology",
      email: "ada@example.com",
      phone: "+49 555",
      referral_source: "whatsapp",
      referral_detail: "Berlin Diaspora",
      referral_code: "ABC42",
      referral_code_id: null,
      description: "Community builder",
      offers_needs: "Network arıyor",
      document_url: "https://example.com/doc.pdf",
      document_name: "doc.pdf",
      documents: [{ url: "https://example.com/doc.pdf", name: "doc.pdf" }],
      contest_interest: false,
      linkedin: null,
      instagram: "@ada",
      tiktok: null,
      facebook: null,
      twitter: null,
      website: null,
      consent: true,
      created_at: "2026-04-06T19:30:00.000Z",
      status: "new",
      notes: "Priority lead",
      reviewed_at: null,
      reviewed_by: null,
    });

    expect(haystack).toContain("community builder");
    expect(haystack).toContain("priority lead");
    expect(haystack).toContain("berlin diaspora");
    expect(haystack).toContain("abc42");
    expect(haystack).toContain("network arıyor");
    expect(haystack).toContain("doc.pdf");
  });

  it("validates uploaded documents against limits and types", () => {
    const validFile = new File(["hello"], "cv.pdf", { type: "application/pdf" });
    const invalidFile = new File(["hello"], "script.exe", { type: "application/x-msdownload" });

    const valid = validateSubmissionDocuments([validFile]);
    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.files).toHaveLength(1);
    }

    const invalid = validateSubmissionDocuments([invalidFile]);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.message).toContain("desteklenmeyen format");
    }
  });

  it("parses documents and falls back to legacy single-document fields", () => {
    expect(
      getSubmissionDocuments({
        documents: [{ url: null, path: "uploads/cv.pdf", name: "cv.pdf", sizeBytes: 2048 }],
        document_url: null,
        document_name: null,
      }),
    ).toEqual([{ url: null, path: "uploads/cv.pdf", name: "cv.pdf", sizeBytes: 2048, contentType: null }]);

    expect(
      getSubmissionDocuments({
        documents: [],
        document_url: "https://example.com/legacy.pdf",
        document_name: "legacy.pdf",
      }),
    ).toEqual([{ url: "https://example.com/legacy.pdf", path: null, name: "legacy.pdf", sizeBytes: null, contentType: null }]);
  });

  it("classifies bucket usage thresholds and formats sizes", () => {
    expect(getSubmissionDocumentsBucketLevel(0.2)).toBe("normal");
    expect(getSubmissionDocumentsBucketLevel(0.7)).toBe("info");
    expect(getSubmissionDocumentsBucketLevel(0.85)).toBe("warning");
    expect(getSubmissionDocumentsBucketLevel(0.95)).toBe("critical");
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});
