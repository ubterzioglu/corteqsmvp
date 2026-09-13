import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { listReferralCodeUsages, listReferralCodes } from "./admin-referral-api";

describe("admin-referral-api S4 additions", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("listReferralCodes: hata dönerse sessizce boş liste döner (davranış korunumu)", async () => {
    const limit = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const order = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ order }));
    fromMock.mockReturnValue({ select });

    await expect(listReferralCodes()).resolves.toEqual([]);
  });

  it("listReferralCodes: satırları olduğu gibi döner", async () => {
    const limit = vi.fn().mockResolvedValue({ data: [{ id: "code-1" }], error: null });
    const order = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ order }));
    fromMock.mockReturnValue({ select });

    await expect(listReferralCodes()).resolves.toEqual([{ id: "code-1" }]);
  });

  it("listReferralCodeUsages: hata varsa fırlatır", async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: "yok" } });
    const inFn = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ in: inFn }));
    fromMock.mockReturnValue({ select });

    await expect(listReferralCodeUsages(["code-1"])).rejects.toEqual({ message: "yok" });
  });

  it("listReferralCodeUsages: id listesiyle sorgular", async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: "u1", referral_code_id: "code-1" }], error: null });
    const inFn = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ in: inFn }));
    fromMock.mockReturnValue({ select });

    const result = await listReferralCodeUsages(["code-1"]);
    expect(inFn).toHaveBeenCalledWith("referral_code_id", ["code-1"]);
    expect(result).toEqual([{ id: "u1", referral_code_id: "code-1" }]);
  });
});
