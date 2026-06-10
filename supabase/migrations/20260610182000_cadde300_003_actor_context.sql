-- Cadde 3.0 Faz 2 (3/4): Köprü attribute'ları + actor context RPC ve policy helper'ları.
-- Tüm fonksiyonlar: security definer, set search_path = public, recursion-free, minimum veri.
-- Telefon zorunluluğu cadde_settings.cadde.phone_verification_required flag'ine bağlı (D-03 stub: false).

begin;

-- ── Köprü policy attribute'ları (yoksa ekle) ────────────────────────────────
insert into public.afs_attributes (key, label, description, data_type, is_active, is_system, sort_order, storage_strategy, default_visibility)
values
  ('indiv_relocating', 'Türkiye''den Taşınma Planı',
   'TR yerleşik bireysel üyenin diasporaya taşınma niyeti. Köprü paylaşım koşulu (CKS).',
   'boolean', true, false, 140, 'dynamic_value', 'private'),
  ('digital_community_enabled', 'Dijital Topluluk Aktif',
   'TR yerleşik kurumsal aktörün (işletme/danışman/kuruluş/elçi) Köprü paylaşım koşulu (CKS).',
   'boolean', true, false, 141, 'dynamic_value', 'private')
on conflict (key) do nothing;

-- ── İç yardımcı: attribute değeri (text) ────────────────────────────────────
create or replace function public.cadde_attr_text(uid uuid, attr_key text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select upa.value_text
  from public.user_profile_attributes upa
  join public.afs_attributes a on a.id = upa.attribute_id
  where upa.user_id = uid and a.key = attr_key
  limit 1;
$$;

-- ── Telefon doğrulama (truth source: user_verifications) ────────────────────
create or replace function public.is_phone_verified(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_verifications
    where user_id = uid and phone_verified_at is not null
  );
$$;

create or replace function public.cadde_phone_required()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (value #>> '{}')::boolean
     from public.cadde_settings
     where key = 'cadde.phone_verification_required'),
    false
  );
$$;

-- ── Yerleşiklik ──────────────────────────────────────────────────────────────
create or replace function public.is_tr_resident(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(public.cadde_attr_text(uid, 'country'), ''))
         in ('türkiye', 'turkiye', 'tr');
$$;

create or replace function public.is_diaspora_resident(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(trim(public.cadde_attr_text(uid, 'country')), ''), '') <> ''
         and not public.is_tr_resident(uid);
$$;

-- ── Cadde profil kapısı: ülke + şehir (+ flag açıksa doğrulanmış telefon) ───
create or replace function public.is_cadde_profile_complete(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(trim(public.cadde_attr_text(uid, 'country')), ''), '') <> ''
     and coalesce(nullif(trim(public.cadde_attr_text(uid, 'city')), ''), '') <> ''
     and (not public.cadde_phone_required() or public.is_phone_verified(uid));
$$;

