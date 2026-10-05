/**
 * G14 · "Şikayet et" bileşen sözleşmesi (G20'nin "yok" kilidinin ÇEVRİLMİŞ hâli).
 *
 * Kilitler: girişsiz → giriş akışı (RPC'ye gitmez) · kendi grubunda ve yayında
 * olmayan grupta düğme ÇİZİLMEZ · telefon/yaş/bekleme durumunda DÜRÜST metin, form
 * açılmaz · uygun hesapta 8 sebep (politika §4 + Diğer) · "Diğer" açıklamasız
 * gönderilemez · sunucu hatası GÖRÜNÜR.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GroupReportButton } from "@/components/whatsapp/GroupReportButton";
import { GroupReportError, type GroupReportState } from "@/lib/group-reports-api";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

const stateSpy = vi.fn();
const submitSpy = vi.fn();

vi.mock("@/lib/group-reports-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/group-reports-api")>();
  return {
    ...actual,
    fetchGroupReportState: (...args: unknown[]) => stateSpy(...args),
    submitGroupReport: (...args: unknown[]) => submitSpy(...args),
  };
});

const DB_ID = "11111111-1111-4111-8111-111111111111";

const landing = { id: "berlin-grup", dbId: DB_ID, groupName: "Berlin Grubu" } as unknown as WhatsAppLanding;

const state = (overrides: Partial<GroupReportState> = {}): GroupReportState => ({
  own_group: false,
  published: true,
  phone_required: false,
  account_too_new: false,
  cooldown_until: null,
  can_report: true,
  ...overrides,
});

const renderButton = (isSignedIn = true) => {
  const onRequestSignIn = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <GroupReportButton landing={landing} isSignedIn={isSignedIn} onRequestSignIn={onRequestSignIn} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { onRequestSignIn, container: view.container };
};

beforeEach(() => {
  vi.clearAllMocks();
  stateSpy.mockResolvedValue(state());
  submitSpy.mockResolvedValue({ report_id: "r1", group_hidden: false });
});

describe("GroupReportButton · görünürlük (G14: düğme VAR)", () => {
  it("girişsiz → 'Giriş yap ve şikayet et' giriş akışını başlatır, durum RPC'si ATILMAZ", () => {
    const { onRequestSignIn } = renderButton(false);

    fireEvent.click(screen.getByRole("button", { name: /Giriş yap ve şikayet et/ }));
    expect(onRequestSignIn).toHaveBeenCalledTimes(1);
    expect(stateSpy).not.toHaveBeenCalled();
  });

  it("uygun hesapta 'Şikayet et' çizilir", async () => {
    renderButton();

    expect(await screen.findByRole("button", { name: /^Şikayet et$/ })).toBeInTheDocument();
    expect(stateSpy).toHaveBeenCalledWith(DB_ID);
  });

  it("KENDİ grubunda düğme çizilmez", async () => {
    stateSpy.mockResolvedValue(state({ own_group: true, can_report: false }));
    const { container } = renderButton();

    await waitFor(() => expect(stateSpy).toHaveBeenCalled());
    await waitFor(() => expect(container.innerHTML).toBe(""));
  });

  it("yayında olmayan grupta çizilmez", async () => {
    stateSpy.mockResolvedValue(state({ published: false, can_report: false }));
    const { container } = renderButton();

    await waitFor(() => expect(container.innerHTML).toBe(""));
  });
});

describe("GroupReportButton · dürüst durum metinleri (form açılmaz)", () => {
  it("telefon doğrulanmamış → 'Şikayet için telefon doğrulaması gerekir' + profil bağlantısı", async () => {
    stateSpy.mockResolvedValue(state({ phone_required: true, can_report: false }));
    renderButton();

    expect(await screen.findByText("Şikayet için telefon doğrulaması gerekir.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Profiline git/ })).toHaveAttribute("href", "/profile");
    expect(screen.queryByRole("button", { name: /^Şikayet et$/ })).not.toBeInTheDocument();
  });

  it("hesap çok yeni → sebep yazılır", async () => {
    stateSpy.mockResolvedValue(state({ account_too_new: true, can_report: false }));
    renderButton();

    expect(await screen.findByText(/Hesabın çok yeni/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Şikayet et$/ })).not.toBeInTheDocument();
  });

  it("bekleme süresi → tekrar gönderilemez, tarih yazılır", async () => {
    stateSpy.mockResolvedValue(state({ cooldown_until: "2026-11-04T10:00:00Z", can_report: false }));
    renderButton();

    expect(await screen.findByText(/tarihinden sonra gönderilebilir/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Şikayet et$/ })).not.toBeInTheDocument();
  });

  it("durum okunamazsa hata GÖRÜNÜR (sessiz boş yok)", async () => {
    stateSpy.mockRejectedValue(new GroupReportError("group_report_group_not_found", "Grup bulunamadı."));
    renderButton();

    expect(await screen.findByRole("alert")).toHaveTextContent("Grup bulunamadı.");
  });
});

describe("GroupReportButton · gönderim", () => {
  it("8 sebep (7 kırmızı çizgi + Diğer); sebep seçilmeden gönderilemez", async () => {
    renderButton();
    fireEvent.click(await screen.findByRole("button", { name: /^Şikayet et$/ }));

    expect(screen.getAllByRole("radio")).toHaveLength(8);
    expect(screen.getByRole("button", { name: /Şikayeti gönder/ })).toBeDisabled();
  });

  it("'Diğer' açıklamasız gönderilemez; açıklamayla gider", async () => {
    renderButton();
    fireEvent.click(await screen.findByRole("button", { name: /^Şikayet et$/ }));

    fireEvent.click(screen.getByLabelText("Diğer (açıklama zorunlu)"));
    const send = screen.getByRole("button", { name: /Şikayeti gönder/ });
    expect(send).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Açıklama/), { target: { value: "Sürekli reklam" } });
    expect(send).not.toBeDisabled();
    fireEvent.click(send);

    await waitFor(() =>
      expect(submitSpy).toHaveBeenCalledWith({ landingId: DB_ID, reason: "diger", note: "Sürekli reklam" }),
    );
    expect(await screen.findByText(/Şikayetin alındı/)).toBeInTheDocument();
  });

  it("sunucu reddi kullanıcıya YAZILIR", async () => {
    submitSpy.mockRejectedValue(new GroupReportError("group_report_cooldown", "Bu gruba yakın zamanda şikayet gönderdin."));
    renderButton();
    fireEvent.click(await screen.findByRole("button", { name: /^Şikayet et$/ }));
    fireEvent.click(screen.getByLabelText("Nefret, şiddet, taciz veya yetişkin içerik"));
    fireEvent.click(screen.getByRole("button", { name: /Şikayeti gönder/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("yakın zamanda şikayet gönderdin");
  });
});
