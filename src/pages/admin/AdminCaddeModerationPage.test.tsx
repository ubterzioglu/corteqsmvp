import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCaddeModerationPage from "@/pages/admin/AdminCaddeModerationPage";
import type { CaddeModerationQueueItem } from "@/lib/cadde-moderation-api";

const listModerationQueueMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/cadde-moderation-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-moderation-api")>("@/lib/cadde-moderation-api");
  return {
    ...actual,
    listModerationQueue: (...args: unknown[]) => listModerationQueueMock(...args),
  };
});

const makeItem = (overrides: Partial<CaddeModerationQueueItem> = {}): CaddeModerationQueueItem => ({
  id: "q1",
  entityType: "post",
  entityId: "post-1",
  reason: "spam içerik",
  status: "open",
  reportCount: 3,
  createdAt: "2026-06-11T10:00:00.000Z",
  resolutionNote: null,
  ...overrides,
});

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminCaddeModerationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("AdminCaddeModerationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders open queue items with report count and actions", async () => {
    listModerationQueueMock.mockResolvedValue([makeItem()]);

    renderPage();

    expect(await screen.findByText(/Sebep: spam içerik/)).toBeInTheDocument();
    expect(screen.getByText("3 rapor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gizle/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sahibini Banla/ })).toBeInTheDocument();
  });

  it("filters by entity type", async () => {
    listModerationQueueMock.mockResolvedValue([makeItem(), makeItem({ id: "q2", entityType: "cafe", entityId: "cafe-1", reason: "uygunsuz cafe adı" })]);

    renderPage();

    expect(await screen.findByText(/Sebep: spam içerik/)).toBeInTheDocument();
    screen.getByRole("button", { name: "Cafe" }).click();
    expect(await screen.findByText(/uygunsuz cafe adı/)).toBeInTheDocument();
  });

  it("shows an empty state when the queue is clear", async () => {
    listModerationQueueMock.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/Açık moderasyon kaydı yok/)).toBeInTheDocument();
  });
});
