// cadde-media testleri (F5/m7) — SQL ayna sözleşmesi + doğrulama + yükleme yolu.
// Ayna kaynağı: 20260730100000_cadde_v1_000_media_bucket.sql (cadde.media.* ayarları,
// 52428800 = 50MB) ve 20260730110000_cadde_v1_001_post_media.sql (cadde_validate_media).
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, uploadMock, getPublicUrlMock, removeMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  uploadMock: vi.fn(),
  getPublicUrlMock: vi.fn(),
  removeMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: getUserMock },
    storage: {
      from: () => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock, remove: removeMock }),
    },
  },
}));

import {
  CADDE_MEDIA_LIMITS,
  normalizeCaddeMedia,
  resolveCaddeMediaKind,
  uploadCaddeMedia,
  validateCaddeMediaFile,
  type CaddeMediaAsset,
} from "@/lib/cadde-media";

/** Gerçek dev buffer ayırmadan istenen boyutta File üretir. */
function fakeFile(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

const image = (path = "u/post/a.jpg"): CaddeMediaAsset => ({ kind: "image", url: "https://x/a.jpg", path });
const video = (path = "u/post/v.mp4"): CaddeMediaAsset => ({ kind: "video", url: "https://x/v.mp4", path });

describe("SQL ayna sözleşmesi (cadde_settings / cadde_validate_media)", () => {
  it("limitler migration'daki değerlerle birebir", () => {
    // Değiştiren taraf SQL ayarlarını da güncellemek ZORUNDA (mig 000 satır 25-28).
    expect(CADDE_MEDIA_LIMITS.maxImages).toBe(4);
    expect(CADDE_MEDIA_LIMITS.maxVideos).toBe(1);
    expect(CADDE_MEDIA_LIMITS.maxImageBytes).toBe(5 * 1024 * 1024);
    expect(CADDE_MEDIA_LIMITS.maxVideoBytes).toBe(52428800);
  });
});

describe("resolveCaddeMediaKind", () => {
  it("görsel/video MIME'larını sınıflar, kalanına null", () => {
    expect(resolveCaddeMediaKind("image/webp")).toBe("image");
    expect(resolveCaddeMediaKind("video/quicktime")).toBe("video");
    expect(resolveCaddeMediaKind("application/pdf")).toBeNull();
    expect(resolveCaddeMediaKind("")).toBeNull();
  });
});

describe("normalizeCaddeMedia", () => {
  it("bozuk kaydı eler, feed kartını düşürmez", () => {
    const raw = [
      { kind: "image", url: "https://x/a.jpg", path: "p/a.jpg", width: 100, height: 80 },
      { kind: "image", url: "http://guvensiz/a.jpg", path: "p" }, // https değil → elenir
      { kind: "gif", url: "https://x/b.gif", path: "p" }, // bilinmeyen tür → elenir
      { kind: "video", url: "https://x/v.mp4" }, // path yok → elenir
      null,
      "çöp",
    ];
    const assets = normalizeCaddeMedia(raw);
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({ kind: "image", width: 100, height: 80 });
  });

  it("dizi olmayan girişte boş döner", () => {
    expect(normalizeCaddeMedia(undefined)).toEqual([]);
    expect(normalizeCaddeMedia({})).toEqual([]);
  });
});

describe("validateCaddeMediaFile", () => {
  it("desteklenmeyen tipe Türkçe mesaj", () => {
    expect(validateCaddeMediaFile(fakeFile("a.pdf", "application/pdf", 10), [])).toMatch(/Yalnız/);
  });

  it("boyut sınırları: görsel 5MB, video 50MB", () => {
    expect(validateCaddeMediaFile(fakeFile("a.jpg", "image/jpeg", 5 * 1024 * 1024 + 1), [])).toMatch(/5MB/);
    expect(validateCaddeMediaFile(fakeFile("a.jpg", "image/jpeg", 5 * 1024 * 1024), [])).toBeNull();
    expect(validateCaddeMediaFile(fakeFile("v.mp4", "video/mp4", 52428800 + 1), [])).toMatch(/50MB/);
    expect(validateCaddeMediaFile(fakeFile("v.mp4", "video/mp4", 52428800), [])).toBeNull();
  });

  it("adet sınırları: 4 görsel, 1 video (SQL ile aynı)", () => {
    const fourImages = [image("1"), image("2"), image("3"), image("4")];
    expect(validateCaddeMediaFile(fakeFile("a.jpg", "image/jpeg", 10), fourImages)).toMatch(/4 görsel/);
    expect(validateCaddeMediaFile(fakeFile("a.jpg", "image/jpeg", 10), fourImages.slice(0, 3))).toBeNull();
    expect(validateCaddeMediaFile(fakeFile("v.mp4", "video/mp4", 10), [video()])).toMatch(/1 video/);
    // Görsel sayısı video eklemeyi engellemez (ve tersi).
    expect(validateCaddeMediaFile(fakeFile("v.mp4", "video/mp4", 10), fourImages)).toBeNull();
  });
});

describe("uploadCaddeMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: "uid-1" } } });
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: "https://cdn/x" } });
  });

  it("yolu {uid}/{scope}/{uuid}{ext} şemasıyla kurar ve asset döner", async () => {
    const asset = await uploadCaddeMedia(fakeFile("Foto Ğüzel.JPG", "image/jpeg", 10), "post");
    expect(asset).toMatchObject({ kind: "image", url: "https://cdn/x" });
    const [path] = uploadMock.mock.calls[0];
    // Uzantı güvenli küçültülür (teknik değer — düz toLowerCase doğru), ad kullanılmaz.
    expect(path).toMatch(/^uid-1\/post\/[0-9a-f-]{36}\.jpg$/);
  });

  it("oturum yoksa Türkçe hatayla reddeder, upload denemez", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(uploadCaddeMedia(fakeFile("a.jpg", "image/jpeg", 10), "post")).rejects.toThrow(
      "giriş yapın",
    );
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("storage hatasında kullanıcı-dostu mesajla fırlatır", async () => {
    uploadMock.mockResolvedValue({ error: { message: "boom" } });
    await expect(uploadCaddeMedia(fakeFile("a.jpg", "image/jpeg", 10), "carsi")).rejects.toThrow(
      "Dosya yüklenemedi",
    );
  });
});
