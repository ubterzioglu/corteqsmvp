-- Import register submissions as member catalog items + repair role-less and
-- wa.local phone-titled member profiles.
--
-- Live state driving this migration (verified 2026-06-10 via Management API):
--   * 127/129 member catalog_items have NO flat role (legacy role links severed
--     by the 2026-06-09 AFS rebuild) -> get_catalog_item_public_page_v2 resolves
--     zero sections/attributes -> profiles render empty.
--   * user_role_assignments holds only the 2 admins.
--   * 15 auth users are WhatsApp-bot accounts (<phone>@wa.local); the member
--     bridge titled them with the email local-part -> "97470648470" profiles.
--   * public.submissions has 132 register-form rows; most have no member item.
--   * sync_member_catalog_role_for_user still defaults to the dropped legacy
--     role 'bireysel' and inserts the non-existent column created_by_user_id
--     in its create branch (broken for brand-new users).
--
-- What this does (idempotent, provenance-tagged):
--   1. Patch sync_member_catalog_role_for_user + handle_new_auth_user_role:
--      default flat role User_DiasporaMember, never title wa.local local-parts,
--      fix created_by column.
--   2. Backfill user_role_assignments for every auth user (default
--      User_DiasporaMember; category-mapped when a register submission matches
--      by email; wa.local users category-mapped via phone match). Admins keep
--      their Admin_* roles.
--   3. Repair wa.local member items: phone-matched ones take the submission's
--      real name + attributes; unmatched ones become visibility='private'.
--   4. Sync platform_role_key + catalog_item_roles for every member item.
--   5. Import cleaned + deduped register submissions (no auth account) as
--      unverified public member items: catalog_items + catalog_item_roles +
--      catalog_item_attribute_values + private catalog_item_contacts.
--
-- Category -> flat role mapping (user-approved 2026-06-10):
--   bireysel / isletme / career / networking / NULL -> User_DiasporaMember
--   danisman      -> Consultant_PracticalLife
--   dernek        -> Organization_AssociationFoundation
--   sehir-elcisi  -> User_CityAmbassador
--   influencer    -> User_BloggerVlogger
--
-- Rollback of the import (provenance tag):
--   delete from catalog_item_attribute_values where item_id in
--     (select id from catalog_items where attributes->>'import_source' = 'submissions-import-20260610');
--   delete from catalog_item_contacts        where item_id in (... same ...);
--   delete from catalog_item_roles           where catalog_item_id in (... same ...);
--   delete from catalog_items                where attributes->>'import_source' = 'submissions-import-20260610'
--                                              and linked_user_id is null;
--   (Role backfill + wa.local repairs are desired end-state; no rollback.)

begin;

-- ─── 0. Guards ───────────────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from public.roles where key = 'User_DiasporaMember' and is_active = true) then
    raise exception 'role User_DiasporaMember missing - aborting import';
  end if;
  if not exists (select 1 from public.afs_attributes where key = 'full_name' and is_active = true) then
    raise exception 'attribute full_name missing - aborting import';
  end if;
end $$;

-- ─── 1. Function patches ─────────────────────────────────────────────────────

-- 1a. Member bridge: default flat role, wa.local-safe title, fixed created_by.
create or replace function public.sync_member_catalog_role_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_role_key   text;
  v_email      text;
  v_title      text;
  v_slug       text;
  v_item_id    uuid;