-- ── Feature çözümlemesi (get_current_user_features mantığının uid'li aynası) ─
create or replace function public.has_cadde_feature(uid uuid, fkey text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with effective_role as (
    select r.id as role_id, r.key as role_key
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = uid
    limit 1
  )
  select coalesce((
    select fc.is_active_globally and coalesce(ufo.is_enabled, rff.is_enabled, false)
    from public.afs_features fc
    join effective_role er
      on fc.scope_role = '*' or fc.scope_role = er.role_key
    left join public.role_features rff
      on rff.role_id = er.role_id and rff.feature_key = fc.key
    left join public.user_feature_overrides ufo
      on ufo.user_id = uid and ufo.feature_key = fc.key
    where fc.key = fkey
  ), false);
$$;

-- ── Paylaşım yetkileri (CKS §7 truth table) ─────────────────────────────────
create or replace function public.can_post_cadde(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select uid is not null
     and public.is_cadde_profile_complete(uid)
     and public.has_cadde_feature(uid, 'cadde.post.create');
$$;

-- TR bireysel roller; geri kalan her rol "kurumsal aktör" sayılır (elçi ve blogger dahil).
create or replace function public.can_post_kopru(uid uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role_key text;
  v_individual boolean;
begin
  if uid is null then return false; end if;
  if public.is_admin(uid) or public.is_moderator(uid) then return true; end if;
  if not public.is_cadde_profile_complete(uid) then return false; end if;
  if not public.has_cadde_feature(uid, 'cadde.bridge.post') then return false; end if;

  if public.is_diaspora_resident(uid) then return true; end if;
  if not public.is_tr_resident(uid) then return false; end if;

  select r.key into v_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = uid
  limit 1;

  v_individual := v_role_key in ('User_Standard', 'User_DiasporaMember', 'User_Contributor');

  if v_individual then
    return lower(coalesce(public.cadde_attr_text(uid, 'indiv_relocating'), '')) = 'true';
  end if;

  return lower(coalesce(public.cadde_attr_text(uid, 'digital_community_enabled'), '')) = 'true';
end;
$$;

-- ── Actor context: frontend'in tek seferde okuduğu kapı durumu ──────────────
create or replace function public.get_cadde_actor_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role_key text;
  v_country text;
  v_city text;
  v_phone_required boolean;
  v_phone_verified boolean;
  v_missing text[] := '{}';
  v_features jsonb;
  v_verification record;
begin
  if v_uid is null then
    return jsonb_build_object('userId', null, 'canEnterCadde', false, 'missingGateFields', jsonb_build_array('auth'));
  end if;

  select r.key into v_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = v_uid
  limit 1;

  v_country := nullif(trim(coalesce(public.cadde_attr_text(v_uid, 'country'), '')), '');
  v_city := nullif(trim(coalesce(public.cadde_attr_text(v_uid, 'city'), '')), '');
  v_phone_required := public.cadde_phone_required();
  v_phone_verified := public.is_phone_verified(v_uid);

  select uv.phone_e164, uv.phone_verified_at into v_verification
  from public.user_verifications uv where uv.user_id = v_uid;

  if v_country is null then v_missing := array_append(v_missing, 'country'); end if;
  if v_city is null then v_missing := array_append(v_missing, 'city'); end if;
  if v_phone_required and not v_phone_verified then
    v_missing := array_append(v_missing, 'phone_verification');
  end if;

  select coalesce(jsonb_agg(f.feature_key order by f.feature_key), '[]'::jsonb)
  into v_features
  from public.get_current_user_features() f
  where f.is_enabled and f.feature_key like 'cadde.%';

  return jsonb_build_object(
    'userId', v_uid,
    'roleKey', v_role_key,
    'featureKeys', v_features,
    'country', v_country,
    'city', v_city,
    'phoneE164', v_verification.phone_e164,
    'phoneVerifiedAt', v_verification.phone_verified_at,
    'isPhoneVerified', v_phone_verified,
    'phoneRequired', v_phone_required,
    'isTRResident', public.is_tr_resident(v_uid),
    'isDiasporaResident', public.is_diaspora_resident(v_uid),
    'indivRelocating', lower(coalesce(public.cadde_attr_text(v_uid, 'indiv_relocating'), '')) = 'true',
    'digitalCommunityEnabled', lower(coalesce(public.cadde_attr_text(v_uid, 'digital_community_enabled'), '')) = 'true',
    'profilePublic', true,
    'missingGateFields', to_jsonb(v_missing),
    'canEnterCadde', cardinality(v_missing) = 0,
    'canPostCadde', public.can_post_cadde(v_uid),
    'canPostKopru', public.can_post_kopru(v_uid)
  );
end;
$$;

-- ── Grant'ler: yalnız authenticated; anon/public kapalı ─────────────────────
revoke all on function public.cadde_attr_text(uuid, text) from public, anon;
revoke all on function public.is_phone_verified(uuid) from public, anon;
revoke all on function public.cadde_phone_required() from public, anon;
revoke all on function public.is_tr_resident(uuid) from public, anon;
revoke all on function public.is_diaspora_resident(uuid) from public, anon;
revoke all on function public.is_cadde_profile_complete(uuid) from public, anon;
revoke all on function public.has_cadde_feature(uuid, text) from public, anon;
revoke all on function public.can_post_cadde(uuid) from public, anon;
revoke all on function public.can_post_kopru(uuid) from public, anon;
revoke all on function public.get_cadde_actor_context() from public, anon;

grant execute on function public.get_cadde_actor_context() to authenticated;
grant execute on function public.is_cadde_profile_complete(uuid) to authenticated;
grant execute on function public.can_post_cadde(uuid) to authenticated;
grant execute on function public.can_post_kopru(uuid) to authenticated;

commit;
