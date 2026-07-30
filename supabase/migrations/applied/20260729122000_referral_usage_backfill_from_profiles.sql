-- ============================================================
-- Purpose:                Profillerde ÖNCEDEN girilmiş referral kodlarını kullanım kaydına
--                         backfill et + referral_codes sayaçlarını kullanımlardan yeniden hesapla.
-- Module:                 REFERRAL (profil doğrulama planı B10 —
--                         docs/plans/2026-07-29-profil-referral-dogrulama-admin-kullanim.md §3)
-- Risk level:             medium (referral_codes.usage_count/is_used/used_at TÜM kodlar için
--                         kullanım satırlarından türetilir hale gelir — türetilmiş alan kararı)
--
-- Background:
--   36 profilde referral_code değeri var; 35'i gerçek bir koda karşılık geliyor (2026-07-29
--   ölçümü) ama hiçbiri referral_code_usages'a düşmemiş (alan doğrulamasızdı — B09 öncesi).
--   Bu migration eşleşenleri source='profile' olarak kaydeder; eşleşmeyen serbest metin
--   kayıtları SİLMEZ, RAISE NOTICE ile raporlar.
--
-- Güvence sırası:
--   1. ÖN KOŞUL ASSERT: recompute'tan önce sum(usage_count) = count(usages) olmalı
--      (bugün 41 = 41). Eşit değilse migration DURUR — bilinmeyen bir sayaç sapması varken
--      türetme yapılmaz.
--   2. Backfill INSERT (ON CONFLICT DO NOTHING — user_id partial unique kilidi korunur).
--   3. Recompute: usage_count/is_used/used_at ← referral_code_usages'tan (tüm kodlar).
--   4. SON KONTROL ASSERT: sum(usage_count) = count(usages).
--
-- Rollback:               delete from referral_code_usages where source='profile';
--                         ardından recompute bloğunu yeniden çalıştır.
-- Estimated lock impact:  low (referral_codes ~onlarca satır, tek UPDATE).
-- Manual verification:    bkz. plan §Doğrulama.
-- ============================================================

BEGIN;

DO $$
declare
  v_sum bigint;
  v_cnt bigint;
  v_inserted int;
  v_unmatched record;
  v_unmatched_count int := 0;
begin
  -- 1) Ön koşul: mevcut sayaçlar kullanım satırlarıyla tutarlı mı?
  select coalesce(sum(usage_count), 0) into v_sum from public.referral_codes;
  select count(*) into v_cnt from public.referral_code_usages;
  if v_sum <> v_cnt then
    raise exception 'ON KOSUL BASARISIZ: sum(usage_count)=% <> count(usages)=% — recompute yapilmadan once sapma incelenmeli', v_sum, v_cnt;
  end if;
  raise notice 'On kosul OK: sum(usage_count) = count(usages) = %', v_cnt;

  -- 2) Backfill: profil değeri gerçek bir koda karşılık gelen kullanıcılar.
  --    Aynı kod metni birden çok satırdaysa validate_and_bind ile aynı tercih: en yenisi.
  with profile_codes as (
    select upa.user_id,
           upper(btrim(upa.value_text)) as code_norm,
           upa.updated_at
    from public.user_profile_attributes upa
    join public.afs_attributes a on a.id = upa.attribute_id
    where a.key = 'referral_code'
      and nullif(btrim(coalesce(upa.value_text, '')), '') is not null
  ),
  matched as (
    select pc.user_id, pc.code_norm, pc.updated_at, rc.id as referral_code_id
    from profile_codes pc
    cross join lateral (
      select rc.id
      from public.referral_codes rc
      where upper(rc.code) = pc.code_norm
      order by rc.created_at desc
      limit 1
    ) rc
  )
  insert into public.referral_code_usages (referral_code_id, user_id, source, used_at, full_name, email)
  select m.referral_code_id,
         m.user_id,
         'profile',
         coalesce(m.updated_at, now()),
         (select upa2.value_text
          from public.user_profile_attributes upa2
          join public.afs_attributes a2 on a2.id = upa2.attribute_id
          where upa2.user_id = m.user_id and a2.key = 'full_name'
          limit 1),
         (select u.email::text from auth.users u where u.id = m.user_id)
  from matched m
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  raise notice 'Backfill: % profil kullanimi eklendi (source=profile)', v_inserted;

  -- Eşleşmeyen serbest metin kayıtları — SİLİNMEZ, raporlanır.
  for v_unmatched in
    select upa.user_id, upa.value_text
    from public.user_profile_attributes upa
    join public.afs_attributes a on a.id = upa.attribute_id
    where a.key = 'referral_code'
      and nullif(btrim(coalesce(upa.value_text, '')), '') is not null
      and not exists (
        select 1 from public.referral_codes rc
        where upper(rc.code) = upper(btrim(upa.value_text))
      )
  loop
    v_unmatched_count := v_unmatched_count + 1;
    raise notice 'ESLESMEYEN (dokunulmadi): user=% deger="%"', v_unmatched.user_id, v_unmatched.value_text;
  end loop;
  raise notice 'Eslesmeyen serbest metin kaydi: %', v_unmatched_count;

  -- 3) Recompute: sayaçlar artık kullanım satırlarından türetilir (çift sayım riski sıfırlanır).
  update public.referral_codes rc
  set usage_count = coalesce(agg.cnt, 0),
      is_used = coalesce(agg.cnt, 0) > 0,
      used_at = agg.max_used
  from (
    select u.referral_code_id, count(*) as cnt, max(u.used_at) as max_used
    from public.referral_code_usages u
    group by u.referral_code_id
  ) agg
  where agg.referral_code_id = rc.id;

  -- Hiç kullanımı olmayan kodlar da türetilmiş hale gelsin (0 / false / null).
  update public.referral_codes rc
  set usage_count = 0, is_used = false, used_at = null
  where not exists (select 1 from public.referral_code_usages u where u.referral_code_id = rc.id)
    and (coalesce(rc.usage_count, 0) <> 0 or rc.is_used or rc.used_at is not null);

  -- 4) Son kontrol.
  select coalesce(sum(usage_count), 0) into v_sum from public.referral_codes;
  select count(*) into v_cnt from public.referral_code_usages;
  if v_sum <> v_cnt then
    raise exception 'SON KONTROL BASARISIZ: sum(usage_count)=% <> count(usages)=%', v_sum, v_cnt;
  end if;
  raise notice 'Son kontrol OK: sum(usage_count) = count(usages) = %', v_cnt;
end $$;

COMMIT;