begin
  if p_user_id is null then
    return;
  end if;

  -- Resolve the user's role from the role-assignment system (single source).
  select r.key
  into v_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = p_user_id
  limit 1;

  -- Every authenticated user defaults to the standard diaspora member role.
  v_role_key := coalesce(v_role_key, 'User_DiasporaMember');

  -- Guard: platform_role_key has a FK to roles(key); skip role if it vanished.
  if not exists (select 1 from public.roles where key = v_role_key) then
    v_role_key := null;
  end if;

  -- Existing bridge?
  select ci.id
  into v_item_id
  from public.catalog_items ci
  where ci.linked_user_id = p_user_id
    and ci.item_type = 'member'
  order by ci.created_at asc
  limit 1;

  if v_item_id is not null then
    update public.catalog_items ci
    set
      platform_role_key = v_role_key,
      attributes = coalesce(ci.attributes, '{}'::jsonb)
                   || jsonb_build_object('platform_role_key', v_role_key),
      updated_at = now()
    where ci.id = v_item_id
      and (
        ci.platform_role_key is distinct from v_role_key
        or coalesce(ci.attributes ->> 'platform_role_key', '') is distinct from coalesce(v_role_key, '')
      );

    insert into public.catalog_item_managers (item_id, user_id, role, status)
    values (v_item_id, p_user_id, 'owner', 'active')
    on conflict (item_id, user_id, role) do update
    set status = 'active', updated_at = now();

    -- Keep the primary flat-role link in sync as well.
    if v_role_key is not null then
      insert into public.catalog_item_roles (catalog_item_id, role_id, is_primary)
      select v_item_id, r.id, not exists (
        select 1 from public.catalog_item_roles cir
        where cir.catalog_item_id = v_item_id and cir.is_primary
      )
      from public.roles r
      where r.key = v_role_key
      on conflict (catalog_item_id, role_id) do nothing;
    end if;

    return;
  end if;

  -- No bridge yet -> create one. Never leak wa.local phone local-parts as title.
  select au.email into v_email from auth.users au where au.id = p_user_id;
  if v_email like '%@wa.local' then
    v_title := 'CorteQS Üyesi';
  else
    v_title := coalesce(
      nullif(btrim(split_part(coalesce(v_email, ''), '@', 1)), ''),
      'CorteQS Üyesi'
    );
  end if;

  v_slug := 'member-' || substr(replace(p_user_id::text, '-', ''), 1, 16);
  if exists (
    select 1 from public.catalog_items ci
    where ci.slug = v_slug and ci.linked_user_id is distinct from p_user_id
  ) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end if;

  insert into public.catalog_items (
    item_type,
    slug,
    title,
    status,
    visibility,
    verification_status,
    linked_user_id,
    created_by,
    platform_role_key,
    attributes,
    published_at
  )
  values (
    'member',
    v_slug,
    v_title,
    'published',
    'public',
    'claimed',
    p_user_id,
    p_user_id,
    v_role_key,
    jsonb_build_object('bridge_source', 'auth_member_sync', 'platform_role_key', v_role_key),
    now()
  )
  on conflict (slug) do nothing
  returning id into v_item_id;

  if v_item_id is null then
    select ci.id into v_item_id
    from public.catalog_items ci
    where ci.linked_user_id = p_user_id and ci.item_type = 'member'
    order by ci.created_at asc
    limit 1;
  end if;

  if v_item_id is not null then
    insert into public.catalog_item_managers (item_id, user_id, role, status)
    values (v_item_id, p_user_id, 'owner', 'active')
    on conflict (item_id, user_id, role) do update
    set status = 'active', updated_at = now();

    if v_role_key is not null then
      insert into public.catalog_item_roles (catalog_item_id, role_id, is_primary)
      select v_item_id, r.id, true
      from public.roles r
      where r.key = v_role_key
      on conflict (catalog_item_id, role_id) do nothing;
    end if;
  end if;
end;
$$;

comment on function public.sync_member_catalog_role_for_user(uuid) is
  'Idempotent member bridge: default flat role User_DiasporaMember, wa.local-safe title, '
  'keeps platform_role_key + catalog_item_roles + owner manager row in sync.';

-- 1b. New-user trigger body: assign the flat default role (was legacy bireysel).
create or replace function public.handle_new_auth_user_role()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_default_role_id uuid;
begin
  select id into v_default_role_id
  from public.roles
  where key = 'User_DiasporaMember' and is_active = true
  limit 1;

  if v_default_role_id is not null then
    insert into public.user_role_assignments (user_id, role_id)
    values (new.id, v_default_role_id)
    on conflict (user_id) do nothing;
  end if;

  perform public.sync_member_catalog_role_for_user(new.id);

  return new;
end;
$$;

-- ─── 2. Working sets ─────────────────────────────────────────────────────────

