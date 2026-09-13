import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

import { getRebuildStatusReport } from "./durum-raporu-api";

describe("getRebuildStatusReport", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("calls the get_rebuild_status_report RPC and returns its data", async () => {
    rpcMock.mockResolvedValue({ data: { roles_total: 76 }, error: null });

    const result = await getRebuildStatusReport();

    expect(rpcMock).toHaveBeenCalledWith("get_rebuild_status_report");
    expect(result).toEqual({ roles_total: 76 });
  });

  it("throws on RPC error", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });

    await expect(getRebuildStatusReport()).rejects.toEqual({ message: "boom" });
  });
});
