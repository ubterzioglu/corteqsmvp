import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchFeedbackListMock, promoteMock, toastMock } = vi.hoisted(() => ({
  fetchFeedbackListMock: vi.fn(),
  promoteMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));

vi.mock("@/lib/feedback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feedback")>();
  return {
    ...actual,
    fetchFeedbackList: fetchFeedbackListMock,
    promoteFeedbackToRevision: promoteMock,
  };
});

vi.mock("@/lib/admin-shell/revision-requests", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-shell/revision-requests")>();
  return { ...actual, fetchUserEmails: vi.fn().mockResolvedValue({}) };
});

import AdminFeedbackPage from "@/pages/admin/AdminFeedbackPage";

const baseRow = {
  body: "Cadde yavaş açılıyor.",
  pagePath: "/cadde",
  status: "yeni" as const,
  createdBy: "member-1",
  createdAt: "2026-11-01T09:00:00.000Z",
  updatedAt: "2026-11-01T09:00:00.000Z",
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(client, "invalidateQueries");
  const view = render(
    <QueryClientProvider client={client}>
      <AdminFeedbackPage />
    </QueryClientProvider>,
  );
  return { ...view, invalidateSpy };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminFeedbackPage — REV'e taşı", () => {
  it("onay verilirse RPC'yi satır kimliğiyle çağırır, iki listeyi yeniler, toast'ta ve etikette REV numarasını gösterir", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fetchFeedbackListMock.mockResolvedValue([{ ...baseRow, id: "f-1", promotedRevisionId: null }]);
    promoteMock.mockImplementation(async () => {
      // Sunucu terfiyi işledi: yenilenen liste artık promoted_revision_id taşır.
      fetchFeedbackListMock.mockResolvedValue([{ ...baseRow, id: "f-1", promotedRevisionId: "r-1" }]);
      return { revisionId: "r-1", revisionNumber: 91 };
    });

    const { invalidateSpy } = renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /REV'e taşı/ }));

    await waitFor(() => expect(promoteMock).toHaveBeenCalledWith("f-1"));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ description: "#REV-091" })));
    const keys = invalidateSpy.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(keys).toContain(JSON.stringify(["member-feedback"]));
    expect(keys).toContain(JSON.stringify(["revision-requests"]));
    expect(await screen.findByText("REV'e taşındı · #REV-091")).toBeInTheDocument();
  });

  it("onay reddedilirse RPC çağrılmaz", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    fetchFeedbackListMock.mockResolvedValue([{ ...baseRow, id: "f-1", promotedRevisionId: null }]);

    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /REV'e taşı/ }));

    expect(promoteMock).not.toHaveBeenCalled();
  });

  it("zaten taşınmış satırda düğme yerine 'REV'e taşındı' etiketi çizer", async () => {
    fetchFeedbackListMock.mockResolvedValue([{ ...baseRow, id: "f-2", promotedRevisionId: "r-9" }]);

    renderPage();

    expect(await screen.findByText("REV'e taşındı")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /REV'e taşı$/ })).not.toBeInTheDocument();
  });
});
