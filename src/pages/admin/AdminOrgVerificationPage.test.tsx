/**
 * G07 · AdminOrgVerificationPage davranış testleri.
 * Kilitler: kuyruk çizimi · belge önizleme imzalı bağlantıyla (createSignedUrl) ·
 * Onayla → review(approve) · Ret sebep ZORUNLU (sebepsiz Ret pasif) · boş kuyruk ·
 * hata durumu görünür.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchQueueMock = vi.fn();
const reviewMock = vi.fn();
const openDocMock = vi.fn();

vi.mock("@/lib/admin/org-verification-review-api", () => ({
  fetchOrgVerificationQueue: (...a: unknown[]) => fetchQueueMock(...a),
  reviewOrgVerification: (...a: unknown[]) => reviewMock(...a),
  openOrgVerificationDocumentUrl: (...a: unknown[]) => openDocMock(...a),
}));

import AdminOrgVerificationPage from "./AdminOrgVerificationPage";

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<AdminOrgVerificationPage />, { wrapper });
};

const pendingRow = (over: Partial<Record<string, unknown>> = {}) => ({
  claim_id: "claim-1",
  item_id: "item-1",
  item_title: "G07 Test Derneği",
  item_slug: "g07-dernek",
  requested_by_user_id: "req-1",
  requester_name: "Ayşe Temsilci",
  note: "Tüzük ekte",
  doc_paths: ["req-1/item-1/tuzuk.pdf"],
  status: "pending",
  review_reason: null,
  created_at: "2026-10-03T10:00:00Z",
  reviewed_at: null,
  reviewed_by_user_id: null,
  ...over,
});

// window.open jsdom'da yok — mock'la.
beforeEach(() => {
  fetchQueueMock.mockReset();
  reviewMock.mockReset();
  openDocMock.mockReset();
  vi.stubGlobal("open", vi.fn());
});

describe("AdminOrgVerificationPage", () => {
  it("bekleyen talebi künyesiyle çizer (başlık + talep eden + belge)", async () => {
    fetchQueueMock.mockResolvedValue([pendingRow()]);
    renderPage();

    expect(await screen.findByText("G07 Test Derneği")).toBeInTheDocument();
    expect(screen.getByText(/Ayşe Temsilci/)).toBeInTheDocument();
    expect(screen.getByText(/Belgeler \(1\)/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tuzuk.pdf/i })).toBeInTheDocument();
  });

  it("belge önizleme imzalı bağlantıyla açılır (openOrgVerificationDocumentUrl + window.open)", async () => {
    fetchQueueMock.mockResolvedValue([pendingRow()]);
    openDocMock.mockResolvedValue("https://signed.example/tuzuk?token=abc");
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /tuzuk.pdf/i }));
    await waitFor(() => expect(openDocMock).toHaveBeenCalledWith("req-1/item-1/tuzuk.pdf"));
    await waitFor(() => expect(globalThis.open).toHaveBeenCalledWith(
      "https://signed.example/tuzuk?token=abc",
      "_blank",
      "noopener,noreferrer",
    ));
  });

  it("Onayla → reviewOrgVerification(claimId, true, sebep)", async () => {
    fetchQueueMock.mockResolvedValue([pendingRow()]);
    reviewMock.mockResolvedValue(undefined);
    renderPage();

    fireEvent.change(await screen.findByPlaceholderText(/Ret sebebi/i), {
      target: { value: "Belgeler tam" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Onayla/i }));
    await waitFor(() => expect(reviewMock).toHaveBeenCalledWith("claim-1", true, "Belgeler tam"));
  });

  it("Ret sebep ZORUNLU — sebepsiz Ret düğmesi pasif (migration reason_required ile uyumlu)", async () => {
    fetchQueueMock.mockResolvedValue([pendingRow()]);
    renderPage();

    const rejectBtn = await screen.findByRole("button", { name: /Reddet/i });
    expect(rejectBtn).toBeDisabled(); // sebep boş
    fireEvent.change(screen.getByPlaceholderText(/Ret sebebi/i), {
      target: { value: "Belge yetersiz" },
    });
    expect(rejectBtn).not.toBeDisabled();
  });

  it("Ret (sebeple) → reviewOrgVerification(claimId, false, sebep)", async () => {
    fetchQueueMock.mockResolvedValue([pendingRow()]);
    reviewMock.mockResolvedValue(undefined);
    renderPage();

    fireEvent.change(await screen.findByPlaceholderText(/Ret sebebi/i), {
      target: { value: "Belge yetersiz" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Reddet/i }));
    await waitFor(() => expect(reviewMock).toHaveBeenCalledWith("claim-1", false, "Belge yetersiz"));
  });

  it("boş kuyruk → 'Bekleyen ... yok' (sessiz boş panel değil)", async () => {
    fetchQueueMock.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/Bekleyen kurumsal doğrulama talebi yok/i)).toBeInTheDocument();
  });

  it("hata durumunda görünür mesaj (admin yetkisi yoksa)", async () => {
    fetchQueueMock.mockRejectedValue(new Error("org_verification_review_auth_required"));
    renderPage();

    expect(await screen.findByText(/Kuyruk okunamadı/i)).toBeInTheDocument();
  });
});
