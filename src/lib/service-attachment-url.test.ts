// B3/Y6 sözleşme testleri — private bucket okuma yolu.
//
// İki şeyi kilitler:
//   1) Normalizasyon: DB'de ne biçim durursa dursun (public URL · imzalı URL ·
//      ham path) imzalama daima PATH ile çağrılır.
//   2) Sessiz ölüm yok: yetki/hata durumunda null döner (çağıran gösterir).
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSignedUrlMock } = vi.hoisted(() => ({ createSignedUrlMock: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: { from: () => ({ createSignedUrl: createSignedUrlMock }) },
  },
}));

import {
  SERVICE_ATTACHMENT_SIGNED_TTL_SECONDS,
  createServiceAttachmentUrl,
  toServiceAttachmentPath,
} from "@/lib/service-attachment-url";

describe("toServiceAttachmentPath", () => {
  it("eski public URL'i path'e çevirir", () => {
    expect(
      toServiceAttachmentPath(
        "https://injprdrsklkxgnaiixzh.supabase.co/storage/v1/object/public/service-attachments/uid-1/123-cv.pdf",
      ),
    ).toBe("uid-1/123-cv.pdf");
  });

  it("yüzde-kodlu path'i çözer (Türkçe ad, boşluk)", () => {
    expect(
      toServiceAttachmentPath(
        "https://x.co/storage/v1/object/public/service-attachments/uid-1/proje%20%C3%B6zeti.pdf",
      ),
    ).toBe("uid-1/proje özeti.pdf");
  });

  it("eski imzalı URL'in token'ını atar", () => {
    expect(
      toServiceAttachmentPath(
        "https://x.co/storage/v1/object/sign/service-attachments/uid-1/a.pdf?token=abc",
      ),
    ).toBe("uid-1/a.pdf");
  });

  it("ham path aynen kalır", () => {
    expect(toServiceAttachmentPath("uid-1/123-cv.pdf")).toBe("uid-1/123-cv.pdf");
  });

  it("boş girdi boş döner", () => {
    expect(toServiceAttachmentPath("")).toBe("");
  });
});

describe("createServiceAttachmentUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("imzalı URL'i sabit TTL ile ister", async () => {
    createSignedUrlMock.mockResolvedValue({ data: { signedUrl: "https://x/s?token=1" }, error: null });

    expect(await createServiceAttachmentUrl("uid-1/a.pdf")).toBe("https://x/s?token=1");
    expect(createSignedUrlMock).toHaveBeenCalledWith(
      "uid-1/a.pdf",
      SERVICE_ATTACHMENT_SIGNED_TTL_SECONDS,
    );
  });

  it("eski public URL kaydını da path'e çevirip imzalar", async () => {
    createSignedUrlMock.mockResolvedValue({ data: { signedUrl: "https://x/s" }, error: null });

    await createServiceAttachmentUrl(
      "https://x.co/storage/v1/object/public/service-attachments/uid-1/a.pdf",
    );

    expect(createSignedUrlMock).toHaveBeenCalledWith(
      "uid-1/a.pdf",
      SERVICE_ATTACHMENT_SIGNED_TTL_SECONDS,
    );
  });

  it("yetki/hata durumunda null döner (sessiz ölüm yok)", async () => {
    createSignedUrlMock.mockResolvedValue({ data: null, error: { message: "not allowed" } });

    expect(await createServiceAttachmentUrl("uid-1/a.pdf")).toBeNull();
  });

  it("boş kayıtta imzalama hiç çağrılmaz", async () => {
    expect(await createServiceAttachmentUrl("")).toBeNull();
    expect(createSignedUrlMock).not.toHaveBeenCalled();
  });
});
