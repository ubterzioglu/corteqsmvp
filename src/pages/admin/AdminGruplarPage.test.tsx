/**
 * G24 · M5 Moderatör paneli sayfa sözleşmesi (KR08 kalıbı).
 *
 * Kilitler: rota · navigasyon · route-meta ÜÇÜ birden kayıtlı (N03 bayatlama
 * kapanı) · dört kuyruk + kısayollar (A/R/J/K) · şikayet kuyruğu G14'e dek
 * bilinçli boş (uydurma şema yok) · hızlı şerit anahtarı group_settings'e yazar
 * · yükleme hatası GÖRÜNÜR (KR08: sessiz boş liste "kuyruk boş" sanılır).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { communitiesNavGroup } from "@/lib/admin-shell/admin-navigation-registry/communities";

const ROUTE = "/admin/gruplar";

const read = (path: string) => readFileSync(path, "utf8");

const summarySpy = vi.fn();
const groupsSpy = vi.fn();
const claimsSpy = vi.fn();
const postsSpy = vi.fn();
const decideGroupSpy = vi.fn();
const decideClaimSpy = vi.fn();
const decidePostSpy = vi.fn();
const strikeSpy = vi.fn();
const fastLaneSpy = vi.fn();
const screenshotSpy = vi.fn();

vi.mock("@/lib/admin-shell/group-moderation-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-shell/group-moderation-api")>();
  return {
    ...actual,
    fetchGroupModeratorSummary: () => summarySpy(),
    fetchPendingGroups: () => groupsSpy(),
    fetchPendingClaims: () => claimsSpy(),
    fetchPendingPosts: () => postsSpy(),
    decidePendingGroup: (...args: unknown[]) => decideGroupSpy(...args),
    decideClaim: (...args: unknown[]) => decideClaimSpy(...args),
    decidePost: (...args: unknown[]) => decidePostSpy(...args),
    recordStrike: (...args: unknown[]) => strikeSpy(...args),
    setFastLaneEnabled: (...args: unknown[]) => fastLaneSpy(...args),
    createClaimScreenshotUrl: (...args: unknown[]) => screenshotSpy(...args),
  };
});

// sonner test ortamında yok sayılır (KR08 deseni)
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const summary = (overrides: Record<string, unknown> = {}) => ({
  pending_groups: 1,
  pending_claims: 1,
  pending_posts: 1,
  pending_reports: 0,
  moderated_count: 10,
  fast_lane_suggest_threshold: 100,
  fast_lane_enabled: false,
  task_runs: [
    { jobname: "group_link_health", schedule: "23 * * * *", last_status: "succeeded", last_end_time: new Date().toISOString() },
  ],
  ...overrides,
});

const groupRow = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "test-grup",
  group_name: "Test Grup",
  category: "sehir-yasam",
  country: "Almanya",
  city: "Berlin",
  short_description: "Aciklama",
  review_flags: ["vize"],
  submitted_as_admin: false,
  platform: "whatsapp",
  created_at: new Date().toISOString(),
};

const claimRow = {
  id: "22222222-2222-2222-2222-222222222222",
  landing_id: groupRow.id,
  user_id: "33333333-3333-3333-3333-333333333333",
  method: "screenshot",
  status: "pending",
  screenshot_path: "33333333-3333-3333-3333-333333333333/screenshot-x.png",
  review_note: null,
  is_contested: true,
  platform_name_read: "Test Grup",
  created_at: new Date().toISOString(),
  group_name: "Test Grup",
};

const postRow = {
  id: "44444444-4444-4444-4444-444444444444",
  landing_id: groupRow.id,
  author_user_id: "33333333-3333-3333-3333-333333333333",
  body: "Onay bekleyen platform gonderisi",
  post_status: "pending_platform",
  created_at: new Date().toISOString(),
  escalate_at: null,
  group_name: "Test Grup",
};

const renderPage = async () => {
  const page = await import("@/pages/admin/AdminGruplarPage");
  const AdminGruplarPage = page.default;
  return render(<AdminGruplarPage />);
};

beforeEach(() => {
  vi.clearAllMocks();
  summarySpy.mockResolvedValue(summary());
  groupsSpy.mockResolvedValue([groupRow]);
  claimsSpy.mockResolvedValue([claimRow]);
  postsSpy.mockResolvedValue([postRow]);
  decideGroupSpy.mockResolvedValue(undefined);
  decideClaimSpy.mockResolvedValue(undefined);
  decidePostSpy.mockResolvedValue(undefined);
  strikeSpy.mockResolvedValue("warning");
  fastLaneSpy.mockResolvedValue(undefined);
  screenshotSpy.mockResolvedValue("https://signed.example/kanit");
});

describe("G24 · kayıt üçlüsü (rota · navigasyon · route-meta)", () => {
  it("üçü birden kayıtlı (KR08 deseni)", () => {
    expect(read("src/pages/admin/routes.tsx")).toContain('path="gruplar"');
    expect(read("src/pages/admin/routes.tsx")).toContain('import("@/pages/admin/AdminGruplarPage")');
    expect(communitiesNavGroup.items.some((item) => item.to === ROUTE)).toBe(true);
    expect(read("src/lib/admin-shell/admin-route-meta.ts")).toContain(`"${ROUTE}"`);
  });

  it("nav öğesi communities grubunda ve accent uyumlu", () => {
    const item = communitiesNavGroup.items.find((entry) => entry.to === ROUTE);

    expect(item?.accent).toBe("rose");
    expect(item?.aliases?.length).toBeGreaterThan(0);
  });
});

describe("G24 · dört kuyruk tek ekranda", () => {
  it("üst şerit sayaçları + kuyruklar yüklenir", async () => {
    await renderPage();

    expect(await screen.findByText("Grup Moderasyonu")).toBeInTheDocument();
    expect(screen.getByText("Test Grup")).toBeInTheDocument();
    // Sayaçlar
    expect(screen.getByText("Yeni gruplar")).toBeInTheDocument();
    expect(screen.getByText("Sahiplik talepleri")).toBeInTheDocument();
    expect(screen.getByText("Şikayetler")).toBeInTheDocument();
    expect(screen.getByText("Gönderi kuyruğu")).toBeInTheDocument();
    expect(screen.getByText("10 / 100")).toBeInTheDocument();
  });

  it("işaretler (review_flags) kartta görünür — hızlı şeridi kapatan kanıt", async () => {
    await renderPage();

    expect(await screen.findByText("işaret: vize")).toBeInTheDocument();
  });

  it("şikayet kuyruğu G14'e dek BİLİNÇLİ boş (uydurma şema yok)", async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole("tab", { name: /Şikayetler/ }));
    expect(screen.getByText(/group_reports.*henüz yok|G14 batch'inde açılacak/)).toBeInTheDocument();
  });

  it("görev koşuları şeritte — 'succeeded' ETKİ kanıtı değil notu ile", async () => {
    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Görev koşuları/ }));
    expect(screen.getByText("group_link_health")).toBeInTheDocument();
    expect(screen.getByText(/Radar dersi/)).toBeInTheDocument();
  });
});

describe("G24 · kararlar", () => {
  it("Onayla → set_group_status_v1 yolu (decidePendingGroup)", async () => {
    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Onayla \(A\)/ }));
    await waitFor(() => expect(decideGroupSpy).toHaveBeenCalledWith(groupRow.id, "approve"));
  });

  it("Reddet → hazır sebep listesi açılır, notla birleşip gider", async () => {
    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Reddet \(R\)/ }));
    expect(screen.getByText(/Reddet: Test Grup/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reddi onayla/ }));
    await waitFor(() => expect(decideGroupSpy).toHaveBeenCalledWith(groupRow.id, "reject", undefined));
  });

  it("klavye: A onaylar, J/K seçimi taşır, R reddi açar", async () => {
    await renderPage();
    await screen.findByRole("button", { name: /Onayla \(A\)/ });

    fireEvent.keyDown(window, { key: "a" });
    await waitFor(() => expect(decideGroupSpy).toHaveBeenCalledWith(groupRow.id, "approve"));

    fireEvent.keyDown(window, { key: "r" });
    expect(await screen.findByText(/Reddet: Test Grup/)).toBeInTheDocument();

    // Input odaklıyken kısayol ÇALIŞMAZ (not yazarken 'a' kararı tetiklemesin)
    decideGroupSpy.mockClear();
    const note = screen.getByLabelText(/Not \(bildirime/);
    fireEvent.keyDown(note, { key: "a" });
    expect(decideGroupSpy).not.toHaveBeenCalled();
  });

  it("sahiplik kuyruğu: ekran görüntüsü imzalı URL ile açılır", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    await renderPage();

    await user.click(await screen.findByRole("tab", { name: /Sahiplik/ }));
    await user.click(await screen.findByRole("button", { name: /Ekran görüntüsünü aç/ }));

    await waitFor(() => expect(screenshotSpy).toHaveBeenCalledWith(claimRow.screenshot_path));
    await waitFor(() => expect(openSpy).toHaveBeenCalledWith("https://signed.example/kanit", "_blank", "noopener,noreferrer"));
    expect(await screen.findByText(/ÇEKİŞMELİ/)).toBeInTheDocument();
    openSpy.mockRestore();
  });

  it("gönderi kuyruğu: Onayla → group_post_review", async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole("tab", { name: /Gönderiler/ }));
    await user.click(await screen.findByRole("button", { name: /Onayla \(A\)/ }));
    await waitFor(() => expect(decidePostSpy).toHaveBeenCalledWith(postRow.id, "approve"));
  });

  it("Uyarı ver → strike merdiveni (gerekçe zorunlu)", async () => {
    await renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Uyarı ver/ }));
    fireEvent.change(screen.getByLabelText(/Gerekçe/), { target: { value: "Grup Sozune aykiri" } });
    fireEvent.click(screen.getByRole("button", { name: /Uyarıyı kaydet/ }));

    await waitFor(() => expect(strikeSpy).toHaveBeenCalledWith(groupRow.id, "Grup Sozune aykiri", null));
  });
});

describe("G24 · hızlı şerit anahtarı group_settings'e yazar", () => {
  it("Switch → admin_set_group_setting (setFastLaneEnabled)", async () => {
    await renderPage();

    const toggle = await screen.findByRole("switch", { name: /Hızlı şerit/i });
    fireEvent.click(toggle);

    await waitFor(() => expect(fastLaneSpy).toHaveBeenCalledWith(true));
  });

  it("eşik dolunca 'hızlı şeridi aç' önerisi görünür (tasarım §2: karar insanın)", async () => {
    summarySpy.mockResolvedValue(summary({ moderated_count: 100, fast_lane_enabled: false }));
    await renderPage();

    expect(await screen.findByText(/hızlı şeridi açmayı/i)).toBeInTheDocument();
  });
});

describe("G24 · hata görünürlüğü (KR08 dersi)", () => {
  it("yükleme hatası GÖRÜNÜR kart + toast — sessiz boş liste YOK", async () => {
    summarySpy.mockRejectedValue(new Error("permission denied for function group_moderator_summary"));
    await renderPage();

    expect(await screen.findByText(/yönetici yetkisi gerekiyor olabilir/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Yeniden dene/ })).toBeInTheDocument();
  });
});
