/**
 * G06b · OrgVerificationRequestCard davranış testleri.
 *
 * Kilitlenen akış (G06a ölçümü: 262 kurumsal kaydın 249'unda kişi bağı YOK):
 *   • bağ sahibi (isOwner) → belge formu görünür, talep gönderilir
 *   • bağı OLMAYAN → "önce kaydı sahiplen" yolu, belge formu GÖRÜNMEZ
 *   • zaten doğrulanmış → yalnız bilgi, form yok
 *   • belgesiz submit → "en az bir belge" (RPC çağrılmaz)
 *   • RPC not_linked derse (bayat sahip statüsü) → claim yoluna düşer
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();
const claimMutate = vi.fn();

vi.mock("@/lib/org-verification-api", () => ({
  ORG_VERIFICATION_ACCEPT: ".pdf,.jpg,.jpeg,.png,.webp",
  ORG_VERIFICATION_MAX_DOCUMENTS: 5,
  validateOrgVerificationFile: () => null,
  isOrgVerificationNotLinkedError: (e: unknown) =>
    String((e as Error)?.message ?? "").includes("org_verification_not_linked"),
  orgVerificationErrorMessage: (e: unknown) => (e as Error)?.message ?? "hata",
  requestOrgVerification: (...args: unknown[]) => requestMock(...args),
}));

vi.mock("@/hooks/useSubmitCatalogClaim", () => ({
  useSubmitCatalogClaim: () => ({
    mutate: claimMutate,
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  }),
}));

import OrgVerificationRequestCard from "./OrgVerificationRequestCard";

const renderCard = (props: Partial<React.ComponentProps<typeof OrgVerificationRequestCard>> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(
    <OrgVerificationRequestCard
      itemId="item-1"
      slug="dernek-x"
      isVerified={false}
      isOwner
      canClaim
      {...props}
    />,
    { wrapper },
  );
};

const fileNamed = (name: string, size = 1024) => new File(["x".repeat(Math.min(size, 8))], name, { type: "application/pdf" });

describe("OrgVerificationRequestCard", () => {
  beforeEach(() => {
    requestMock.mockReset();
    claimMutate.mockReset();
  });

  it("bağ sahibi → belge formu görünür (dosya girişi + gönder düğmesi)", () => {
    renderCard({ isOwner: true });
    expect(screen.getByLabelText(/Belgeler/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Doğrulama Talebini Gönder/i })).toBeInTheDocument();
    // claim-first yolu GÖRÜNMEZ
    expect(screen.queryByRole("button", { name: /Önce Kaydı Sahiplen/i })).not.toBeInTheDocument();
  });

  it("bağı OLMAYAN → 'önce kaydı sahiplen' yolu, belge formu YOK", () => {
    renderCard({ isOwner: false, canClaim: true });
    expect(screen.getByRole("button", { name: /Önce Kaydı Sahiplen/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Belgeler/i)).not.toBeInTheDocument();
    expect(screen.getByText(/önce kaydı temsil yetkisi almalısın/i)).toBeInTheDocument();
  });

  it("bağı olmayan + canClaim=false → sahiplenme kapalı mesajı (düğme yok)", () => {
    renderCard({ isOwner: false, canClaim: false });
    expect(screen.queryByRole("button", { name: /Önce Kaydı Sahiplen/i })).not.toBeInTheDocument();
    expect(screen.getByText(/sahiplenme talebi şu anda kapalı/i)).toBeInTheDocument();
  });

  it("zaten doğrulanmış → yalnız bilgi, form ve claim YOK", () => {
    renderCard({ isVerified: true, isOwner: true });
    expect(screen.getByText(/Bu kayıt doğrulanmış/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Belgeler/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Doğrulama Talebini Gönder/i })).not.toBeInTheDocument();
  });

  it("belgesiz submit → 'en az bir belge' uyarısı, RPC çağrılmaz", () => {
    renderCard({ isOwner: true });
    fireEvent.click(screen.getByRole("button", { name: /Doğrulama Talebini Gönder/i }));
    expect(screen.getByText(/En az bir belge yüklemelisin/i)).toBeInTheDocument();
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("belge seçilip gönderilince requestOrgVerification çağrılır + başarı mesajı", async () => {
    requestMock.mockResolvedValue("claim-123");
    renderCard({ isOwner: true });

    const input = screen.getByLabelText(/Belgeler/i) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fileNamed("tuzuk.pdf")] } });
    fireEvent.click(screen.getByRole("button", { name: /Doğrulama Talebini Gönder/i }));

    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("item-1", expect.any(Array), ""));
    await waitFor(() =>
      expect(screen.getByText(/Doğrulama talebin yönetici onayına gönderildi/i)).toBeInTheDocument(),
    );
  });

  it("RPC not_linked derse (bayat sahip) → claim yoluna düşer", async () => {
    requestMock.mockRejectedValue(new Error("org_verification_not_linked"));
    renderCard({ isOwner: true });

    const input = screen.getByLabelText(/Belgeler/i) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fileNamed("tuzuk.pdf")] } });
    fireEvent.click(screen.getByRole("button", { name: /Doğrulama Talebini Gönder/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Önce Kaydı Sahiplen/i })).toBeInTheDocument(),
    );
  });

  it("5'ten fazla belge → istemci ön kontrolü düşürür (RPC çağrılmaz)", () => {
    renderCard({ isOwner: true });
    const input = screen.getByLabelText(/Belgeler/i) as HTMLInputElement;
    const six = Array.from({ length: 6 }, (_, i) => fileNamed(`b${i}.pdf`));
    fireEvent.change(input, { target: { files: six } });
    expect(screen.getByText(/En fazla 5 belge yükleyebilirsin/i)).toBeInTheDocument();
    // Gönder düğmesi validationError yüzünden pasif
    expect(screen.getByRole("button", { name: /Doğrulama Talebini Gönder/i })).toBeDisabled();
  });
});
