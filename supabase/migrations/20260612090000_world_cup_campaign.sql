-- Dünya Kupası işletme kampanyası (geçici kampanya, kalıcı işletme profilleri).
--
-- Akış:
--   1. Maç yayını yapan işletme /dunya-kupasi/kayit üzerinden başvurur
--      (create_world_cup_registration_v1, status='pending').
--   2. Admin /admin/dunya-kupasi'da onaylar (admin_review_world_cup_registration_v1):
--      kullanıcıya seçilen Business_* flat rolü atanır -> mevcut
--      trg_sync_member_catalog_role_from_user_role_assignments köprüsü dizindeki
--      member catalog_items kaydını işletme profiline çevirir.
--   3. Onaylı işletmeler /dunya-kupasi public sayfasında listelenir
--      (list_world_cup_businesses_v1, anon erişimli).
--
-- Kurallar (Cadde 3.0 ile aynı): kullanıcı INSERT/UPDATE policy'si YOK,
-- tüm mutasyonlar security-definer RPC üzerinden; hata kodları 'worldcup_*'.
-- Kampanya bitişi world_cup_campaign_settings ile kontrol edilir (kod değişikliği
-- gerekmez); işletme profilleri kampanya bitince KALICI kalır.
--
-- Rol kuralı (onayda):
--   * mevcut rol NULL / User_DiasporaMember / Business_* -> seçilen Business_* atanır
--   * mevcut rol Admin_*                                  -> asla dokunulmaz
--   * diğer roller (Consultant_*, Organization_*, ...)    -> korunur,
--     dönüş payload'ında roleAssigned=false + previousRoleKey (admin UI uyarır)

begin;

-- ─── 1. Tablolar ─────────────────────────────────────────────────────────────

create table if not exists public.world_cup_campaign_settings (
  id integer primary key default 1 check (id = 1),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint world_cup_settings_dates_check
    check (starts_at is null or ends_at is null or ends_at > starts_at)
);

insert into public.world_cup_campaign_settings (id, is_active)
values (1, true)
on conflict (id) do nothing;

create table if not exists public.world_cup_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  category_role_key text not null references public.roles(key),
  country text not null,
  city text not null,
  address text,
  broadcast_confirmed boolean not null default false,
  applicant_note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  previous_role_key text,
  role_assigned boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Kullanıcı başına tek aktif (pending/approved) başvuru; reddedilen yeniden başvurabilir.
create unique index if not exists world_cup_registrations_active_per_user
  on public.world_cup_registrations (user_id)
  where status in ('pending', 'approved');

create index if not exists world_cup_registrations_status_idx
  on public.world_cup_registrations (status, created_at desc);

-- ─── 2. RLS ──────────────────────────────────────────────────────────────────

alter table public.world_cup_campaign_settings enable row level security;
alter table public.world_cup_registrations enable row level security;

drop policy if exists world_cup_settings_select on public.world_cup_campaign_settings;
create policy world_cup_settings_select
on public.world_cup_campaign_settings
for select
to anon, authenticated
using (true);

drop policy if exists world_cup_settings_admin_update on public.world_cup_campaign_settings;
create policy world_cup_settings_admin_update
on public.world_cup_campaign_settings
for update
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

-- Başvurular: sahibi veya admin okuyabilir; kullanıcı yazamaz (RPC-only mutation).
drop policy if exists world_cup_registrations_select on public.world_cup_registrations;
create policy world_cup_registrations_select
on public.world_cup_registrations
for select
to authenticated
using (user_id = auth.uid() or public.is_admin_user(auth.uid()));

drop policy if exists world_cup_registrations_admin_write on public.world_cup_registrations;
create policy world_cup_registrations_admin_write
on public.world_cup_registrations
for update
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

-- ─── 3. Yardımcı: kampanya penceresi aktif mi? ──────────────────────────────

create or replace function public.world_cup_campaign_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select s.is_active
        and (s.starts_at is null or s.starts_at <= now())
        and (s.ends_at is null or s.ends_at > now())
      from public.world_cup_campaign_settings s
      where s.id = 1
    ),
    false
  );
$$;

-- ─── 4. RPC: başvuru oluştur ─────────────────────────────────────────────────

