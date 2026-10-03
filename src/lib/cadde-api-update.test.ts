/**
 * CD01 · `updateCaddePost` sarmalayıcı sözleşmesi (A11b RPC'si `update_cadde_post_v1`).
 *
 * Kilitler:
 *   1. **NULL semantiği:** verilmeyen alan payload'a HİÇ girmez (RPC default
 *      null = "dokunma"). Fazladan alan göndermek sessizce veri SİLER (ör.
 *      p_media null değil [] gönderilirse medya temizlenir).
 *   2. **T1 (mentions):** şemada mentions alanı YOK — çağıran geçse bile
 *      soyulur, `p_mentions` asla gönderilmez (RPC null'da anmaları KORUR).
 *   3. **T3 (premium):** targets max 1 — düzenlemede ek hedef eklenemez.
 *   4. Boş güncelleme ve "body'yi temizle ama medya yok" durumları istemcide
 *      düşer (SQL `cadde_invalid_body` aynası).
 *   5. Hata yolu: `caddeWriteError("updateCaddePost", …)` + Türkçe harita
 *      (yeni kod YOK — cadde-rules haritası A11b'den beri tam).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcSpy = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcSpy(...args),
    from: () => ({ insert: () => Promise.resolve({ error: null }) }),
  },
  isSupabaseConfigured: true,
}));

vi.mock("@/lib/client-error-reports", () => ({ reportClientError: vi.fn() }));

import { reportClientError } from "@/lib/client-error-reports";
import { updateCaddePost } from "@/lib/cadde-api";
import { caddePostUpdateSchema } from "@/lib/cadde-schemas";

const POST_ID = "11111111-1111-1111-1111-111111111111";

const lastPayload = () => {
  const call = rpcSpy.mock.calls[rpcSpy.mock.calls.length - 1];
  expect(call?.[0]).toBe("update_cadde_post_v1");
  return call?.[1] as Record<string, unknown>;
};

/** Wire düzeyi gerçek: JSON serileştirmede `undefined` alanlar DÜŞER. */
const wirePayload = () => JSON.parse(JSON.stringify(lastPayload())) as Record<string, unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  rpcSpy.mockResolvedValue({ data: null, error: null });
});

describe("updateCaddePost · null semantiği (dokunma ≠ temizle)", () => {
  it("verilmeyen alan wire'a GİRMEZ (JSON'da undefined düşer → RPC null default)", async () => {
    await updateCaddePost({ postId: POST_ID, body: "yeni metin" });

    expect(wirePayload()).toEqual({ p_post_id: POST_ID, p_body: "yeni metin" });
  });

  it("title '' gönderilirse wire'da '' kalır (RPC nullif ile TEMİZLER)", async () => {
    await updateCaddePost({ postId: POST_ID, title: "" });

    expect(wirePayload()).toEqual({ p_post_id: POST_ID, p_title: "" });
  });

  it("media [] wire'da p_media:[] (medya temizlenir) — undefined ise anahtar hiç yok", async () => {
    await updateCaddePost({ postId: POST_ID, media: [] });
    expect(wirePayload()).toEqual({ p_post_id: POST_ID, p_media: [] });

    await updateCaddePost({ postId: POST_ID, body: "x" });
    expect(wirePayload()).not.toHaveProperty("p_media");
  });

  it("targets tek öğeyle {country, city} biçiminde maplenir", async () => {
    await updateCaddePost({
      postId: POST_ID,
      targets: [{ country: " Almanya ", city: "Berlin" }],
    });

    expect(wirePayload()).toEqual({
      p_post_id: POST_ID,
      p_targets: [{ country: "Almanya", city: "Berlin" }],
    });
  });
});

describe("updateCaddePost · T1 — mentions ASLA gönderilmez", () => {
  it("çağıran mentions geçse bile şema soyar, wire'da p_mentions YOK", async () => {
    await updateCaddePost({
      postId: POST_ID,
      body: "anmasız metin",
      // Bilinçli T1 ihlali denemesi — tip dışı alan Zod'da soyulmalı.
      mentions: [{ type: "user", id: "u1" }],
    } as never);

    expect(wirePayload()).not.toHaveProperty("p_mentions");
    // Şema düzeyinde de kilitli: parse çıktısında mentions anahtarı soyulur.
    expect(
      caddePostUpdateSchema.parse({ postId: POST_ID, body: "x", mentions: [{ type: "user", id: "u1" }] }),
    ).not.toHaveProperty("mentions");
  });
});

describe("updateCaddePost · istemci ön doğrulaması (SQL aynası)", () => {
  it("hiçbir alan verilmezse 'Değişiklik yapılmadı'", async () => {
    await expect(updateCaddePost({ postId: POST_ID })).rejects.toThrow(/Değişiklik yapılmadı/);
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it("body temizlenirken medya da boşsa reddedilir (cadde_invalid_body aynası)", async () => {
    await expect(updateCaddePost({ postId: POST_ID, body: "" })).rejects.toThrow(/boş paylaşım olmaz/);
    await expect(updateCaddePost({ postId: POST_ID, body: "", media: [] })).rejects.toThrow(/boş paylaşım olmaz/);
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it("body '' + medya dolu → geçerli (medya paylaşımı)", async () => {
    await updateCaddePost({
      postId: POST_ID,
      body: "",
      media: [{ kind: "image", url: "https://x/y.png", path: "u/post/y.png" }],
    });

    expect(lastPayload()).toHaveProperty("p_media");
  });

  it("T3: ikinci hedef istemcide reddedilir (premium kapısı)", async () => {
    await expect(
      updateCaddePost({
        postId: POST_ID,
        targets: [
          { country: "Almanya" },
          { country: "Fransa" },
        ],
      }),
    ).rejects.toThrow(/ek hedef eklenemez/);
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it("sınırlar: body 4000 · title 160", async () => {
    await expect(updateCaddePost({ postId: POST_ID, body: "x".repeat(4001) })).rejects.toThrow(/4000/);
    await expect(updateCaddePost({ postId: POST_ID, title: "t".repeat(161) })).rejects.toThrow(/160/);
  });
});

describe("updateCaddePost · hata yolu", () => {
  it("RPC hatası Türkçeleşir (cadde_post_owner_required) ve bağlam updateCaddePost", async () => {
    rpcSpy.mockResolvedValue({ data: null, error: { message: "cadde_post_owner_required" } });

    await expect(updateCaddePost({ postId: POST_ID, body: "x" })).rejects.toThrow(
      "Bu işlem yalnız paylaşım sahibine veya moderatöre açık.",
    );
  });

  it("bilinmeyen kod genel mesaja düşer", async () => {
    rpcSpy.mockResolvedValue({ data: null, error: { message: "some_new_code" } });

    await expect(updateCaddePost({ postId: POST_ID, body: "x" })).rejects.toThrow(
      /İşlem tamamlanamadı|tekrar dene/i,
    );
  });

  it("tanılama raporu BİREBİR 'updateCaddePost' bağlamıyla yazılır (client_error_reports)", async () => {
    rpcSpy.mockResolvedValue({ data: null, error: { message: "cadde_post_not_found" } });

    await expect(updateCaddePost({ postId: POST_ID, body: "x" })).rejects.toThrow();

    // Mutasyon dersi (CD01 M5): bağlam adı yeniden adlandırılınca hiçbir test
    // düşmüyordu — raporlar yanlış context'le birikirdi. Artık kilitli.
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ source: "cadde_write", context: "updateCaddePost" }),
    );
  });
});
