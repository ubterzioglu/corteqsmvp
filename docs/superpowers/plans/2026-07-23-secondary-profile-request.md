# İkinci Profil Talebi (Admin Onaylı Yeni Profil) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bir kullanıcının, mevcut Bireysel profiline dokunmadan, admin onayı ile ikinci bir profil (başka bir rol için) açabilmesini sağlamak.

**Architecture:** Mevcut generic `approval_requests` onay kuyruğuna yeni bir `request_type = 'new_profile'` değeri eklenir. Kullanıcı tarafında yeni bir RPC (`request_new_catalog_item`) talebi kuyruğa yazar; admin tarafında mevcut `admin_review_approval_request` fonksiyonuna yeni bir `elsif` dalı eklenir — onaylanınca yeni `catalog_items` + `catalog_item_roles` + `catalog_item_managers` satırları oluşturulur. Admin UI (`AdminApprovalsPage`) ve kullanıcı tarafı geçiş menüsü (`ProfileSwitcherMenu`) hiçbir değişiklik gerektirmeden yeni türü otomatik olarak destekler.

**Tech Stack:** Supabase Postgres (plpgsql RPC + migration), React + TypeScript + Vitest, TanStack Query.

## Global Constraints

- Domain terimleri Türkçe kalacak (bkz. CLAUDE.md) — `catalog_items`, `role_key` gibi teknik isimler İngilizce kalır, kullanıcıya gösterilen metinler Türkçe.
- Türkçe metin kuralları: kullanıcıya görünen string'lerde `trUpper`/`trLower`/`trIncludes` (bkz. `src/lib/text-normalization.ts`) — bu görevde büyük/küçük harf dönüşümü yapılmıyor, o yüzden pratikte tetiklenmez ama yeni bir liste/karşılaştırma eklenirse kural geçerli.
- Supabase migration'ları asla silinmez/yeniden sıralanmaz — sadece yeni migration eklenir.
- RLS ve RPC'ler whitelist mantığıyla yazılır (bkz. CLAUDE.md §Visibility & RLS) — `security definer` fonksiyonlar `auth.uid()` kontrolü yapmadan hiçbir yazma işlemi yapmaz.
- Mevcut `submit_role_change_request` / `admin_review_approval_request` deseni referans alınır — yeni bir mimari icat edilmez.
- Migration dosya adı `YYYYMMDDHHMMSS_açıklama.sql` formatında, en son migration `20260721140000` olduğu için yeni migration `20260723100000` ile başlar.

---

## Dosya Yapısı

**Yeni migration:**
- `supabase/migrations/20260723100000_secondary_profile_request.sql` — CHECK constraint genişletme + 2 yeni RPC + `admin_review_approval_request` güncellemesi

**Değişecek dosyalar:**
- `src/lib/member-profile-api.ts` — yeni `requestNewCatalogItem()` fonksiyonu eklenir (mevcut `submitRoleChangeRequest` deseniyle aynı satırda)
- `src/pages/admin/AdminApprovalsPage.tsx` — `FILTER_OPTIONS` listesine yeni satır

**Yeni test dosyaları:**
- `src/lib/member-profile-api.test.ts` — mevcut dosyaya yeni `describe` bloğu eklenir (yeni dosya değil, mevcut dosya genişletilir)

**Yeni UI dosyası (yeni profil talep formu):**
- `src/components/profile/RequestNewProfileDialog.tsx` — rol seçimi + başlık + not formu, `ProfileSwitcherMenu`'nün yanına eklenir
- `src/components/profile/RequestNewProfileDialog.test.tsx` — form davranış testi

**Değişecek dosya (formu bağlamak için):**
- `src/components/profile/ProfileSwitcherMenu.tsx` — "+ Yeni Profil" tetikleyicisi eklenir

---

## Task 1: Migration — CHECK constraint genişletme + `request_new_catalog_item` RPC'si

**Files:**
- Create: `supabase/migrations/20260723100000_secondary_profile_request.sql`

**Interfaces:**
- Consumes: `public.roles` (key, is_active), `public.approval_requests` (mevcut şema), `public.catalog_items`, `public.catalog_item_roles`, `public.catalog_item_managers`
- Produces: `public.request_new_catalog_item(p_role_key text, p_title text, p_note text default null) returns uuid` — çağıran kullanıcı için `approval_requests` tablosuna `request_type='new_profile'` satırı ekler, `id` döner.

- [ ] **Step 1: Migration dosyasını oluştur — CHECK constraint genişletme**

