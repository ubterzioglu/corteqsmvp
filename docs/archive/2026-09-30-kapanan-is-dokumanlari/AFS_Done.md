# AFS_Done — Detaylı İmplementasyon Planı

> **Strateji: Bridge (Köprü)**
> `profiles` ve `user_profiles` tabloları **sonsuza dek korunur**, silinmez, değiştirilmez.
> Yeni kod catalog katmanını kullanır. Eski RPC'ler ve trigger'lar olduğu gibi çalışmaya devam eder.
> Kullanıcılar kendi member profillerini self-edit edebilir (`linked_user_id = auth.uid()`).

---

## Kararlar Özeti

| # | Karar |
|---|-------|
| 1 | `profiles` + `user_profiles` → Bridge olarak sonsuza tutulur, dokunulmaz |
| 2 | Member item slug formatı → `member-{uuid-short}` (önemli değil, değiştirilebilir) |
| 3 | Self-edit → evet, `linked_user_id = auth.uid()` kontrolüyle |

---

## Mevcut Mimarinin Tam Haritası

### Tablolar (ilgili)

```
auth.users                          ← Supabase, dokunulamaz
  ↓ trigger: on_auth_user_created_catalog_profile
public.profiles                     ← platform_role, avatar, directory_opt_in  [BRIDGE - korunur]
  ↓ trigger: trg_sync_user_profile_compat_from_profile
public.user_profiles                ← profile_type (→ roles.key), feature motoru [BRIDGE - korunur]

public.catalog_items                ← Ana entity tablosu (item_type, slug, title, attributes JSONB…)
  platform_role_key → roles.key     ← zaten var (20260606010000)
  [YENİ] linked_user_id → profiles.id

public.catalog_item_memberships     ← Kim hangi item'a hangi rolle erişebilir (owner/manager/editor…)
public.catalog_item_types           ← advisor, organization, business, event, person_profile…
                                       [YENİ] 'member' tipi eklenecek

-- Feature sistemi (KATALOG için yeni tablolar):
public.catalog_item_feature_overrides   ← item bazında feature on/off [YENİ]
public.item_type_feature_defaults       ← item_type bazında varsayılan feature flag [YENİ]
-- (Mevcut feature_definitions + item_type_features tablolarını kullanır)

-- Attribute sistemi (KATALOG için yeni tablolar):
public.catalog_item_attributes          ← item bazında EAV değerleri [YENİ]
public.item_type_attribute_rules        ← item_type bazında attribute kuralları [YENİ]
-- (Mevcut attribute_catalog tablosunu kullanır)
```

### Mevcut Yardımcı Fonksiyonlar (korunur, dokunulmaz)

| Fonksiyon | Ne Yapıyor |
|-----------|-----------|
| `upsert_profile_from_auth_identity()` | auth → profiles + user_profiles yazar |
| `catalog_user_can_edit_item(user_id, item_id)` | membership + moderator kontrolü |
| `catalog_user_can_manage_item(user_id, item_id, roles[])` | membership kontrolü |
| `is_admin(uid)` | admin kontrolü |
| `is_moderator(uid)` | moderator kontrolü |
| `catalog_slugify(text)` | slug üretimi |
| `admin_list_unified_records(...)` | catalog + profile birleşik liste (zaten var) |

---

## Faz 0 — Temel Tablo Altyapısı

### Migration: `20260607010000_afs_phase0_foundation_tables.sql`

**Amaç:** Yeni 4 tablo + `catalog_items.linked_user_id` kolonu. Mevcut hiçbir tabloya dokunulmaz.

