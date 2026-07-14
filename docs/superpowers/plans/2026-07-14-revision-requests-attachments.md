# Revizyon İstekleri — Görsel Ekleme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin/revision-requests` sayfasında hem revizyon taleplerine hem yorumlara çoklu görsel ekleme özelliği eklemek.

**Architecture:** `social_share_assets`/`burak-share` desenini genişleten yeni bağımsız tablo `revision_request_attachments` (talep veya yoruma bağlı, CHECK ile tam biri) + yeni private storage bucket `revision-attachments`. Mevcut `revision-requests.ts` API dosyasına attachment fonksiyonları eklenir; yeni ortak `RevisionAttachmentGrid` bileşeni hem talep detay drawer'ında hem yorum thread'inde kullanılır.

**Tech Stack:** React + TypeScript, Supabase (Postgres + Storage + RLS), TanStack Query, Vitest.

## Global Constraints

- Görsel MIME kısıtı: `image/jpeg, image/png, image/webp, image/gif`, boyut limiti 15MB (spec Bölüm 3, `burak-share` ile aynı).
- RLS: yalnız admin okur/yazar (`public.is_admin(auth.uid())`), tüm adminler ortak görür (spec Bölüm 3).
- Soft-delete: `deleted_at` kolonu, satır fiziksel silinmez (sayfanın geri kalanıyla tutarlı, spec Bölüm 3).
- CHECK kısıtı: her attachment satırı ya `request_id` ya `comment_id`'ye bağlı, ikisine birden değil (spec Bölüm 3).
- Path şeması: `request/<request_id>/<timestamp>-<rand>-<safeName>` veya `comment/<comment_id>/<timestamp>-<rand>-<safeName>` (spec Bölüm 3).
- Yeni talep formunda draft-upload YOK — kayıt önce oluşturulur, sonra drawer'dan görsel eklenir (spec Bölüm 2, Bölüm 6).
- Türkçe metin kuralları: UI metinleri Türkçe, `trIncludes`/`trUpper` gerekmiyor burada (sabit etiketler, kullanıcı girdisi arama/karşılaştırma yok).
- Migration commit ≠ canlı DB — canlıya uygulama ayrı onay adımı (spec Bölüm 7).

---

## Dosya Yapısı

**Create:**
- `supabase/migrations/20260714120000_revision_request_attachments.sql` — tablo + RLS + bucket + storage policy
- `src/components/admin/revision/RevisionAttachmentGrid.tsx` — ortak thumbnail grid + yükle/sil bileşeni
- `src/components/admin/revision/RevisionAttachmentGrid.test.tsx` — bileşen testi (yok, API katmanı test edilir; bkz Task 3 notu)

**Modify:**
- `src/lib/admin-shell/revision-requests.ts` — `RevisionAttachment` tipi + 4 yeni fonksiyon
- `src/lib/admin-shell/revision-requests.test.ts` — yeni fonksiyonlar için testler
- `src/pages/admin/AdminRevisionRequestsPage.tsx` — drawer'a `RevisionAttachmentGrid` eklenir + yeni-talep-sonrası-drawer-aç akışı
- `src/components/admin/revision/RevisionCommentThread.tsx` — her yoruma `RevisionAttachmentGrid` + compose alanına dosya seçici
- `src/lib/admin-shell/admin-updates.ts` — duyuru girdisi (Task 6)

---

## Task 1: Migration — tablo + RLS + storage bucket

**Files:**
- Create: `supabase/migrations/20260714120000_revision_request_attachments.sql`

**Interfaces:**
- Produces: tablo `revision_request_attachments` (id, request_id, comment_id, storage_path, file_name, content_type, size_bytes, created_by, created_at, deleted_at), bucket `revision-attachments`.

- [ ] **Step 1: Migration dosyasını yaz**

