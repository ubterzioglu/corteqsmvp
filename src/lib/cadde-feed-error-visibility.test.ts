// Feed okuma yolunda hata görünürlüğü sözleşmesi — 04.08.2026 canlı denetimi bulgusu.
//
// `listCaddeFeed` catch bloğu hatayı `reportCaddeApiError`'a verip `{ items: [], nextPage: null }`
// DÖNÜYORDU. React Query açısından bu BAŞARILI bir sorgudur: `feedQuery.isError` hiçbir zaman
// true olmaz. Sonuç zinciri:
//   1. RLS reddi / RPC parametre hatası / ağ sorunu → boş dizi
//   2. CaddePage → feedItems.length === 0 → "Bu akış henüz sessiz."
//   3. Kullanıcı sistemin bozuk olduğunu değil, içeriğin olmadığını görür
//
// Canlıda feed 9 posta düştüğü için bu ayrım gözle de fark edilemiyordu. Doğru kalıp okuma
// yüzeyinin TAMAMI için: hatayı `caddeReadError` ile logla ve FIRLAT; boş sonuç yalnız
// gerçekten içerik yokken dönsün.

import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CaddeFilterState } from "@/lib/cadde-types";

const rpcMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {},
  isSupabaseConfigured: true,
}));

vi.mock("@/lib/cadde-internal", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-internal")>("@/lib/cadde-internal");
  return {
    ...actual,
    db: { rpc: (...args: unknown[]) => rpcMock(...args) },
  };
});

const realFilters = (): CaddeFilterState =>
  ({
    countries: [],
    cities: [],
    bridge: false,
    mode: "real",
    hashtag: null,
    scope: "all",
  }) as CaddeFilterState;

const read = (file: string) => readFileSync(file, "utf8");

describe("cadde feed okuma yolu hata görünürlüğü", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("RPC hatası fırlatır — sessizce boş sayfa DÖNMEZ", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { listCaddeFeed } = await import("@/lib/cadde-api");
    rpcMock.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied for function list_cadde_feed_v1" },
    });

    await expect(listCaddeFeed(realFilters(), null, null, "tr")).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith("[cadde_api_error] listCaddeFeed", expect.anything());
    consoleErrorSpy.mockRestore();
  });

  it("ağ/istisna hatası da fırlatır", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { listCaddeFeed } = await import("@/lib/cadde-api");
    rpcMock.mockRejectedValue(new Error("Failed to fetch"));

    await expect(listCaddeFeed(realFilters(), null, null, "tr")).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith("[cadde_api_error] listCaddeFeed", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it("caddeReadError ham hatayı loglar, kullanıcıya toast atmaz ve Error döner", () => {
    const source = read("src/lib/cadde-internal.ts");

    expect(source).toContain("export function caddeReadError");
    expect(source).toContain("console.error(`[cadde_api_error] ${context}`, error)");

    // Toast, tüm yüzeyi kaplayan bir hata kartı varken çift mesaj üretir; okuma
    // yüzeyi kendi satır içi hata kartını çizer.
    const body = source.slice(source.indexOf("export function caddeReadError"));
    const fnBody = body.slice(0, body.indexOf("\n}"));
    expect(fnBody).not.toContain("toast");
  });

  it("listCaddeFeed catch bloğu boş sayfa döndürme kalıbını geri getirmez", () => {
    const source = read("src/lib/cadde-api.ts");
    const start = source.indexOf("export async function listCaddeFeed");
    expect(start).toBeGreaterThan(-1);

    // Fonksiyon gövdesi = bir sonraki üst düzey `export async function`a kadar.
    const rest = source.slice(start + 1);
    const end = rest.indexOf("\nexport ");
    const fnBody = end === -1 ? rest : rest.slice(0, end);

    // Demo dalı hâlâ boş sayfa dönebilir; yasak olan CATCH bloğunun bunu yapması.
    const catchStart = fnBody.indexOf("} catch (error");
    expect(catchStart).toBeGreaterThan(-1);
    const catchBody = fnBody.slice(catchStart);

    expect(catchBody).toContain("throw caddeReadError(\"listCaddeFeed\", error)");
    expect(catchBody).not.toContain("return { items: [], nextPage: null }");
  });
});
