-- Cadde 3.0 Faz 5 (1/1): Çarşı (U2U marketplace) — katalog + ilan tablosu + RPC akışı.
-- Spec §9.5 (şema), §14 (modül), §3.2 (D-01: Çarşı ≠ Çıfıt/Tanıtım — sponsorlu görünürlük
-- tablolarıyla ASLA birleştirilmez; bu migration yalnız marketplace nesneleri kurar).
--
-- * carsi_items mutation'ları yalnız security-definer RPC ile (create/update/delete_carsi_item_v1);
--   kullanıcı için direct INSERT/UPDATE/DELETE policy'si YOK, admin'e panel için tam yetki var.
-- * D-07 (premium limiti): gerçek entitlement altyapısı yokken aktif ilan limiti
--   cadde_settings'ten okunur ('cadde.carsi.active_item_limit', default 5); admin/mod muaf.
--   Premium kademesi D-07 kararıyla ayrı feature/override olarak gelecek — legacy
--   useIsPremium'un admin=premium demo mantığı BİLEREK taşınmadı (spec §14.4).
-- * Süre: expires_at; default 'cadde.carsi.default_expiry_days' (30). Süresi dolan ilan
--   sahibi/admin dışındakilere SELECT'te görünmez (cron gerekmez).
-- RPC hata kodları frontend'de cadde-rules.ts haritasıyla Türkçe mesaja çevrilir.

begin;