```sql
begin;

-- 1. catalog_items tablosuna linked_user_id ekle
alter table public.catalog_items
  add column if not exists linked_user_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_catalog_items_linked_user_id
  on public.catalog_items (linked_user_id)
  where linked_user_id is not null;

comment on column public.catalog_items.linked_user_id is
  'AFS bridge: authenticated user who owns this catalog entry (member/person_profile types).';

-- 2. catalog_item_attributes (user_profile_attributes'ın catalog versiyonu)
create table if not exists public.catalog_item_attributes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  attribute_id uuid not null references public.attribute_catalog(id) on delete cascade,
  value_text text,
  value_json jsonb,
  visibility text not null default 'private'
    check (visibility in ('public', 'private', 'admin_only')),
  approval_status text not null default 'approved'
    check (approval_status in ('draft', 'pending', 'approved', 'rejected')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, attribute_id),
  constraint catalog_item_attributes_value_check
    check (value_text is not null or value_json is not null)
);

create index if not exists idx_catalog_item_attributes_item_id
  on public.catalog_item_attributes (item_id);
create index if not exists idx_catalog_item_attributes_attribute_id
  on public.catalog_item_attributes (attribute_id);

-- 3. item_type_attribute_rules (role_attribute_rules'ın catalog versiyonu)
create table if not exists public.item_type_attribute_rules (
  id uuid primary key default gen_random_uuid(),
  item_type text not null references public.catalog_item_types(key) on delete cascade,
  attribute_id uuid not null references public.attribute_catalog(id) on delete cascade,
  is_enabled boolean not null default true,
  is_required boolean not null default false,
  is_public_default boolean not null default false,
  editor_can_edit boolean not null default true,
  editor_can_hide boolean not null default true,
  requires_admin_approval_on_change boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_type, attribute_id)
);

create index if not exists idx_item_type_attribute_rules_item_type
  on public.item_type_attribute_rules (item_type);

-- 4. item_type_feature_defaults (role_feature_flags'ın catalog versiyonu)
create table if not exists public.item_type_feature_defaults (
  id uuid primary key default gen_random_uuid(),
  item_type text not null references public.catalog_item_types(key) on delete cascade,
  feature_key text not null references public.feature_definitions(key) on delete cascade,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_type, feature_key)
);

create index if not exists idx_item_type_feature_defaults_item_type
  on public.item_type_feature_defaults (item_type);

-- 5. catalog_item_feature_overrides (user_feature_overrides'ın catalog versiyonu)
create table if not exists public.catalog_item_feature_overrides (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  feature_key text not null references public.feature_definitions(key) on delete cascade,
  is_enabled boolean not null,
  updated_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, feature_key)
);

create index if not exists idx_catalog_item_feature_overrides_item_id
  on public.catalog_item_feature_overrides (item_id);

-- updated_at trigger'ları
do $$
declare v_table text;
begin
  foreach v_table in array array[
    'catalog_item_attributes',
    'item_type_attribute_rules',
    'item_type_feature_defaults',
    'catalog_item_feature_overrides'
  ]
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on public.%1$s; ' ||
      'create trigger trg_%1$s_updated_at before update on public.%1$s ' ||
      'for each row execute function public.set_updated_at()',
      v_table
    );
  end loop;
end $$;

-- RLS
alter table public.catalog_item_attributes enable row level security;
alter table public.item_type_attribute_rules enable row level security;
alter table public.item_type_feature_defaults enable row level security;
alter table public.catalog_item_feature_overrides enable row level security;

-- catalog_item_attributes policies
drop policy if exists "cia_select_public" on public.catalog_item_attributes;
create policy "cia_select_public" on public.catalog_item_attributes
  for select using (visibility = 'public');

drop policy if exists "cia_select_self" on public.catalog_item_attributes;
create policy "cia_select_self" on public.catalog_item_attributes
  for select using (
    exists (
      select 1 from public.catalog_items ci
      where ci.id = item_id and ci.linked_user_id = auth.uid()
    )
  );

drop policy if exists "cia_select_member" on public.catalog_item_attributes;
create policy "cia_select_member" on public.catalog_item_attributes
  for select using (
    public.catalog_user_can_edit_item(auth.uid(), item_id)
  );

drop policy if exists "cia_all_admin" on public.catalog_item_attributes;
create policy "cia_all_admin" on public.catalog_item_attributes
  for all using (public.is_admin(auth.uid()));

-- item_type_attribute_rules: herkese okuma
drop policy if exists "itar_select_authenticated" on public.item_type_attribute_rules;
create policy "itar_select_authenticated" on public.item_type_attribute_rules
  for select to authenticated using (true);

drop policy if exists "itar_all_admin" on public.item_type_attribute_rules;
create policy "itar_all_admin" on public.item_type_attribute_rules
  for all using (public.is_admin(auth.uid()));

-- item_type_feature_defaults: herkese okuma
drop policy if exists "itfd_select_authenticated" on public.item_type_feature_defaults;
create policy "itfd_select_authenticated" on public.item_type_feature_defaults
  for select to authenticated using (true);

drop policy if exists "itfd_all_admin" on public.item_type_feature_defaults;
create policy "itfd_all_admin" on public.item_type_feature_defaults
  for all using (public.is_admin(auth.uid()));

-- catalog_item_feature_overrides
drop policy if exists "cifo_select_self_or_member" on public.catalog_item_feature_overrides;
create policy "cifo_select_self_or_member" on public.catalog_item_feature_overrides
  for select using (
    public.catalog_user_can_edit_item(auth.uid(), item_id)
    or exists (
      select 1 from public.catalog_items ci
      where ci.id = item_id and ci.linked_user_id = auth.uid()
    )
  );

drop policy if exists "cifo_all_admin" on public.catalog_item_feature_overrides;
create policy "cifo_all_admin" on public.catalog_item_feature_overrides
  for all using (public.is_admin(auth.uid()));

-- Grant'lar
grant select on public.catalog_item_attributes to authenticated;
grant select on public.item_type_attribute_rules to authenticated;
grant select on public.item_type_feature_defaults to authenticated;
grant select on public.catalog_item_feature_overrides to authenticated;

commit;
```

