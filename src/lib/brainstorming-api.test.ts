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
  addComment,
  createRow,
  createSection,
  deleteRow,
  deleteSection,
  fetchComments,
  fetchSections,
  fetchUserEmails,
  updateRow,
  updateSection,
  type BrainstormingRowForm,
  type BrainstormingSectionForm,
} from "@/lib/brainstorming-api";

const VALID_SECTION_FORM: BrainstormingSectionForm = {
  groupLabel: "Bölüm 1",
  title: "Yeni Bölüm",
  intro: "Kısa giriş.",
};

const VALID_ROW_FORM: BrainstormingRowForm = {
  label: "Konu",
  technical: "Teknik açıklama.",
  plain: "Sade açıklama.",
  status: "open",
};

// Zincirlenebilir sorgu kurucusu mock'u: terminal davranış son adımda belirlenir.
function chainable(opts: {
  resolved?: { data: unknown; error: unknown };
  single?: { data: unknown; error: unknown };
}) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "insert", "update", "delete", "eq", "order"]) {
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

describe("createSection / updateSection validation", () => {
  it("rejects an empty title via Zod", async () => {
    await expect(
      createSection({ ...VALID_SECTION_FORM, title: "  " }, 0),
    ).rejects.toThrow();
  });

  it("creates a section with derived section_key", async () => {
    const inserted = {
      id: "sec-1",
      section_key: "yeni-bolum-abc123",
      group_label: "Bölüm 1",
      title: "Yeni Bölüm",
      intro: "Kısa giriş.",
      order_index: 0,
    };
    fromMock.mockReturnValue(chainable({ single: { data: inserted, error: null } }));

    const result = await createSection(VALID_SECTION_FORM, 0);
    expect(result.title).toBe("Yeni Bölüm");
    expect(result.rows).toEqual([]);
    expect(fromMock).toHaveBeenCalledWith("brainstorming_sections");
  });

  it("surfaces a friendly error on update failure", async () => {
    fromMock.mockReturnValue(
      chainable({ single: { data: null, error: { message: "boom" } } }),
    );
    await expect(updateSection("sec-1", VALID_SECTION_FORM)).rejects.toThrow(
      "Bölüm güncellenemedi.",
    );
  });
});

describe("createRow / updateRow validation", () => {
  it("rejects an empty label via Zod", async () => {
    await expect(
      createRow("sec-1", { ...VALID_ROW_FORM, label: "" }, 0),
    ).rejects.toThrow();
  });

  it("creates a row under a section", async () => {
    const inserted = {
      id: "row-1",
      section_id: "sec-1",
      label: "Konu",
      technical: "Teknik açıklama.",
      plain: "Sade açıklama.",
      status: "open",
      order_index: 0,
    };
    fromMock.mockReturnValue(chainable({ single: { data: inserted, error: null } }));

    const result = await createRow("sec-1", VALID_ROW_FORM, 0);
    expect(result.sectionId).toBe("sec-1");
    expect(result.status).toBe("open");
  });

  it("surfaces a friendly error on update failure", async () => {
    fromMock.mockReturnValue(
      chainable({ single: { data: null, error: { message: "boom" } } }),
    );
    await expect(updateRow("row-1", VALID_ROW_FORM)).rejects.toThrow(
      "Satır güncellenemedi.",
    );
  });
});

describe("deleteSection / deleteRow", () => {
  it("throws a friendly error when delete fails", async () => {
    fromMock.mockReturnValue(chainable({ resolved: { data: null, error: { message: "boom" } } }));
    await expect(deleteSection("sec-1")).rejects.toThrow("Bölüm silinemedi.");
  });

  it("resolves when delete succeeds", async () => {
    fromMock.mockReturnValue(chainable({ resolved: { data: null, error: null } }));
    await expect(deleteRow("row-1")).resolves.toBeUndefined();
  });
});

describe("fetchSections", () => {
  it("groups rows under their section, ordered", async () => {
    const sections = [
      { id: "sec-1", section_key: "a", group_label: null, title: "A", intro: null, order_index: 0 },
    ];
    const rows = [
      {
        id: "row-1",
        section_id: "sec-1",
        label: "L1",
        technical: "T1",
        plain: "P1",
        status: "ok",
        order_index: 0,
      },
    ];

    fromMock.mockImplementation((name: string) => {
      if (name === "brainstorming_sections") {
        return chainable({ resolved: { data: sections, error: null } });
      }
      return chainable({ resolved: { data: rows, error: null } });
    });

    const result = await fetchSections();
    expect(result).toHaveLength(1);
    expect(result[0].rows).toHaveLength(1);
    expect(result[0].rows[0].label).toBe("L1");
  });
});

describe("fetchComments / addComment", () => {
  it("rejects an empty comment body before calling the RPC", async () => {
    await expect(addComment("ozet", "   ")).rejects.toThrow("Yorum boş bırakılamaz.");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("calls add_brainstorming_comment_v1 with trimmed body", async () => {
    rpcMock.mockResolvedValue({
      data: {
        id: "c-1",
        section_key: "ozet",
        author_name: "Admin",
        created_by: "admin-1",
        body: "Merhaba",
        created_at: "2026-07-18T00:00:00Z",
      },
      error: null,
    });

    const result = await addComment("ozet", "  Merhaba  ");
    expect(rpcMock).toHaveBeenCalledWith("add_brainstorming_comment_v1", {
      p_section_key: "ozet",
      p_body: "Merhaba",
    });
    expect(result.body).toBe("Merhaba");
  });

  it("fetches comments for a section", async () => {
    fromMock.mockReturnValue(
      chainable({
        resolved: {
          data: [
            {
              id: "c-1",
              section_key: "ozet",
              author_name: "Admin",
              created_by: "admin-1",
              body: "Merhaba",
              created_at: "2026-07-18T00:00:00Z",
            },
          ],
          error: null,
        },
      }),
    );
    const result = await fetchComments("ozet");
    expect(result).toHaveLength(1);
    expect(result[0].sectionKey).toBe("ozet");
  });
});

describe("fetchUserEmails", () => {
  it("returns an empty map for no ids", async () => {
    expect(await fetchUserEmails([null, null])).toEqual({});
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("resolves unique ids to emails", async () => {
    rpcMock.mockResolvedValue({ data: "admin@example.com", error: null });
    const result = await fetchUserEmails(["admin-1", "admin-1", null]);
    expect(result).toEqual({ "admin-1": "admin@example.com" });
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });
});
