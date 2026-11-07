// getCurrentUserId — beş lib modülündeki birebir `currentUserId` kopyasının ortak hâli (W3, 07.11).
// Sözleşme: oturum yoksa null döner, FIRLATMAZ (çağıranlar null'u kendisi ele alır).

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: getUserMock } },
}));

import { getCurrentUserId } from "@/lib/auth-api";

describe("getCurrentUserId", () => {
  beforeEach(() => {
    getUserMock.mockReset();
  });

  it("oturumdaki kullanıcının kimliğini döner", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u-1" } }, error: null });
    await expect(getCurrentUserId()).resolves.toBe("u-1");
  });

  it("oturum yoksa null döner", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    await expect(getCurrentUserId()).resolves.toBeNull();
  });

  it("getUser hata dönse de fırlatmaz, null döner", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: "Auth session missing!" } });
    await expect(getCurrentUserId()).resolves.toBeNull();
  });
});