```sql
-- Revizyon İstekleri — talep/yorum ekleri (görsel).
-- /admin/revision-requests sayfasında bir revizyon talebine veya bir yoruma
-- eklenen görseller. Her satır tam olarak bir üst kayda bağlıdır (talep XOR yorum).
-- Görünürlük: tüm adminler ortak okur/yazar. RLS gate = public.is_admin(auth.uid()).
-- Desen kaynakları:
--   • Tablo/RLS deseni → 20260628100000_revision_requests.sql
--   • Storage bucket/policy deseni → 20260708120000_burak_share_assets.sql

-- 1) Ekler tablosu -----------------------------------------------------------
create table if not exists public.revision_request_attachments (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid references public.revision_requests (id) on delete cascade,
  comment_id    uuid references public.revision_request_comments (id) on delete cascade,
  storage_path  text not null,
  file_name     text not null,
  content_type  text,
  size_bytes    integer,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  constraint revision_request_attachments_one_parent_chk check (
    ((request_id is not null)::int + (comment_id is not null)::int) = 1
  )
);

create index if not exists revision_request_attachments_request_idx
  on public.revision_request_attachments (request_id) where deleted_at is null;
create index if not exists revision_request_attachments_comment_idx
  on public.revision_request_attachments (comment_id) where deleted_at is null;

-- 2) RLS — yalnız admin okur/yazar; tüm adminler ortak görür -----------------
alter table public.revision_request_attachments enable row level security;

drop policy if exists revision_request_attachments_admin_select on public.revision_request_attachments;
create policy revision_request_attachments_admin_select on public.revision_request_attachments
  for select using (public.is_admin(auth.uid()));

drop policy if exists revision_request_attachments_admin_insert on public.revision_request_attachments;
create policy revision_request_attachments_admin_insert on public.revision_request_attachments
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists revision_request_attachments_admin_update on public.revision_request_attachments;
create policy revision_request_attachments_admin_update on public.revision_request_attachments
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists revision_request_attachments_admin_delete on public.revision_request_attachments;
create policy revision_request_attachments_admin_delete on public.revision_request_attachments
  for delete using (public.is_admin(auth.uid()));

comment on table public.revision_request_attachments is
  'Revizyon talebi/yorum görsel ekleri: satır başına tek dosya, talep XOR yoruma bağlı (ortak, admin-only).';

-- 3) Private storage bucket (yalnız admin okuma/yazma) ----------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'revision-attachments',
  'revision-attachments',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where not exists (
  select 1 from storage.buckets where id = 'revision-attachments'
);

drop policy if exists "revision attachments admin read" on storage.objects;
create policy "revision attachments admin read"
  on storage.objects for select to authenticated
  using (bucket_id = 'revision-attachments' and public.is_admin(auth.uid()));

drop policy if exists "revision attachments admin insert" on storage.objects;
create policy "revision attachments admin insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'revision-attachments' and public.is_admin(auth.uid()));

drop policy if exists "revision attachments admin update" on storage.objects;
create policy "revision attachments admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'revision-attachments' and public.is_admin(auth.uid()))
  with check (bucket_id = 'revision-attachments' and public.is_admin(auth.uid()));

drop policy if exists "revision attachments admin delete" on storage.objects;
create policy "revision attachments admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'revision-attachments' and public.is_admin(auth.uid()));
```

- [ ] **Step 2: Dosyanın UTF-8 ve mojibake temiz olduğunu doğrula**