create or replace function public.create_world_cup_registration_v1(
  p_business_name text,
  p_category_role_key text,
  p_country text,
  p_city text,
  p_address text default null,
  p_broadcast_confirmed boolean default false,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_business_name text := btrim(coalesce(p_business_name, ''));
  v_country text := btrim(coalesce(p_country, ''));
  v_city text := btrim(coalesce(p_city, ''));
  v_registration_id uuid;
begin
  if v_uid is null then
    raise exception 'worldcup_auth_required';
  end if;

  if not public.world_cup_campaign_is_active() then
    raise exception 'worldcup_campaign_inactive';
  end if;

  if not exists (
    select 1 from public.roles r
    where r.key = p_category_role_key
      and r.key like 'Business\_%'
      and r.is_active = true
      and r.deleted_at is null
  ) then
    raise exception 'worldcup_invalid_category';
  end if;

  if char_length(v_business_name) < 3 or char_length(v_business_name) > 120 then
    raise exception 'worldcup_invalid_business_name';
  end if;

  if v_country = '' or v_city = '' then
    raise exception 'worldcup_invalid_location';
  end if;

  if not coalesce(p_broadcast_confirmed, false) then
    raise exception 'worldcup_broadcast_confirmation_required';
  end if;

  if exists (
    select 1 from public.world_cup_registrations w
    where w.user_id = v_uid and w.status in ('pending', 'approved')
  ) then
    raise exception 'worldcup_already_registered';
  end if;

  insert into public.world_cup_registrations (
    user_id, business_name, category_role_key, country, city,
    address, broadcast_confirmed, applicant_note
  )
  values (
    v_uid, v_business_name, p_category_role_key, v_country, v_city,
    nullif(btrim(coalesce(p_address, '')), ''), true,
    nullif(btrim(coalesce(p_note, '')), '')
  )
  returning id into v_registration_id;

  return v_registration_id;
exception
  when unique_violation then
    raise exception 'worldcup_already_registered';
end;
$$;

-- ─── 5. RPC: admin onay / red ────────────────────────────────────────────────

create or replace function public.admin_review_world_cup_registration_v1(
  p_registration_id uuid,
  p_approve boolean,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reg public.world_cup_registrations%rowtype;
  v_current_role_key text;
  v_target_role_id uuid;
  v_role_assigned boolean := false;
  v_category_label text;
  v_email_local text;
begin
  if v_uid is null or not public.is_admin(v_uid) then
    raise exception 'worldcup_admin_required';
  end if;

  select * into v_reg
  from public.world_cup_registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'worldcup_registration_not_found';
  end if;

  if v_reg.status <> 'pending' then
    raise exception 'worldcup_registration_not_pending';
  end if;

  if not p_approve then
    update public.world_cup_registrations
    set status = 'rejected',
        reviewed_by = v_uid,
        reviewed_at = now(),
        review_note = nullif(btrim(coalesce(p_note, '')), ''),
        updated_at = now()
    where id = p_registration_id;

    return jsonb_build_object('status', 'rejected');
  end if;

  -- Onay: mevcut rolü çöz.
  select r.key into v_current_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = v_reg.user_id
  limit 1;

  -- Rol kuralı: yalnız varsayılan üye veya halihazırda Business_* rolü ezilir.
  if v_current_role_key is null
     or v_current_role_key = 'User_DiasporaMember'
     or v_current_role_key like 'Business\_%' then

    select id into v_target_role_id
    from public.roles
    where key = v_reg.category_role_key
      and is_active = true
      and deleted_at is null
    limit 1;

    if v_target_role_id is null then
      raise exception 'worldcup_invalid_category';
    end if;

    insert into public.user_role_assignments (user_id, role_id)
    values (v_reg.user_id, v_target_role_id)
    on conflict (user_id) do update
    set role_id = excluded.role_id, updated_at = now();

    -- Köprü trigger'ı tetiklenir; defensif olarak da senkronla.
    perform public.sync_member_catalog_role_for_user(v_reg.user_id);

    v_role_assigned := true;
  end if;

  -- Profil öznitelikleri (mevcut afs_attributes anahtarları; eksikse atla).
  select r.label into v_category_label
  from public.roles r
  where r.key = v_reg.category_role_key;

  insert into public.user_profile_attributes
    (user_id, attribute_id, value_text, visibility, approval_status, approved_at, updated_at)
  select v_reg.user_id, a.id, v.value_text, 'public', 'approved', now(), now()
  from (values
    ('business_name',     v_reg.business_name),
    ('business_category', v_category_label),
    ('country',           v_reg.country),
    ('city',              v_reg.city)
  ) v(attr_key, value_text)
  join public.afs_attributes a on a.key = v.attr_key and a.is_active = true
  where v.value_text is not null
  on conflict (user_id, attribute_id) do update
  set value_text = excluded.value_text,
      visibility = 'public',
      approval_status = 'approved',
      approved_at = now(),
      updated_at = now();

  -- Katalog kartı: placeholder başlığı işletme adıyla değiştir, boş şehri doldur.
  select lower(split_part(coalesce(au.email, ''), '@', 1))
  into v_email_local
  from auth.users au
  where au.id = v_reg.user_id;

  update public.catalog_items ci
  set title = v_reg.business_name,
      city = coalesce(nullif(btrim(coalesce(ci.city, '')), ''), v_reg.city),
      updated_at = now()
  where ci.linked_user_id = v_reg.user_id
    and ci.item_type = 'member'
    and ci.deleted_at is null
    and (
      ci.title ~ '^[0-9]+$'
      or lower(ci.title) = coalesce(v_email_local, '')
      or ci.title = 'CorteQS Üyesi'
    );

  update public.world_cup_registrations
  set status = 'approved',
      reviewed_by = v_uid,
      reviewed_at = now(),
      review_note = nullif(btrim(coalesce(p_note, '')), ''),
      previous_role_key = v_current_role_key,
      role_assigned = v_role_assigned,
      updated_at = now()
  where id = p_registration_id;

  return jsonb_build_object(
    'status', 'approved',
    'roleAssigned', v_role_assigned,
    'previousRoleKey', v_current_role_key
  );
end;
$$;

-- ─── 6. RPC: public liste (anon erişimli) ───────────────────────────────────

create or replace function public.list_world_cup_businesses_v1(
  p_limit integer default 200
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 200), 1), 500);
  v_result jsonb;
