-- ============================================================
-- Purpose:                update_profile_attribute'a AFS rebuild'inde kaybolan referral
--                         mantığını geri getir + profil kaynaklı kullanım kaydı ekle.
-- Module:                 REFERRAL (profil doğrulama planı B09 —
--                         docs/plans/2026-07-29-profil-referral-dogrulama-admin-kullanim.md §2)
-- Risk level:             medium (profildeki TÜM alan kayıtları bu fonksiyondan geçer;
--                         referral-dışı yollar bilinçli olarak bire bir korunmuştur)
--
-- Background / regression:
--   20260609100900_rebuild_010c_backend_rewire.sql fonksiyonu yeniden yazarken
--   20260604190000_add_profile_onboarding_foundation.sql'deki referral mantığını düşürdü:
--   "referral alanları her zaman private" istisnası kalkınca `user_can_hide = false` +
--   private görünürlük isteği 42501 fırlatır oldu → üye referral kodunu KAYDEDEMİYOR ve
--   rol-özel kaydetme döngüsü ilk hatada kopuyor. Ayrıca doğrulama/kullanım kaydı yoktu.
--
--   Bu gövde canlı pg_get_functiondef dökümünden alınıp yamalandı (elle kopya drift'i yok).
--   İmza AYNI (text, jsonb, text) → eski imza düşürme (PGRST203) gerekmez.
--
-- Yeni davranış (yalnız referral alanlarında):
--   * referral_code / referral_source → görünürlük HER ZAMAN 'private' (42501 çözümü).
--   * referral_source → public.validate_profile_onboarding_referral_source (yeniden bağlandı).
--   * referral_code  → upper(btrim), boş → NULL;
--       - kullanıcının kayıtlı kullanımı VARSA: aynı kod no-op, farklı kod/boşaltma
--         P0001 DETAIL='locked' ile RED (kilit kararı).
--       - yoksa ve değer doluysa: validate_and_bind_referral_code; status<>'valid' ise
--         P0001 DETAIL=<status> ile RED (not_found/inactive/expired/out_of_window).
--       - geçerliyse: değer normalized_code olarak yazılır; başarılı attribute upsert'inden
--         SONRA referral_code_usages'a (user_id, source='profile') satır + sayaç güncellemesi
--         (submissions_log_referral_usage ile aynı semantik). ON CONFLICT DO NOTHING +
--         RETURNING id → satır gerçekten eklendiyse sayaç artar (yarış koşulunda çift sayım yok).
--
-- Hata sözleşmesi: P0001, DETAIL alanında statü taşır — TS tarafı
--   (getReferralValidationMessage) Türkçe mesajı bu DETAIL'den çözer.
--
-- Rollback:               önceki gövdeyi canlı yedekten geri yükle
--                         (scratchpad/fn_update_profile_attribute.sql — bu oturumun dökümü)
--                         ya da 20260609100900 içindeki tanımı yeniden çalıştır.
-- Estimated lock impact:  negligible (CREATE OR REPLACE FUNCTION).
-- Manual verification:    bkz. plan §Doğrulama; ayrıca bu migration'ın begin/rollback
--                         senaryo testi uygulama sırasında koşuldu (geçerli/geçersiz/kilitli).
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.update_profile_attribute(attribute_key text, attribute_value jsonb, visibility text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_role_key text;
  v_role_id uuid;
  v_attribute public.afs_attributes%rowtype;
  v_rule public.role_attributes%rowtype;
  v_visibility text;
  v_value_text text;
  v_request_id uuid;
  -- Referral (B09) yerelleri:
  v_existing_usage public.referral_code_usages%rowtype;
  v_existing_code text;
  v_referral record;
  v_new_usage_code_id uuid;
  v_usage_row_id uuid;
  v_full_name text;
  v_email text;
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select r.key, r.id into v_role_key, v_role_id
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = v_user_id
  limit 1;

  if v_role_key is null then
    raise exception 'user role not found' using errcode = 'P0002';
  end if;

  select * into v_attribute from public.afs_attributes where key = attribute_key and is_active = true limit 1;
  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  select rar.* into v_rule
  from public.role_attributes rar
  where rar.role_id = v_role_id
    and rar.attribute_id = v_attribute.id
    and rar.is_enabled = true
  limit 1;

  if v_rule.id is null then
    raise exception 'attribute is not enabled for current role' using errcode = '42501';
  end if;

  if not v_rule.user_can_edit then
    raise exception 'attribute is not editable' using errcode = '42501';
  end if;

  v_visibility := coalesce(visibility, case when v_rule.is_public_default then 'public' else 'private' end);
  if v_visibility not in ('public', 'private', 'admin_only') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  -- B09: referral alanları HER ZAMAN private — 20260604190000'daki istisnanın geri
  -- getirilmesi. user_can_hide kontrolü bu iki key için atlanır (42501 blocker'ının çözümü).
  if v_attribute.key in ('referral_code', 'referral_source') then
    v_visibility := 'private';
  elsif not v_rule.user_can_hide and v_visibility <> 'public' then
    raise exception 'attribute visibility cannot be changed' using errcode = '42501';
  end if;

  if v_attribute.data_type in ('text','textarea','select','url','phone') then
    v_value_text := nullif(btrim(coalesce(attribute_value #>> '{}', '')), '');
  end if;

  -- B09: referral_source allowlist doğrulaması (canlıda vardı, kullanılmıyordu — yeniden bağlandı).
  if v_attribute.key = 'referral_source' then
    v_value_text := public.validate_profile_onboarding_referral_source(v_value_text);
  end if;

  -- B09: referral_code doğrulama + kilit.
  if v_attribute.key = 'referral_code' then
    v_value_text := nullif(upper(btrim(coalesce(v_value_text, ''))), '');

    select * into v_existing_usage
    from public.referral_code_usages
    where user_id = v_user_id
    limit 1;

    if v_existing_usage.id is not null then
      select upper(rc.code) into v_existing_code
      from public.referral_codes rc
      where rc.id = v_existing_usage.referral_code_id;

      if v_value_text is null or v_value_text <> v_existing_code then
        -- Kilit: doğrulanmış kod değiştirilemez ve boşaltılamaz.
        raise exception 'referral code locked' using errcode = 'P0001', detail = 'locked';
      end if;
      -- Aynı kod: no-op (çift sayım yok) — normalize edilmiş değeri yazmaya devam et.
      v_value_text := v_existing_code;
    elsif v_value_text is not null then
      select * into v_referral
      from public.validate_and_bind_referral_code(v_value_text, now())
      limit 1;

      if v_referral.status is distinct from 'valid' then
        raise exception 'referral code rejected' using errcode = 'P0001', detail = coalesce(v_referral.status, 'not_found');
      end if;

      v_value_text := v_referral.normalized_code;
      v_new_usage_code_id := v_referral.referral_code_id;
    end if;
  end if;

  if v_rule.requires_admin_approval_on_change then
    insert into public.approval_requests (
      request_type, user_id, target_entity_type, payload, status
    ) values (
      'attribute_change', v_user_id, 'attribute',
      jsonb_build_object('attribute_key', attribute_key, 'attribute_value', attribute_value, 'visibility', v_visibility),
      'pending'
    ) returning id into v_request_id;

    return jsonb_build_object('status', 'pending', 'request_id', v_request_id, 'attribute_key', attribute_key);
  end if;

  insert into public.user_profile_attributes (
    user_id, attribute_id, value_text, value_json,
    visibility, approval_status, approved_by, approved_at, updated_at
  ) values (
    v_user_id, v_attribute.id,
    case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
    case when v_attribute.data_type in ('multi_select','boolean','json') then attribute_value else null end,
    v_visibility, 'approved', v_user_id, now(), now()
  )
  on conflict (user_id, attribute_id) do update
  set value_text = excluded.value_text,
      value_json = excluded.value_json,
      visibility = excluded.visibility,
      approval_status = 'approved',
      approved_by = excluded.approved_by,
      approved_at = excluded.approved_at,
      updated_at = now();

  -- B09: doğrulama geçtiyse ve bu kullanıcı için İLK kullanımsa kaydı düş + sayaç artır.
  -- Attribute upsert'inden SONRA: değer kaydedilmeden kullanım yazılmaz.
  if v_new_usage_code_id is not null then
    select upa.value_text into v_full_name
    from public.user_profile_attributes upa
    join public.afs_attributes a on a.id = upa.attribute_id
    where upa.user_id = v_user_id and a.key = 'full_name'
    limit 1;

    select u.email::text into v_email from auth.users u where u.id = v_user_id;

    insert into public.referral_code_usages (referral_code_id, user_id, source, used_at, full_name, email)
    values (v_new_usage_code_id, v_user_id, 'profile', now(), v_full_name, v_email)
    on conflict do nothing
    returning id into v_usage_row_id;

    -- Satır GERÇEKTEN eklendiyse sayaç artar (submissions_log_referral_usage semantiği;
    -- yarış koşulunda ON CONFLICT atlarsa çift sayım olmaz).
    if v_usage_row_id is not null then
      update public.referral_codes
      set usage_count = coalesce(usage_count, 0) + 1,
          is_used = true,
          used_at = greatest(coalesce(used_at, timestamptz 'epoch'), now())
      where id = v_new_usage_code_id;
    end if;
  end if;

  return jsonb_build_object('status', 'approved', 'attribute_key', attribute_key, 'visibility', v_visibility);
end;
$function$;

COMMIT;