Run: `npm run verify:text`
Expected: PASS (yeni dosya `includeDirs` kapsamındaki `supabase/migrations` altında; script zaten tüm dizini tarar, ek konfig gerekmez).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260714120000_revision_request_attachments.sql
git commit -m "feat(revision-requests): revizyon istegi/yorum gorsel ekleri tablosu + bucket migration"
```

---

## Task 2: API katmanı — tip + fonksiyonlar (TDD)

**Files:**
- Modify: `src/lib/admin-shell/revision-requests.ts`
- Modify: `src/lib/admin-shell/revision-requests.test.ts`

**Interfaces:**
- Consumes: mevcut `table()` / `LooseQuery` köprüsü (dosyada zaten tanımlı, satır 81-93), `sanitizeError` (`@/lib/security`), `supabase` (`@/integrations/supabase/client`).
- Produces:
  - `type RevisionAttachment = { id: string; requestId: string | null; commentId: string | null; storagePath: string; fileName: string; contentType: string | null; sizeBytes: number | null; createdBy: string | null; createdAt: string }`
  - `type AttachmentParent = { requestId: string } | { commentId: string }`
  - `fetchAttachments(parent: AttachmentParent): Promise<RevisionAttachment[]>`
  - `uploadAttachment(parent: AttachmentParent, file: File): Promise<RevisionAttachment>`
  - `deleteAttachment(id: string, storagePath: string): Promise<void>`
  - `getAttachmentUrl(storagePath: string): Promise<string>`

### Step 1: Yazılacak testler (RED)

- [ ] **Step 1a: `revision-requests.test.ts`'e mock genişletmesi ekle**

Mevcut dosyanın en üstünde `vi.mock("@/integrations/supabase/client", ...)` bloğu var (satır 9-15). Bu bloğa `storage` ekle:

```ts
// Dosyanın en üstündeki vi.hoisted + vi.mock bloğunu şu şekilde genişlet:
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
```

(Bu, dosyanın satır 3-15 aralığındaki mevcut bloğun yerine geçer — `storageFromMock` ve `storage` eklenir, geri kalan aynı kalır.)

- [ ] **Step 1b: import listesine yeni fonksiyonları ekle**

Mevcut import bloğunun (satır 17-32) sonuna ekle:

```ts
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
```

- [ ] **Step 1c: Testleri dosyanın sonuna ekle**

```ts
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
```

- [ ] **Step 2: Testleri çalıştır, başarısız olduğunu doğrula**

Run: `npm run test -- src/lib/admin-shell/revision-requests.test.ts`
Expected: FAIL — `fetchAttachments`, `uploadAttachment`, `deleteAttachment`, `getAttachmentUrl` tanımsız (import hatası).

### Step 3: Minimal implementasyon (GREEN)

- [ ] **Step 3a: `revision-requests.ts` en üstündeki import'a `validateFile` ekle**

Mevcut satır 11:
```ts
import { sanitizeError, validateContent, validateTitle } from "@/lib/security";
```
şu şekilde değiştir:
```ts
import { sanitizeError, validateContent, validateFile, validateTitle } from "@/lib/security";
```

- [ ] **Step 3b: Dosyanın en sonuna (satır 317'den, `fetchUserEmails` fonksiyonundan sonra) yeni tip + fonksiyonları ekle**

```ts
export type RevisionAttachment = {
  id: string;
  requestId: string | null;
  commentId: string | null;
  storagePath: string;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  createdBy: string | null;
  createdAt: string;
};

export type AttachmentParent = { requestId: string } | { commentId: string };

type AttachmentRow = {
  id: string;
  request_id: string | null;
  comment_id: string | null;
  storage_path: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
  created_by: string | null;
  created_at: string;
};

const ATTACHMENT_SELECT =
  "id,request_id,comment_id,storage_path,file_name,content_type,size_bytes,created_by,created_at";
const ATTACHMENTS_BUCKET = "revision-attachments";

