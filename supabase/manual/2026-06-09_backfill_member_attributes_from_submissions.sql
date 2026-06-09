-- =============================================================================
-- Manual one-off data backfill (NOT a migration — supabase/manual/ convention)
-- Date: 2026-06-09
--
-- Amaç: public.submissions tablosundaki üye attribute'larını (phone, country,
-- city, business, field, referral_*, sosyal linkler, bio) email eşleşmesiyle
-- auth.users kullanıcılarına bağlayıp canonical `user_profile_attributes`
-- (key-value) tablosuna yazmak. Ayrıca catalog_items.title'ı gerçek ad-soyadla
-- düzeltmek.
--
-- Kararlar (onaylı):
--   1. Email'i auth.users'ta OLMAYAN submission'lar için placeholder auth.users
--      oluştur (giriş yapılamaz; trigger rol + catalog bridge'i otomatik kurar).
--   2. NON-DESTRUCTIVE: mevcut attribute'a dokunma -> ON CONFLICT DO NOTHING.
--   3. submission.field -> hem expertise_area HEM profession.
--   4. Test/bot filtresi YOK -> eşleşen her email taşınır.
--   Çoklu submission -> en güncel (created_at DESC) seçilir.
--
-- Çalıştırma (PowerShell): bu dosya transaction AÇAR ama KAPATMAZ.
-- Mode dış psql çağrısıyla kontrol edilir:
--   DRY-RUN : psql ... -f bu_dosya.sql -c "rollback"
--   COMMIT  : psql ... -f bu_dosya.sql -c "commit"
-- (ON_ERROR_STOP açık; herhangi bir hata -> otomatik rollback.)
-- =============================================================================

\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------------------
-- 0) İz/geri-alma log tablosu (kalıcı). Eklenen her upa satırı + placeholder
--    user buraya yazılır; gerekirse bu kayıtlardan geri alınabilir.
-- ---------------------------------------------------------------------------
create table if not exists public._submission_backfill_log_20260609 (
  id            bigint generated always as identity primary key,
  kind          text not null,           -- 'auth_user' | 'attribute' | 'title'
  user_id       uuid,
  attribute_key text,
  detail        jsonb,
  logged_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- A) Placeholder auth.users: email'i auth.users'ta olmayan submission'lar.
--    Her email için en güncel submission'dan isim alınır.
--    Trigger (on_auth_user_created_assign_role) rol + catalog bridge'i kurar.
-- ---------------------------------------------------------------------------
with missing as (
  select distinct on (lower(s.email))
    lower(s.email) as email_norm,
    s.email        as email_raw,
    s.fullname     as fullname
  from public.submissions s
  where s.email is not null
    and btrim(s.email) <> ''
    and position('@' in s.email) > 1
    and not exists (
      select 1 from auth.users u where lower(u.email) = lower(s.email)
    )
  order by lower(s.email), s.created_at desc
),
inserted as (
  insert into auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at
  )
  select
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    m.email_raw,
    extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),  -- giriş yapılamaz placeholder
    now(),
    jsonb_build_object(
      'full_name', m.fullname,
      'bridge_source', 'submission_import'
    ),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    now(), now()
  from missing m
  -- missing CTE zaten not-exists ile filtreliyor; tek seferlik çalıştırma,
  -- yarış koşulu yok. auth.users.email üzerinde ON CONFLICT hedeflenebilir
  -- bir constraint olmadığı için filtreye güveniyoruz.
  returning id, email
)
insert into public._submission_backfill_log_20260609 (kind, user_id, detail)
select 'auth_user', i.id, jsonb_build_object('email', i.email)
from inserted i;

-- ---------------------------------------------------------------------------
-- B) Eşleştirme: her auth user için en güncel submission (email join).
-- ---------------------------------------------------------------------------
create temporary table _chosen on commit drop as
with ranked as (
  select distinct on (lower(s.email))
    u.id            as user_id,
    s.fullname      as fullname,
    s.phone         as phone,
    s.country       as country,
    s.city          as city,
    s.business      as business,
    s.field         as field,
    s.description   as description,
    s.linkedin      as linkedin,
    s.instagram     as instagram,
    s.website       as website,
    s.referral_source as referral_source,
    s.referral_code   as referral_code
  from public.submissions s
  join auth.users u on lower(u.email) = lower(s.email)
  where s.email is not null and btrim(s.email) <> ''
  order by lower(s.email), s.created_at desc
)
select * from ranked;

