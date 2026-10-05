/**
 * A11 · useAdminAccess sözleşme testi.
 *
 * Kök neden: syncSession her onAuthStateChange olayında setStatus("checking") yapıyordu.
 * Düzeltme: aynı kullanıcı zaten "authorized" ise checking'e DÜŞME.
 *
 * Test: authorized iken aynı kullanıcı için TOKEN_REFRESHED/SIGNED_IN olayı → durum değişmez.
 * Farklı kullanıcı → checking.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock'ları hoist
const { userIsAdminMock, onAuthStateChangeMock, getSessionMock } = vi.hoisted(() => ({
  userIsAdminMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  getSessionMock: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({
  userIsAdmin: userIsAdminMock,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: onAuthStateChangeMock,
      getSession: getSessionMock,
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

import { useAdminAccess } from "./useAdminAccess";

describe("useAdminAccess — A11 sekme değişince kapanmasın", () => {
  let authChangeCallback: ((event: string, session: any) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    authChangeCallback = null;

    // onAuthStateChange callback'i yakala
    onAuthStateChangeMock.mockImplementation((callback) => {
      authChangeCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // İlk session yok
    getSessionMock.mockResolvedValue({ data: { session: null } });
  });

  it("authorized iken aynı kullanıcı için TOKEN_REFRESHED → durum değişmez", async () => {
    const userId = "user-123";
    const session = { user: { id: userId } } as any;

    // İlk session: admin
    getSessionMock.mockResolvedValue({ data: { session } });
    userIsAdminMock.mockResolvedValue(true);

    const { result } = renderHook(() => useAdminAccess());

    // Başlangıç: loading → authorized
    await waitFor(() => {
      expect(result.current.status).toBe("authorized");
    });

    const initialCallCount = userIsAdminMock.mock.calls.length;

    // Token yenilendi (aynı kullanıcı)
    await act(async () => {
      authChangeCallback?.("TOKEN_REFRESHED", session);
    });

    // Durum HÂLÂ authorized (checking'e düşmedi)
    expect(result.current.status).toBe("authorized");
    // userIsAdmin çağrılmadı (kısa devre)
    expect(userIsAdminMock.mock.calls.length).toBe(initialCallCount);
  });

  it("authorized iken aynı kullanıcı için SIGNED_IN → durum değişmez", async () => {
    const userId = "user-456";
    const session = { user: { id: userId } } as any;

    getSessionMock.mockResolvedValue({ data: { session } });
    userIsAdminMock.mockResolvedValue(true);

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current.status).toBe("authorized");
    });

    const initialCallCount = userIsAdminMock.mock.calls.length;

    // Aynı kullanıcı için SIGNED_IN
    await act(async () => {
      authChangeCallback?.("SIGNED_IN", session);
    });

    expect(result.current.status).toBe("authorized");
    // userIsAdmin çağrılmadı (kısa devre)
    expect(userIsAdminMock.mock.calls.length).toBe(initialCallCount);
  });

  it("farklı kullanıcı → checking'e düşer", async () => {
    const session1 = { user: { id: "user-1" } } as any;
    const session2 = { user: { id: "user-2" } } as any;

    getSessionMock.mockResolvedValue({ data: { session: session1 } });
    userIsAdminMock.mockResolvedValue(true);

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current.status).toBe("authorized");
    });

    // Farklı kullanıcı
    userIsAdminMock.mockResolvedValue(true);
    await act(async () => {
      authChangeCallback?.("SIGNED_IN", session2);
    });

    // checking'e düştü (sonra authorized olacak)
    await waitFor(() => {
      expect(result.current.status).toBe("authorized");
    });

    // userIsAdmin İKİ KEZ çağrıldı (her kullanıcı için)
    expect(userIsAdminMock).toHaveBeenCalledTimes(2);
  });

  it("çıkış → unauthenticated", async () => {
    const session = { user: { id: "user-789" } } as any;

    getSessionMock.mockResolvedValue({ data: { session } });
    userIsAdminMock.mockResolvedValue(true);

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current.status).toBe("authorized");
    });

    // Çıkış
    await act(async () => {
      authChangeCallback?.("SIGNED_OUT", null);
    });

    expect(result.current.status).toBe("unauthenticated");
  });

  it("denied iken aynı kullanıcı için TOKEN_REFRESHED → checking'e düşer", async () => {
    const userId = "user-999";
    const session = { user: { id: userId } } as any;

    getSessionMock.mockResolvedValue({ data: { session } });
    userIsAdminMock.mockResolvedValue(false); // admin değil

    const { result } = renderHook(() => useAdminAccess());

    await waitFor(() => {
      expect(result.current.status).toBe("denied");
    });

    const initialCallCount = userIsAdminMock.mock.calls.length;

    // Token yenilendi (aynı kullanıcı)
    await act(async () => {
      authChangeCallback?.("TOKEN_REFRESHED", session);
    });

    // denied olduğu için checking'e düştü (authorized değil)
    await waitFor(() => {
      expect(result.current.status).toBe("denied");
    });

    // userIsAdmin tekrar çağrıldı (kısa devre yok çünkü authorized değil)
    expect(userIsAdminMock.mock.calls.length).toBeGreaterThan(initialCallCount);
  });
});