function mapAttachment(row: AttachmentRow): RevisionAttachment {
  return {
    id: row.id,
    requestId: row.request_id,
    commentId: row.comment_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function attachmentParentColumn(parent: AttachmentParent): { column: "request_id" | "comment_id"; value: string } {
  return "requestId" in parent
    ? { column: "request_id", value: parent.requestId }
    : { column: "comment_id", value: parent.commentId };
}

function attachmentPathPrefix(parent: AttachmentParent): string {
  return "requestId" in parent ? `request/${parent.requestId}` : `comment/${parent.commentId}`;
}

function buildAttachmentPath(parent: AttachmentParent, file: File): string {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${attachmentPathPrefix(parent)}/${Date.now()}-${rand}-${safeName}`;
}

/** Bir talebin ya da yorumun aktif (silinmemiş) eklerini eskiden yeniye getirir. */
export async function fetchAttachments(parent: AttachmentParent): Promise<RevisionAttachment[]> {
  const { column, value } = attachmentParentColumn(parent);
  const { data, error } = await table("revision_request_attachments")
    .select(ATTACHMENT_SELECT)
    .eq(column, value)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(sanitizeError(error, "Ekler yüklenemedi."));
  }

  return ((data as AttachmentRow[]) ?? []).map(mapAttachment);
}

/** Bir dosyayı revision-attachments bucket'ına yükler ve satır ekler (created_by = aktif admin). */
export async function uploadAttachment(
  parent: AttachmentParent,
  file: File,
): Promise<RevisionAttachment> {
  const fileError = validateFile(file, {
    allowedExtensions: new Set(["png", "jpg", "jpeg", "gif", "webp"]),
    maxSize: 15 * 1024 * 1024,
  });
  if (fileError) {
    throw new Error(fileError);
  }

  const path = buildAttachmentPath(parent, file);
  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) {
    throw new Error(sanitizeError(uploadError, "Görsel yüklenemedi."));
  }

  const createdBy = await currentUserId();
  const { column, value } = attachmentParentColumn(parent);
  const { data, error } = await table("revision_request_attachments")
    .insert({
      [column]: value,
      storage_path: path,
      file_name: file.name,
      content_type: file.type || null,
      size_bytes: file.size,
      created_by: createdBy,
    })
    .select(ATTACHMENT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Görsel yüklenemedi."));
  }

  return mapAttachment(data as AttachmentRow);
}

/** Eki storage'dan siler ve satırı soft-delete eder. */
export async function deleteAttachment(id: string, storagePath: string): Promise<void> {
  const { error: removeError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .remove([storagePath]);
  if (removeError) {
    throw new Error(sanitizeError(removeError, "Ek silinemedi."));
  }

  const { error } = await table("revision_request_attachments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(sanitizeError(error, "Ek silinemedi."));
  }
}

/** Bir ekin görüntülenmesi için kısa ömürlü signed URL üretir. */
export async function getAttachmentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) {
    throw new Error(sanitizeError(error, "Görsel için erişim linki üretilemedi."));
  }
  return data.signedUrl;
}
```

- [ ] **Step 3c: Testleri tekrar çalıştır, geçtiğini doğrula**

Run: `npm run test -- src/lib/admin-shell/revision-requests.test.ts`
Expected: PASS (tüm testler, eski + yeni).

- [ ] **Step 4: Lint + typecheck**

Run: `npm run lint`
Expected: PASS, hata yok.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin-shell/revision-requests.ts src/lib/admin-shell/revision-requests.test.ts
git commit -m "feat(revision-requests): ek (attachment) API katmani - fetch/upload/delete/signed-url"
```

---

## Task 3: Ortak `RevisionAttachmentGrid` bileşeni

**Files:**
- Create: `src/components/admin/revision/RevisionAttachmentGrid.tsx`

**Interfaces:**
- Consumes: `fetchAttachments`, `uploadAttachment`, `deleteAttachment`, `getAttachmentUrl`, `type RevisionAttachment`, `type AttachmentParent` (`@/lib/admin-shell/revision-requests`, Task 2'de üretildi); `AdminEmptyState` yok (kullanılmıyor, grid boşsa sadece buton gösterilir); `Button`, `useToast` (mevcut proje hook'ları).
- Produces: `<RevisionAttachmentGrid parent={{ requestId } | { commentId }} />` — prop olarak sadece parent alır, kendi içinde React Query ile veri çeker.

Not: Bu bileşen için ayrı bir `.test.tsx` dosyası **yazılmaz** — proje genelinde `RevisionCommentThread`/`RevisionRequestForm` gibi UI bileşenlerinin component-level testi yok (yalnız `*-api.ts` dosyaları test ediliyor, bkz mevcut `revision-requests.test.ts`). Davranış Task 2'nin API testleriyle ve Task 5/6'daki manuel QA adımıyla doğrulanır — mevcut proje pratiğiyle tutarlı (YAGNI).

- [ ] **Step 1: Bileşeni yaz**

```tsx
// Revizyon talebi/yorum görsel ekleri — ortak thumbnail grid.
// AdminRevisionRequestsPage (talep detay drawer'ı) ve RevisionCommentThread
// (her yorumun altı) tarafından kullanılır.

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  deleteAttachment,
  fetchAttachments,
  getAttachmentUrl,
  uploadAttachment,
  type AttachmentParent,
  type RevisionAttachment,
} from "@/lib/admin-shell/revision-requests";

function attachmentsKey(parent: AttachmentParent) {
  return "requestId" in parent
    ? (["revision-attachments", "request", parent.requestId] as const)
    : (["revision-attachments", "comment", parent.commentId] as const);
}

const errMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Beklenmeyen hata";

function AttachmentThumbnail({
  attachment,
  onDelete,
  isDeleting,
}: {
  attachment: RevisionAttachment;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useState(() => {
    getAttachmentUrl(attachment.storagePath)
      .then(setUrl)
      .catch(() => setUrl(null));
  });

  return (
    <div className="group relative h-16 w-16 overflow-hidden rounded border border-border bg-muted">
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={attachment.fileName} className="h-full w-full object-cover" />
        </a>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <button
        type="button"
        aria-label="Görseli sil"
        onClick={onDelete}
        disabled={isDeleting}
        className="absolute right-0.5 top-0.5 hidden rounded-full bg-background/90 p-1 text-muted-foreground hover:text-red-500 group-hover:block"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export type RevisionAttachmentGridProps = {
  parent: AttachmentParent;
};

export function RevisionAttachmentGrid({ parent }: RevisionAttachmentGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const key = attachmentsKey(parent);

  const attachmentsQuery = useQuery({
    queryKey: key,
    queryFn: () => fetchAttachments(parent),
  });
  const attachments = attachmentsQuery.data ?? [];

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(parent, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error: unknown) => {
      toast({ title: "Yüklenemedi", description: errMessage(error), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachment: RevisionAttachment) =>
      deleteAttachment(attachment.id, attachment.storagePath),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error: unknown) => {
      toast({ title: "Silinemedi", description: errMessage(error), variant: "destructive" });
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <AttachmentThumbnail
            key={attachment.id}
            attachment={attachment}
            onDelete={() => deleteMutation.mutate(attachment)}
            isDeleting={deleteMutation.isPending}
          />
        ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={uploadMutation.isPending}
        onClick={() => fileRef.current?.click()}
      >
        {uploadMutation.isPending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="mr-1.5 h-3.5 w-3.5" />
        )}
        Görsel Ekle
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Lint + typecheck**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/revision/RevisionAttachmentGrid.tsx
git commit -m "feat(revision-requests): ortak RevisionAttachmentGrid bileseni"
```

---

## Task 4: Talep detay drawer'ına entegrasyon + yeni-talep-sonrası-otomatik-aç

**Files:**
- Modify: `src/pages/admin/AdminRevisionRequestsPage.tsx`

**Interfaces:**
- Consumes: `RevisionAttachmentGrid` (Task 3), mevcut `createRevisionRequest` dönüş tipi `RevisionRequest` (zaten `id` alanı var).

- [ ] **Step 1: Import ekle**

Mevcut satır 9-10'un (import bloğu) hemen altına ekle:

```tsx
import { RevisionAttachmentGrid } from "@/components/admin/revision/RevisionAttachmentGrid";
```

- [ ] **Step 2: `upsertMutation.onSuccess`'i genişlet — yeni talep oluşunca drawer'ı otomatik aç**

Mevcut kod (satır 77-93):
```tsx
  const upsertMutation = useMutation({
    mutationFn: (form: RevisionRequestFormState) =>
      editing ? updateRevisionRequest(editing.id, form) : createRevisionRequest(form),
    onSuccess: async () => {
      setFormOpen(false);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
      toast({ title: editing ? "Revizyon isteği güncellendi" : "Revizyon isteği oluşturuldu" });
    },
    onError: (error: unknown) => {
      toast({
        title: "İşlem başarısız",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });
```

Şu şekilde değiştir (`onSuccess` artık oluşturulan/güncellenen kaydı alır ve yeni kayıtta drawer'ı açar):

```tsx
  const upsertMutation = useMutation({
    mutationFn: (form: RevisionRequestFormState) =>
      editing ? updateRevisionRequest(editing.id, form) : createRevisionRequest(form),
    onSuccess: async (saved) => {
      const wasCreate = !editing;
      setFormOpen(false);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
      toast({ title: wasCreate ? "Revizyon isteği oluşturuldu" : "Revizyon isteği güncellendi" });
      if (wasCreate) {
        setSelectedId(saved.id);
      }
    },
    onError: (error: unknown) => {
      toast({
        title: "İşlem başarısız",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });
```

- [ ] **Step 3: Drawer içeriğine `RevisionAttachmentGrid` ekle**

Mevcut kod (satır 244-253):
```tsx
        {selected ? (
          <div className="flex h-full flex-col gap-4">
            {selected.detail ? (
              <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm text-foreground">
                {selected.detail}
              </p>
            ) : null}
            <RevisionCommentThread requestId={selected.id} />
          </div>
        ) : null}
```

Şu şekilde değiştir (görsel bölümü `detail` ile yorum thread'i arasına girer):

```tsx
        {selected ? (
          <div className="flex h-full flex-col gap-4">
            {selected.detail ? (
              <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm text-foreground">
                {selected.detail}
              </p>
            ) : null}
            <RevisionAttachmentGrid parent={{ requestId: selected.id }} />
            <RevisionCommentThread requestId={selected.id} />
          </div>
        ) : null}
```

- [ ] **Step 4: Lint + typecheck**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Testleri çalıştır (regresyon kontrolü)**

Run: `npm run test -- src/lib/admin-shell/revision-requests.test.ts`
Expected: PASS (bu dosya UI'a dokunmuyor ama Task 2 fonksiyonlarının hâlâ doğru çalıştığını doğrular).

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/AdminRevisionRequestsPage.tsx
git commit -m "feat(revision-requests): talep detay drawer'ina gorsel grid + yeni-talep-sonrasi otomatik ac"
```

---

## Task 5: Yorum thread'ine entegrasyon + compose'da dosya seçimi

**Files:**
- Modify: `src/components/admin/revision/RevisionCommentThread.tsx`

**Interfaces:**
- Consumes: `RevisionAttachmentGrid` (Task 3), `uploadAttachment` (Task 2), mevcut `addComment` (değişmez).

- [ ] **Step 1: Import ekle**

Mevcut satır 4-6'nın hemen altına, mevcut import bloğuna (satır 12-18) ekle:

```tsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Paperclip, Send, Trash2, X } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/page";
import { RevisionAttachmentGrid } from "@/components/admin/revision/RevisionAttachmentGrid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  addComment,
  deleteComment,
  fetchComments,
  fetchUserEmails,
  uploadAttachment,
  type RevisionComment,
} from "@/lib/admin-shell/revision-requests";
```

(Bu, dosyanın satır 4-18 aralığındaki tüm import bloğunun yerine geçer — `Paperclip`/`X` ikonları ve `RevisionAttachmentGrid`/`uploadAttachment` eklenir.)

- [ ] **Step 2: Draft dosya state'i ve compose'a dosya seçici ekle**

Mevcut kod (satır 41-44):
```tsx
export function RevisionCommentThread({ requestId }: RevisionCommentThreadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
```

Şu şekilde değiştir:

```tsx
export function RevisionCommentThread({ requestId }: RevisionCommentThreadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
```

`useRef` import'unu Step 1'deki bloğa ekle — satır başındaki `import { useState } from "react";` satırını şu şekilde değiştir:

```tsx
import { useRef, useState } from "react";
```

- [ ] **Step 3: `addMutation`'ı genişlet — yorum oluşunca seçilen dosyaları yükle**

Mevcut kod (satır 60-74):
```tsx
  const addMutation = useMutation({
    mutationFn: (body: string) => addComment(requestId, body),
    onSuccess: async () => {
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: commentsKey(requestId) });
      await queryClient.invalidateQueries({ queryKey: ["revision-requests"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Yorum eklenemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });
```

Şu şekilde değiştir:

```tsx
  const addMutation = useMutation({
    mutationFn: (body: string) => addComment(requestId, body),
    onSuccess: async (comment) => {
      setDraft("");
      const filesToUpload = draftFiles;
      setDraftFiles([]);
      await queryClient.invalidateQueries({ queryKey: commentsKey(requestId) });
      await queryClient.invalidateQueries({ queryKey: ["revision-requests"] });

      for (const file of filesToUpload) {
        try {
          await uploadAttachment({ commentId: comment.id }, file);
        } catch (error: unknown) {
          toast({
            title: "Görsel yüklenemedi",
            description: error instanceof Error ? error.message : "Bilinmeyen hata",
            variant: "destructive",
          });
        }
      }
      if (filesToUpload.length > 0) {
        await queryClient.invalidateQueries({
          queryKey: ["revision-attachments", "comment", comment.id],
        });
      }
    },
    onError: (error: unknown) => {
      toast({
        title: "Yorum eklenemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });
```

- [ ] **Step 4: Yorum listesindeki her karta `RevisionAttachmentGrid` ekle**

Mevcut kod (satır 109-131, yorum map'i içindeki `<p>` satırı):
```tsx
              <p className="whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
            </div>
          ))
        )}
```

Şu şekilde değiştir:

```tsx
              <p className="whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
              <div className="mt-2">
                <RevisionAttachmentGrid parent={{ commentId: comment.id }} />
              </div>
            </div>
          ))
        )}
```

- [ ] **Step 5: Compose alanına dosya seçici ekle**

Mevcut kod (satır 135-156, textarea + gönder butonu bloğu):
```tsx
      <div className="space-y-2 border-t border-border pt-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Yorum yazın…"
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSend}
            disabled={addMutation.isPending || !draft.trim()}
          >
            {addMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Gönder
          </Button>
        </div>
      </div>
```

Şu şekilde değiştir:

```tsx
      <div className="space-y-2 border-t border-border pt-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Yorum yazın…"
          rows={3}
        />
        {draftFiles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {draftFiles.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {file.name}
                <button
                  type="button"
                  aria-label="Dosyayı kaldır"
                  onClick={() => setDraftFiles((prev) => prev.filter((_, i) => i !== index))}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = event.target.files;
            if (files && files.length > 0) {
              setDraftFiles((prev) => [...prev, ...Array.from(files)]);
            }
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
            <Paperclip className="mr-1.5 h-3.5 w-3.5" />
            Görsel Ekle
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={addMutation.isPending || !draft.trim()}
          >
            {addMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Gönder
          </Button>
        </div>
      </div>
```

- [ ] **Step 6: `Trash2` import'unun hâlâ kullanıldığını doğrula**

Dosyada `Trash2` zaten yorum silme ikonunda kullanılıyor (satır 125) — Step 1'deki import listesinde tutuldu, ekstra işlem gerekmez.

- [ ] **Step 7: Lint + typecheck**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/revision/RevisionCommentThread.tsx
git commit -m "feat(revision-requests): yorum thread'ine gorsel grid + compose'da coklu dosya secimi"
```

---

## Task 6: Tam test suite + duyuru girdisi + son doğrulama

**Files:**
- Modify: `src/lib/admin-shell/admin-updates.ts`

**Interfaces:**
- Consumes: mevcut `AdminUpdateEntry` tipi (dosyada zaten tanımlı).

- [ ] **Step 1: Tüm proje test suite'ini çalıştır**

Run: `npm run test`
Expected: PASS — tüm dosyalar (mevcut + Task 2'de eklenenler) yeşil, 0 fail.

- [ ] **Step 2: Full lint**

Run: `npm run lint`
Expected: PASS, 0 hata.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: PASS, `dist/` üretilir, tip hatası yok.

- [ ] **Step 4: `admin-updates.ts`'e duyuru girdisi ekle**

Mevcut dosyanın `ADMIN_UPDATES` dizisinin en başına (satır 16, ilk `{` açılışından hemen önce) yeni girdi ekle:

```ts
export const ADMIN_UPDATES: AdminUpdateEntry[] = [
  {
    id: "20260714-revizyon-istekleri-gorsel-ekleme",
    date: "14 Temmuz 2026",
    title: "Revizyon İstekleri'ne görsel ekleme eklendi: hem talebe hem yorumlara çoklu görsel",
    items: [
      "Admin panelindeki Revizyon İstekleri (/admin/revision-requests) sayfasında artık hem bir revizyon talebine hem de talebin altındaki her yoruma birden fazla görsel eklenebiliyor. Bir talep açtıktan sonra detay panelinden, ya da yorum yazarken 'Görsel Ekle' ile ekran görüntüsü/referans görsel paylaşılabiliyor.",
      "Yüklenen görseller veritabanında KALICI olarak saklanıyor ve tüm adminler ortak görüyor — biri bir görsel eklediğinde diğer adminler de aynı anda görüyor. Görseller yalnız adminlere açık özel bir depoda (private bucket) tutuluyor; her görsel tekil olarak silinebiliyor.",
      "Teknik tarafta: yeni revision_request_attachments tablosu + admin-only güvenlik kuralları (RLS) + özel 'revision-attachments' depo tek migration'da; ek API'si otomatik testlerle korunuyor, tüm proje testleri yeşil. Sayfanın görünmesi için bir sonraki yayın (deploy) gerekiyor; veritabanı/depo değişikliğinin canlıya uygulanması ayrı bir onay adımı olarak bekliyor.",
    ],
  },
```

(Mevcut ilk girdi `20260708-burak-buraya-bak-paylasim-bolumu` bu yeni girdinin hemen ardından, dizide olduğu gibi devam eder — sadece en başa ekleme yapılır, mevcut girdiler silinmez/değiştirilmez.)

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin-shell/admin-updates.ts
git commit -m "docs(admin-updates): revizyon istekleri gorsel ekleme duyurusu"
```

---

## Bitiş (kullanıcı tarafı — kod dışı)

Bu adımlar plan kapsamı dışındadır, implementasyon tamamlandıktan sonra kullanıcı/agent tarafından ayrıca yürütülür:

1. Migration'ı canlı DB'ye uygula (Management API curl, memory: `project_referral_admin_rls_fix` dersi — psql pooler bağlantısı da alternatif).
2. `git push` (main branch classifier'a takılırsa kullanıcı onayı + `dangerouslyDisableSandbox`).
3. Coolify deploy.
4. Görsel QA: talep oluştur → drawer'da görsel ekle → önizleme → sayfa yenile → kalıcılık → ikinci admin hesabıyla görünürlük kontrolü; yorum yaz + dosya ekle → thread'de görünür; her iki yerde silme çalışıyor.