```sql
-- Secondary Profile Request — Migration: new_profile request type + RPCs
--
-- Kullanıcının mevcut profiline dokunmadan, admin onayı ile ikinci bir profil
-- (başka bir rol için) açabilmesini sağlar. Mevcut approval_requests onay
-- kuyruğuna yeni bir request_type ('new_profile') eklenir; submit_role_change_request
-- deseninin bir kopyasıdır.
--
-- Idempotent.

begin;

-- 1. request_type CHECK constraint'ini 'new_profile' değerini kapsayacak şekilde genişlet.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'approval_requests_request_type_check'
  ) then
    alter table public.approval_requests
      drop constraint approval_requests_request_type_check;
  end if;

  alter table public.approval_requests
    add constraint approval_requests_request_type_check
    check (request_type in (
      'role_change','directory_visibility','contact_visibility','featured_listing',
      'event_create','offer_create','referral_create','attribute_change','city_manage',
      'new_profile'
    ));
end $$;

comment on constraint approval_requests_request_type_check on public.approval_requests is
  'Secondary profile request 2026-07-23: added new_profile request type.';

commit;
```

- [ ] **Step 2: Aynı dosyaya `request_new_catalog_item` RPC'sini ekle**

```sql
begin;

-- 2. request_new_catalog_item: kullanıcı ikinci bir profil (başka rol için) talep eder.
-- submit_role_change_request deseninin kopyası — tek fark: kullanıcının mevcut rolüne
-- dokunmaz, sadece pending bir 'new_profile' talebi kuyruğa yazar.
create or replace function public.request_new_catalog_item(
  p_role_key text,
  p_title text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_title text;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_role_key is null or btrim(p_role_key) = '' then
    raise exception 'role key is required' using errcode = '22023';
  end if;

  if not exists (select 1 from public.roles r where r.key = p_role_key and r.is_active = true) then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  v_title := nullif(btrim(coalesce(p_title, '')), '');
  if v_title is null then
    raise exception 'title is required' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.approval_requests
    where user_id = auth.uid()
      and request_type = 'new_profile'
      and status = 'pending'
  ) then
    raise exception 'a pending new profile request already exists' using errcode = '22023';
  end if;

  insert into public.approval_requests (
    request_type, user_id, target_role_key,
    target_entity_type, payload, status
  ) values (
    'new_profile', auth.uid(), p_role_key,
    'catalog_item', jsonb_build_object('role_key', p_role_key, 'title', v_title, 'note', p_note), 'pending'
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

grant execute on function public.request_new_catalog_item(text, text, text) to authenticated;

comment on function public.request_new_catalog_item(text, text, text) is
  'Secondary profile request 2026-07-23: user requests a second catalog_items profile for another role. Admin-approved via admin_review_approval_request.';

commit;
```

- [ ] **Step 3: Migration'ı local Supabase'e uygula ve doğrula**

