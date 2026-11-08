// Üye Geri Bildirimleri lib testleri — mock deseni: revision-requests.test.ts.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, getUserMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
    auth: { getUser: getUserMock },
  },
}));

import {
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_ERROR_MESSAGES,
  deleteFeedback,
  feedbackErrorMessage,
  fetchFeedbackList,
  fetchMyFeedback,
  promoteFeedbackToRevision,
  getFeedbackStatusLabel,
  submitFeedback,
  updateFeedbackStatus,
  validateFeedbackBody,
  type FeedbackStatus,
} from "@/lib/feedback";

// Zincirlenebilir sorgu kurucusu mock'u — thenable olarak `resolved` ile çözülür.
function chainable(opts: { resolved?: { data: unknown; error: unknown } }) {
  const builder: Record<string, unknown> = {};
  // S07c: `fetchFeedbackList` artık sayfalanıyor, zincire `range` girdi.
  for (const method of ["select", "insert", "update", "eq", "is", "order", "range"]) {
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
    fromMock.mockReturnValue(chainable({ resolved: { data: null, error: new Error("boom") } }));
    await expect(submitFeedback("Görüşüm var.", "/")).rejects.toThrow("Feedback gönderilemedi.");
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
      promotedRevisionId: null,
    });
  });

  it("hatada sanitize edilmiş mesaj fırlatır", async () => {
    fromMock.mockReturnValue(chainable({ resolved: { data: null, error: new Error("boom") } }));
    await expect(fetchFeedbackList()).rejects.toThrow("Geri bildirimler yüklenemedi.");
  });
});

describe("updateFeedbackStatus", () => {
  it("geçersiz durumu DB'ye gitmeden reddeder", async () => {
    await expect(updateFeedbackStatus("f-1", "bogus" as FeedbackStatus)).rejects.toThrow("Geçersiz durum.");
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
    fromMock.mockReturnValue(chainable({ resolved: { data: null, error: new Error("nope") } }));
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

describe("feedbackErrorMessage", () => {
  it("bilinmeyen feedback_* kodundan sonra gelen bilinen kodu bulur", () => {
    expect(feedbackErrorMessage({ message: "feedback_unknown_x", details: "feedback_not_found" }, "genel")).toBe(
      FEEDBACK_ERROR_MESSAGES.feedback_not_found,
    );
  });
});

describe("fetchFeedbackList — migration henüz uygulanmadıysa", () => {
  it("42703 (undefined_column) olursa promoted_revision_id'siz select ile yeniden dener", async () => {
    const failing = chainable({ resolved: { data: null, error: { code: "42703", message: "column does not exist" } } });
    const ok = chainable({
      resolved: {
        data: [
          {
            id: "f-1",
            body: "x",
            page_path: "/",
            status: "yeni",
            created_by: null,
            created_at: "2026-11-01T00:00:00.000Z",
            updated_at: "2026-11-01T00:00:00.000Z",
          },
        ],
        error: null,
      },
    });
    fromMock.mockReturnValueOnce(failing).mockReturnValueOnce(ok);

    const list = await fetchFeedbackList();

    expect((failing.select as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain("promoted_revision_id");
    expect((ok.select as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toContain("promoted_revision_id");
    expect(list[0].promotedRevisionId).toBeNull();
  });
});

describe("fetchFeedbackList — 42703 dışı hata", () => {
  it("PGRST301 gibi başka hatada yeniden DENEMEZ: tek sorgu, red", async () => {
    fromMock.mockReturnValue(chainable({ resolved: { data: null, error: { code: "PGRST301", message: "jwt" } } }));

    await expect(fetchFeedbackList()).rejects.toThrow("Geri bildirimler yüklenemedi.");
    expect(fromMock).toHaveBeenCalledTimes(1);
  });
});

describe("fetchMyFeedback (list_my_feedback_v1)", () => {
  it("RPC'yi parametresiz çağırır ve satırları camelCase'e mapler", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "f-9",
          body: "Profil sayfası güzel.",
          page_path: "/profile",
          status: "okundu",
          created_at: "2026-11-01T09:00:00.000Z",
        },
      ],
      error: null,
    });

    const list = await fetchMyFeedback();

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock.mock.calls[0][0]).toBe("list_my_feedback_v1");
    expect(fromMock).not.toHaveBeenCalled();
    expect(list).toEqual([
      {
        id: "f-9",
        body: "Profil sayfası güzel.",
        pagePath: "/profile",
        status: "okundu",
        createdAt: "2026-11-01T09:00:00.000Z",
      },
    ]);
  });

  it("boş/null veride boş liste döner", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    await expect(fetchMyFeedback()).resolves.toEqual([]);
  });

  it("düz nesne hatada bilinen kodu Türkçeye çevirir", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "feedback_not_found", code: "P0001" } });
    await expect(fetchMyFeedback()).rejects.toThrow("bulunamadı");
  });

  it("bilinmeyen hatada genel mesaj fırlatır (ham metin sızmaz)", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "PGRST202 nope" } });
    await expect(fetchMyFeedback()).rejects.toThrow("Geri bildirimleriniz yüklenemedi.");
  });
});

describe("promoteFeedbackToRevision (admin_promote_feedback_to_revision_v1)", () => {
  it("boş kimlikte RPC'ye gitmez", async () => {
    await expect(promoteFeedbackToRevision("")).rejects.toThrow();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("p_feedback_id ile çağırır ve revizyon numarasını döndürür", async () => {
    rpcMock.mockResolvedValue({ data: { revision_id: "r-1", revision_number: 91 }, error: null });

    const result = await promoteFeedbackToRevision("f-1");

    expect(rpcMock).toHaveBeenCalledWith("admin_promote_feedback_to_revision_v1", { p_feedback_id: "f-1" });
    expect(result).toEqual({ revisionId: "r-1", revisionNumber: 91 });
  });

  it("ikinci terfide Türkçe 'zaten taşındı' mesajı fırlatır", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "feedback_already_promoted", code: "P0001" } });
    await expect(promoteFeedbackToRevision("f-1")).rejects.toThrow("zaten");
  });

  it("admin olmayan çağrıda Türkçe yetki mesajı fırlatır", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "feedback_admin_required", code: "42501" } });
    await expect(promoteFeedbackToRevision("f-1")).rejects.toThrow("yetki");
  });

  it("veri dönmezse genel hata fırlatır", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    await expect(promoteFeedbackToRevision("f-1")).rejects.toThrow("REV'e taşınamadı.");
  });
});
