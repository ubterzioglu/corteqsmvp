import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseBrowserClientMock = vi.fn();

vi.mock("./supabase", () => ({
  getSupabaseBrowserClient: () => getSupabaseBrowserClientMock(),
}));

import {
  createResourceEntry,
  deleteResourceEntry,
  listResourceEntries,
  updateResourceEntry,
} from "./resource-entries-api";

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: "entry-1",
  order_no: null,
  slug: null,
  section: "Genel",
  subsection: "Alt",
  department: "Genel",
  record_kind: "Link",
  added_by: "UBT",
  title: "Örnek",
  description: null,
  url: "https://example.com",
  file_id: null,
  file_type: null,
  mime_type: null,
  privacy_level: null,
  is_public_import: null,
  import_suggestion: null,
  tags: null,
  source_path: null,
  status: null,
  is_hidden: false,
  storage_bucket: null,
  storage_path: null,
  file_name: null,
  person_first_name: null,
  person_last_name: null,
  person_role: null,
  linkedin_url: null,
  instagram_url: null,
  website_url: null,
  source_folder: null,
  source_subfolder: null,
  source_snapshot_date: null,
  import_batch: null,
  created_at: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("resource-entries-api", () => {
  beforeEach(() => {
    getSupabaseBrowserClientMock.mockReset();
  });

  it("listResourceEntries: supabase yapılandırılmamışsa boş liste döner", async () => {
    getSupabaseBrowserClientMock.mockReturnValue(null);
    expect(await listResourceEntries()).toEqual([]);
  });

  it("listResourceEntries: satırları domain tipine eşler", async () => {
    const order = vi.fn().mockResolvedValue({ data: [makeRow()], error: null });
    const select = vi.fn(() => ({ order }));
    getSupabaseBrowserClientMock.mockReturnValue({ from: vi.fn(() => ({ select })) });

    const result = await listResourceEntries();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("entry-1");
    expect(result[0].isHidden).toBe(false);
  });

  it("createResourceEntry: supabase yapılandırılmamışsa null döner", async () => {
    getSupabaseBrowserClientMock.mockReturnValue(null);
    expect(await createResourceEntry({ title: "x" } as never)).toBeNull();
  });

  it("createResourceEntry: eklenen satırı domain tipine eşleyip döner", async () => {
    const single = vi.fn().mockResolvedValue({ data: makeRow({ id: "entry-2" }), error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    getSupabaseBrowserClientMock.mockReturnValue({ from: vi.fn(() => ({ insert })) });

    const result = await createResourceEntry({ title: "x" } as never);
    expect(result?.id).toBe("entry-2");
  });

  it("updateResourceEntry: hatada fırlatır", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "yok" } });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    getSupabaseBrowserClientMock.mockReturnValue({ from: vi.fn(() => ({ update })) });

    await expect(updateResourceEntry("entry-1", { title: "y" })).rejects.toEqual({ message: "yok" });
  });

  it("deleteResourceEntry: storage yolu varsa önce storage'dan, sonra satırı siler", async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const storageFrom = vi.fn(() => ({ remove }));
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn(() => ({ eq }));
    const tableFrom = vi.fn(() => ({ delete: del }));

    getSupabaseBrowserClientMock.mockReturnValue({
      storage: { from: storageFrom },
      from: tableFrom,
    });

    await deleteResourceEntry({ id: "entry-1", storageBucket: "bucket", storagePath: "path.pdf" });

    expect(storageFrom).toHaveBeenCalledWith("bucket");
    expect(remove).toHaveBeenCalledWith(["path.pdf"]);
    expect(tableFrom).toHaveBeenCalledWith("resource_entries");
    expect(eq).toHaveBeenCalledWith("id", "entry-1");
  });

  it("deleteResourceEntry: storage yolu yoksa yalnız satırı siler", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn(() => ({ eq }));
    const tableFrom = vi.fn(() => ({ delete: del }));
    const storageFrom = vi.fn();

    getSupabaseBrowserClientMock.mockReturnValue({ storage: { from: storageFrom }, from: tableFrom });

    await deleteResourceEntry({ id: "entry-1", storageBucket: null, storagePath: null });

    expect(storageFrom).not.toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "entry-1");
  });
});