---

## Faz 1 — Member Tipi ve Trigger

### Migration: `20260607020000_afs_phase1_member_type_and_trigger.sql`

**Amaç:** `catalog_item_types`'a `member` ekle, `attribute_catalog`'a member attribute'larını seed'le, `upsert_profile_from_auth_identity()` fonksiyonunu extend et (mevcut body'ye sadece catalog INSERT eklenir, başka hiçbir şey değişmez).

```sql
begin;

-- 1. 'member' item type
insert into public.catalog_item_types (key, label, description)
values ('member', 'Member', 'Registered platform member — auto-created on signup')
on conflict (key) do update
set label = excluded.label, description = excluded.description, updated_at = now();

-- 2. feature_definitions'a member-spesifik feature'lar
insert into public.feature_definitions (key, name, description)
values
  ('directory_opt_in', 'Directory Görünürlüğü', 'Üyenin public dizinde görünmesi'),
  ('self_edit', 'Profil Düzenleme', 'Üyenin kendi profilini düzenleyebilmesi'),
  ('contact_receive', 'İletişim Alma', 'İletişim talebi alma')
on conflict (key) do update
set name = excluded.name, description = excluded.description, updated_at = now();

-- 3. item_type_feature_defaults: member için varsayılanlar
insert into public.item_type_feature_defaults (item_type, feature_key, is_enabled)
values
  ('member', 'directory_opt_in', false),
  ('member', 'self_edit', true),
  ('member', 'contact_receive', true),
  ('member', 'favorites', true),
  ('member', 'external_links', true),
  ('member', 'media_gallery', false),
  ('member', 'verification_badge', false)
on conflict (item_type, feature_key) do update
set is_enabled = excluded.is_enabled, updated_at = now();

-- 4. item_type_attribute_rules: member için attribute kuralları
--    (attribute_catalog'daki mevcut key'leri kullanır)
insert into public.item_type_attribute_rules (
  item_type, attribute_id,
  is_enabled, is_required, is_public_default,
  editor_can_edit, editor_can_hide,
  requires_admin_approval_on_change, sort_order
)
select
  'member',
  ac.id,
  true,
  (ac.key = 'full_name'),        -- sadece full_name zorunlu
  (ac.key in ('full_name', 'bio_short', 'profile_photo_url', 'country', 'city')),
  true,
  (ac.key <> 'full_name'),       -- full_name gizlenemez
  false,
  ac.sort_order
from public.attribute_catalog ac
where ac.key in (
  'full_name', 'country', 'city', 'profile_photo_url', 'bio_short',
  'interests', 'expertise_area', 'business_category',
  'organization_type', 'main_platform', 'ambassador_city'
)
and ac.is_active = true
on conflict (item_type, attribute_id) do update
set
  is_enabled = excluded.is_enabled,
  is_required = excluded.is_required,
  is_public_default = excluded.is_public_default,
  editor_can_edit = excluded.editor_can_edit,
  editor_can_hide = excluded.editor_can_hide,
  requires_admin_approval_on_change = excluded.requires_admin_approval_on_change,
  sort_order = excluded.sort_order,
  updated_at = now();

-- 5. upsert_profile_from_auth_identity() — catalog INSERT eklenir
--    Mevcut profiles + user_profiles yazımı DOKUNULMAZ.
--    Sadece en sona catalog_items + catalog_item_memberships INSERT eklenir.
create or replace function public.upsert_profile_from_auth_identity(
  p_user_id uuid,
  p_email text,
  p_raw_user_meta_data jsonb default '{}'::jsonb,
  p_raw_app_meta_data jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_avatar_url   text;
  v_country_code text;
  v_profile      public.profiles%rowtype;
  v_item_id      uuid;
  v_slug         text;
begin
  if p_user_id is null then
    raise exception 'user id is required' using errcode = '22023';
  end if;

  v_display_name := nullif(btrim(coalesce(
    p_raw_user_meta_data ->> 'display_name',
    p_raw_user_meta_data ->> 'full_name',
    p_raw_user_meta_data ->> 'name',
    split_part(coalesce(p_email, 'corteqs-uye'), '@', 1)
  )), '');

  v_avatar_url := nullif(btrim(coalesce(
    p_raw_user_meta_data ->> 'avatar_url',
    p_raw_user_meta_data ->> 'picture'
  )), '');

  v_country_code := nullif(btrim(coalesce(
    p_raw_user_meta_data ->> 'country_code',
    p_raw_app_meta_data  ->> 'country_code'
  )), '');

  -- ── Mevcut profiles yazımı (değişmedi) ──────────────────────────────────
  insert into public.profiles (
    id, email, full_name, display_name, avatar_url, country_code, platform_role, directory_opt_in
  ) values (
    p_user_id, p_email, v_display_name, v_display_name, v_avatar_url, v_country_code, 'user', false
  )
  on conflict (id) do update set
    email        = coalesce(excluded.email,        public.profiles.email),
    full_name    = coalesce(nullif(excluded.full_name,    ''), public.profiles.full_name),
    display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name, public.profiles.full_name),
    avatar_url   = coalesce(nullif(excluded.avatar_url,   ''), public.profiles.avatar_url),
    country_code = coalesce(nullif(excluded.country_code, ''), public.profiles.country_code),
    updated_at   = now()
  returning * into v_profile;

  -- ── Mevcut user_profiles yazımı (değişmedi) ─────────────────────────────
  if to_regclass('public.user_profiles') is not null then
    insert into public.user_profiles (
      user_id, email, full_name, profile_type, auth_provider, avatar_url
    ) values (
      p_user_id, p_email, v_profile.display_name, 'bireysel',
      coalesce(nullif(p_raw_app_meta_data ->> 'provider', ''), 'unknown'),
      v_profile.avatar_url
    )
    on conflict (user_id) do update set
      email      = coalesce(excluded.email,      public.user_profiles.email),
      full_name  = coalesce(nullif(excluded.full_name, ''), public.user_profiles.full_name),
      auth_provider = coalesce(nullif(excluded.auth_provider, ''), public.user_profiles.auth_provider),
      avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.user_profiles.avatar_url),
      updated_at = now();
  end if;

  -- ── YENİ: catalog_items member kaydı ────────────────────────────────────
  if to_regclass('public.catalog_items') is not null then

    -- Benzersiz slug üret
    v_slug := 'member-' || replace(p_user_id::text, '-', '')[:16];

    -- Slug çakışması olursa uuid suffix ekle
    if exists (
      select 1 from public.catalog_items
      where slug = v_slug and linked_user_id is distinct from p_user_id
    ) then
      v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    end if;

    insert into public.catalog_items (
      item_type, slug, title, status, visibility,
      verification_status, linked_user_id, created_by_user_id
    ) values (
      'member',
      v_slug,
      coalesce(v_display_name, split_part(coalesce(p_email, 'corteqs-uye'), '@', 1)),
      'published',
      'private',      -- varsayılan gizli; directory_opt_in feature ile açılır
      'unverified',
      p_user_id,
      p_user_id
    )
    on conflict (slug) do nothing   -- zaten varsa atla
    returning id into v_item_id;

    -- linked_user_id'ye göre mevcut kaydı bul (slug çakışmasında id null gelir)
    if v_item_id is null then
      select id into v_item_id
      from public.catalog_items
      where linked_user_id = p_user_id and item_type = 'member'
      limit 1;
    end if;

    -- Membership: owner rolü
    if v_item_id is not null then
      insert into public.catalog_item_memberships (item_id, user_id, role, status)
      values (v_item_id, p_user_id, 'owner', 'active')
      on conflict (item_id, user_id, role) do nothing;
    end if;

  end if;
  -- ── YENİ bitti ──────────────────────────────────────────────────────────

  select * into v_profile from public.profiles where id = p_user_id;
  return v_profile;
end;
$$;

comment on function public.upsert_profile_from_auth_identity(uuid, text, jsonb, jsonb) is
  'AFS v2: Writes profiles + user_profiles (unchanged bridge) AND creates catalog_items member entry.';

-- 6. Backfill: mevcut kullanıcılar için catalog_items member kaydı
--    (prod'da yavaş çalışabilir; gerekirse batch'e böl)
do $$
declare
  r record;
  v_slug text;
  v_item_id uuid;
begin
  for r in
    select p.id, p.display_name, p.full_name, p.email
    from public.profiles p
    where not exists (
      select 1 from public.catalog_items ci
      where ci.linked_user_id = p.id and ci.item_type = 'member'
    )
  loop
    v_slug := 'member-' || replace(r.id::text, '-', '')[:16];

    if exists (select 1 from public.catalog_items where slug = v_slug) then
      v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    end if;

    insert into public.catalog_items (
      item_type, slug, title, status, visibility,
      verification_status, linked_user_id, created_by_user_id
    ) values (
      'member', v_slug,
      coalesce(nullif(r.display_name,''), nullif(r.full_name,''), split_part(coalesce(r.email,'corteqs-uye'),'@',1)),
      'published', 'private', 'unverified',
      r.id, r.id
    )
    on conflict (slug) do nothing
    returning id into v_item_id;

    if v_item_id is null then
      select id into v_item_id from public.catalog_items
      where linked_user_id = r.id and item_type = 'member' limit 1;
    end if;

    if v_item_id is not null then
      insert into public.catalog_item_memberships (item_id, user_id, role, status)
      values (v_item_id, r.id, 'owner', 'active')
      on conflict (item_id, user_id, role) do nothing;
    end if;
  end loop;
end $$;

-- 7. catalog_items RLS: linked_user_id self-select/update
--    (Mevcut admin + public policy'lere ek olarak)
drop policy if exists "catalog_items_self_select" on public.catalog_items;
create policy "catalog_items_self_select" on public.catalog_items
  for select using (linked_user_id = auth.uid());

drop policy if exists "catalog_items_self_update" on public.catalog_items;
create policy "catalog_items_self_update" on public.catalog_items
  for update using (linked_user_id = auth.uid())
  with check (linked_user_id = auth.uid());

commit;
```

---

## Faz 2 — Attribute ve Feature RPC'leri

### Migration: `20260607030000_afs_phase2_catalog_rpcs.sql`

**Amaç:** Catalog item'lar için attribute okuma/yazma ve feature yönetimi RPC'leri.

```sql
begin;

-- ── get_catalog_item_profile(item_id) ──────────────────────────────────────
-- get_current_user_profile()'ın catalog versiyonu
create or replace function public.get_catalog_item_profile(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item  public.catalog_items%rowtype;
  v_attrs jsonb;
  v_feats jsonb;
begin
  select * into v_item from public.catalog_items where id = p_item_id limit 1;
  if v_item.id is null then return '{}'::jsonb; end if;

  -- Erişim kontrolü: public item VEYA self VEYA editor VEYA admin
  if v_item.visibility <> 'public'
    and not (v_item.linked_user_id = auth.uid())
    and not public.catalog_user_can_edit_item(auth.uid(), p_item_id)
    and not public.is_admin(auth.uid())
  then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Attributes
  select coalesce(jsonb_agg(jsonb_build_object(
    'attribute_key',  ac.key,
    'label',          ac.label,
    'data_type',      ac.data_type,
    'is_system',      ac.is_system,
    'sort_order',     itar.sort_order,
    'is_required',    itar.is_required,
    'is_public_default', itar.is_public_default,
    'editor_can_edit', itar.editor_can_edit,
    'editor_can_hide', itar.editor_can_hide,
    'requires_admin_approval_on_change', itar.requires_admin_approval_on_change,
    'visibility',     coalesce(cia.visibility, case when itar.is_public_default then 'public' else 'private' end),
    'approval_status', coalesce(cia.approval_status, 'approved'),
    'value_text',     case when ac.key = 'full_name' then v_item.title else cia.value_text end,
    'value_json',     cia.value_json
  ) order by itar.sort_order, ac.label), '[]'::jsonb)
  into v_attrs
  from public.item_type_attribute_rules itar
  join public.attribute_catalog ac on ac.id = itar.attribute_id and ac.is_active
  left join public.catalog_item_attributes cia on cia.item_id = p_item_id and cia.attribute_id = ac.id
  where itar.item_type = v_item.item_type
    and itar.is_enabled;

  -- Features
  select coalesce(jsonb_agg(jsonb_build_object(
    'feature_key', itfd.feature_key,
    'is_enabled',  coalesce(cifo.is_enabled, itfd.is_enabled),
    'source',      case when cifo.id is not null then 'override' else 'type_default' end
  ) order by itfd.feature_key), '[]'::jsonb)
  into v_feats
  from public.item_type_feature_defaults itfd
  left join public.catalog_item_feature_overrides cifo
    on cifo.item_id = p_item_id and cifo.feature_key = itfd.feature_key
  where itfd.item_type = v_item.item_type;

  return jsonb_build_object(
    'id',          v_item.id,
    'item_type',   v_item.item_type,
    'slug',        v_item.slug,
    'title',       v_item.title,
    'status',      v_item.status,
    'visibility',  v_item.visibility,
    'linked_user_id', v_item.linked_user_id,
    'attributes',  coalesce(v_attrs, '[]'::jsonb),
    'features',    coalesce(v_feats, '[]'::jsonb)
  );
end;
$$;

-- ── update_catalog_item_attribute() ────────────────────────────────────────
-- Kullanıcı kendi item'ının attribute'unu günceller
create or replace function public.update_catalog_item_attribute(
  p_item_id       uuid,
  p_attribute_key text,
  p_value         jsonb,
  p_visibility    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item      public.catalog_items%rowtype;
  v_attr      public.attribute_catalog%rowtype;
  v_rule      public.item_type_attribute_rules%rowtype;
  v_vis       text;
  v_value_text text;
  v_request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_item from public.catalog_items where id = p_item_id limit 1;
  if v_item.id is null then
    raise exception 'item not found' using errcode = 'P0002';
  end if;

  -- Yetki: self-edit (linked_user_id) VEYA editor membership VEYA admin
  if not (
    v_item.linked_user_id = auth.uid()
    or public.catalog_user_can_edit_item(auth.uid(), p_item_id)
    or public.is_admin(auth.uid())
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_attr from public.attribute_catalog where key = p_attribute_key and is_active limit 1;
  if v_attr.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  select itar.* into v_rule
  from public.item_type_attribute_rules itar
  where itar.item_type = v_item.item_type and itar.attribute_id = v_attr.id and itar.is_enabled
  limit 1;

  if v_rule.id is null then
    raise exception 'attribute not enabled for this item type' using errcode = '42501';
  end if;

  -- Admin her zaman edit edebilir; editor kısıtlamalara tabidir
  if not public.is_admin(auth.uid()) and not v_rule.editor_can_edit then
    raise exception 'attribute not editable' using errcode = '42501';
  end if;

  v_vis := coalesce(p_visibility, case when v_rule.is_public_default then 'public' else 'private' end);
  if v_vis not in ('public', 'private', 'admin_only') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  if v_attr.data_type in ('text','textarea','select','url','phone') then
    v_value_text := nullif(btrim(coalesce(p_value #>> '{}', '')), '');
  end if;

  -- Onay gerekiyorsa approval_requests'e ekle
  if v_rule.requires_admin_approval_on_change and not public.is_admin(auth.uid()) then
    insert into public.approval_requests (
      request_type, user_id, target_entity_type, target_entity_id, payload, status
    ) values (
      'attribute_change', auth.uid(), 'catalog_item', p_item_id,
      jsonb_build_object(
        'item_id', p_item_id, 'attribute_key', p_attribute_key,
        'attribute_value', p_value, 'visibility', v_vis
      ),
      'pending'
    ) returning id into v_request_id;

    return jsonb_build_object('status','pending','request_id',v_request_id,'attribute_key',p_attribute_key);
  end if;

  -- title güncellemesi: full_name → catalog_items.title sync
  if p_attribute_key = 'full_name' then
    update public.catalog_items set title = v_value_text, updated_at = now()
    where id = p_item_id;
  end if;

  insert into public.catalog_item_attributes (
    item_id, attribute_id, value_text, value_json, visibility, approval_status, approved_by, approved_at, updated_at
  ) values (
    p_item_id, v_attr.id,
    case when v_attr.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
    case when v_attr.data_type in ('multi_select','boolean','json') then p_value else null end,
    v_vis, 'approved', auth.uid(), now(), now()
  )
  on conflict (item_id, attribute_id) do update set
    value_text     = excluded.value_text,
    value_json     = excluded.value_json,
    visibility     = excluded.visibility,
    approval_status = 'approved',
    approved_by    = excluded.approved_by,
    approved_at    = excluded.approved_at,
    updated_at     = now();

  return jsonb_build_object('status','approved','attribute_key',p_attribute_key,'visibility',v_vis);
end;
$$;

-- ── admin_set_catalog_item_attribute() ─────────────────────────────────────
create or replace function public.admin_set_catalog_item_attribute(
  p_item_id       uuid,
  p_attribute_key text,
  p_value         jsonb,
  p_visibility    text default 'public'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attr public.attribute_catalog%rowtype;
  v_value_text text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_attr from public.attribute_catalog where key = p_attribute_key and is_active limit 1;
  if v_attr.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  if v_attr.data_type in ('text','textarea','select','url','phone') then
    v_value_text := nullif(btrim(coalesce(p_value #>> '{}', '')), '');
  end if;

  if p_attribute_key = 'full_name' then
    update public.catalog_items set title = v_value_text, updated_at = now() where id = p_item_id;
  end if;

  insert into public.catalog_item_attributes (
    item_id, attribute_id, value_text, value_json, visibility, approval_status, approved_by, approved_at, updated_at
  ) values (
    p_item_id, v_attr.id,
    case when v_attr.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
    case when v_attr.data_type in ('multi_select','boolean','json') then p_value else null end,
    coalesce(p_visibility,'public'), 'approved', auth.uid(), now(), now()
  )
  on conflict (item_id, attribute_id) do update set
    value_text      = excluded.value_text,
    value_json      = excluded.value_json,
    visibility      = excluded.visibility,
    approval_status = 'approved',
    approved_by     = excluded.approved_by,
    approved_at     = excluded.approved_at,
    updated_at      = now();

  perform public.write_admin_audit_log(
    'catalog.attribute_set', null, 'catalog_item', p_item_id,
    null, jsonb_build_object('attribute_key', p_attribute_key, 'value', p_value)
  );
end;
$$;

-- ── admin_set_catalog_item_feature_override() ──────────────────────────────
create or replace function public.admin_set_catalog_item_feature_override(
  p_item_id    uuid,
  p_feature_key text,
  p_is_enabled  boolean,
  p_reason      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (select 1 from public.feature_definitions where key = p_feature_key) then
    raise exception 'invalid feature key' using errcode = '22023';
  end if;

  insert into public.catalog_item_feature_overrides (item_id, feature_key, is_enabled, updated_by, reason, updated_at)
  values (p_item_id, p_feature_key, p_is_enabled, auth.uid(), p_reason, now())
  on conflict (item_id, feature_key) do update set
    is_enabled = excluded.is_enabled,
    updated_by = excluded.updated_by,
    reason     = excluded.reason,
    updated_at = now();

  perform public.write_admin_audit_log(
    'catalog.feature_override_set', null, 'catalog_item', p_item_id,
    null, jsonb_build_object('feature_key', p_feature_key, 'is_enabled', p_is_enabled, 'reason', p_reason)
  );
end;
$$;

-- ── admin_set_catalog_item_editor() ────────────────────────────────────────
-- Admin bir kullanıcıya item üzerinde 'editor' rolü verir
create or replace function public.admin_set_catalog_item_editor(
  p_item_id uuid,
  p_user_id uuid,
  p_role    text default 'editor'   -- 'editor' | 'manager' | 'viewer'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_role not in ('owner','manager','editor','contributor','viewer') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  insert into public.catalog_item_memberships (item_id, user_id, role, status)
  values (p_item_id, p_user_id, p_role, 'active')
  on conflict (item_id, user_id, role) do update set
    status     = 'active',
    updated_at = now();

  perform public.write_admin_audit_log(
    'catalog.editor_set', p_user_id, 'catalog_item', p_item_id,
    null, jsonb_build_object('role', p_role)
  );
end;
$$;

-- ── admin_remove_catalog_item_editor() ─────────────────────────────────────
create or replace function public.admin_remove_catalog_item_editor(
  p_item_id uuid,
  p_user_id uuid,
  p_role    text default 'editor'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.catalog_item_memberships
  set status = 'revoked', updated_at = now()
  where item_id = p_item_id and user_id = p_user_id and role = p_role;

  perform public.write_admin_audit_log(
    'catalog.editor_removed', p_user_id, 'catalog_item', p_item_id,
    null, jsonb_build_object('role', p_role)
  );
end;
$$;

-- Grant'lar
grant execute on function public.get_catalog_item_profile(uuid) to authenticated;
grant execute on function public.update_catalog_item_attribute(uuid, text, jsonb, text) to authenticated;
grant execute on function public.admin_set_catalog_item_attribute(uuid, text, jsonb, text) to authenticated;
grant execute on function public.admin_set_catalog_item_feature_override(uuid, text, boolean, text) to authenticated;
grant execute on function public.admin_set_catalog_item_editor(uuid, uuid, text) to authenticated;
grant execute on function public.admin_remove_catalog_item_editor(uuid, uuid, text) to authenticated;

commit;
```

---

## Faz 3 — Frontend Entegrasyonu

### Yeni API modülü: `src/lib/catalog-entity-api.ts`

```typescript
// src/lib/catalog-entity-api.ts
import { supabase } from '@/integrations/supabase/client'

export async function getCatalogItemProfile(itemId: string) {
  const { data, error } = await supabase
    .rpc('get_catalog_item_profile', { p_item_id: itemId })
  if (error) throw error
  return data
}

export async function updateCatalogItemAttribute(
  itemId: string,
  attributeKey: string,
  value: unknown,
  visibility?: string
) {
  const { data, error } = await supabase
    .rpc('update_catalog_item_attribute', {
      p_item_id: itemId,
      p_attribute_key: attributeKey,
      p_value: value,
      p_visibility: visibility ?? null,
    })
  if (error) throw error
  return data
}

export async function adminSetCatalogItemAttribute(
  itemId: string,
  attributeKey: string,
  value: unknown,
  visibility = 'public'
) {
  const { data, error } = await supabase
    .rpc('admin_set_catalog_item_attribute', {
      p_item_id: itemId,
      p_attribute_key: attributeKey,
      p_value: value,
      p_visibility: visibility,
    })
  if (error) throw error
  return data
}

export async function adminSetCatalogItemFeatureOverride(
  itemId: string,
  featureKey: string,
  isEnabled: boolean,
  reason?: string
) {
  const { data, error } = await supabase
    .rpc('admin_set_catalog_item_feature_override', {
      p_item_id: itemId,
      p_feature_key: featureKey,
      p_is_enabled: isEnabled,
      p_reason: reason ?? null,
    })
  if (error) throw error
  return data
}

export async function adminSetCatalogItemEditor(
  itemId: string,
  userId: string,
  role: 'editor' | 'manager' | 'viewer' = 'editor'
) {
  const { data, error } = await supabase
    .rpc('admin_set_catalog_item_editor', {
      p_item_id: itemId,
      p_user_id: userId,
      p_role: role,
    })
  if (error) throw error
  return data
}
```

### `AdminCatalogPage.tsx` Değişiklikleri

`AdminEntityPreviewPage.tsx` zaten `catalog_items` üzerinden çalışıyor.
`AdminCatalogPage.tsx`'e eklenecek iki panel:

1. **Attribute paneli** → `get_catalog_item_profile()` → attribute listesi + `admin_set_catalog_item_attribute()`
2. **Feature paneli** → `item_type_feature_defaults` → `admin_set_catalog_item_feature_override()`
3. **Editor paneli** → `catalog_item_memberships` → `admin_set_catalog_item_editor()`

---

## Faz 4 — Directory Sync (Opsiyonel)

`directory_opt_in` feature override'ı `catalog_items.visibility`'yi otomatik günceller:

```sql
-- Migration: 20260607040000_afs_phase4_directory_sync.sql
create or replace function public.catalog_sync_member_visibility()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.feature_key, old.feature_key) = 'directory_opt_in' then
    update public.catalog_items
    set visibility = case when coalesce(new.is_enabled, false) then 'public' else 'private' end,
        updated_at = now()
    where id = coalesce(new.item_id, old.item_id)
      and item_type = 'member';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_catalog_sync_member_visibility on public.catalog_item_feature_overrides;
create trigger trg_catalog_sync_member_visibility
after insert or update or delete on public.catalog_item_feature_overrides
for each row execute function public.catalog_sync_member_visibility();
```

---

## Sıra ve Bağımlılık Şeması

```
Faz 0  →  Faz 1  →  Faz 2  →  Faz 3 (frontend)  →  Faz 4 (directory)
  │          │          │
  │       backfill   RPC'ler
  │       mevcut     yazılır
  │       üyeler
  │
  └── Bu faz'lar birbirini kırmaz.
      Her faz ayrı migration + ayrı PR olabilir.
      Herhangi bir faz'da durulabilir; sistem çalışmaya devam eder.
```

---

## Kırmıyor mu? Kontrol Listesi

| | Kontrol | Sonuç |
|---|---------|-------|
| ✅ | `profiles` tablosuna dokunulmuyor | Korunur |
| ✅ | `user_profiles` tablosuna dokunulmuyor | Korunur |
| ✅ | Mevcut trigger'lar değiştirilmiyor | Yeni trigger ekleniyor (ayrı) |
| ✅ | `get_current_user_profile()` bozulmuyor | Dokunulmadı |
| ✅ | `get_current_user_features()` bozulmuyor | Dokunulmadı |
| ✅ | Mevcut 60+ migration geçersiz kalmıyor | Üzerine ekleme |
| ✅ | `upsert_profile_from_auth_identity()` geriye uyumlu | profiles+user_profiles yazımı korundu |
| ✅ | Mevcut admin RPC'leri çalışmaya devam ediyor | Dokunulmadı |
| ✅ | RLS: self-edit `linked_user_id = auth.uid()` | Uygulandı |
| ✅ | RLS: admin bypass `is_admin()` | Uygulandı |
| ✅ | Editor yetki: `catalog_item_memberships` | Mevcut tablo kullanıldı |

---

> **Başlamak için:** Faz 0 migration SQL'ini doğrudan `supabase/migrations/` altına yazabilirim.
> Onay ver, hemen başlayalım.
