import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminMembersPage from "@/pages/admin/AdminMembersPage";

const toast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast,
  }),
}));

type MockSubmission = {
  id: string;
  created_at: string;
  updated_at: string;
  fullname: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  field: string;
  offers_needs: string;
  form_type: "advisor" | "investor" | "talent" | "business";
  category: "danisman" | "startup" | "student" | "other";
  status: "new" | "contacted" | "archived";
  referral_source: string | null;
  referral_code: string | null;
  whatsapp_interest: boolean;
  contest_interest: boolean;
  source_type: "form" | "chatbot" | "wa";
  contact_phone_reached: boolean;
  contact_whatsapp_reached: boolean;
  contact_instagram_reached: boolean;
  contact_email_reached: boolean;
  document_url: string | null;
  document_name: string | null;
  documents: Array<{ url: string | null; path?: string | null; name: string; sizeBytes?: number; contentType?: string }>;
};

const createMockRows = (): MockSubmission[] =>
  Array.from({ length: 45 }, (_, index) => ({
    id: `member-${index + 1}`,
    created_at: new Date(Date.UTC(2026, 4, 1, 12, 0, index)).toISOString(),
    updated_at: new Date(Date.UTC(2026, 4, 1, 12, 0, index)).toISOString(),
    fullname: `Member ${index + 1}`,
    email: `member${index + 1}@corteqs.test`,
    phone: "+49123456789",
    country: "Germany",
    city: "Berlin",
    field: "AI",
    offers_needs: "Support",
    form_type: "advisor",
    category: "other",
    status: "new",
    referral_source: null,
    referral_code: null,
    whatsapp_interest: false,
    contest_interest: false,
    source_type: "form",
    contact_phone_reached: false,
    contact_whatsapp_reached: false,
    contact_instagram_reached: false,
    contact_email_reached: false,
    document_url: null,
    document_name: null,
    documents: [],
  }));

let mockRows: MockSubmission[] = [];
let mockBucketStats = {
  bucket_id: "submission-documents",
  file_count: 12,
  total_bytes: 44_564_480,
  file_size_limit: 52_428_800,
  usage_ratio: 0.85,
};
let mockBucketStatsError: Error | null = null;
const windowOpen = vi.fn();

function getFieldValue(row: MockSubmission, column: string) {
  return row[column as keyof MockSubmission];
}

function createSelectQuery(data: MockSubmission[]) {
  return {
    ilike: (column: string, pattern: string) => {
      const normalizedPattern = pattern.replace(/%/g, "").toLocaleLowerCase("tr-TR");
      return createSelectQuery(
        data.filter((row) =>
          String(getFieldValue(row, column) ?? "")
            .toLocaleLowerCase("tr-TR")
            .includes(normalizedPattern),
        ),
      );
    },
    eq: (column: string, value: string | boolean) =>
      createSelectQuery(data.filter((row) => getFieldValue(row, column) === value)),
    neq: (column: string, value: string | boolean) =>
      createSelectQuery(data.filter((row) => getFieldValue(row, column) !== value)),
    gte: (column: string, value: string) =>
      createSelectQuery(data.filter((row) => String(getFieldValue(row, column) ?? "") >= value)),
    lte: (column: string, value: string) =>
      createSelectQuery(data.filter((row) => String(getFieldValue(row, column) ?? "") <= value)),
    order: (column: string, options?: { ascending?: boolean }) => ({
      range: (start: number, end: number) => {
        const sorted = [...data].sort((left, right) => {
          const leftValue = String(getFieldValue(left, column) ?? "");
          const rightValue = String(getFieldValue(right, column) ?? "");
          const orderResult = leftValue.localeCompare(rightValue, "tr");
          return options?.ascending ? orderResult : -orderResult;
        });

        return Promise.resolve({
          data: sorted.slice(start, end + 1),
          count: sorted.length,
          error: null,
        });
      },
    }),
  };
}

function createHeadCountQuery(data: MockSubmission[]) {
  return {
    eq: (column: string, value: string | boolean) =>
      createHeadCountQuery(data.filter((row) => getFieldValue(row, column) === value)),
    neq: (column: string, value: string | boolean) =>
      Promise.resolve({
        count: data.filter((row) => getFieldValue(row, column) !== value).length,
        error: null,
      }),
  };
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table !== "submissions") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select: (_columns: string, options?: { count?: "exact"; head?: boolean }) => {
          if (options?.head) {
            return createHeadCountQuery(mockRows);
          }

          return createSelectQuery(mockRows);
        },
      };
    },
    rpc: (fn: string) => {
      if (fn !== "get_submission_documents_bucket_stats") {
        throw new Error(`Unexpected rpc ${fn}`);
      }

      if (mockBucketStatsError) {
        return Promise.resolve({ data: null, error: mockBucketStatsError });
      }

      return Promise.resolve({ data: [mockBucketStats], error: null });
    },
    storage: {
      from: () => ({
        createSignedUrl: (path: string) =>
          Promise.resolve({
            data: { signedUrl: `https://signed.example.com/${path}` },
            error: null,
          }),
      }),
    },
  },
}));

