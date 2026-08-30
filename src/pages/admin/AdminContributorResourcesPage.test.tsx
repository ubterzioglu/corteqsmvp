import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminContributorResourcesPage from "@/pages/admin/AdminContributorResourcesPage";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  review: vi.fn(),
}));

vi.mock("@/lib/contributor-resource-submissions", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/contributor-resource-submissions")>();
  return {
    ...original,
    listContributorResourceSubmissions: mocks.list,
    createContributorResourceSubmission: mocks.create,
    reviewContributorResourceSubmission: mocks.review,
  };
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminContributorResourcesPage />
    </QueryClientProvider>,
  );
}

describe("AdminContributorResourcesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue([]);
  });

  it("shows the source intake contract and an empty review queue", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Contributor Kaynak Kuyruğu" })).toBeInTheDocument();
    expect(screen.getByLabelText("Kaynak türü")).toBeInTheDocument();
    expect(screen.getByLabelText("Birincil kaynak adresi")).toBeInTheDocument();
    expect(screen.getByText("Henüz kaynak gönderimi yok")).toBeInTheDocument();
  });
});
