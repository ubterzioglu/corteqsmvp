/**
 * M13 · davet taşıyıcısı + redeem karakterizasyonu.
 *
 * 🔴 KAYIT AKIŞI KUTSALDIR: bu testler "davet başarısız olsa bile akış devam
 * eder" sözünü kilitler — redeemInviteCodeSafely ASLA fırlatmaz, takeInviteCarrier
 * kodu ne olursa olsun SİLER (zehirli kod sonsuz döngüde denenmez).
 *
 * İdempotans SQL'de (M11 invited_user_id UNIQUE) — istemcide sayaç/durum YOK
 * (M03/M04 dersi; kaynak kilidi aşağıda).
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redeemRpcSpy = vi.fn();
const reportSpy = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: (...args: unknown[]) => redeemRpcSpy(...args) },
  isSupabaseConfigured: true,
}));

vi.mock("@/lib/client-error-reports", () => ({
  reportClientError: (...args: unknown[]) => reportSpy(...args),
}));

vi.mock("@/components/auth/useAuth", () => ({ useAuth: () => useAuthMock() }));

import {
  INVITE_CARRIER_STORAGE_KEY,
  captureInviteCarrier,
  redeemInviteCodeSafely,
  takeInviteCarrier,
} from "@/lib/invites-api";
import { useInviteRedemption } from "@/hooks/use-invite-redemption";

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  redeemRpcSpy.mockResolvedValue({ data: { redeemed: true, already: false }, error: null });
  useAuthMock.mockReturnValue({ user: null });
});

describe("M13 · taşıyıcı (capture → take)", () => {
  it("?davet= yakalanır ve NORMALİZE saklanır (SAFE_CHARS)", () => {
    captureInviteCarrier("?davet=ab12cd&x=1");

    expect(window.localStorage.getItem(INVITE_CARRIER_STORAGE_KEY)).toBe("AB12CD");
  });

  it("kod yoksa mevcut taşıyıcıya DOKUNMAZ (oturumlar arası korunur)", () => {
    window.localStorage.setItem(INVITE_CARRIER_STORAGE_KEY, "ESKIKOD");

    captureInviteCarrier("?baska=1");
    captureInviteCarrier("");

    expect(window.localStorage.getItem(INVITE_CARRIER_STORAGE_KEY)).toBe("ESKIKOD");
  });

  it("take okur VE SİLER (tek kullanım); ikinci take null", () => {
    window.localStorage.setItem(INVITE_CARRIER_STORAGE_KEY, "HKWXK6");

    expect(takeInviteCarrier()).toBe("HKWXK6");
    expect(window.localStorage.getItem(INVITE_CARRIER_STORAGE_KEY)).toBeNull();
    expect(takeInviteCarrier()).toBeNull();
  });

  it("bozuk taşıyıcı içeriği null döner ve SİLİNİR (zehirli kod döngüsü yok)", () => {
    window.localStorage.setItem(INVITE_CARRIER_STORAGE_KEY, "!!!bozuk!!!");

    // normalizeReferralCode fırlatır → take null dönmeli (takeInviteCarrier
    // try/catch içinde siler... silme normalize'dan ÖNCE olmalı ki zehirli kod
    // kalıcılaşmasın):
    expect(takeInviteCarrier()).toBeNull();
    expect(window.localStorage.getItem(INVITE_CARRIER_STORAGE_KEY)).toBeNull();
  });
});

describe("M13 · redeemInviteCodeSafely — asla fırlatmaz", () => {
  it("başarı → true, RPC doğru kodla çağrılır", async () => {
    await expect(redeemInviteCodeSafely("HKWXK6")).resolves.toBe(true);
    expect(redeemRpcSpy).toHaveBeenCalledWith("redeem_invite_code", { p_code: "HKWXK6" });
  });

  it("geçersiz kod → false + reportClientError (throw YOK — kayıt düşmez)", async () => {
    redeemRpcSpy.mockResolvedValue({ data: null, error: { message: "invite_code_not_found" } });

    await expect(redeemInviteCodeSafely("YOK123")).resolves.toBe(false);
    expect(reportSpy).toHaveBeenCalledWith(
      expect.objectContaining({ context: "redeemInviteCodeSafely" }),
    );
  });

  it("kendi kodu → false, sessiz (beklenen durum)", async () => {
    redeemRpcSpy.mockResolvedValue({ data: null, error: { message: "invite_self_not_allowed" } });

    await expect(redeemInviteCodeSafely("KENDI1")).resolves.toBe(false);
  });

  it("ağ patlarsa bile reject YOK — false döner (sözleşme: asla fırlatma)", async () => {
    redeemRpcSpy.mockRejectedValue(new Error("fetch failed"));

    await expect(redeemInviteCodeSafely("HKWXK6")).resolves.toBe(false);
    expect(reportSpy).toHaveBeenCalled();
  });
});

describe("M13 · useInviteRedemption — oturum kurulunca bir kez", () => {
  it("mount'ta URL'deki ?davet= yakalanır (capture effect davranış kilidi)", () => {
    // M5 mutasyon dersi: App-kaynak kilidi hook GÖVDESİNDEKİ capture çağrısını
    // korumuyordu — davranıştan kilitlenir (gerçek URL → storage).
    window.history.replaceState({}, "", "/?davet=abc123");
    useAuthMock.mockReturnValue({ user: null });

    renderHook(() => useInviteRedemption());

    expect(window.localStorage.getItem(INVITE_CARRIER_STORAGE_KEY)).toBe("ABC123");
    window.history.replaceState({}, "", "/");
  });

  it("user yok → RPC çağrılmaz, taşıyıcı DURUR (kayıp yok)", () => {
    window.localStorage.setItem(INVITE_CARRIER_STORAGE_KEY, "HKWXK6");
    useAuthMock.mockReturnValue({ user: null });

    renderHook(() => useInviteRedemption());

    expect(redeemRpcSpy).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(INVITE_CARRIER_STORAGE_KEY)).toBe("HKWXK6");
  });

  it("user geldi → kod tüketilir, RPC bir kez, taşıyıcı silinir", async () => {
    window.localStorage.setItem(INVITE_CARRIER_STORAGE_KEY, "hkwxk6");
    useAuthMock.mockReturnValue({ user: { id: "u-1" } });

    renderHook(() => useInviteRedemption());

    await vi.waitFor(() =>
      expect(redeemRpcSpy).toHaveBeenCalledWith("redeem_invite_code", { p_code: "HKWXK6" }),
    );
    expect(window.localStorage.getItem(INVITE_CARRIER_STORAGE_KEY)).toBeNull();
  });

  it("redeem hata verse hook ÇÖKMEZ (render tamamlanır — kayıt akışı kutsal)", async () => {
    window.localStorage.setItem(INVITE_CARRIER_STORAGE_KEY, "YOK123");
    redeemRpcSpy.mockResolvedValue({ data: null, error: { message: "invite_code_not_found" } });
    useAuthMock.mockReturnValue({ user: { id: "u-1" } });

    const view = renderHook(() => useInviteRedemption());

    await vi.waitFor(() => expect(reportSpy).toHaveBeenCalled());
    // Hook undefined döner (çökmedi) ve ikinci render'da taşıyıcı yok → no-op
    expect(view.result.current).toBeUndefined();
    expect(redeemRpcSpy).toHaveBeenCalledTimes(1);
    view.rerender();
    expect(redeemRpcSpy).toHaveBeenCalledTimes(1);
  });

  it("taşıyıcı yokken user gelirse RPC çağrılmaz (her oturumda boş deneme yok)", () => {
    useAuthMock.mockReturnValue({ user: { id: "u-1" } });

    renderHook(() => useInviteRedemption());

    expect(redeemRpcSpy).not.toHaveBeenCalled();
  });
});

describe("M13 · App kablolaması (kaynak sözleşmesi)", () => {
  it("InviteRedemption AuthProvider İÇİNDE mount — kayıt akışına dokunmaz", async () => {
    const { readFileSync } = await import("node:fs");
    const app = readFileSync("src/App.tsx", "utf8");

    const authIdx = app.indexOf("<AuthProvider>");
    const inviteIdx = app.indexOf("<InviteRedemption />");
    const suspIdx = app.indexOf("<Suspense");
    expect(authIdx).toBeGreaterThan(-1);
    expect(inviteIdx).toBeGreaterThan(authIdx);
    expect(inviteIdx).toBeLessThan(suspIdx);
    // Bileşen null çizer — Routes'a müdahale yok
    expect(app).toContain("const InviteRedemption = () => {\n  useInviteRedemption();\n  return null;\n};");
  });
});