-- Cleaned register submissions: bots/tests dropped, deduped by email then phone
-- (newest row wins).
create temp table _subs_clean on commit drop as
with src as (
  select
    s.id as submission_id,
    s.fullname, s.email, s.phone, s.country, s.city, s.business, s.field,
    s.category, s.referral_source, s.referral_code, s.created_at,
    lower(btrim(s.email)) as email_n,
    regexp_replace(coalesce(s.phone, ''), '\D', '', 'g') as phone_n,
    lower(btrim(s.fullname)) as fullname_n
  from public.submissions s
  where s.form_type = 'register'
    and coalesce(s.status, 'new') <> 'archived'
),
filtered as (
  select * from src
  where email_n not like '%@wa.local'
    and fullname_n !~ '^[0-9]+$'
    and email_n not in (
      'a@gmail.com', 'x@gmail.com', 'rqwefwqegfqwe@gmail.com',
      'policy.min@example.com', 'test@gmail.com', 'test_99@gmail.com',
      'yeni_deneme_hesabi@gmail.com',
      'hobtrik@gmail.com',          -- "Deneme Umut" test entry
      'ubterzioglu@gmail.com',      -- developer test submissions
      'burakakcakanat@hotmail.com'  -- duplicate of admin gmail account
    )
    and fullname_n not in (
      'a', 'x a', 'ueia', 'uiea uiea', 'qwefqwefggqwef',
      'deneme deneme', 'umut umut', 'ubt ubt', 'deneme umut'
    )
),
dedup_email as (
  select distinct on (email_n) *
  from filtered
  order by email_n, created_at desc
),
dedup_phone as (
  select distinct on (coalesce(nullif(phone_n, ''), submission_id::text)) *
  from dedup_email
  order by coalesce(nullif(phone_n, ''), submission_id::text), created_at desc
)
select * from dedup_phone;

-- Legacy category -> flat role.
create temp table _role_map on commit drop as
select c.category, r.id as role_id, r.key as role_key
from (values
  ('bireysel',     'User_DiasporaMember'),
  ('isletme',      'User_DiasporaMember'),
  ('career',       'User_DiasporaMember'),
  ('networking',   'User_DiasporaMember'),
  ('danisman',     'Consultant_PracticalLife'),
  ('dernek',       'Organization_AssociationFoundation'),
  ('sehir-elcisi', 'User_CityAmbassador'),
  ('influencer',   'User_BloggerVlogger')
) as c(category, role_key)
join public.roles r on r.key = c.role_key and r.is_active = true and r.deleted_at is null;

create temp table _default_role on commit drop as
select id as role_id, key as role_key
from public.roles
where key = 'User_DiasporaMember' and is_active = true
limit 1;

-- Free-text country -> ISO code: direct Turkish geo_countries name match first,
-- then an alias map for the variants present in the submission data.
create temp table _country_alias on commit drop as
select * from (values
  ('turkiye', 'TR'), ('tr', 'TR'), ('turkey', 'TR'),
  ('almanya', 'DE'), ('deutschland', 'DE'), ('germany', 'DE'), ('de', 'DE'),
  ('katar', 'QA'), ('qatar', 'QA'), ('katar, doha', 'QA'),
  ('abd', 'US'), ('amerika birlesik devletleri', 'US'), ('united states', 'US'), ('usa', 'US'),
  ('ingiltere', 'GB'), ('uk', 'GB'), ('england', 'GB'),
  ('fransa', 'FR'), ('france', 'FR'),
  ('hollanda', 'NL'),
  ('avustralya', 'AU'),
  ('italya', 'IT'), ('italy', 'IT'),
  ('tayland', 'TH'),
  ('guney kore', 'KR'),
  ('romanya', 'RO'),
  ('moldova', 'MD'),
  ('polonya', 'PL'),
  ('azerbaycan', 'AZ'),
  ('luksemburg', 'LU'),
  ('kanada', 'CA'), ('vancouver', 'CA'),
  ('birlesik arap emirlikleri', 'AE'), ('dubai', 'AE'),
  ('suudi arabistan', 'SA'),
  ('south africa', 'ZA')
) v(alias, code);

-- ASCII-fold Turkish letters so alias matching survives case/diacritic variants.
create or replace function pg_temp._fold_tr(p text)
returns text
language sql
immutable
as $$
  select lower(translate(coalesce(p, ''), 'ÇĞİÖŞÜçğıöşü', 'CGIOSUcgiosu'))
$$;

create temp table _subs_geo on commit drop as
select
  s.*,
  coalesce(gc_direct.code, alias_map.code) as country_code_resolved
from _subs_clean s
left join public.geo_countries gc_direct
  on gc_direct.is_active = true
  and lower(gc_direct.name) = lower(btrim(s.country))
left join lateral (
  select ca.code
  from _country_alias ca
  where ca.alias = pg_temp._fold_tr(btrim(s.country))
  limit 1
) alias_map on true;

-- ─── 3. Role backfill for auth users ─────────────────────────────────────────

-- 3a. Default role for every auth user without an assignment.
insert into public.user_role_assignments (user_id, role_id)
select au.id, dr.role_id
from auth.users au
cross join _default_role dr
where not exists (
  select 1 from public.user_role_assignments ura where ura.user_id = au.id
)
on conflict (user_id) do nothing;

