// Çarşı admin listesi: veri çağrısı sayfadan `src/lib` API katmanına taşındı.
//
// İki sözleşme:
//   1. Okunamayan liste BOŞ liste olarak DÖNMEZ — fırlatır. Admin ekranında boş liste
//      "ilan yok" demektir; oysa sorgu düşmüştür ve moderatör sorunu hiç fark etmez
//      (cadde-feed-error-visibility ile aynı sınıf: sessiz boşluk).
//   2. Sayfa katmanı tabloya doğrudan dokunmaz (CLAUDE.md "Data Layer": API modülü + React Query).

import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

const limitMock = vi.hoisted(() => vi.fn());

// cadde-internal gerçek `supabase` istemcisini import eder; yalnız yapılandırma bayrağı ezilir.
vi.mock("@/integrations/supabase/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/integrations/supabase/client")>();
  return { ...actual, isSupabaseConfigured: true };
});

vi.mock("@/lib/cadde-internal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cadde-internal")>();
  return {
    ...actual,
    db: {
      from: (table: string) => ({
        select: () => ({ order: () => ({ limit: (n: number) => limitMock(table, n) }) }),
      }),
    },
    // Gerçek sürüm istemci hata kaydına RPC atar; testte yalnız Error döndürmesi yeter.
    caddeReadError: (context: string, error: unknown) =>
      error instanceof Error ? error : new Error(`okuma hatası: ${context}`),
  };
});

import { listAllCarsiItemsForAdmin } from "@/lib/cadde-carsi-api";

beforeEach(() => {
  limitMock.mockReset();
});

describe("listAllCarsiItemsForAdmin", () => {
  it("carsi_items tablosunu 200 satırla okur ve satırları olduğu gibi döner", async () => {
    limitMock.mockResolvedValue({ data: [{ id: "a", deleted_at: null }], error: null });

    const rows = await listAllCarsiItemsForAdmin();

    expect(limitMock).toHaveBeenCalledWith("carsi_items", 200);
    expect(rows).toEqual([{ id: "a", deleted_at: null }]);
  });

  it("veri null ise boş liste döner (hata DEĞİL, gerçekten boş)", async () => {
    limitMock.mockResolvedValue({ data: null, error: null });

    expect(await listAllCarsiItemsForAdmin()).toEqual([]);
  });

  it("sorgu hatasında BOŞ LİSTE DÖNMEZ, fırlatır (sessiz boşluk yasağı)", async () => {
    limitMock.mockResolvedValue({ data: null, error: new Error("permission denied") });

    await expect(listAllCarsiItemsForAdmin()).rejects.toThrow("permission denied");
  });
});

describe("AdminCaddeCarsiPage veri katmanı sözleşmesi", () => {
  const page = readFileSync("src/pages/admin/AdminCaddeCarsiPage.tsx", "utf8");

  it("tabloya doğrudan dokunmaz; liste API modülünden gelir", () => {
    expect(page).not.toMatch(/\bdb\s*\.\s*from\(/);
    expect(page).not.toContain('from "@/lib/cadde-internal"');
    expect(page).toMatch(/import \{[^}]*\blistAllCarsiItemsForAdmin\b[^}]*\} from "@\/lib\/cadde-carsi-api"/);
  });

  it("yükleme hatasını gösterir — hata 'ilan yok' gibi görünmez", () => {
    // Alt dize yetmez (`isErrorX` de içerir): koşul biçimi ve kullanıcıya görünen mesaj aranır.
    expect(page).toMatch(/itemsQuery\.isError\s*\?/);
    expect(page).toContain("İlanlar yüklenemedi");
    // Hata varken "Bu filtrede ilan yok" gösterilmez — yanıltıcı olur.
    expect(page).toMatch(/!itemsQuery\.isError\s*&&\s*items\.length === 0/);
  });
});