-- ---------------------------------------------------------------------------
-- C) Attribute upsert helper: tek bir (key, value, visibility) için
--    user_profile_attributes'a NON-DESTRUCTIVE insert + log.
--    value boş/null ise satır üretilmez. Mevcut attribute varsa DO NOTHING.
-- ---------------------------------------------------------------------------
-- Tek bir geçici fonksiyonla tekrarları azaltıyoruz.
create or replace function pg_temp._bf_upsert(
  p_key text, p_value_expr text, p_visibility text
) returns void language plpgsql as $fn$
begin
  execute format($q$
    with ins as (
      insert into public.user_profile_attributes
        (user_id, attribute_id, value_text, visibility, approval_status)
      select
        c.user_id,
        ac.id,
        btrim(%1$s),
        %2$L,
        'approved'
      from _chosen c
      cross join lateral (
        select id from public.attribute_catalog where key = %3$L limit 1
      ) ac
      where %1$s is not null and btrim(%1$s) <> ''
      on conflict (user_id, attribute_id) do nothing
      returning user_id
    )
    insert into public._submission_backfill_log_20260609 (kind, user_id, attribute_key)
    select 'attribute', user_id, %3$L from ins
  $q$, p_value_expr, p_visibility, p_key);
end;
$fn$;

select pg_temp._bf_upsert('full_name',       'c.fullname',        'public');
select pg_temp._bf_upsert('phone',           'c.phone',           'private');
select pg_temp._bf_upsert('country',         'c.country',         'public');
select pg_temp._bf_upsert('city',            'c.city',            'public');
select pg_temp._bf_upsert('business_name',   'c.business',        'public');
select pg_temp._bf_upsert('expertise_area',  'c.field',           'public');
select pg_temp._bf_upsert('profession',      'c.field',           'public');
select pg_temp._bf_upsert('bio_short',       'c.description',     'public');
select pg_temp._bf_upsert('linkedin_url',    'c.linkedin',        'public');
select pg_temp._bf_upsert('instagram_url',   'c.instagram',       'public');
select pg_temp._bf_upsert('website_url',     'c.website',         'public');
select pg_temp._bf_upsert('referral_source', 'c.referral_source', 'admin_only');
select pg_temp._bf_upsert('referral_code',   'c.referral_code',   'admin_only');

-- ---------------------------------------------------------------------------
-- D) catalog_items.title düzeltmesi: title hâlâ email local-part ise gerçek
--    ad-soyadla güncelle. Kullanıcının elle değiştirdiği başlığı EZMEZ.
-- ---------------------------------------------------------------------------
with title_fix as (
  update public.catalog_items ci
  set title = btrim(c.fullname), updated_at = now()
  from _chosen c, auth.users u
  where ci.item_type = 'member'
    and ci.linked_user_id = c.user_id
    and u.id = c.user_id
    and c.fullname is not null and btrim(c.fullname) <> ''
    -- yalnızca otomatik üretilmiş (email local-part) başlığı düzelt:
    and ci.title = split_part(u.email, '@', 1)
  returning ci.linked_user_id, ci.title
)
insert into public._submission_backfill_log_20260609 (kind, user_id, detail)
select 'title', linked_user_id, jsonb_build_object('new_title', title) from title_fix;

-- ---------------------------------------------------------------------------
-- E) Doğrulama / rapor (dry-run'da da çalışır)
-- ---------------------------------------------------------------------------
\echo ''
\echo '=== Bu çalıştırmada loglanan değişiklikler (kind bazında) ==='
select kind, count(*) from public._submission_backfill_log_20260609
where logged_at > now() - interval '5 minutes'
group by kind order by kind;

\echo ''
\echo '=== Eklenen attribute key dağılımı (bu çalıştırma) ==='
select attribute_key, count(*) from public._submission_backfill_log_20260609
where kind='attribute' and logged_at > now() - interval '5 minutes'
group by attribute_key order by count(*) desc;

\echo ''
\echo '=== Örnek profil: hsanbur@yahoo.com ==='
select ac.key, left(upa.value_text, 50) as value
from public.user_profile_attributes upa
join public.attribute_catalog ac on ac.id = upa.attribute_id
join auth.users u on u.id = upa.user_id
where u.email = 'hsanbur@yahoo.com'
order by ac.key;

\echo ''
\echo '=== Toplam sayımlar ==='
select 'auth.users' t, count(*) c from auth.users
union all select 'user_profile_attributes', count(*) from public.user_profile_attributes
union all select 'catalog_items member', count(*) from public.catalog_items where item_type='member';

-- ---------------------------------------------------------------------------
-- Transaction burada AÇIK kalır. Çağıran psql `-c "rollback"` (dry) veya
-- `-c "commit"` (apply) ile sonlandırır.
-- ---------------------------------------------------------------------------