-- 3b. Category-mapped role for auth users matched by submission email
--     (never touch Admin_* assignments).
update public.user_role_assignments ura
set role_id = m.role_id, updated_at = now()
from (
  select au.id as user_id, coalesce(rm.role_id, dr.role_id) as role_id
  from auth.users au
  join _subs_geo s on lower(au.email) = s.email_n
  left join _role_map rm on rm.category = s.category
  cross join _default_role dr
) m
where ura.user_id = m.user_id
  and ura.role_id <> m.role_id
  and not exists (
    select 1 from public.roles r
    where r.id = ura.role_id and r.key like 'Admin\_%'
  );

-- ─── 4. wa.local member repair ───────────────────────────────────────────────

create temp table _wa_members on commit drop as
select ci.id as item_id, ci.linked_user_id as user_id,
       split_part(au.email, '@', 1) as digits
from public.catalog_items ci
join auth.users au on au.id = ci.linked_user_id
where ci.item_type = 'member'
  and ci.deleted_at is null
  and au.email like '%@wa.local';

-- Phone-matched real submission (only people WITHOUT their own auth account,
-- otherwise the real account keeps the identity and the bot twin goes private).
create temp table _wa_matched on commit drop as
select distinct on (w.item_id) w.item_id, w.user_id, s.*
from _wa_members w
join _subs_geo s on s.phone_n = w.digits
where not exists (select 1 from auth.users au2 where lower(au2.email) = s.email_n)
order by w.item_id, s.created_at desc;

-- 4a. Role of matched wa users follows the submission category.
update public.user_role_assignments ura
set role_id = coalesce(rm.role_id, dr.role_id), updated_at = now()
from _wa_matched m
left join _role_map rm on rm.category = m.category
cross join _default_role dr
where ura.user_id = m.user_id
  and ura.role_id <> coalesce(rm.role_id, dr.role_id);

-- 4b. Item core fields take the submission identity.
update public.catalog_items ci
set
  title = m.fullname,
  headline = coalesce(ci.headline, nullif(left(btrim(coalesce(m.field, '')), 140), '')),
  city = coalesce(nullif(btrim(coalesce(m.city, '')), ''), ci.city),
  country_code = coalesce(m.country_code_resolved, ci.country_code),
  attributes = coalesce(ci.attributes, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'import_source', 'submissions-import-20260610',
    'submission_id', m.submission_id::text,
    'submission_category', m.category,
    'referral_code', m.referral_code,
    'referral_source', m.referral_source
  )),
  updated_at = now()
from _wa_matched m
where ci.id = m.item_id;

-- 4c. full_name attribute (overwrite only empty/phone-number values).
insert into public.catalog_item_attribute_values
  (item_id, attribute_id, value_text, visibility, approval_status, approved_at, updated_at)
select m.item_id, a.id, m.fullname, 'public', 'approved', now(), now()
from _wa_matched m
join public.afs_attributes a on a.key = 'full_name' and a.is_active = true
on conflict (item_id, attribute_id) do update
set value_text = excluded.value_text, approval_status = 'approved', updated_at = now()
where catalog_item_attribute_values.value_text is null
   or catalog_item_attribute_values.value_text ~ '^[0-9]+$';

-- 4d. user_profile_attributes.full_name for the linked auth user.
insert into public.user_profile_attributes
  (user_id, attribute_id, value_text, visibility, approval_status, approved_at, updated_at)
select m.user_id, a.id, m.fullname, 'public', 'approved', now(), now()
from _wa_matched m
join public.afs_attributes a on a.key = 'full_name' and a.is_active = true
on conflict (user_id, attribute_id) do update
set value_text = excluded.value_text, approval_status = 'approved', updated_at = now()
where user_profile_attributes.value_text is null
   or user_profile_attributes.value_text ~ '^[0-9]+$';

-- 4e. Unmatched bot accounts leave the public directory.
update public.catalog_items ci
set visibility = 'private', updated_at = now()
from _wa_members w
where ci.id = w.item_id
  and not exists (select 1 from _wa_matched m where m.item_id = w.item_id)
  and ci.visibility <> 'private';

-- ─── 5. Enrich members of real auth users matched by email ───────────────────

create temp table _auth_matched on commit drop as
select distinct on (au.id) au.id as user_id, ci.id as item_id, s.*
from auth.users au
join _subs_geo s on lower(au.email) = s.email_n
join public.catalog_items ci
  on ci.linked_user_id = au.id and ci.item_type = 'member' and ci.deleted_at is null
where au.email not like '%@wa.local'
order by au.id, s.created_at desc;

