import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminSubmissionsPage from "./AdminSubmissionsPage";
import type { Submission } from "@/lib/submissions";

const fetchSubmissionsMock = vi.fn();
const updateSubmissionStatusMock = vi.fn();
const getAdminSubmissionDocumentUrlMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/admin/admin-submissions-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin/admin-submissions-api")>(
    "@/lib/admin/admin-submissions-api",
  );
  return {
    ...actual,
    fetchSubmissions: (...args: unknown[]) => fetchSubmissionsMock(...args),
    updateSubmissionStatus: (...args: unknown[]) => updateSubmissionStatusMock(...args),
    getAdminSubmissionDocumentUrl: (...args: unknown[]) =>
      getAdminSubmissionDocumentUrlMock(...args),
  };
});

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
    documents: [{ name: "cv.pdf", path: "2026/cv.pdf" }],
    document_url: null,
    document_name: null,
    referral_source: "linkedin",
    referral_detail: "CorteQS paylaşımı",
    referral_code: "LISCTY-ABC123",
    ...overrides,
  }) as Submission;

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminSubmissionsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("AdminSubmissionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateSubmissionStatusMock.mockResolvedValue(undefined);
    getAdminSubmissionDocumentUrlMock.mockResolvedValue("https://signed.example/cv.pdf");
  });

  it("listeyi ve detay dialogunda açıklama, ihtiyaç, referral ve ekleri gösterir", async () => {
    fetchSubmissionsMock.mockResolvedValue([makeSubmission()]);

    renderPage();

    expect(await screen.findByText("Ayşe Yılmaz")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Detay" }));

    expect((await screen.findAllByText("İş Arıyorum")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Mentorluk ihtiyacım var")).toBeInTheDocument();
    expect(screen.getByText(/LISCTY-ABC123/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cv.pdf/ })).toBeInTheDocument();
  });

  it("dosyası olmayan kayıtta açık bir boş durum gösterir", async () => {
    fetchSubmissionsMock.mockResolvedValue([
      makeSubmission({ id: "submission-2", fullname: "Can Kaya", documents: [] }),
    ]);

    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Detay" }));

    expect(await screen.findByText("Ek dosya yok.")).toBeInTheDocument();
  });

  it("is ariyorum sorgusuyla İş Arıyorum kaydını bulur", async () => {
    fetchSubmissionsMock.mockResolvedValue([
      makeSubmission(),
      makeSubmission({ id: "submission-2", fullname: "Can Kaya", description: "Yatırımcıyım" }),
    ]);

    renderPage();
    await screen.findByText("Can Kaya");
    await userEvent.type(screen.getByRole("searchbox", { name: "Başvurularda ara" }), "is ariyorum");

    await waitFor(() => expect(screen.queryByText("Can Kaya")).not.toBeInTheDocument());
    expect(screen.getByText("Ayşe Yılmaz")).toBeInTheDocument();
  });
});