-- ── 1. Kategori kataloğu + seed (spec §9.5) ──────────────────────────────────
create table if not exists public.carsi_categories (
  key text primary key,
  label_tr text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

insert into public.carsi_categories (key, label_tr, sort_order) values
  ('second_hand',      'İkinci El',        10),
  ('room_rental',      'Oda Kiralama',     20),
  ('lesson_education', 'Ders / Eğitim',    30),
  ('service',          'Hizmet',           40),
  ('event_ticket',     'Etkinlik Bileti',  50),
  ('gift_donation',    'Hediye / Bağış',   60),
  ('other',            'Diğer',            70)
on conflict (key) do nothing;

-- ── 2. İlan tablosu ──────────────────────────────────────────────────────────
create table if not exists public.carsi_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  diaspora_key text not null default 'tr',
  category_key text not null references public.carsi_categories(key),
  title text not null,
  description text not null,
  price_amount numeric,
  price_currency text,
  country_id uuid references public.cadde_countries(id) on delete set null,
  city_id uuid references public.cadde_cities(id) on delete set null,
  image_urls text[] not null default '{}',
  contact_mode text not null default 'platform',
  status text not null default 'published',
  moderation_status text not null default 'approved',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

do $$ begin
  alter table public.carsi_items
    add constraint carsi_items_status_check check (status in ('draft', 'published', 'paused', 'expired'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.carsi_items
    add constraint carsi_items_moderation_check check (moderation_status in ('approved', 'pending', 'rejected'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.carsi_items
    add constraint carsi_items_contact_mode_check check (contact_mode in ('platform', 'phone', 'email'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.carsi_items
    add constraint carsi_items_price_check check (price_amount is null or price_amount >= 0);
exception when duplicate_object then null; end $$;

create index if not exists carsi_items_feed_idx
  on public.carsi_items (status, moderation_status, created_at desc) where deleted_at is null;
create index if not exists carsi_items_owner_idx on public.carsi_items (owner_user_id);
create index if not exists carsi_items_category_idx on public.carsi_items (category_key);
create index if not exists carsi_items_geo_idx on public.carsi_items (country_id, city_id);

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
alter table public.carsi_categories enable row level security;
alter table public.carsi_items enable row level security;

drop policy if exists "carsi categories public read" on public.carsi_categories;
create policy "carsi categories public read"
on public.carsi_categories for select
to anon, authenticated
using (is_active = true);

-- D-02 ile uyumlu: ilanlar yalnız authenticated okunur. Yayında + onaylı + süresi geçmemiş
-- ilanları herkes (login), kendi ilanlarını her durumda sahibi, hepsini admin görür.
drop policy if exists "carsi items authenticated read" on public.carsi_items;
create policy "carsi items authenticated read"
on public.carsi_items for select
using (
  auth.uid() is not null
  and (
    (status = 'published' and moderation_status = 'approved' and deleted_at is null
     and (expires_at is null or expires_at > now()))
    or owner_user_id = auth.uid()
    or public.is_admin_user(auth.uid())
  )
);

-- Kullanıcı mutation'ları yalnız RPC; admin paneli için tam yetki.
drop policy if exists "carsi items admin write" on public.carsi_items;
create policy "carsi items admin write"
on public.carsi_items for all
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

-- ── 4. D-07 limit ayarları ───────────────────────────────────────────────────
insert into public.cadde_settings (key, value) values
  ('cadde.carsi.active_item_limit', '5'::jsonb),
  ('cadde.carsi.default_expiry_days', '30'::jsonb)
on conflict (key) do nothing;

-- ── 5. create_carsi_item_v1 ──────────────────────────────────────────────────
create or replace function public.create_carsi_item_v1(
  p_category_key text,
  p_title text,
  p_description text,
  p_price_amount numeric default null,
  p_price_currency text default null,
  p_country text default null,
  p_city text default null,
  p_image_urls text[] default '{}',
  p_contact_mode text default 'platform'
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_title text := trim(coalesce(p_title, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_currency text := upper(nullif(trim(coalesce(p_price_currency, '')), ''));
  v_images text[] := coalesce(p_image_urls, '{}');
  v_country_id uuid;
  v_city_id uuid;
  v_active_count integer;
  v_item_id uuid;
  v_url text;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if not public.is_cadde_profile_complete(v_uid) then
    if public.cadde_phone_required() and not public.is_phone_verified(v_uid) then
      raise exception 'phone_verification_required';
    end if;
    raise exception 'cadde_profile_incomplete';
  end if;

  if not public.has_cadde_feature(v_uid, 'cadde.carsi.create') then
    raise exception 'cadde_carsi_permission_denied';
  end if;

  if not exists (select 1 from public.carsi_categories where key = p_category_key and is_active = true) then
    raise exception 'cadde_invalid_carsi_category';
  end if;

  if length(v_title) < 3 or length(v_title) > 100 then
    raise exception 'cadde_invalid_carsi_title';
  end if;

  if length(v_description) < 1 or length(v_description) > 2000 then
    raise exception 'cadde_invalid_carsi_description';
  end if;

  if p_price_amount is not null and p_price_amount < 0 then
    raise exception 'cadde_invalid_carsi_price';
  end if;

  if v_currency is not null and v_currency !~ '^[A-Z]{3}$' then
    raise exception 'cadde_invalid_carsi_currency';
  end if;

  if p_contact_mode not in ('platform', 'phone', 'email') then
    raise exception 'cadde_invalid_carsi_contact_mode';
  end if;

  if cardinality(v_images) > 6 then
    raise exception 'cadde_invalid_carsi_image';
  end if;
  foreach v_url in array v_images loop
    if v_url !~ '^https?://' then
      raise exception 'cadde_invalid_carsi_image';
    end if;
  end loop;

  -- D-07: aktif ilan limiti (admin/mod muaf; premium kademesi ayrı karar).
  if not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    select count(*) into v_active_count
    from public.carsi_items
    where owner_user_id = v_uid
      and deleted_at is null
      and status in ('draft', 'published', 'paused')
      and (expires_at is null or expires_at > now());
    if v_active_count >= public.cadde_setting_int('cadde.carsi.active_item_limit', 5) then
      raise exception 'cadde_carsi_item_limit';
    end if;
  end if;

  select c.id into v_country_id
  from public.cadde_countries c
  where c.name = nullif(trim(coalesce(p_country, '')), '') and c.is_active = true
  limit 1;

  select ci.id into v_city_id
  from public.cadde_cities ci
  where ci.name = nullif(trim(coalesce(p_city, '')), '')
    and (v_country_id is null or ci.country_id = v_country_id)
    and ci.is_active = true
  limit 1;

  insert into public.carsi_items (
    owner_user_id, category_key, title, description,
    price_amount, price_currency, country_id, city_id,
    image_urls, contact_mode, status, moderation_status, expires_at
  )
  values (
    v_uid, p_category_key, v_title, v_description,
    p_price_amount, v_currency, v_country_id, v_city_id,
    v_images, p_contact_mode, 'published', 'approved',
    now() + make_interval(days => public.cadde_setting_int('cadde.carsi.default_expiry_days', 30))
  )
  returning id into v_item_id;

  return v_item_id;
end;
$$;

-- ── 6. update_carsi_item_v1 ──────────────────────────────────────────────────
create or replace function public.update_carsi_item_v1(
  p_item_id uuid,
  p_title text default null,
  p_description text default null,
  p_price_amount numeric default null,
  p_price_currency text default null,
  p_status text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.carsi_items%rowtype;
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_description text := nullif(trim(coalesce(p_description, '')), '');
  v_currency text := upper(nullif(trim(coalesce(p_price_currency, '')), ''));
  v_is_privileged boolean;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  select * into v_item from public.carsi_items where id = p_item_id and deleted_at is null;
  if v_item.id is null then
    raise exception 'cadde_carsi_item_not_found';
  end if;

  v_is_privileged := public.is_admin(v_uid) or public.is_moderator(v_uid);
  if v_item.owner_user_id is distinct from v_uid and not v_is_privileged then
    raise exception 'cadde_carsi_owner_required';
  end if;

  if v_item.owner_user_id = v_uid and not v_is_privileged
     and not public.has_cadde_feature(v_uid, 'cadde.carsi.manage_own') then
    raise exception 'cadde_carsi_permission_denied';
  end if;

  if v_title is not null and (length(v_title) < 3 or length(v_title) > 100) then
    raise exception 'cadde_invalid_carsi_title';
  end if;

  if v_description is not null and length(v_description) > 2000 then
    raise exception 'cadde_invalid_carsi_description';
  end if;

  if p_price_amount is not null and p_price_amount < 0 then
    raise exception 'cadde_invalid_carsi_price';
  end if;

  if v_currency is not null and v_currency !~ '^[A-Z]{3}$' then
    raise exception 'cadde_invalid_carsi_currency';
  end if;

  -- Sahip yalnız yayına alma/pasife alma yapar; expired/draft geçişleri de serbest.
  if p_status is not null and p_status not in ('draft', 'published', 'paused', 'expired') then
    raise exception 'cadde_invalid_carsi_status';
  end if;

  update public.carsi_items
  set title = coalesce(v_title, title),
      description = coalesce(v_description, description),
      price_amount = coalesce(p_price_amount, price_amount),
      price_currency = coalesce(v_currency, price_currency),
      status = coalesce(p_status, status),
      updated_at = now()
  where id = p_item_id;
end;
$$;

-- ── 7. delete_carsi_item_v1 (soft delete) ────────────────────────────────────
create or replace function public.delete_carsi_item_v1(p_item_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.carsi_items%rowtype;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  select * into v_item from public.carsi_items where id = p_item_id and deleted_at is null;
  if v_item.id is null then
    raise exception 'cadde_carsi_item_not_found';
  end if;

  if v_item.owner_user_id is distinct from v_uid
     and not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    raise exception 'cadde_carsi_owner_required';
  end if;

  update public.carsi_items
  set deleted_at = now(), status = 'paused', updated_at = now()
  where id = p_item_id;
end;
$$;

-- ── 8. Grant'ler ─────────────────────────────────────────────────────────────
revoke all on function public.create_carsi_item_v1(text, text, text, numeric, text, text, text, text[], text) from public, anon;
revoke all on function public.update_carsi_item_v1(uuid, text, text, numeric, text, text) from public, anon;
revoke all on function public.delete_carsi_item_v1(uuid) from public, anon;

grant execute on function public.create_carsi_item_v1(text, text, text, numeric, text, text, text, text[], text) to authenticated;
grant execute on function public.update_carsi_item_v1(uuid, text, text, numeric, text, text) to authenticated;
grant execute on function public.delete_carsi_item_v1(uuid) to authenticated;

commit;