-- 5a. Fix placeholder titles (email local-part or digits) with the real name.
update public.catalog_items ci
set title = m.fullname, updated_at = now()
from _auth_matched m
where ci.id = m.item_id
  and (ci.title ~ '^[0-9]+$' or lower(ci.title) = split_part(m.email_n, '@', 1));

-- 5b. Fill empty core fields + provenance (existing values win).
update public.catalog_items ci
set
  headline = coalesce(ci.headline, nullif(left(btrim(coalesce(m.field, '')), 140), '')),
  city = coalesce(ci.city, nullif(btrim(coalesce(m.city, '')), '')),
  country_code = coalesce(ci.country_code, m.country_code_resolved),
  attributes = coalesce(ci.attributes, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'import_source', 'submissions-import-20260610',
    'submission_id', m.submission_id::text,
    'submission_category', m.category,
    'referral_code', m.referral_code,
    'referral_source', m.referral_source
  )),
  updated_at = now()
from _auth_matched m
where ci.id = m.item_id;

-- 5c. Missing attribute values only (never overwrite user-entered data).
insert into public.catalog_item_attribute_values
  (item_id, attribute_id, value_text, visibility, approval_status, approved_at, updated_at)
select m.item_id, a.id, v.value_text, 'public', 'approved', now(), now()
from _auth_matched m
cross join lateral (values
  ('full_name',      m.fullname),
  ('country',        nullif(btrim(coalesce(m.country, '')), '')),
  ('city',           nullif(btrim(coalesce(m.city, '')), '')),
  ('business_name',  nullif(btrim(coalesce(m.business, '')), '')),
  ('expertise_area', case when m.category = 'danisman'
                          then nullif(btrim(coalesce(m.field, '')), '') end)
) v(attr_key, value_text)
join public.afs_attributes a on a.key = v.attr_key and a.is_active = true
where v.value_text is not null
on conflict (item_id, attribute_id) do nothing;

-- 5d. Private contacts for admin reference.
insert into public.catalog_item_contacts (item_id, contact_type, contact_value, is_public, is_primary)
select m.item_id, c.contact_type, c.contact_value, false, false
from _auth_matched m
cross join lateral (values
  ('email', nullif(btrim(coalesce(m.email, '')), '')),
  ('phone', nullif(btrim(coalesce(m.phone, '')), ''))
) c(contact_type, contact_value)
where c.contact_value is not null
  and not exists (
    select 1 from public.catalog_item_contacts x
    where x.item_id = m.item_id
      and x.contact_type = c.contact_type
      and x.contact_value = c.contact_value
  );

-- 5e. Known test auth accounts never belong in the public directory.
update public.catalog_items ci
set visibility = 'private', updated_at = now()
from auth.users au
where au.id = ci.linked_user_id
  and ci.item_type = 'member'
  and ci.visibility <> 'private'
  and lower(au.email) in (
    'a@gmail.com', 'test@gmail.com', 'test_99@gmail.com',
    'yeni_deneme_hesabi@gmail.com', 'test_import_001@corteqs.internal'
  );

-- ─── 6. Item-level role sync for ALL member items ────────────────────────────

update public.catalog_items ci
set
  platform_role_key = r.key,
  attributes = coalesce(ci.attributes, '{}'::jsonb)
               || jsonb_build_object('platform_role_key', r.key),
  updated_at = now()
from public.user_role_assignments ura
join public.roles r on r.id = ura.role_id
where ci.item_type = 'member'
  and ci.deleted_at is null
  and ci.linked_user_id = ura.user_id
  and ci.platform_role_key is distinct from r.key;

insert into public.catalog_item_roles (catalog_item_id, role_id, is_primary)
select ci.id, ura.role_id, true
from public.catalog_items ci
join public.user_role_assignments ura on ura.user_id = ci.linked_user_id
where ci.item_type = 'member'
  and ci.deleted_at is null
  and not exists (
    select 1 from public.catalog_item_roles cir where cir.catalog_item_id = ci.id
  )
on conflict (catalog_item_id, role_id) do nothing;

-- Re-point stale primary role links to the user's current role.
update public.catalog_item_roles cir
set role_id = ura.role_id, updated_at = now()
from public.catalog_items ci
join public.user_role_assignments ura on ura.user_id = ci.linked_user_id
where cir.catalog_item_id = ci.id
  and cir.is_primary
  and ci.item_type = 'member'
  and ci.deleted_at is null
  and cir.role_id <> ura.role_id
  and not exists (
    select 1 from public.catalog_item_roles dup
    where dup.catalog_item_id = cir.catalog_item_id and dup.role_id = ura.role_id
  );

