-- Cadde: yeni Cafe açıldığında uygulama içi `cadde.cafe.opened` bildirimi (2026-09-25).
-- Plan: docs/plans/2026-09-25-profil-cadde-kampanya-ve-canli-hata-duzeltmeleri.md
--
-- * create_cadde_cafe_v1 CREATE OR REPLACE ile GENİŞLETİLİR — imza AYNI (DROP YOK). Gövde,
--   2026-09-25'te canlıdan çekilen pg_get_functiondef çıktısıyla BİREBİR aynıdır (repodaki
--   son tanım 20260730150000_cadde_v1_005 de aynı). Yalnız `return v_cafe_id;` satırından
--   hemen önce işaretli (>>> / <<<) bildirim bloğu eklendi.
-- * Alıcı = açan HARİÇ; has_cadde_feature(uid, 'cadde.access') true olan, silinmemiş ve
--   auth tarafında banlanmamış kullanıcılar. Ayrı bir "Cadde üyeliği" tablosu yoktur;
--   erişim, /cadde rotasının RequireFeature(cadde.access) kapısıyla aynı kuraldır. Cadde ban
--   kill-switch'i has_cadde_feature içindedir. Ölçüm (2026-09-25): 171 rol ataması, 171'i
--   cadde.access'e sahip, 0 Cadde ban kaydı.
-- * Kullanıcı başına diaspora_key tutulmaz (afs_attributes'ta diaspora alanı yok; seçim
--   istemcide DiasporaContext'tedir) — cafe'nin diaspora_key'i payload.diasporaKey'e yazılır.
-- * YALNIZ uygulama içi bildirim (notifications satırı). E-posta / edge function tetiklenmez.
-- * notifications.type üzerinde CHECK/enum YOKTUR (canlı pg_constraint ölçüldü: yalnız pkey
--   + iki FK) — tip listesi güncellemesi gerekmez.
-- * Tek set-based INSERT...SELECT; döngü ve satır başına cadde_notify çağrısı yok.
--   Spam sınırı mevcut cadde.cafe.daily_create_limit (varsayılan 3/gün; admin/moderatör muaf).
-- * Frontend: entity_type='cafe' → /cadde/cafe/:cafeId (notificationDeepLink); zil
--   CaddeCafeIcon'u çizer (notificationUsesCafeIcon). Sözleşme testi:
--   src/lib/cadde-cafe-opened-notification-contract.test.ts

begin;

CREATE OR REPLACE FUNCTION public.create_cadde_cafe_v1(p_title text, p_summary text, p_theme_key text, p_country text, p_city text, p_is_bridge boolean, p_entry_mode text, p_referral_code text DEFAULT NULL::text, p_entry_question text DEFAULT NULL::text, p_starts_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_ends_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_capacity integer DEFAULT NULL::integer, p_external_links jsonb DEFAULT '[]'::jsonb, p_diaspora_key text DEFAULT 'tr'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_title text := trim(coalesce(p_title, ''));
  v_summary text := trim(coalesce(p_summary, ''));
  v_theme text := nullif(trim(coalesce(p_theme_key, '')), '');
  v_brand text;
  v_referral text := nullif(trim(coalesce(p_referral_code, '')), '');
  v_question text := nullif(trim(coalesce(p_entry_question, '')), '');
  v_starts timestamptz := coalesce(p_starts_at, now());
  v_ends timestamptz;
  v_max_hours integer := public.cadde_setting_int('cadde.cafe.max_duration_hours', 6);
  v_diaspora text := coalesce(nullif(trim(coalesce(p_diaspora_key, '')), ''), 'tr');
  v_country_id uuid;
  v_city_id uuid;
  v_cafe_id uuid;
  v_slug text;
  v_today_count integer;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if v_diaspora not in ('tr', 'in', 'cn', 'ph') then
    raise exception 'cadde_invalid_diaspora';
  end if;

  if not public.is_cadde_profile_complete(v_uid) then
    if public.cadde_phone_required() and not public.is_phone_verified(v_uid) then
      raise exception 'phone_verification_required';
    end if;
    raise exception 'cadde_profile_incomplete';
  end if;

  if not public.has_cadde_feature(v_uid, 'cadde.cafe.create') then
    if public.is_cadde_banned(v_uid) then
      raise exception 'cadde_banned';
    end if;
    raise exception 'cadde_cafe_permission_denied';
  end if;

  if length(v_title) < 3 or length(v_title) > 80 then
    raise exception 'cadde_invalid_cafe_title';
  end if;

  -- Tema kataloğa bağlı (FK yok — legacy satırlar düşmesin diye burada doğrulanır).
  if v_theme is null or not exists (
    select 1 from public.cadde_cafe_themes t where t.key = v_theme and t.is_active = true
  ) then
    raise exception 'cadde_invalid_cafe_theme';
  end if;

  -- Marka koruması: markanın meşru sahibi değilse bu adla cafe açılamaz.
  -- Admin/moderatör muaf (moderasyon amaçlı açabilmeliler).
  v_brand := public.cadde_check_brand_conflict(v_title);
  if v_brand is not null
     and not public.cadde_user_owns_brand(v_uid, v_brand)
     and not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    raise exception 'cadde_cafe_brand_protected';
  end if;

  if length(v_summary) < 1 or length(v_summary) > 500 then
    raise exception 'cadde_invalid_cafe_summary';
  end if;

  if p_entry_mode not in ('open', 'approval', 'referral') then
    raise exception 'cadde_invalid_entry_mode';
  end if;

  if p_entry_mode = 'referral' and (v_referral is null or length(v_referral) < 4) then
    raise exception 'cadde_cafe_referral_code_required';
  end if;

  if p_entry_mode = 'approval' and v_question is null then
    raise exception 'cadde_cafe_question_required';
  end if;

  v_ends := coalesce(p_ends_at, v_starts + interval '2 hours');
  if v_ends <= v_starts then
    raise exception 'cadde_invalid_cafe_time';
  end if;
  if v_ends > v_starts + make_interval(hours => v_max_hours) then
    raise exception 'cadde_cafe_duration_exceeded';
  end if;

  if p_capacity is not null and p_capacity < 1 then
    raise exception 'cadde_invalid_cafe_capacity';
  end if;

  if not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    select count(*) into v_today_count
    from public.cadde_cafes
    where host_user_id = v_uid and created_at > now() - interval '24 hours';
    if v_today_count >= public.cadde_setting_int('cadde.cafe.daily_create_limit', 3) then
      raise exception 'cadde_rate_limit';
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

  v_slug := trim(both '-' from regexp_replace(lower(v_title), '[^a-z0-9]+', '-', 'g'));
  v_slug := nullif(v_slug, '') || '-' || substr(md5(gen_random_uuid()::text), 1, 6);

  insert into public.cadde_cafes (
    host_user_id, title, summary, country_id, city_id,
    content_mode, status, is_bridge, is_free,
    starts_at, ends_at, is_active,
    slug, theme_key, entry_mode, referral_code_hash, entry_question,
    capacity, external_links, diaspora_key
  )
  values (
    v_uid, v_title, v_summary, v_country_id, v_city_id,
    'real', 'published', coalesce(p_is_bridge, false), true,
    v_starts, v_ends, true,
    v_slug, v_theme, p_entry_mode,
    case when v_referral is not null then encode(digest(upper(v_referral), 'sha256'), 'hex') end,
    v_question, p_capacity, coalesce(p_external_links, '[]'::jsonb), v_diaspora
  )
  returning id into v_cafe_id;

  insert into public.cadde_cafe_members (cafe_id, user_id, status, approved_at, approved_by)
  values (v_cafe_id, v_uid, 'approved', now(), v_uid)
  on conflict (cafe_id, user_id) do nothing;

  -- >>> cadde.cafe.opened (20260925110000) — yalnız bu blok eklendi, gövdenin geri kalanı canlı tanımla BİREBİR aynı.
  -- Açan HARİÇ, Cadde'ye erişimi olan herkese uygulama içi bildirim (e-posta YOK).
  -- Erişim = /cadde rota kapısıyla aynı feature: has_cadde_feature(uid, 'cadde.access');
  -- ban kill-switch has_cadde_feature içinde olduğu için banlılar kendiliğinden elenir.
  -- Kullanıcı başına diaspora anahtarı TUTULMAZ (diaspora istemci tarafında seçilir) —
  -- cafe'nin diaspora_key'i payload'a yazılır. Tek set-based INSERT...SELECT: döngü yok,
  -- cadde_notify satır satır çağrılmaz (canlı DB < 1 GB RAM).
  insert into public.notifications (user_id, actor_user_id, type, title, message, related_id, entity_type, payload)
  select
    ura.user_id,
    v_uid,
    'cadde.cafe.opened',
    'Yeni Cafe açıldı',
    v_title,
    v_cafe_id,
    'cafe',
    jsonb_build_object('cafeId', v_cafe_id, 'diasporaKey', v_diaspora, 'themeKey', v_theme, 'entryMode', p_entry_mode)
  from public.user_role_assignments ura
  join auth.users u on u.id = ura.user_id
  where ura.user_id <> v_uid
    and u.deleted_at is null
    and (u.banned_until is null or u.banned_until <= now())
    and public.has_cadde_feature(ura.user_id, 'cadde.access');
  -- <<< cadde.cafe.opened

  return v_cafe_id;
end;
$function$;

revoke all on function public.create_cadde_cafe_v1(text, text, text, text, text, boolean, text, text, text, timestamptz, timestamptz, integer, jsonb, text) from public, anon;
grant execute on function public.create_cadde_cafe_v1(text, text, text, text, text, boolean, text, text, text, timestamptz, timestamptz, integer, jsonb, text) to authenticated;

commit;