begin
  if not public.world_cup_campaign_is_active() then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(row_data order by rn), '[]'::jsonb)
  into v_result
  from (
    select
      row_number() over (order by w.reviewed_at desc nulls last, w.created_at desc) as rn,
      jsonb_build_object(
        'registrationId', w.id,
        'businessName', w.business_name,
        'categoryKey', w.category_role_key,
        'categoryLabel', r.label,
        'country', w.country,
        'city', w.city,
        'userId', w.user_id
      ) as row_data
    from public.world_cup_registrations w
    join public.roles r on r.key = w.category_role_key
    where w.status = 'approved'
    order by w.reviewed_at desc nulls last, w.created_at desc
    limit v_limit
  ) sub;

  return v_result;
end;
$$;

-- ─── 7. RPC: admin liste ─────────────────────────────────────────────────────

create or replace function public.list_world_cup_registrations_admin_v1(
  p_status text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null or not public.is_admin(v_uid) then
    raise exception 'worldcup_admin_required';
  end if;

  if p_status is not null and p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'worldcup_invalid_status_filter';
  end if;

  select coalesce(jsonb_agg(row_data order by rn), '[]'::jsonb)
  into v_result
  from (
    select
      row_number() over (order by w.created_at desc) as rn,
      jsonb_build_object(
        'id', w.id,
        'userId', w.user_id,
        'email', au.email,
        'businessName', w.business_name,
        'categoryKey', w.category_role_key,
        'categoryLabel', r.label,
        'country', w.country,
        'city', w.city,
        'address', w.address,
        'broadcastConfirmed', w.broadcast_confirmed,
        'applicantNote', w.applicant_note,
        'status', w.status,
        'reviewedAt', w.reviewed_at,
        'reviewNote', w.review_note,
        'previousRoleKey', w.previous_role_key,
        'roleAssigned', w.role_assigned,
        'createdAt', w.created_at
      ) as row_data
    from public.world_cup_registrations w
    join public.roles r on r.key = w.category_role_key
    left join auth.users au on au.id = w.user_id
    where p_status is null or w.status = p_status
    order by w.created_at desc
  ) sub;

  return v_result;
end;
$$;

-- ─── 8. Grants ───────────────────────────────────────────────────────────────

revoke all on function public.world_cup_campaign_is_active() from public, anon;
grant execute on function public.world_cup_campaign_is_active() to anon, authenticated;

revoke all on function public.create_world_cup_registration_v1(text, text, text, text, text, boolean, text) from public, anon;
grant execute on function public.create_world_cup_registration_v1(text, text, text, text, text, boolean, text) to authenticated;

revoke all on function public.admin_review_world_cup_registration_v1(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_world_cup_registration_v1(uuid, boolean, text) to authenticated;

revoke all on function public.list_world_cup_businesses_v1(integer) from public;
grant execute on function public.list_world_cup_businesses_v1(integer) to anon, authenticated;

revoke all on function public.list_world_cup_registrations_admin_v1(text) from public, anon;
grant execute on function public.list_world_cup_registrations_admin_v1(text) to authenticated;

comment on table public.world_cup_registrations is
  'Dünya Kupası kampanyası işletme başvuruları. Mutasyonlar yalnız worldcup_* RPC''leri üzerinden; onayda Business_* rolü atanır ve member catalog köprüsü profili işletmeye çevirir.';
comment on table public.world_cup_campaign_settings is
  'Dünya Kupası kampanya penceresi (singleton id=1). is_active=false veya ends_at geçmiş -> kayıt kapanır, public liste boşalır.';

commit;