-- ─── 7. Unclaimed member import (no auth account) ────────────────────────────

create temp table _to_create on commit drop as
select s.*, coalesce(rm.role_id, dr.role_id) as role_id,
       coalesce(rm.role_key, dr.role_key) as role_key
from _subs_geo s
left join _role_map rm on rm.category = s.category
cross join _default_role dr
where not exists (select 1 from auth.users au where lower(au.email) = s.email_n)
  and not exists (select 1 from _wa_matched m where m.submission_id = s.submission_id)
  and not exists (
    select 1 from public.catalog_items ci
    where ci.attributes ->> 'submission_id' = s.submission_id::text
  );

insert into public.catalog_items (
  item_type, slug, title, headline, status, visibility, verification_status,
  linked_user_id, platform_role_key, country_code, city, attributes, published_at
)
select
  'member',
  'member-' || substr(replace(t.submission_id::text, '-', ''), 1, 16),
  btrim(t.fullname),
  nullif(left(btrim(coalesce(t.field, '')), 140), ''),
  'published',
  'public',
  'unverified',
  null,
  t.role_key,
  t.country_code_resolved,
  nullif(btrim(coalesce(t.city, '')), ''),
  jsonb_strip_nulls(jsonb_build_object(
    'import_source', 'submissions-import-20260610',
    'submission_id', t.submission_id::text,
    'submission_category', t.category,
    'referral_code', t.referral_code,
    'referral_source', t.referral_source,
    'platform_role_key', t.role_key
  )),
  now()
from _to_create t
on conflict (slug) do nothing;

-- Resolve created items back via provenance for the satellite inserts.
create temp table _created on commit drop as
select ci.id as item_id, t.*
from _to_create t
join public.catalog_items ci
  on ci.attributes ->> 'submission_id' = t.submission_id::text
 and ci.item_type = 'member';

insert into public.catalog_item_roles (catalog_item_id, role_id, is_primary)
select c.item_id, c.role_id, true
from _created c
where not exists (
  select 1 from public.catalog_item_roles cir where cir.catalog_item_id = c.item_id
)
on conflict (catalog_item_id, role_id) do nothing;

insert into public.catalog_item_attribute_values
  (item_id, attribute_id, value_text, visibility, approval_status, approved_at, updated_at)
select c.item_id, a.id, v.value_text, 'public', 'approved', now(), now()
from _created c
cross join lateral (values
  ('full_name',      btrim(c.fullname)),
  ('country',        nullif(btrim(coalesce(c.country, '')), '')),
  ('city',           nullif(btrim(coalesce(c.city, '')), '')),
  ('business_name',  nullif(btrim(coalesce(c.business, '')), '')),
  ('expertise_area', case when c.category = 'danisman'
                          then nullif(btrim(coalesce(c.field, '')), '') end)
) v(attr_key, value_text)
join public.afs_attributes a on a.key = v.attr_key and a.is_active = true
where v.value_text is not null
on conflict (item_id, attribute_id) do nothing;

insert into public.catalog_item_contacts (item_id, contact_type, contact_value, is_public, is_primary)
select c.item_id, x.contact_type, x.contact_value, false, false
from _created c
cross join lateral (values
  ('email', nullif(btrim(coalesce(c.email, '')), '')),
  ('phone', nullif(btrim(coalesce(c.phone, '')), ''))
) x(contact_type, contact_value)
where x.contact_value is not null
  and not exists (
    select 1 from public.catalog_item_contacts pc
    where pc.item_id = c.item_id
      and pc.contact_type = x.contact_type
      and pc.contact_value = x.contact_value
  );

-- ─── 8. Report ───────────────────────────────────────────────────────────────

do $$
declare
  v_clean int; v_created int; v_wa_fixed int; v_wa_hidden int; v_roles int;
begin
  select count(*) into v_clean from _subs_clean;
  select count(*) into v_created from _created;
  select count(*) into v_wa_fixed from _wa_matched;
  select count(*) into v_wa_hidden
    from _wa_members w
    where not exists (select 1 from _wa_matched m where m.item_id = w.item_id);
  select count(*) into v_roles from public.user_role_assignments;
  raise notice 'submissions-import-20260610: clean=% created=% wa_fixed=% wa_hidden=% role_assignments=%',
    v_clean, v_created, v_wa_fixed, v_wa_hidden, v_roles;
end $$;

commit;
