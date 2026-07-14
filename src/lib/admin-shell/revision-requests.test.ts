import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, getUserMock, rpcMock, storageFromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
  rpcMock: vi.fn(),
  storageFromMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
    auth: { getUser: getUserMock },
    storage: { from: storageFromMock },
  },
}));

import {
  addComment,
  createRevisionRequest,
  deleteAttachment,
  deleteRevisionRequest,
  fetchAttachments,
  fetchComments,
  fetchRevisionRequests,
  fetchUserEmails,
  getAttachmentUrl,
  getRevisionStatusLabel,
  REVISION_STATUS_LABELS,
  uploadAttachment,
  validateRevisionRequestForm,
  type RevisionRequestForm,
} from "@/lib/admin-shell/revision-requests";

const VALID_FORM: RevisionRequestForm = {
  title: "Anasayfa hero görseli değişsin",
  detail: "Yeni kampanya görseliyle güncellensin.",
  status: "acik",
  priority: 5,
  areaLabel: "Anasayfa",
};

// Zincirlenebilir sorgu kurucusu mock'u: terminal davranış son adımda belirlenir.
// `resolved` → query thenable olarak çözülür (fetch/list); `single` → .single() döner.
function chainable(opts: { resolved?: { data: unknown; error: unknown }; single?: { data: unknown; error: unknown } }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "insert", "update", "eq", "is", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn().mockResolvedValue(opts.single ?? { data: null, error: null });
  builder.then = (onF: (v: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve(opts.resolved ?? { data: null, error: null }).then(onF);
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "admin-1" } } });
});

describe("getRevisionStatusLabel", () => {
  it("maps known statuses to Turkish labels and falls back to raw value", () => {
    expect(getRevisionStatusLabel("acik")).toBe(REVISION_STATUS_LABELS.acik);
    expect(getRevisionStatusLabel("yapildi")).toBe("Yapıldı");
    expect(getRevisionStatusLabel("unknown")).toBe("unknown");
  });
});

describe("validateRevisionRequestForm", () => {
  it("accepts a valid form", () => {
    expect(validateRevisionRequestForm(VALID_FORM)).toBeNull();
  });

  it("rejects an empty title", () => {
    expect(validateRevisionRequestForm({ ...VALID_FORM, title: "   " })).toBe(
      "Başlık boş bırakılamaz.",
    );
  });

  it("rejects an out-of-range priority", () => {
    expect(validateRevisionRequestForm({ ...VALID_FORM, priority: 0 })).toBe(
      "Geçersiz öncelik değeri.",
    );
    expect(validateRevisionRequestForm({ ...VALID_FORM, priority: 11 })).toBe(
      "Geçersiz öncelik değeri.",
    );
  });

  it("rejects an invalid status", () => {
    expect(
      validateRevisionRequestForm({ ...VALID_FORM, status: "bogus" as RevisionRequestForm["status"] }),
    ).toBe("Geçersiz durum.");
  });
});

describe("fetchRevisionRequests", () => {
  it("maps rows to camelCase requests", async () => {
    fromMock.mockReturnValue(
      chainable({
        resolved: {
          data: [
            {
              id: "r-1",
              title: "Başlık",
              detail: "Detay",
              status: "inceleniyor",
              priority: 8,
              area_label: "Cadde",
              created_by: "admin-1",
              created_at: "2026-06-28T10:00:00.000Z",
              updated_at: "2026-06-28T11:00:00.000Z",
            },
          ],
          error: null,
        },
      }),
    );

    const requests = await fetchRevisionRequests();

    expect(fromMock).toHaveBeenCalledWith("revision_requests");
    expect(requests[0]).toEqual({
      id: "r-1",
      title: "Başlık",
      detail: "Detay",
      status: "inceleniyor",
      priority: 8,
      areaLabel: "Cadde",
      createdBy: "admin-1",
      createdAt: "2026-06-28T10:00:00.000Z",
      updatedAt: "2026-06-28T11:00:00.000Z",
    });
  });

  it("throws a sanitized message on error", async () => {
    fromMock.mockReturnValue(chainable({ resolved: { data: null, error: { message: "boom" } } }));
    await expect(fetchRevisionRequests()).rejects.toThrow("Revizyon istekleri yüklenemedi.");
  });
});

describe("fetchComments", () => {
  it("maps comment rows for a request", async () => {
    fromMock.mockReturnValue(
      chainable({
        resolved: {
          data: [
            {
              id: "c-1",
              request_id: "r-1",
              body: "İlk yorum",
              created_by: "admin-2",
              created_at: "2026-06-28T12:00:00.000Z",
            },
          ],
          error: null,
        },
      }),
    );

    const comments = await fetchComments("r-1");

    expect(fromMock).toHaveBeenCalledWith("revision_request_comments");
    expect(comments[0]).toMatchObject({ id: "c-1", requestId: "r-1", body: "İlk yorum" });
  });
});

