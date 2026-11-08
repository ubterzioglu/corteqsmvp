import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMyFeedbackMock, submitFeedbackMock } = vi.hoisted(() => ({
  fetchMyFeedbackMock: vi.fn(),
  submitFeedbackMock: vi.fn(),
}));

vi.mock("@/lib/feedback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feedback")>();
  return { ...actual, fetchMyFeedback: fetchMyFeedbackMock, submitFeedback: submitFeedbackMock };
});

vi.mock("@/components/auth/useAuth", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));

import ProfileFeedbackPanel from "@/components/profile/ProfileFeedbackPanel";

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/profile"]}>
        <ProfileFeedbackPanel />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMyFeedbackMock.mockResolvedValue([]);
});

describe("ProfileFeedbackPanel", () => {
  it("geçmiş boşken Türkçe boş durum metnini gösterir", async () => {
    renderPanel();
    expect(await screen.findByText("Henüz geri bildirim göndermedin.")).toBeInTheDocument();
  });

  it("geçmiş kayıtları tarih ve Türkçe durum etiketiyle listeler", async () => {
    fetchMyFeedbackMock.mockResolvedValue([
      {
        id: "f-1",
        body: "Profil çok güzel.",
        pagePath: "/profile",
        status: "okundu",
        createdAt: "2026-11-01T09:00:00.000Z",
      },
      {
        id: "f-2",
        body: "Arama bozuk.",
        pagePath: "/directory",
        status: "arsiv",
        createdAt: "2026-10-20T09:00:00.000Z",
      },
    ]);

    renderPanel();

    expect(await screen.findByText("Profil çok güzel.")).toBeInTheDocument();
    expect(screen.getByText("Okundu")).toBeInTheDocument();
    expect(screen.getByText("Arşiv")).toBeInTheDocument();
  });

  it("boş metinde göndermez ve Türkçe hata gösterir", async () => {
    renderPanel();
    await userEvent.click(await screen.findByRole("button", { name: "Gönder" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Yorum boş bırakılamaz.");
    expect(submitFeedbackMock).not.toHaveBeenCalled();
  });

  it("gönderimde sayfa yolu olarak mevcut pathname'i kullanır ve geçmişi yeniler", async () => {
    submitFeedbackMock.mockResolvedValue(undefined);
    renderPanel();

    await userEvent.type(await screen.findByLabelText("Geri bildirim metni"), "Yeni bir fikrim var.");
    await userEvent.click(screen.getByRole("button", { name: "Gönder" }));

    await waitFor(() => expect(submitFeedbackMock).toHaveBeenCalledWith("Yeni bir fikrim var.", "/profile"));
    await waitFor(() => expect(fetchMyFeedbackMock.mock.calls.length).toBeGreaterThanOrEqual(2));
    expect(await screen.findByRole("status")).toHaveTextContent(/Teşekkürler/);
  });

  it("gönderim hatasını gösterir", async () => {
    submitFeedbackMock.mockRejectedValue(new Error("Feedback gönderilemedi."));
    renderPanel();

    await userEvent.type(await screen.findByLabelText("Geri bildirim metni"), "Deneme");
    await userEvent.click(screen.getByRole("button", { name: "Gönder" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Feedback gönderilemedi.");
  });
});
