import { describe, expect, it, vi } from "vitest";

import type { Submission } from "@/lib/submissions";
import {
  fetchAllSubmissionPages,
  filterSubmissions,
  getSubmissionStoragePath,
} from "./admin-submissions-api";

const makeSubmission = (overrides: Partial<Submission> = {}): Submission =>
  ({
    id: "submission-1",
    fullname: "Ayşe Yılmaz",
    email: "ayse@example.com",
    phone: "+491701234567",
    country: "Almanya",
    city: "Berlin",
    field: "Yazılım",
    form_type: "register",
    source_type: "website",
    status: "new",
    consent: true,
    created_at: "2026-08-30T10:00:00.000Z",
    description: "İş Arıyorum",
    offers_needs: "Mentorluk ihtiyacım var",
    category: "bireysel",
    documents: [],
    document_url: null,
    document_name: null,
    ...overrides,
  }) as Submission;

describe("fetchAllSubmissionPages", () => {
  it("PostgREST 1000 satır sınırını Range sayfalama ile aşar", async () => {
    const first = Array.from({ length: 500 }, (_, index) => makeSubmission({ id: `a-${index}` }));
    const second = Array.from({ length: 500 }, (_, index) => makeSubmission({ id: `b-${index}` }));
    const third = [makeSubmission({ id: "c-0" })];
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)
      .mockResolvedValueOnce(third);

    const rows = await fetchAllSubmissionPages(fetchPage, 500);

    expect(rows).toHaveLength(1001);
    expect(fetchPage.mock.calls).toEqual([
      [0, 499],
      [500, 999],
      [1000, 1499],
    ]);
  });
});

describe("filterSubmissions", () => {
  const rows = [
    makeSubmission(),
    makeSubmission({
      id: "submission-2",
      fullname: "Can Kaya",
      description: "Yeni işlere açığım",
      status: "contacted",
      form_type: "backer",
      category: "support",
      created_at: "2026-07-01T10:00:00.000Z",
      documents: [{ name: "sunum.pdf", path: "2026/sunum.pdf" }],
    }),
  ];

  it("Türkçe aramayı aksan ve noktasız i toleranslı uygular", () => {
    expect(filterSubmissions(rows, { search: "is ariyorum" }).map((row) => row.id)).toEqual([
      "submission-1",
    ]);
  });

  it("durum, form, kategori, tarih ve ek filtresini birlikte uygular", () => {
    expect(
      filterSubmissions(rows, {
        status: "contacted",
        formType: "backer",
        category: "support",
        createdFrom: "2026-06-01",
        createdTo: "2026-07-31",
        hasDocuments: true,
      }).map((row) => row.id),
    ).toEqual(["submission-2"]);
  });
});

describe("getSubmissionStoragePath", () => {
  it("doğrudan path değerini kabul eder", () => {
    expect(getSubmissionStoragePath({ name: "cv.pdf", path: "2026/cv.pdf", url: null })).toBe(
      "2026/cv.pdf",
    );
  });

  it("eski Supabase storage URL'inden yalnız submission-documents yolunu çıkarır", () => {
    expect(
      getSubmissionStoragePath({
        name: "cv.pdf",
        path: null,
        url: "https://example.supabase.co/storage/v1/object/public/submission-documents/legacy/cv.pdf",
      }),
    ).toBe("legacy/cv.pdf");
    expect(
      getSubmissionStoragePath({ name: "x", path: null, url: "https://evil.example/x.pdf" }),
    ).toBeNull();
  });
});
