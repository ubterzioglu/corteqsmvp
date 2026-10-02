/**
 * G20 · "Bu grup sizin mi?" bileşen sözleşmesi (tasarım §3.B UI yakası).
 *
 * Kilitler:
 *   • verified grupta bölüm HİÇ çizilmez (otomatik devir yok — §3.B.6).
 *   • Girişsiz kullanıcı RPC'ye değil OAuth'a düşer (G02 giriş kapısı deseni).
 *   • Kod yolu: kod + talimat + "Kontrol et"; verified → onVerified + tasarımın
 *     "Kodu artık silebilirsin" cümlesi; exhausted → ekran görüntüsü yolu AÇILIR.
 *   • Bekleyen talep sayfa açılışında geri yüklenir (kod/screenshot ayrımıyla).
 *   • "Şikayet et" YOK — backend'i G14'te (ölü düğme çizilmez).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GroupOwnershipClaim } from "@/components/whatsapp/GroupOwnershipClaim";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

const fetchMyPendingClaimSpy = vi.fn();
const startClaimCodeSpy = vi.fn();
const verifyClaimCodeSpy = vi.fn();
const submitClaimScreenshotSpy = vi.fn();

vi.mock("@/lib/group-claims", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/group-claims")>();
  return {
    ...actual,
    fetchMyPendingClaim: (...args: unknown[]) => fetchMyPendingClaimSpy(...args),
    startClaimCode: (...args: unknown[]) => startClaimCodeSpy(...args),
    verifyClaimCode: (...args: unknown[]) => verifyClaimCodeSpy(...args),
    submitClaimScreenshot: (...args: unknown[]) => submitClaimScreenshotSpy(...args),
  };
});

const landing = (overrides: Partial<WhatsAppLanding> = {}) =>
  ({
    id: "berlin-grup",
    dbId: "11111111-1111-1111-1111-111111111111",
    groupName: "Berlin Grubu",
    category: "hobi",
    country: "Almanya",
    city: "Berlin",
    mode: "text",
    tagline: "",
    callToActionText: "",
    conditions: "",
    whatsappLink: "",
    createdAt: "2026-06-01T00:00:00Z",
    ownership: "unclaimed",
    ...overrides,
  }) as WhatsAppLanding;

const renderClaim = (overrides: Partial<Parameters<typeof GroupOwnershipClaim>[0]> = {}) => {
  const onRequestSignIn = vi.fn();
  const onVerified = vi.fn();
  const view = render(
    <GroupOwnershipClaim
      landing={landing()}
      isSignedIn
      onRequestSignIn={onRequestSignIn}
      onVerified={onVerified}
      {...overrides}
    />,
  );
  return { onRequestSignIn, onVerified, container: view.container };
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchMyPendingClaimSpy.mockResolvedValue(null);
  startClaimCodeSpy.mockResolvedValue({
    claim_id: "22222222-2222-2222-2222-222222222222",
    code: "CQ4821",
    expires_at: new Date(Date.now() + 600_000).toISOString(),
    reused: false,
  });
  verifyClaimCodeSpy.mockResolvedValue({ result: "verified" });
});

describe("GroupOwnershipClaim · görünürlük", () => {
  it("verified grupta HİÇ çizilmez", () => {
    const { container } = renderClaim({ landing: landing({ ownership: "verified" }) });

    expect(container.innerHTML).toBe("");
    expect(fetchMyPendingClaimSpy).not.toHaveBeenCalled();
  });

  it("claim_pending grupta çizilir (doğrulama henüz bitmemiş)", () => {
    renderClaim({ landing: landing({ ownership: "claim_pending" }) });

    expect(screen.getByText("Bu grup sizin mi?")).toBeInTheDocument();
  });

  it("'Şikayet et' YOK — backend G14'te, ölü düğme çizilmez", () => {
    renderClaim();

    expect(screen.queryByText(/Şikayet/i)).not.toBeInTheDocument();
  });
});

describe("GroupOwnershipClaim · giriş kapısı", () => {
  it("girişsiz tıklama RPC'ye değil OAuth'a düşer", async () => {
    const { onRequestSignIn } = renderClaim({ isSignedIn: false });

    fireEvent.click(screen.getByRole("button", { name: /Kod ile doğrula/i }));

    expect(onRequestSignIn).toHaveBeenCalledTimes(1);
    expect(startClaimCodeSpy).not.toHaveBeenCalled();
  });
});

describe("GroupOwnershipClaim · kod yolu (tasarım §3.B 1-5)", () => {
  it("kod talebi → kod + talimat + Kontrol et", async () => {
    renderClaim();

    fireEvent.click(screen.getByRole("button", { name: /Kod ile doğrula/i }));

    await waitFor(() => expect(startClaimCodeSpy).toHaveBeenCalledWith(landing().dbId));
    expect(await screen.findByText("CQ4821")).toBeInTheDocument();
    // Talimat cümlesi tasarım §3.B.2 ("Grup adının sonuna … ekle, sonra Kontrol
    // et'e bas") — kod kutusunda da başarı mesajında da geçer, en az bir eşleşme.
    expect(screen.getAllByText(/Grup adının sonuna/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Kontrol et/i })).toBeInTheDocument();
  });

  it("verified sonucu → onVerified + 'Kodu artık silebilirsin'", async () => {
    const { onVerified } = renderClaim();

    fireEvent.click(screen.getByRole("button", { name: /Kod ile doğrula/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Kontrol et/i }));

    await waitFor(() => expect(verifyClaimCodeSpy).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Kodu artık silebilirsin/)).toBeInTheDocument();
    expect(onVerified).toHaveBeenCalledTimes(1);
  });

  it("not_found → kalan deneme yazılır", async () => {
    verifyClaimCodeSpy.mockResolvedValue({ result: "not_found", attempts_left: 2, exhausted: false });
    renderClaim();

    fireEvent.click(screen.getByRole("button", { name: /Kod ile doğrula/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Kontrol et/i }));

    expect(await screen.findByText(/Kalan deneme: 2/)).toBeInTheDocument();
  });

  it("denemeler tükenince ekran görüntüsü yolu AÇILIR", async () => {
    verifyClaimCodeSpy.mockResolvedValue({ result: "not_found", attempts_left: 0, exhausted: true });
    renderClaim();

    fireEvent.click(screen.getByRole("button", { name: /Kod ile doğrula/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Kontrol et/i }));

    expect(await screen.findByRole("button", { name: /Talebi gönder/i })).toBeInTheDocument();
    expect(screen.getByText(/moderatör kuyruğuna düşer/i)).toBeInTheDocument();
  });

  it("bekleyen kod talebi sayfa açılışında geri yüklenir (yeniden kod ÜRETİLMEZ)", async () => {
    fetchMyPendingClaimSpy.mockResolvedValue({
      id: "33333333-3333-3333-3333-333333333333",
      method: "code",
      status: "pending",
      code: "CQ0007",
      code_expires_at: new Date(Date.now() + 300_000).toISOString(),
      attempt_count: 1,
    });
    renderClaim();

    expect(await screen.findByText("CQ0007")).toBeInTheDocument();
    expect(startClaimCodeSpy).not.toHaveBeenCalled();
  });
});

describe("GroupOwnershipClaim · ekran görüntüsü yolu", () => {
  it("bekleyen screenshot talebi → kuyruk mesajı, yeni talep formu YOK", async () => {
    fetchMyPendingClaimSpy.mockResolvedValue({
      id: "44444444-4444-4444-4444-444444444444",
      method: "screenshot",
      status: "pending",
      code: null,
      code_expires_at: null,
      attempt_count: 0,
    });
    renderClaim();

    expect(await screen.findByText(/moderatör kuyruğunda/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Kod ile doğrula/i })).not.toBeInTheDocument();
  });

  it("dosya seçilmeden 'Talebi gönder' etkinleşmez; gönderim RPC'ye düşer", async () => {
    submitClaimScreenshotSpy.mockResolvedValue("55555555-5555-5555-5555-555555555555");
    renderClaim();

    fireEvent.click(screen.getByRole("button", { name: /Ekran görüntüsüyle kanıtla/i }));
    const submit = await screen.findByRole("button", { name: /Talebi gönder/i });
    expect(submit).toBeDisabled();

    const file = new File(["kanıt"], "panel.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText(/ekran görüntüsü/i), { target: { files: [file] } });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);
    await waitFor(() => expect(submitClaimScreenshotSpy).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Talebin moderatör kuyruğuna düştü/)).toBeInTheDocument();
  });
});