function renderPage(initialEntry = "/admin/members?page=1&pageSize=20") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin/members" element={<AdminMembersPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  toast.mockReset();
  windowOpen.mockReset();
  vi.stubGlobal("open", windowOpen);
  mockRows = createMockRows();
  mockRows[44].phone = "+49 123 456 789";
  mockRows[44].documents = [
    {
      url: null,
      path: "member-1-cv.pdf",
      name: "member-1-cv.pdf",
      sizeBytes: 2_048,
      contentType: "application/pdf",
    },
    {
      url: null,
      path: "member-1-portfolio.pdf",
      name: "member-1-portfolio.pdf",
      sizeBytes: 4_096,
      contentType: "application/pdf",
    },
  ];
  mockRows[43].phone = "0555 123 12";
  mockRows[43].document_url = "https://example.com/legacy-doc.pdf";
  mockRows[43].document_name = "legacy-doc.pdf";
  mockRows[42].phone = "";
  mockRows[42].documents = [];
  mockRows[0].status = "archived";
  mockRows[0].fullname = "Archived Member";
  mockRows[43].source_type = "chatbot";
  mockRows[42].source_type = "wa";
  mockBucketStats = {
    bucket_id: "submission-documents",
    file_count: 12,
    total_bytes: 44_564_480,
    file_size_limit: 52_428_800,
    usage_ratio: 0.85,
  };
  mockBucketStatsError = null;
});

describe("AdminMembersPage", () => {
  it("renders a WhatsApp link for valid phone numbers", async () => {
    renderPage();

    const phoneLink = await screen.findByRole("link", { name: "+49 123 456 789" });
    expect(phoneLink).toHaveAttribute("href", "https://wa.me/49123456789");
    expect(phoneLink).toHaveAttribute("target", "_blank");
    expect(phoneLink).toHaveAttribute("rel", "noreferrer");
  });

  it("renders plain text for invalid or empty phone numbers", async () => {
    renderPage();

    await screen.findByText("0555 123 12");
    expect(screen.queryByRole("link", { name: "0555 123 12" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "-" })).not.toBeInTheDocument();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("keeps the selected page when moving to the next page", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Sonraki" }));

    await waitFor(() => {
      expect(screen.getByText("2 / 3")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Önceki" })).toBeEnabled();
  });

  it("shows uploaded documents for the selected submission", async () => {
    renderPage();

    fireEvent.click(await screen.findByText("Member 45"));

    expect(await screen.findByText("Yüklenen Dokümanlar")).toBeInTheDocument();
    expect(screen.getByText("member-1-cv.pdf")).toBeInTheDocument();
    expect(screen.getByText("member-1-portfolio.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Aç" })[0]);
    await waitFor(() => {
      expect(windowOpen).toHaveBeenCalledWith(
        "https://signed.example.com/member-1-cv.pdf",
        "_blank",
        "noopener,noreferrer",
      );
    });
  });

  it("falls back to legacy single-document fields when documents json is empty", async () => {
    mockRows[43].documents = [];
    mockRows[43].document_url = "https://example.com/legacy-doc.pdf";
    mockRows[43].document_name = "legacy-doc.pdf";

    renderPage();

    fireEvent.click(await screen.findByText("Member 44"));

    expect(await screen.findByText("legacy-doc.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aç" }));
    await waitFor(() => {
      expect(windowOpen).toHaveBeenCalledWith(
        "https://example.com/legacy-doc.pdf",
        "_blank",
        "noopener,noreferrer",
      );
    });
  });

  it("shows bucket usage summary with warning status when usage is near the limit", async () => {
    renderPage();

    const summary = await screen.findByTestId("documents-bucket-summary");
    expect(summary).toHaveTextContent("Yüklenen Doküman Kapasitesi");
    expect(summary).toHaveTextContent("Uyarı");
    expect(summary).toHaveTextContent("43 MB");
    expect(summary).toHaveTextContent("50 MB");
    expect(summary).toHaveTextContent("%85");
    expect(summary).toHaveTextContent("12");
  });

  it("shows a critical status when usage crosses the critical threshold", async () => {
    mockBucketStats = {
      ...mockBucketStats,
      total_bytes: 49_807_360,
      usage_ratio: 0.95,
    };

    renderPage();

    expect(await screen.findByText("Kritik")).toBeInTheDocument();
    expect(screen.getByText("%95")).toBeInTheDocument();
  });

  it("shows a fallback message when bucket stats cannot be fetched", async () => {
    mockBucketStatsError = new Error("rpc failed");
    renderPage();

    expect(await screen.findByText("Doküman kapasite özeti şu anda alınamıyor.")).toBeInTheDocument();
  });

  it("excludes archived members from summary counts and the default list", async () => {
    renderPage();

    expect(await screen.findByText("Toplam Üye")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("44")).toBeInTheDocument();
    expect(screen.queryByText("Archived Member")).not.toBeInTheDocument();
    expect(screen.getByText("Toplam 44 kayıt · Seçili 0")).toBeInTheDocument();
  });

  it("shows archived members when the archived status filter is selected", async () => {
    renderPage("/admin/members?page=1&pageSize=20&status=archived");

    expect(await screen.findByText("Archived Member")).toBeInTheDocument();
    expect(screen.queryByText("Member 45")).not.toBeInTheDocument();
    expect(screen.getByText("Toplam 1 kayıt · Seçili 0")).toBeInTheDocument();
  });
});
