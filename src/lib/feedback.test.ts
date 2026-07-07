// Üye Geri Bildirimleri lib testleri — mock deseni: revision-requests.test.ts.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, getUserMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    auth: { getUser: getUserMock },
  },
}));

import {
  FEEDBACK_STATUS_LABELS,
  deleteFeedback,
  fetchFeedbackList,
  getFeedbackStatusLabel,
  submitFeedback,
  updateFeedbackStatus,
  validateFeedbackBody,
  type FeedbackStatus,
} from "@/lib/feedback";

// Zincirlenebilir sorgu kurucusu mock'u — thenable olarak `resolved` ile çözülür.
function chainable(opts: { resolved?: { data: unknown; error: unknown } }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "insert", "update", "eq", "is", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (onF: (v: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve(opts.resolved ?? { data: null, error: null }).then(onF);
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "member-1" } } });
});

describe("getFeedbackStatusLabel", () => {
  it("bilinen durumları Türkçe etikete çevirir, bilinmeyeni aynen döner", () => {
    expect(getFeedbackStatusLabel("yeni")).toBe(FEEDBACK_STATUS_LABELS.yeni);
    expect(getFeedbackStatusLabel("okundu")).toBe("Okundu");
    expect(getFeedbackStatusLabel("arsiv")).toBe("Arşiv");
    expect(getFeedbackStatusLabel("unknown")).toBe("unknown");
  });
});

describe("validateFeedbackBody", () => {
  it("dolu gövdeyi kabul eder", () => {
    expect(validateFeedbackBody("Harika bir öneri.")).toBeNull();
  });

  it("boş/sadece boşluk gövdeyi reddeder", () => {
    expect(validateFeedbackBody("   ")).toBe("Yorum boş bırakılamaz.");
  });

  it("aşırı uzun gövdeyi reddeder (MAX_CONTENT_LENGTH)", () => {
    expect(validateFeedbackBody("x".repeat(50001))).toMatch(/karakterden uzun olamaz/);
  });
});

describe("submitFeedback", () => {
  it("boş gövdede DB'ye hiç gitmez", async () => {
    await expect(submitFeedback("  ", "/cadde")).rejects.toThrow("Yorum boş bırakılamaz.");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("oturum yoksa reddeder", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(submitFeedback("Görüşüm var.", "/cadde")).rejects.toThrow(
      "Feedback göndermek için giriş yapmalısınız.",
    );
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("trimlenmiş gövde + created_by + kırpılmış page_path ile insert eder", async () => {
    const builder = chainable({ resolved: { data: null, error: null } });
    fromMock.mockReturnValue(builder);

    await submitFeedback("  Görüşüm var.  ", `/uzun${"x".repeat(400)}`);

    expect(fromMock).toHaveBeenCalledWith("member_feedback");
    const insertMock = builder.insert as ReturnType<typeof vi.fn>;
    const inserted = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(inserted.body).toBe("Görüşüm var.");
    expect(inserted.created_by).toBe("member-1");
    expect((inserted.page_path as string).length).toBe(300);
  });

  it("DB hatasında sanitize edilmiş mesaj fırlatır", async () => {
    fromMock.mockReturnValue(
      chainable({ resolved: { data: null, error: new Error("boom") } }),
    );
    await expect(submitFeedback("Görüşüm var.", "/")).rejects.toThrow(
      "Feedback gönderilemedi.",
    );
  });
});

describe("fetchFeedbackList", () => {
  it("satırları camelCase'e mapler", async () => {
    fromMock.mockReturnValue(
      chainable({
        resolved: {
          data: [
            {
              id: "f-1",
              body: "Cadde çok yavaş açılıyor.",
              page_path: "/cadde",
              status: "yeni",
              created_by: "member-1",
              created_at: "2026-07-07T10:00:00.000Z",
              updated_at: "2026-07-07T10:00:00.000Z",
            },
          ],
          error: null,
        },
      }),
    );

    const list = await fetchFeedbackList();

    expect(fromMock).toHaveBeenCalledWith("member_feedback");
    expect(list[0]).toEqual({
      id: "f-1",
      body: "Cadde çok yavaş açılıyor.",
      pagePath: "/cadde",
      status: "yeni",
      createdBy: "member-1",
      createdAt: "2026-07-07T10:00:00.000Z",
      updatedAt: "2026-07-07T10:00:00.000Z",
    });
  });

  it("hatada sanitize edilmiş mesaj fırlatır", async () => {
    fromMock.mockReturnValue(
      chainable({ resolved: { data: null, error: new Error("boom") } }),
    );
    await expect(fetchFeedbackList()).rejects.toThrow("Geri bildirimler yüklenemedi.");
  });
});

describe("updateFeedbackStatus", () => {
  it("geçersiz durumu DB'ye gitmeden reddeder", async () => {
    await expect(
      updateFeedbackStatus("f-1", "bogus" as FeedbackStatus),
    ).rejects.toThrow("Geçersiz durum.");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("geçerli durumda update eder", async () => {
    const builder = chainable({ resolved: { data: null, error: null } });
    fromMock.mockReturnValue(builder);

    await updateFeedbackStatus("f-1", "okundu");

    const updateMock = builder.update as ReturnType<typeof vi.fn>;
    expect(updateMock).toHaveBeenCalledWith({ status: "okundu" });
  });
});

describe("deleteFeedback", () => {
  it("soft-delete update'i hatada sanitize mesajla fırlatır", async () => {
    fromMock.mockReturnValue(
      chainable({ resolved: { data: null, error: new Error("nope") } }),
    );
    await expect(deleteFeedback("f-1")).rejects.toThrow("Geri bildirim silinemedi.");
  });

  it("deleted_at set eden update çağırır", async () => {
    const builder = chainable({ resolved: { data: null, error: null } });
    fromMock.mockReturnValue(builder);

    await deleteFeedback("f-1");

    const updateMock = builder.update as ReturnType<typeof vi.fn>;
    const payload = updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(typeof payload.deleted_at).toBe("string");
  });
});
