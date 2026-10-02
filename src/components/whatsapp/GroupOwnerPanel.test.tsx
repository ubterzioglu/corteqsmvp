/**
 * G21 · Sahip paneli bileşen sözleşmesi.
 *
 * Kilitler: sahip-olmayana panel ÇİZİLMEZ (RPC zaten veri vermez, UI da hiçbir
 * şey göstermez) · skor + eksik adımlar görünür · kuyruk Onayla/Reddet G16
 * RPC'sine düşer · rozet indirme YALNIZ has_approved_badge ile · kaldırma iki
 * adımlı onayla `requestGroupRemoval`'a gider ve sayfayı tazeler (kabul #9 UI
 * yakası: "anında" gizleme sunucu RPC'sinin kendisi — canlı ölçüm batch notunda).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GroupOwnerPanel } from "@/components/whatsapp/GroupOwnerPanel";
import type { OwnerPanelState } from "@/lib/group-owner-panel";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

const fetchOwnerPanelStateSpy = vi.fn();
const ownerUpdateSpy = vi.fn();
const reviewGroupPostSpy = vi.fn();
const requestGroupRemovalSpy = vi.fn();
const downloadBadgeSvgSpy = vi.fn();

vi.mock("@/lib/group-owner-panel", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/group-owner-panel")>();
  return {
    ...actual,
    fetchOwnerPanelState: (...args: unknown[]) => fetchOwnerPanelStateSpy(...args),
    ownerUpdate: (...args: unknown[]) => ownerUpdateSpy(...args),
    reviewGroupPost: (...args: unknown[]) => reviewGroupPostSpy(...args),
    requestGroupRemoval: (...args: unknown[]) => requestGroupRemovalSpy(...args),
    downloadBadgeSvg: (...args: unknown[]) => downloadBadgeSvgSpy(...args),
  };
});

vi.mock("@/components/SearchableCountrySelect", () => ({
  default: (props: { value: string; onChange: (v: string) => void; disabled?: boolean }) => (
    <input aria-label="Ülke autocomplete" value={props.value} disabled={props.disabled} onChange={(e) => props.onChange(e.target.value)} />
  ),
}));

vi.mock("@/components/SearchableCitySelect", () => ({
  default: (props: { value: string; onChange: (v: string) => void; disabled?: boolean }) => (
    <input aria-label="Şehir autocomplete" value={props.value} disabled={props.disabled} onChange={(e) => props.onChange(e.target.value)} />
  ),
}));

const landing = (overrides: Partial<WhatsAppLanding> = {}) =>
  ({
    id: "berlin-grup",
    dbId: "11111111-1111-1111-1111-111111111111",
    groupName: "Berlin Grubu",
    category: "sehir-yasam",
    country: "Almanya",
    city: "Berlin",
    mode: "text",
    tagline: "",
    callToActionText: "",
    conditions: "",
    whatsappLink: "",
    createdAt: "2026-06-01T00:00:00Z",
    ownership: "verified",
    ...overrides,
  }) as WhatsAppLanding;

const ownerState = (overrides: Partial<Extract<OwnerPanelState, { is_owner: true }>> = {}): OwnerPanelState => ({
  is_owner: true,
  landing: {
    group_name: "Berlin Grubu",
    slug: "berlin-grubu",
    listing_status: "published",
    short_description: "Kisa aciklama",
    rules: null,
    category: "sehir-yasam",
    country_code: "DE",
    city_id: null,
    is_global: false,
    hero_image: null,
    tagline: null,
    group_score: 65,
    has_approved_badge: false,
  },
  score: {
    score: 65,
    in_grace: false,
    recommendation_count: 0,
    components: { profile: 15, rules: 0, moderation: 15, link: 15, recommendations: 0, reports: 20 },
  },
  pending_posts: [
    {
      id: "p1",
      body: "Onay bekleyen duyuru",
      author_user_id: "u2",
      created_at: "2026-10-02T10:00:00Z",
      escalate_at: "2026-10-04T10:00:00Z",
    },
  ],
  pending_count: 1,
  ...overrides,
});

const renderPanel = (overrides: Partial<Parameters<typeof GroupOwnerPanel>[0]> = {}) => {
  const onHidden = vi.fn();
  const view = render(
    <GroupOwnerPanel landing={landing()} isSignedIn onHidden={onHidden} {...overrides} />,
  );
  return { onHidden, container: view.container };
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchOwnerPanelStateSpy.mockResolvedValue(ownerState());
  ownerUpdateSpy.mockResolvedValue(undefined);
  reviewGroupPostSpy.mockResolvedValue(undefined);
  requestGroupRemovalSpy.mockResolvedValue(undefined);
});

describe("GroupOwnerPanel · görünürlük", () => {
  it("ownership verified değilse RPC bile çağrılmaz, panel çizilmez", () => {
    const { container } = renderPanel({ landing: landing({ ownership: "unclaimed" }) });

    expect(container.innerHTML).toBe("");
    expect(fetchOwnerPanelStateSpy).not.toHaveBeenCalled();
  });

  it("is_owner:false → panel çizilmez (sızıntı yok)", async () => {
    fetchOwnerPanelStateSpy.mockResolvedValue({ is_owner: false });
    const { container } = renderPanel();

    await waitFor(() => expect(fetchOwnerPanelStateSpy).toHaveBeenCalledTimes(1));
    expect(container.innerHTML).toBe("");
  });

  it("girişsiz ziyaretçiye panel hiç açılmaz", () => {
    const { container } = renderPanel({ isSignedIn: false });

    expect(container.innerHTML).toBe("");
    expect(fetchOwnerPanelStateSpy).not.toHaveBeenCalled();
  });
});

describe("GroupOwnerPanel · skor + eksik adımlar", () => {
  it("skor, altı kalem ve tasarım dili rehber görünür", async () => {
    renderPanel();

    expect(await screen.findByText("Sahip Paneli")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
    for (const item of [
      "Profil (açıklama + kategori + şehir)",
      "Yazılı grup kuralları",
      "Doğrulanmış sahip + 48 saat kuyruk",
      "Çalışan davet linki",
      "Üye tavsiyeleri",
      "Onaylanmış şikayet yok",
    ]) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    expect(screen.getByText(/Kurallarını ekle, \+15/)).toBeInTheDocument();
  });

  it("rozet indirme YALNIZ has_approved_badge ile çizilir", async () => {
    renderPanel();
    expect(await screen.findByText("Sahip Paneli")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Rozet görselini indir/i })).not.toBeInTheDocument();

    const withBadge = ownerState();
    if (withBadge.is_owner) withBadge.landing.has_approved_badge = true;
    fetchOwnerPanelStateSpy.mockResolvedValue(withBadge);
    renderPanel();
    const download = await screen.findAllByRole("button", { name: /Rozet görselini indir/i });
    fireEvent.click(download[download.length - 1]);
    expect(downloadBadgeSvgSpy).toHaveBeenCalledTimes(1);
  });
});

describe("GroupOwnerPanel · onay kuyruğu (G16 RPC)", () => {
  it("bekleyen gönderi listelenir; Onayla → group_post_review(approve)", async () => {
    renderPanel();

    expect(await screen.findByText("Onay bekleyen duyuru")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Onayla/i }));

    await waitFor(() => expect(reviewGroupPostSpy).toHaveBeenCalledWith("p1", "approve"));
  });

  it("Reddet → group_post_review(reject)", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /Reddet/i }));
    await waitFor(() => expect(reviewGroupPostSpy).toHaveBeenCalledWith("p1", "reject"));
  });

  it("kuyruk boşsa bilgi mesajı (48 saat notu her zaman görünür)", async () => {
    fetchOwnerPanelStateSpy.mockResolvedValue(ownerState({ pending_posts: [], pending_count: 0 }));
    renderPanel();

    expect(await screen.findByText("Onay bekleyen gönderi yok.")).toBeInTheDocument();
    expect(screen.getByText(/48 saat içinde bakmazsan/)).toBeInTheDocument();
  });
});

describe("GroupOwnerPanel · kaldırma isteği (kabul #9 UI yakası)", () => {
  it("iki adımlı onay → requestGroupRemoval + onHidden (gerekçe SORULMAZ)", async () => {
    const { onHidden } = renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /Grubu listeden kaldır/i }));
    // Gerekçe alanı YOK — tasarım §3.C
    expect(screen.queryByRole("textbox", { name: /gerekçe/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Evet, listeden kaldır/i }));
    await waitFor(() =>
      expect(requestGroupRemovalSpy).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111"),
    );
    await waitFor(() => expect(onHidden).toHaveBeenCalledTimes(1));
  });

  it("Vazgeç kaldırma RPC'sini çağırmaz", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /Grubu listeden kaldır/i }));
    fireEvent.click(screen.getByRole("button", { name: /Vazgeç/i }));

    expect(requestGroupRemovalSpy).not.toHaveBeenCalled();
  });
});

describe("GroupOwnerPanel · düzenleme", () => {
  it("kayıt ownerUpdate RPC'sine düşer (160 sayaçlı açıklama + kurallar)", async () => {
    renderPanel();

    const desc = await screen.findByLabelText(/Kısa açıklama/i);
    fireEvent.change(desc, { target: { value: "Yeni aciklama" } });
    fireEvent.change(screen.getByLabelText(/Grup kuralları/i), { target: { value: "Reklam yasak" } });
    fireEvent.click(screen.getByRole("button", { name: /Değişiklikleri kaydet/i }));

    await waitFor(() => expect(ownerUpdateSpy).toHaveBeenCalledTimes(1));
    const params = ownerUpdateSpy.mock.calls[0][0];
    expect(params.shortDescription).toBe("Yeni aciklama");
    expect(params.rules).toBe("Reklam yasak");
    expect(params.landingDbId).toBe("11111111-1111-1111-1111-111111111111");
  });
});
