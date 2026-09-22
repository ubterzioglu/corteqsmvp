import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: rpcMock },
}));

import { searchPublicContent, searchStaticTools } from "@/lib/public-content-search";

describe("searchPublicContent", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("iki karakterden kisa sorguda ag istegi atmaz", async () => {
    await expect(searchPublicContent(" a ")).resolves.toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("blog sonucunu public hedefe map eder ve sorguyu sinirlar", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          content_type: "blog",
          external_id: "blog-1",
          slug: "almanya-butce",
          title: "Almanya'da bütçe",
          description: "Kira ve gündelik giderler",
          href: "/blog/almanya-butce",
          match_rank: 1,
        },
      ],
      error: null,
    });

    await expect(searchPublicContent("  Almanya  ", 99)).resolves.toEqual(
      expect.arrayContaining([{
        type: "blog",
        id: "blog-1",
        title: "Almanya'da bütçe",
        description: "Kira ve gündelik giderler",
        href: "/blog/almanya-butce",
      }]),
    );
    expect(rpcMock).toHaveBeenCalledWith("search_public_content", {
      p_search_text: "Almanya",
      p_limit: 24,
    });
  });

  it("RPC hatasini cagirana aktarir", async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error("search failed") });

    await expect(searchPublicContent("almanya")).rejects.toThrow("search failed");
  });
});

describe("searchStaticTools", () => {
  it("Turkce katlamayla maas aracini bulur", () => {
    expect(searchStaticTools("MAAŞ")).toEqual([
      expect.objectContaining({
        type: "tool",
        title: "Maaş Hesaplama (Almanya)",
        href: "/tools/maas-hesaplama-almanya",
      }),
      expect.objectContaining({
        type: "tool",
        title: "StepStone Maaş Karşılaştırma (Almanya)",
        href: "/tools/stepstone-karsilastirma-almanya",
      }),
    ]);
  });

  it("iki karakterden kisa sorguyu ve gecersiz limiti reddeder", () => {
    expect(searchStaticTools("a")).toEqual([]);
    expect(searchStaticTools("almanya", 0)).toEqual([]);
  });
});
