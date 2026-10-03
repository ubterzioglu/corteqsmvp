/**
 * M12 · /liderlik sayfası + InviteCard sözleşmesi.
 *
 * Kilitler:
 *   • Sayfa RPC'nin döndürdüğünü AYNEN çizer — istemci tarafı FİLTRE YOK
 *     (sızıntı üçlüsü SQL'in işi, M11; çift kaynak yarışı istemcide filtre
 *     kurmayı yasaklar).
 *   • Anon → liste + giriş yönlendirmesi; girişli → InviteCard.
 *   • Hata GÖRÜNÜR (KR08: sessiz boş liste "kimse yok" sanılır).
 *   • InviteCard: kod + link + kopyala + QR; QR ÜRETİLEMEZSE link çalışmaya
 *     devam eder (ikincil süs).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InviteCard } from "@/components/invites/InviteCard";
import LeaderboardPage from "@/pages/LeaderboardPage";

const leaderboardSpy = vi.fn();
const inviteCodeSpy = vi.fn();
const qrSpy = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/lib/invites-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/invites-api")>();
  return {
    ...actual,
    fetchInviteLeaderboard: (...args: unknown[]) => leaderboardSpy(...args),
    getOrCreateMyInviteCode: (...args: unknown[]) => inviteCodeSpy(...args),
  };
});

vi.mock("@/lib/referral-qr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/referral-qr")>();
  return { ...actual, generateReferralQrPngDataUrl: (...args: unknown[]) => qrSpy(...args) };
});

vi.mock("@/components/auth/useAuth", () => ({ useAuth: () => useAuthMock() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const renderWith = (ui: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

const LEADERBOARD = {
  entries: [
    { display_name: "smddnz", slug: "member-f620", invite_count: 12 },
    { display_name: "judgedredd408", slug: "member-d1a3", invite_count: 3 },
  ],
  badge_tiers: [3, 10, 25],
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthMock.mockReturnValue({ user: null });
  leaderboardSpy.mockResolvedValue(LEADERBOARD);
  inviteCodeSpy.mockResolvedValue({ code: "HKWXK6", created: false });
  qrSpy.mockResolvedValue("data:image/png;base64,QR");
});

describe("LeaderboardPage · liste", () => {
  it("RPC çıktısı AYNEN çizilir — istemci filtre EKLEMEZ", async () => {
    renderWith(<LeaderboardPage />);

    expect(await screen.findByText("smddnz")).toBeInTheDocument();
    expect(screen.getByText("judgedredd408")).toBeInTheDocument();
    expect(screen.getByText("12 davet")).toBeInTheDocument();
    // Rozet eşikleri RPC verisinden: 12 → "10+ davet", 3 → "3+ davet"
    expect(screen.getAllByTestId("leaderboard-badge").map((node) => node.textContent)).toEqual([
      "10+ davet",
      "3+ davet",
    ]);
  });

  it("kaynak kilit: sayfada istemci tarafı görünürlük filtresi YOK", () => {
    const source = readFileSync("src/pages/LeaderboardPage.tsx", "utf8");
    const code = source
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("//"))
      .join("\n");

    expect(code).not.toContain("is_directory_visible");
    expect(code).not.toContain("PLACEHOLDER");
    expect(code).not.toContain("is_admin");
    expect(code).not.toContain(".filter(");
  });

  it("anon → giriş yönlendirmesi; InviteCard çizilmez", async () => {
    renderWith(<LeaderboardPage />);

    expect(await screen.findByRole("link", { name: /Giriş yap \/ üye ol/i })).toHaveAttribute("href", "/login");
    expect(screen.queryByTestId("invite-card")).not.toBeInTheDocument();
  });

  it("girişli üye → InviteCard görünür", async () => {
    useAuthMock.mockReturnValue({ user: { id: "u-1" } });
    renderWith(<LeaderboardPage />);

    expect(await screen.findByTestId("invite-card")).toBeInTheDocument();
  });

  it("boş liste → 'Henüz davet kaydı yok' (sessiz boşluk yok)", async () => {
    leaderboardSpy.mockResolvedValue({ entries: [], badge_tiers: [3, 10, 25] });
    renderWith(<LeaderboardPage />);

    expect(await screen.findByText("Henüz davet kaydı yok")).toBeInTheDocument();
  });

  it("RPC hatası GÖRÜNÜR kart + yeniden dene (KR08)", async () => {
    leaderboardSpy.mockRejectedValue(new Error("permission denied"));
    renderWith(<LeaderboardPage />);

    expect(await screen.findByTestId("leaderboard-error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Yeniden dene/i })).toBeInTheDocument();
  });

  it("rota kayıtlı ve guard'sız (M01 kilidi App tarafında test ediyor — burada kayıt)", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    expect(app).toContain('path="/liderlik"');
    expect(app).toContain('lazyWithReload(() => import("@/pages/LeaderboardPage"))');
  });
});

describe("InviteCard · kod + link + QR", () => {
  it("kod, link ve QR çizilir; QR referral-qr'dan üretilir", async () => {
    renderWith(<InviteCard />);

    expect(await screen.findByTestId("invite-code")).toHaveTextContent("HKWXK6");
    expect(screen.getByTestId("invite-link")).toHaveTextContent("davet=HKWXK6");
    await waitFor(() => expect(qrSpy).toHaveBeenCalledTimes(1));
    expect(await screen.findByTestId("invite-qr")).toHaveAttribute("src", "data:image/png;base64,QR");
  });

  it("kopyala → clipboard; QR üretilemezse link ÇALIŞMAYA DEVAM EDER", async () => {
    qrSpy.mockRejectedValue(new Error("qr patladi"));
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    renderWith(<InviteCard />);

    expect(await screen.findByTestId("invite-code")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId("invite-qr")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Linki kopyala/i }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
  });

  it("kod alınamazsa hata GÖRÜNÜR + yeniden dene (sessiz boş kart yok)", async () => {
    inviteCodeSpy.mockRejectedValue(new Error("Davet kodu için giriş yapmalısın."));
    renderWith(<InviteCard />);

    expect(await screen.findByRole("alert")).toHaveTextContent("giriş yapmalısın");
    expect(screen.getByRole("button", { name: /Yeniden dene/i })).toBeInTheDocument();
  });
});