describe("createRevisionRequest", () => {
  it("validates before inserting and rejects an empty title", async () => {
    await expect(
      createRevisionRequest({ ...VALID_FORM, title: "" }),
    ).rejects.toThrow("Başlık boş bırakılamaz.");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("inserts with created_by from the current user and returns the mapped row", async () => {
    fromMock.mockReturnValue(
      chainable({
        single: {
          data: {
            id: "r-2",
            title: VALID_FORM.title,
            detail: VALID_FORM.detail,
            status: "acik",
            priority: 5,
            area_label: "Anasayfa",
            created_by: "admin-1",
            created_at: "2026-06-28T13:00:00.000Z",
            updated_at: "2026-06-28T13:00:00.000Z",
          },
          error: null,
        },
      }),
    );

    const created = await createRevisionRequest(VALID_FORM);

    expect(getUserMock).toHaveBeenCalled();
    expect(created.id).toBe("r-2");
    expect(created.createdBy).toBe("admin-1");
  });
});

describe("addComment", () => {
  it("rejects an empty body without hitting the DB", async () => {
    await expect(addComment("r-1", "   ")).rejects.toThrow("Yorum boş bırakılamaz.");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("inserts a trimmed comment", async () => {
    fromMock.mockReturnValue(
      chainable({
        single: {
          data: {
            id: "c-2",
            request_id: "r-1",
            body: "Yeni yorum",
            created_by: "admin-1",
            created_at: "2026-06-28T14:00:00.000Z",
          },
          error: null,
        },
      }),
    );

    const comment = await addComment("r-1", "  Yeni yorum  ");
    expect(comment.body).toBe("Yeni yorum");
    expect(comment.createdBy).toBe("admin-1");
  });
});

describe("deleteRevisionRequest", () => {
  it("soft-deletes via an update and surfaces errors", async () => {
    fromMock.mockReturnValue(chainable({ resolved: { data: null, error: { message: "nope" } } }));
    await expect(deleteRevisionRequest("r-1")).rejects.toThrow("Revizyon isteği silinemedi.");
  });
});

describe("fetchUserEmails", () => {
  it("resolves unique ids to emails and skips nulls", async () => {
    rpcMock.mockImplementation((_fn: string, args: { p_user_id: string }) =>
      Promise.resolve({
        data: args.p_user_id === "admin-1" ? "a@corteqs.net" : "b@corteqs.net",
        error: null,
      }),
    );

    const emails = await fetchUserEmails(["admin-1", "admin-1", "admin-2", null]);

    expect(rpcMock).toHaveBeenCalledTimes(2);
    expect(emails).toEqual({ "admin-1": "a@corteqs.net", "admin-2": "b@corteqs.net" });
  });

  it("returns an empty object when there are no ids", async () => {
    const emails = await fetchUserEmails([null, null]);
    expect(emails).toEqual({});
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

describe("fetchAttachments", () => {
  it("fetches attachments for a request and maps rows to camelCase", async () => {
    fromMock.mockReturnValue(
      chainable({
        resolved: {
          data: [
            {
              id: "a-1",
              request_id: "r-1",
              comment_id: null,
              storage_path: "request/r-1/123-abc-foto.png",
              file_name: "foto.png",
              content_type: "image/png",
              size_bytes: 1024,
              created_by: "admin-1",
              created_at: "2026-07-14T10:00:00.000Z",
            },
          ],
          error: null,
        },
      }),
    );

    const attachments = await fetchAttachments({ requestId: "r-1" });

    expect(fromMock).toHaveBeenCalledWith("revision_request_attachments");
    expect(attachments[0]).toEqual({
      id: "a-1",
      requestId: "r-1",
      commentId: null,
      storagePath: "request/r-1/123-abc-foto.png",
      fileName: "foto.png",
      contentType: "image/png",
      sizeBytes: 1024,
      createdBy: "admin-1",
      createdAt: "2026-07-14T10:00:00.000Z",
    });
  });

  it("fetches attachments for a comment", async () => {
    fromMock.mockReturnValue(chainable({ resolved: { data: [], error: null } }));

    await fetchAttachments({ commentId: "c-1" });

    expect(fromMock).toHaveBeenCalledWith("revision_request_attachments");
  });

  it("throws a sanitized message on error", async () => {
    fromMock.mockReturnValue(chainable({ resolved: { data: null, error: { message: "boom" } } }));
    await expect(fetchAttachments({ requestId: "r-1" })).rejects.toThrow(
      "Ekler yüklenemedi.",
    );
  });
});

describe("uploadAttachment", () => {
  it("uploads to storage under request/ prefix and inserts a row", async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    storageFromMock.mockReturnValue({ upload: uploadMock });

    fromMock.mockReturnValue(
      chainable({
        single: {
          data: {
            id: "a-2",
            request_id: "r-1",
            comment_id: null,
            storage_path: "request/r-1/999-xyz-test.png",
            file_name: "test.png",
            content_type: "image/png",
            size_bytes: 500,
            created_by: "admin-1",
            created_at: "2026-07-14T11:00:00.000Z",
          },
          error: null,
        },
      }),
    );

    const file = new File(["x"], "test.png", { type: "image/png" });
    const result = await uploadAttachment({ requestId: "r-1" }, file);

    expect(storageFromMock).toHaveBeenCalledWith("revision-attachments");
    expect(uploadMock).toHaveBeenCalled();
    const [path] = uploadMock.mock.calls[0];
    expect(path).toMatch(/^request\/r-1\/\d+-[a-z0-9]+-test\.png$/);
    expect(result.id).toBe("a-2");
    expect(result.fileName).toBe("test.png");
  });

  it("uploads to storage under comment/ prefix", async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    storageFromMock.mockReturnValue({ upload: uploadMock });
    fromMock.mockReturnValue(
      chainable({
        single: {
          data: {
            id: "a-3",
            request_id: null,
            comment_id: "c-1",
            storage_path: "comment/c-1/1-a-x.png",
            file_name: "x.png",
            content_type: "image/png",
            size_bytes: 10,
            created_by: "admin-1",
            created_at: "2026-07-14T12:00:00.000Z",
          },
          error: null,
        },
      }),
    );

    const file = new File(["x"], "x.png", { type: "image/png" });
    await uploadAttachment({ commentId: "c-1" }, file);

    const [path] = uploadMock.mock.calls[0];
    expect(path).toMatch(/^comment\/c-1\/\d+-[a-z0-9]+-x\.png$/);
  });

  it("rejects a disallowed file type before touching storage", async () => {
    const file = new File(["x"], "malware.exe", { type: "application/x-msdownload" });
    await expect(uploadAttachment({ requestId: "r-1" }, file)).rejects.toThrow(
      "Geçersiz dosya uzantısı",
    );
    expect(storageFromMock).not.toHaveBeenCalled();
  });

  it("throws a sanitized message when storage upload fails", async () => {
    storageFromMock.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: { message: "storage full" } }),
    });
    const file = new File(["x"], "test.png", { type: "image/png" });
    await expect(uploadAttachment({ requestId: "r-1" }, file)).rejects.toThrow(
      "Görsel yüklenemedi.",
    );
  });
});

describe("deleteAttachment", () => {
  it("removes from storage and soft-deletes the row", async () => {
    const removeMock = vi.fn().mockResolvedValue({ error: null });
    storageFromMock.mockReturnValue({ remove: removeMock });
    fromMock.mockReturnValue(chainable({ resolved: { data: null, error: null } }));

    await deleteAttachment("a-1", "request/r-1/123-abc-foto.png");

    expect(storageFromMock).toHaveBeenCalledWith("revision-attachments");
    expect(removeMock).toHaveBeenCalledWith(["request/r-1/123-abc-foto.png"]);
    expect(fromMock).toHaveBeenCalledWith("revision_request_attachments");
  });

  it("throws a sanitized message when the DB update fails", async () => {
    storageFromMock.mockReturnValue({ remove: vi.fn().mockResolvedValue({ error: null }) });
    fromMock.mockReturnValue(chainable({ resolved: { data: null, error: { message: "nope" } } }));
    await expect(deleteAttachment("a-1", "path/x.png")).rejects.toThrow("Ek silinemedi.");
  });
});

describe("getAttachmentUrl", () => {
  it("returns a signed URL", async () => {
    storageFromMock.mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: "https://signed.example/x.png" },
        error: null,
      }),
    });

    const url = await getAttachmentUrl("request/r-1/x.png");
    expect(url).toBe("https://signed.example/x.png");
  });

  it("throws when signing fails", async () => {
    storageFromMock.mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: { message: "nope" } }),
    });
    await expect(getAttachmentUrl("request/r-1/x.png")).rejects.toThrow(
      "Görsel için erişim linki üretilemedi.",
    );
  });
});