Run: `supabase db push --local` (proje zaten `supabase/migrations` altında dosya bazlı çalışıyor; local doğrulama için `supabase db reset` veya proje kurulumundaki mevcut komut kullanılır — bu repo'da canlıya psql/Management API ile uygulanıyor, bkz. CLAUDE.md §Database & Migrations).

Expected: Migration hatasız çalışır, `select conname from pg_constraint where conname = 'approval_requests_request_type_check'` sorgusu constraint'in var olduğunu, `select proname from pg_proc where proname = 'request_new_catalog_item'` fonksiyonun var olduğunu gösterir.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260723100000_secondary_profile_request.sql
git commit -m "feat(db): add new_profile approval request type + request_new_catalog_item RPC"
```

---

## Task 2: Migration — `admin_review_approval_request` fonksiyonuna `new_profile` onay dalı

**Files:**
- Modify: `supabase/migrations/20260723100000_secondary_profile_request.sql` (Task 1'de oluşturulan dosyaya ekleme)

**Interfaces:**
- Consumes: `public.admin_review_approval_request(request_id uuid, decision text, note text)` — mevcut fonksiyon, `CREATE OR REPLACE` ile güncellenir (bkz. `supabase/migrations/20260609100901_rebuild_010d_fix_user_profiles_leftovers.sql:290`).
- Produces: `new_profile` onaylandığında `catalog_items` (yeni satır), `catalog_item_roles` (yeni satır, `is_primary=true`), `catalog_item_managers` (yeni satır, `role='owner'`, `status='active'`) oluşur.

- [ ] **Step 1: Aynı migration dosyasına `admin_review_approval_request`'in güncellenmiş halini ekle**

Mevcut fonksiyonun tam gövdesi `supabase/migrations/20260609100901_rebuild_010d_fix_user_profiles_leftovers.sql:290-448` içinde. Bu adımda o fonksiyon `CREATE OR REPLACE` ile yeniden tanımlanır — sadece `if decision = 'approved' then` bloğuna yeni bir `elsif` dalı eklenir, geri kalan davranış birebir korunur.

```sql
begin;

-- 3. admin_review_approval_request: new_profile onay dalı eklendi.
-- Diğer tüm dallar (role_change, attribute_change, directory_visibility vb.)
-- 20260609100901_rebuild_010d_fix_user_profiles_leftovers.sql ile birebir aynı.
CREATE OR REPLACE FUNCTION public.admin_review_approval_request(request_id uuid, decision text, note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_request public.approval_requests%rowtype;
  v_attribute public.afs_attributes%rowtype;
  v_attribute_value jsonb;
  v_visibility text;
  v_value_text text;
  v_new_item_id uuid;
  v_new_role_id uuid;
  v_new_slug text;
  v_new_title text;
  v_new_role_key text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if decision not in ('approved', 'rejected') then
    raise exception 'invalid decision' using errcode = '22023';
  end if;

  select * into v_request
  from public.approval_requests
  where id = request_id
  limit 1;

  if v_request.id is null then
    raise exception 'approval request not found' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'approval request is not pending' using errcode = '22023';
  end if;

  if decision = 'approved' then
    if v_request.request_type = 'role_change' then
      perform public.admin_set_user_role(v_request.user_id, v_request.target_role_key);
    elsif v_request.request_type = 'new_profile' then
      v_new_role_key := v_request.payload ->> 'role_key';
      v_new_title := nullif(btrim(coalesce(v_request.payload ->> 'title', '')), '');

      if v_new_title is null then
        v_new_title := 'CorteQS Üyesi';
      end if;

      select id into v_new_role_id
      from public.roles
      where key = v_new_role_key and is_active = true
      limit 1;

      if v_new_role_id is null then
        raise exception 'target role no longer valid' using errcode = '22023';
      end if;

      v_new_slug := 'profile-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);

      insert into public.catalog_items (
        item_type,
        slug,
        title,
        status,
        visibility,
        verification_status,
        linked_user_id,
        created_by_user_id,
        platform_role_key,
        attributes,
        published_at
      ) values (
        'member',
        v_new_slug,
        v_new_title,
        'published',
        'public',
        'claimed',
        v_request.user_id,
        v_request.user_id,
        v_new_role_key,
        jsonb_build_object('bridge_source', 'new_profile_request', 'platform_role_key', v_new_role_key),
        now()
      )
      returning id into v_new_item_id;

      insert into public.catalog_item_roles (catalog_item_id, role_id, is_primary)
      values (v_new_item_id, v_new_role_id, true)
      on conflict (catalog_item_id, role_id) do nothing;

      insert into public.catalog_item_managers (item_id, user_id, role, status)
      values (v_new_item_id, v_request.user_id, 'owner', 'active')
      on conflict (item_id, user_id, role) do update
      set status = 'active', updated_at = now();

      perform public.write_admin_audit_log(
        'catalog_item.new_profile_approved',
        v_request.user_id,
        'catalog_item',
        v_new_item_id,
        null,
        v_request.payload
      );
    elsif v_request.request_type = 'attribute_change' then
      select * into v_attribute
      from public.afs_attributes
      where key = v_request.payload ->> 'attribute_key'
      limit 1;

      v_attribute_value := v_request.payload -> 'attribute_value';
      v_visibility := coalesce(v_request.payload ->> 'visibility', 'private');
      v_value_text := nullif(btrim(coalesce(v_attribute_value #>> '{}', '')), '');

      if v_attribute.key = 'full_name' then
        insert into public.user_profile_attributes (
          user_id,
          attribute_id,
          value_text,
          value_json,
          visibility,
          approval_status,
          approved_by,
          approved_at,
          updated_at
        ) values (
          v_request.user_id,
          v_attribute.id,
          v_value_text,
          null,
          'public',
          'approved',
          auth.uid(),
          now(),
          now()
        )
        on conflict (user_id, attribute_id) do update
        set
          value_text = excluded.value_text,
          value_json = null,
          visibility = excluded.visibility,
          approval_status = 'approved',
          approved_by = excluded.approved_by,
          approved_at = excluded.approved_at,
          updated_at = now();
      else
        insert into public.user_profile_attributes (
          user_id,
          attribute_id,
          value_text,
          value_json,
          visibility,
          approval_status,
          approved_by,
          approved_at,
          updated_at
        ) values (
          v_request.user_id,
          v_attribute.id,
          case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
          case when v_attribute.data_type in ('multi_select','boolean','json') then v_attribute_value else null end,
          v_visibility,
          'approved',
          auth.uid(),
          now(),
          now()
        )
        on conflict (user_id, attribute_id) do update
        set
          value_text = excluded.value_text,
          value_json = excluded.value_json,
          visibility = excluded.visibility,
          approval_status = 'approved',
          approved_by = excluded.approved_by,
          approved_at = excluded.approved_at,
          updated_at = now();
      end if;

      perform public.write_admin_audit_log(
        'attribute.value_approved',
        v_request.user_id,
        'attribute',
        null,
        null,
        v_request.payload
      );
    elsif v_request.request_type in ('directory_visibility','contact_visibility','featured_listing','event_create','offer_create','referral_create','city_manage') then
      if v_request.target_feature_key is not null then
        perform public.admin_set_user_feature_override_detailed(
          v_request.user_id,
          v_request.target_feature_key,
          true,
          coalesce(note, 'approval_request:' || v_request.id::text)
        );
      end if;
    end if;
  elsif v_request.request_type = 'attribute_change' then
    perform public.write_admin_audit_log(
      'attribute.value_rejected',
      v_request.user_id,
      'attribute',
      null,
      null,
      v_request.payload
    );
  end if;

  update public.approval_requests
  set
    status = decision,
    admin_note = note,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where id = request_id;

  perform public.write_admin_audit_log(
    case when decision = 'approved' then 'approval.approved' else 'approval.rejected' end,
    v_request.user_id,
    'approval_request',
    v_request.id,
    to_jsonb(v_request),
    jsonb_build_object('status', decision, 'admin_note', note)
  );
end;
$function$;

comment on function public.admin_review_approval_request(uuid, text, text) is
  'Secondary profile request 2026-07-23: added new_profile branch (creates catalog_items + catalog_item_roles + catalog_item_managers on approval).';

commit;
```

- [ ] **Step 2: Migration'ı uygula ve manuel doğrulama sorgusu çalıştır**

Local/staging ortamda:
1. Bir test kullanıcısı olarak `select public.request_new_catalog_item('Consultant_HealthcareDoctor', 'Test Danışman Profili', 'test not');` çağır, dönen `id`'yi not al.
2. `select * from public.approval_requests where id = '<id>';` — `status='pending'`, `request_type='new_profile'` olduğunu doğrula.
3. Admin kullanıcısı olarak `select public.admin_review_approval_request('<id>', 'approved', 'onaylandı');` çağır.
4. `select * from public.catalog_items where created_by_user_id = '<test_user_id>' and platform_role_key = 'Consultant_HealthcareDoctor';` — yeni satırın oluştuğunu doğrula.
5. `select * from public.catalog_item_managers where item_id = '<yeni_item_id>' and role = 'owner';` — kullanıcının owner olduğunu doğrula.

Expected: Her sorgu beklenen satırı döner, hata yok.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260723100000_secondary_profile_request.sql
git commit -m "feat(db): approve new_profile requests by creating a second owned catalog item"
```

---

## Task 3: `member-profile-api.ts` — `requestNewCatalogItem()` istemci fonksiyonu

**Files:**
- Modify: `src/lib/member-profile-api.ts:1-13` (dosyanın başına yeni fonksiyon eklenir)
- Test: `src/lib/member-profile-api.test.ts`

**Interfaces:**
- Consumes: `supabase.rpc("request_new_catalog_item", { p_role_key, p_title, p_note })`
- Produces: `requestNewCatalogItem(roleKey: string, title: string, note: string): Promise<string>` — RPC'nin döndürdüğü `request_id`'yi (uuid string) döner, hata varsa fırlatır.

- [ ] **Step 1: Failing testi yaz**

`src/lib/member-profile-api.test.ts` dosyasının sonuna ekle:

```typescript
describe("requestNewCatalogItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpcMock.mockResolvedValue({ data: "11111111-1111-1111-1111-111111111111", error: null });
  });

  it("calls request_new_catalog_item with trimmed title", async () => {
    const requestId = await requestNewCatalogItem(
      "Consultant_HealthcareDoctor",
      "  Dr. Ahmet Yılmaz Danışmanlık  ",
      "Diş hekimiyim",
    );

    expect(rpcMock).toHaveBeenCalledWith("request_new_catalog_item", {
      p_role_key: "Consultant_HealthcareDoctor",
      p_title: "Dr. Ahmet Yılmaz Danışmanlık",
      p_note: "Diş hekimiyim",
    });
    expect(requestId).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("throws when the RPC returns an error", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "a pending new profile request already exists" } });

    await expect(
      requestNewCatalogItem("Consultant_HealthcareDoctor", "Başlık", ""),
    ).rejects.toEqual({ message: "a pending new profile request already exists" });
  });
});
```

Dosyanın üst kısmındaki import satırını güncelle (Task 3 Step 1 içindeki test dosyasının en üstünde):

```typescript
import { updateProfileAttribute, requestNewCatalogItem } from "@/lib/member-profile-api";
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/lib/member-profile-api.test.ts`
Expected: FAIL — `requestNewCatalogItem is not a function` veya benzeri import hatası.

- [ ] **Step 3: `src/lib/member-profile-api.ts`'ye fonksiyonu ekle**

`src/lib/member-profile-api.ts:13`'ten (mevcut `submitRoleChangeRequest` fonksiyonunun bitişinden) hemen sonra ekle:

```typescript
export async function requestNewCatalogItem(roleKey: string, title: string, note: string) {
  const { data, error } = await supabase.rpc("request_new_catalog_item", {
    p_role_key: roleKey,
    p_title: title.trim(),
    p_note: note,
  });

  if (error) throw error;
  return data as string;
}
```

- [ ] **Step 4: Testi çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/lib/member-profile-api.test.ts`
Expected: PASS — tüm testler (mevcut `updateProfileAttribute` testleri dahil) geçer.

- [ ] **Step 5: Commit**

```bash
git add src/lib/member-profile-api.ts src/lib/member-profile-api.test.ts
git commit -m "feat: add requestNewCatalogItem client function"
```

---

## Task 4: `RequestNewProfileDialog` — yeni profil talep formu

**Files:**
- Create: `src/components/profile/RequestNewProfileDialog.tsx`
- Test: `src/components/profile/RequestNewProfileDialog.test.tsx`

**Interfaces:**
- Consumes: `requestNewCatalogItem(roleKey, title, note)` (Task 3), `supabase.rpc("get_flat_roles")` (mevcut, bkz. `src/pages/ProfilePage.tsx:441-471` deseninin aynısı), `useToast` (`@/hooks/use-toast`)
- Produces: `<RequestNewProfileDialog open={boolean} onOpenChange={(open: boolean) => void} onSuccess={() => void} />` — form gönderildiğinde `onSuccess` çağrılır, dialog kapanır.

- [ ] **Step 1: Failing testi yaz**

```typescript
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock, requestNewCatalogItemMock, toastMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  requestNewCatalogItemMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: rpcMock },
}));

vi.mock("@/lib/member-profile-api", () => ({
  requestNewCatalogItem: requestNewCatalogItemMock,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

import RequestNewProfileDialog from "@/components/profile/RequestNewProfileDialog";

describe("RequestNewProfileDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpcMock.mockResolvedValue({
      data: [{ key: "Consultant_HealthcareDoctor", label: "Danışman — Doktor", description: null }],
      error: null,
    });
    requestNewCatalogItemMock.mockResolvedValue("req-1");
  });

  it("submits the selected role, title and note", async () => {
    const onSuccess = vi.fn();
    render(<RequestNewProfileDialog open onOpenChange={() => {}} onSuccess={onSuccess} />);

    await waitFor(() => expect(rpcMock).toHaveBeenCalledWith("get_flat_roles"));

    fireEvent.change(await screen.findByLabelText("Profil Başlığı"), {
      target: { value: "Dr. Ahmet Yılmaz Danışmanlık" },
    });
    fireEvent.change(screen.getByLabelText("Kısa Açıklama"), {
      target: { value: "Diş hekimiyim" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Talebi Gönder" }));

    await waitFor(() =>
      expect(requestNewCatalogItemMock).toHaveBeenCalledWith(
        "Consultant_HealthcareDoctor",
        "Dr. Ahmet Yılmaz Danışmanlık",
        "Diş hekimiyim",
      ),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Talep gönderildi" }),
    );
  });

  it("shows an error toast when the RPC rejects", async () => {
    requestNewCatalogItemMock.mockRejectedValue(
      new Error("a pending new profile request already exists"),
    );
    render(<RequestNewProfileDialog open onOpenChange={() => {}} onSuccess={() => {}} />);

    await waitFor(() => expect(rpcMock).toHaveBeenCalledWith("get_flat_roles"));
    fireEvent.change(await screen.findByLabelText("Profil Başlığı"), {
      target: { value: "Başlık" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Talebi Gönder" }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Talep gönderilemedi",
          description: "a pending new profile request already exists",
          variant: "destructive",
        }),
      ),
    );
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/components/profile/RequestNewProfileDialog.test.tsx`
Expected: FAIL — modül bulunamadı hatası (`RequestNewProfileDialog.tsx` henüz yok).

- [ ] **Step 3: `RequestNewProfileDialog.tsx`'i yaz**

```typescript
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { requestNewCatalogItem } from "@/lib/member-profile-api";
import { supabase } from "@/integrations/supabase/client";

type FlatRoleOption = {
  key: string;
  label: string;
  description: string | null;
};

type RequestNewProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const RequestNewProfileDialog = ({ open, onOpenChange, onSuccess }: RequestNewProfileDialogProps) => {
  const { toast } = useToast();
  const [roleOptions, setRoleOptions] = useState<FlatRoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRoleKey, setSelectedRoleKey] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setRolesLoading(true);

    void (async () => {
      const { data, error } = await supabase.rpc("get_flat_roles");
      if (cancelled) return;

      if (error) {
        setRoleOptions([]);
        setRolesLoading(false);
        toast({
          title: "Rol listesi yüklenemedi",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const options = (Array.isArray(data) ? data : [])
        .map((item) => ({
          key: typeof item?.key === "string" ? item.key : "",
          label: typeof item?.label === "string" ? item.label : "",
          description: typeof item?.description === "string" ? item.description : null,
        }))
        .filter((item) => item.key && item.label);
      setRoleOptions(options);
      setRolesLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, toast]);

  const resetForm = () => {
    setSelectedRoleKey("");
    setTitle("");
    setNote("");
  };

  const handleSubmit = async () => {
    if (!selectedRoleKey || !title.trim()) return;

    setSubmitting(true);
    try {
      await requestNewCatalogItem(selectedRoleKey, title, note);
      toast({
        title: "Talep gönderildi",
        description: "Yeni profil talebin admin onay kuyruğuna eklendi.",
      });
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Talep gönderilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Profil Aç</DialogTitle>
          <DialogDescription>
            Başka bir rol için ikinci bir profil talep et. Talebin admin onayından sonra profilin açılır;
            mevcut profilin değişmeden kalır.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-profile-role">Rol</Label>
            <Select value={selectedRoleKey} onValueChange={setSelectedRoleKey} disabled={rolesLoading}>
              <SelectTrigger id="new-profile-role">
                <SelectValue placeholder={rolesLoading ? "Roller yükleniyor..." : "Bir rol seç"} />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-profile-title">Profil Başlığı</Label>
            <Input
              id="new-profile-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ör. Dr. Ahmet Yılmaz Danışmanlık"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-profile-note">Kısa Açıklama</Label>
            <Textarea
              id="new-profile-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Admin değerlendirmesi için kısa bir not (opsiyonel)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={!selectedRoleKey || !title.trim() || submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Gönderiliyor..." : "Talebi Gönder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestNewProfileDialog;
```

- [ ] **Step 4: Testi çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/components/profile/RequestNewProfileDialog.test.tsx`
Expected: PASS — her iki test de geçer.

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/RequestNewProfileDialog.tsx src/components/profile/RequestNewProfileDialog.test.tsx
git commit -m "feat: add RequestNewProfileDialog for secondary profile requests"
```

---

## Task 5: `ProfileSwitcherMenu` — "+ Yeni Profil" tetikleyicisi

**Files:**
- Modify: `src/components/profile/ProfileSwitcherMenu.tsx`
- Test: `src/components/profile/ProfileSwitcherMenu.test.tsx` (yeni dosya — mevcut bileşenin hiç testi yok, bu görev onu da ekliyor)

**Interfaces:**
- Consumes: `RequestNewProfileDialog` (Task 4)
- Produces: Değişmiyor — `ProfileSwitcherMenu`'nün mevcut props'u (`currentItemId`, `triggerClassName`) aynen korunur, sadece dropdown içine yeni bir menü öğesi eklenir.

- [ ] **Step 1: Failing testi yaz**

```typescript
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useQueryMock, dialogSpy } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  dialogSpy: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/lib/member-catalog", () => ({
  getMyEditableCatalogItems: vi.fn(),
}));

vi.mock("@/hooks/useMemberCatalogSlug", () => ({
  memberCatalogItemsKeys: { mine: ["member-catalog-items", "mine"] },
}));

vi.mock("@/lib/profile-routing", () => ({
  profileEditorPathFor: () => "/profile",
}));

vi.mock("@/components/profile/RequestNewProfileDialog", () => ({
  default: (props: { open: boolean }) => {
    dialogSpy(props);
    return props.open ? <div data-testid="request-dialog" /> : null;
  },
}));

import ProfileSwitcherMenu from "@/components/profile/ProfileSwitcherMenu";

describe("ProfileSwitcherMenu — yeni profil talebi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockReturnValue({
      data: [
        { itemId: "a", itemType: "member", roleKey: "bireysel", title: "Bireysel" },
        { itemId: "b", itemType: "member", roleKey: "Consultant_HealthcareDoctor", title: "Danışman" },
      ],
      isLoading: false,
    });
  });

  it("shows a '+ Yeni Profil' menu item that opens the request dialog", async () => {
    render(<ProfileSwitcherMenu currentItemId="a" />);

    fireEvent.click(screen.getByRole("button", { name: /Diğer Profiller/i }));
    fireEvent.click(await screen.findByText("+ Yeni Profil"));

    await waitFor(() =>
      expect(dialogSpy).toHaveBeenCalledWith(expect.objectContaining({ open: true })),
    );
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/components/profile/ProfileSwitcherMenu.test.tsx`
Expected: FAIL — `"+ Yeni Profil"` metni henüz DOM'da yok.

- [ ] **Step 3: `ProfileSwitcherMenu.tsx`'i güncelle**

`src/components/profile/ProfileSwitcherMenu.tsx:1-25` içindeki import bloğuna ekle:

```typescript
import { useState } from "react";
```

(mevcut `import { useMemo } from "react";` satırını şu şekilde değiştir:)

```typescript
import { useMemo, useState } from "react";
```

`Plus` ikonunu lucide-react import satırına ekle (`src/components/profile/ProfileSwitcherMenu.tsx:4`):

```typescript
import { Check, ChevronDown, Plus, Sparkles, Users } from "lucide-react";
```

`RequestNewProfileDialog` import'unu ekle (dosyanın import bloğunun sonuna):

```typescript
import RequestNewProfileDialog from "@/components/profile/RequestNewProfileDialog";
```

Bileşen gövdesinde (`const ProfileSwitcherMenu = ...` içinde), `const navigate = useNavigate();` satırından hemen sonra ekle:

```typescript
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
```

`if (isLoading || items.length < 2) { return null; }` bloğunu şu şekilde değiştir — artık tek profili olan kullanıcı da "+ Yeni Profil" seçeneğini görebilmeli:

```typescript
  if (isLoading) {
    return null;
  }
```

`DropdownMenuContent` içindeki `{items.map(...)}` bloğundan hemen sonra, `</DropdownMenuContent>` kapanışından önce ekle:

```typescript
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setIsRequestDialogOpen(true)} className="gap-2">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          + Yeni Profil
        </DropdownMenuItem>
```

Bileşenin `return` bloğunun en sonuna (`</DropdownMenu>` kapanışından hemen sonra, `);` öncesine) dialog'u ekle — `return (` ifadesini bir fragment'e çevir:

```typescript
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className={triggerClassName}>
            <Users className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Diğer Profiller
            <ChevronDown className="ml-auto h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Profillerin</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.map((item) => {
            const isActive = item.itemId === activeItemId;
            const isPremium = isPremiumPresentation(resolveProfilePresentation(item.roleKey));
            return (
              <DropdownMenuItem
                key={item.itemId}
                disabled={isActive}
                onSelect={() => {
                  if (isActive) return;
                  navigate(profileEditorPathFor(item));
                }}
                className="flex items-start gap-2"
              >
                <span className="mt-0.5 h-3.5 w-3.5 shrink-0">
                  {isActive ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {profileTypeLabel(item)}
                    {isPremium ? (
                      <span className="inline-flex items-center gap-0.5 text-violet-700 dark:text-violet-400">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Premium
                      </span>
                    ) : null}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsRequestDialogOpen(true)} className="gap-2">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            + Yeni Profil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RequestNewProfileDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSuccess={() => setIsRequestDialogOpen(false)}
      />
    </>
  );
```

Not: `activeItemId` hesaplaması `items.length < 2` erken dönüşü kaldırıldığı için tek öğeli listede de çalışmaya devam eder — mevcut mantık (`currentItemId ?? items.find(...)`) değişmiyor.

- [ ] **Step 4: Testi çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/components/profile/ProfileSwitcherMenu.test.tsx`
Expected: PASS.

- [ ] **Step 5: Mevcut testlerin kırılmadığını doğrula**

Run: `npm run test -- src/components/profile`
Expected: PASS — `ProfileSwitcherMenu`'yü kullanan başka bileşen testi varsa (ör. `ProfilePage` ile ilgili testler) etkilenmediğini doğrula.

- [ ] **Step 6: Commit**

```bash
git add src/components/profile/ProfileSwitcherMenu.tsx src/components/profile/ProfileSwitcherMenu.test.tsx
git commit -m "feat: surface + Yeni Profil trigger in ProfileSwitcherMenu"
```

---

## Task 6: Admin panel — `AdminApprovalsPage` filtre seçeneği

**Files:**
- Modify: `src/pages/admin/AdminApprovalsPage.tsx:21-32`
- Test: `src/pages/admin/AdminApprovalsPage.test.tsx` (yeni dosya)

**Interfaces:**
- Consumes: `useAdminApprovals` (mevcut, değişmiyor), `AdminApprovalRequest` tipi (mevcut, değişmiyor — `request_type: string` zaten generic)
- Produces: Değişmiyor — sadece `FILTER_OPTIONS` dizisine bir satır eklenir.

- [ ] **Step 1: Failing testi yaz**

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/admin/useAdminApprovals", () => ({
  useAdminApprovals: () => ({
    data: {
      requests: [
        {
          id: "req-1",
          request_type: "new_profile",
          user_id: "user-1",
          target_role_key: "Consultant_HealthcareDoctor",
          target_feature_key: null,
          target_entity_type: "catalog_item",
          payload: { role_key: "Consultant_HealthcareDoctor", title: "Dr. Ahmet Yılmaz", note: "Diş hekimiyim" },
          status: "pending",
          admin_note: null,
          created_at: "2026-07-23T10:00:00.000Z",
        },
      ],
      users: [],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    reviewMutation: { isPending: false, variables: undefined, mutateAsync: vi.fn() },
  }),
}));

import AdminApprovalsPage from "@/pages/admin/AdminApprovalsPage";

describe("AdminApprovalsPage — yeni profil filtresi", () => {
  it("lists 'Yeni profil talebi' as a filter option", () => {
    render(<AdminApprovalsPage />);
    expect(screen.getByText("Yeni profil talebi", { selector: "[role=option], span" })).toBeDefined();
  });

  it("renders a pending new_profile request in the queue", () => {
    render(<AdminApprovalsPage />);
    expect(screen.getByText("new_profile")).toBeDefined();
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/pages/admin/AdminApprovalsPage.test.tsx`
Expected: FAIL (veya en azından ilk test fail) — `"Yeni profil talebi"` seçeneği `FILTER_OPTIONS`'ta henüz yok. (İkinci test muhtemelen zaten geçer çünkü sayfa `request_type`'ı ham metin olarak zaten basıyor — bu test mevcut davranışı belgeler.)

- [ ] **Step 3: `AdminApprovalsPage.tsx`'teki `FILTER_OPTIONS`'a satır ekle**

`src/pages/admin/AdminApprovalsPage.tsx:21-32` içindeki diziyi güncelle:

```typescript
const FILTER_OPTIONS = [
  { value: "all", label: "Tüm talepler" },
  { value: "role_change", label: "Rol başvuruları" },
  { value: "new_profile", label: "Yeni profil talebi" },
  { value: "directory_visibility", label: "Directory görünürlük" },
  { value: "contact_visibility", label: "İletişim görünürlük" },
  { value: "featured_listing", label: "Featured talebi" },
  { value: "event_create", label: "Etkinlik talebi" },
  { value: "offer_create", label: "Teklif talebi" },
  { value: "referral_create", label: "Referral talebi" },
  { value: "attribute_change", label: "Attribute değişikliği" },
  { value: "city_manage", label: "Şehir yönetimi" },
] as const;
```

- [ ] **Step 4: Testi çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/pages/admin/AdminApprovalsPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminApprovalsPage.tsx src/pages/admin/AdminApprovalsPage.test.tsx
git commit -m "feat(admin): add new_profile filter option to approvals queue"
```

---

## Task 7: Uçtan uca doğrulama

**Files:** Yok (sadece komutlar) — bu görev kod üretmez, önceki 6 görevin bütünlüğünü doğrular.

- [ ] **Step 1: Tüm test paketini çalıştır**

Run: `npm run test`
Expected: Tüm testler PASS, önceki görevlerde eklenen testler dahil.

- [ ] **Step 2: Lint çalıştır**

Run: `npm run lint`
Expected: Yeni/değiştirilen dosyalarda hata yok.

- [ ] **Step 3: Build çalıştır**

Run: `npm run build`
Expected: Başarılı — yeni bileşenler ve fonksiyonlar tip hatası vermeden derlenir.

- [ ] **Step 4: Manuel duman testi (dev server)**

Run: `npm run dev`

1. Tarayıcıda bir üye hesabıyla `/profile`'a git.
2. "Diğer Profiller" (veya tek profilliyken görünen menü) içinde "+ Yeni Profil" seçeneğine tıkla.
3. Formda bir rol seç, başlık ve not gir, "Talebi Gönder"e bas.
4. Toast'ta "Talep gönderildi" mesajını doğrula.
5. Aynı formu tekrar açıp göndermeyi dene — RPC'nin "zaten bekleyen bir talep var" hatasını toast'ta gösterdiğini doğrula.
6. Admin hesabıyla `/admin/approvals`'a git, "Yeni profil talebi" filtresini seç, talebin göründüğünü doğrula.
7. Talebi onayla.
8. Talebi gönderen kullanıcı hesabına dön, "Diğer Profiller" menüsünde yeni profilin göründüğünü doğrula.

Expected: Uçtan uca akış hatasız çalışır; eski Bireysel profil değişmeden kalır.

- [ ] **Step 5: Commit (varsa küçük düzeltmeler)**

```bash
git add -A
git commit -m "test: verify end-to-end secondary profile request flow"
```

(Eğer Step 1-4'te düzeltme gerekmediyse bu adım atlanır — boş commit oluşturulmaz.)
