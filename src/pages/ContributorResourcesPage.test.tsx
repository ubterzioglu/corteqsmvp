import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import ContributorResourcesPage from "@/pages/ContributorResourcesPage";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  submit: vi.fn(),
  profile: { isLoading: false, errorMessage: null, profile: { roleKey: "User_Contributor" } },
}));

vi.mock("@/hooks/useCurrentUserProfile", () => ({
  useCurrentUserProfile: () => mocks.profile,
}));

vi.mock("@/lib/contributor-resource-submissions", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/contributor-resource-submissions")>();
  return {
    ...original,
    listMyContributorResourceSubmissions: mocks.list,
    submitContributorResourceSubmission: mocks.submit,
  };
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ContributorResourcesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ContributorResourcesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profile = { isLoading: false, errorMessage: null, profile: { roleKey: "User_Contributor" } };
    mocks.list.mockResolvedValue([]);
    mocks.submit.mockResolvedValue("submission-id");
  });

  it("shows the contributor form and own empty history", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Şehrinden Kaynak Öner" })).toBeInTheDocument();
    expect(screen.getByLabelText("Kaynak adı")).toBeInTheDocument();
    expect(await screen.findByText("Henüz gönderdiğin kaynak yok.")).toBeInTheDocument();
  });

  it("submits a validated source through the contributor RPC", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Şehrinden Kaynak Öner" });

    fireEvent.change(screen.getByLabelText("Kaynak adı"), { target: { value: "Berlin Türk Kitabevi" } });
    fireEvent.change(screen.getByLabelText("Ülke"), { target: { value: "Almanya" } });
    fireEvent.change(screen.getByLabelText("Şehir"), { target: { value: "Berlin" } });
    fireEvent.change(screen.getByLabelText("Birincil kaynak adresi"), { target: { value: "https://example.org/berlin" } });
    fireEvent.change(screen.getByLabelText("Neden faydalı?"), { target: { value: "Şehirde Türkçe kitap bulunan güvenilir bir yer." } });
    fireEvent.click(screen.getByRole("button", { name: "İncelemeye gönder" }));

    await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
    expect(mocks.submit.mock.calls[0][0]).toMatchObject({ city: "Berlin", resourceType: "business" });
  });

  it("does not render the intake form for a non-contributor role", () => {
    mocks.profile = { isLoading: false, errorMessage: null, profile: { roleKey: "User_Standard" } };
    renderPage();

    expect(screen.getByText("Bu alan Contributor hesabına açık.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Kaynak adı")).not.toBeInTheDocument();
  });
});
