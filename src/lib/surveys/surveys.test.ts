import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { buildAutoDateSlug } from "./surveys";

describe("buildAutoDateSlug", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-13T10:00:00Z"));
    fromMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the base slug when no survey uses it yet", async () => {
    const like = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn(() => ({ like }));
    fromMock.mockReturnValue({ select });

    await expect(buildAutoDateSlug()).resolves.toBe("anket-20260913");
  });

  it("appends the next free numeric suffix when the base slug is taken", async () => {
    const like = vi.fn().mockResolvedValue({
      data: [{ slug: "anket-20260913" }, { slug: "anket-20260913-2" }],
      error: null,
    });
    const select = vi.fn(() => ({ like }));
    fromMock.mockReturnValue({ select });

    await expect(buildAutoDateSlug()).resolves.toBe("anket-20260913-3");
  });

  it("throws on a query error", async () => {
    const like = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const select = vi.fn(() => ({ like }));
    fromMock.mockReturnValue({ select });

    await expect(buildAutoDateSlug()).rejects.toEqual({ message: "boom" });
  });
});
