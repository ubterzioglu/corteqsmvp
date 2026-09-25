-- Profil — öğrenim alanları (plan: docs/plans/2026-09-25-profil-cadde-kampanya-ve-canli-hata-duzeltmeleri.md)
--
-- İki yeni, İSTEĞE BAĞLI profil alanı:
--   * education_level        — "Öğrenim durumu" (select)
--   * education_last_school  — "Son bitirdiği üniversite/okul" (text)
--
-- Kurallar (CLAUDE.md "Profil formu kuralları"):
--   1) Bir alanın formda görünmesi role_attributes kuralına bağlıdır →
--      TÜM aktif rollere (ölçüm 2026-09-25: 78) kural eklenir. Yoksa alan canlıda
--      sessizce hiç çizilmez (phone alanında tam olarak bu yaşandı).
--   2) Varsayılan GİZLİ: is_public=false, is_public_default=false, visibility='private'.
--      user_can_hide=TRUE bilinçlidir: false olsaydı update_profile_attribute
--      'public' dışı görünürlüğü 42501 ile reddederdi ("her zaman public" olurdu).
--   3) Zorunlu değil (is_required=false), kullanıcı düzenler (user_can_edit=true).
--
-- Seçenek DEĞERLERİ ASCII slug'dır (DB anahtarı); Türkçe etiketler tek kaynak olan
-- src/lib/profile-education.ts içindedir. validation_schema.enum o modülle BİREBİR
-- aynı olmalıdır — src/lib/profile-education.test.ts bu dosyanın metnini okuyup kilitler.
-- (update_profile_attribute bugün select değerini sunucuda doğrulamaz; enum belge +
-- sözleşme testi içindir. RPC gövdesine bu migration'da DOKUNULMADI.)
--
-- Not: afs_attributes'ta kullanılmayan eski bir `school` ("Okul") kaydı var
-- (0 rol kuralı, 0 değer — ölçüm 2026-09-25). Anlamı "şu an okuduğu okul" olabileceği
-- için yeniden kullanılmadı; ona dokunulmadı.
--
-- Idempotent: attribute'lar key üzerinden upsert, kurallar NOT EXISTS ile eklenir.
-- Geri alma: afs_attributes'ta iki key için is_active=false (kurallar kalabilir).

-- ── 1) Attribute tanımları ──────────────────────────────────────────────────
insert into public.afs_attributes (
  key, label, description, data_type, is_active, is_system, sort_order,
  storage_strategy, default_visibility, validation_schema
)
values
  (
    'education_level',
    'Öğrenim durumu',
    'En son tamamlanan öğrenim düzeyi. İsteğe bağlı; varsayılan gizli.',
    'select',
    true,
    false,
    55,
    'dynamic_value',
    'owner',
    jsonb_build_object(
      'enum', jsonb_build_array(
        'ilkogretim', 'ortaogretim', 'lise', 'on_lisans', 'lisans', 'yuksek_lisans', 'doktora'
      )
    )
  ),
  (
    'education_last_school',
    'Son bitirdiği üniversite/okul',
    'En son mezun olunan üniversite ya da okulun adı. İsteğe bağlı; varsayılan gizli.',
    'text',
    true,
    false,
    56,
    'dynamic_value',
    'owner',
    jsonb_build_object('maxLength', 200)
  )
on conflict (key) do update
set label = excluded.label,
    description = excluded.description,
    data_type = excluded.data_type,
    is_active = true,
    sort_order = excluded.sort_order,
    storage_strategy = excluded.storage_strategy,
    default_visibility = excluded.default_visibility,
    validation_schema = excluded.validation_schema,
    updated_at = now();

-- ── 2) Tüm aktif rollere kural: isteğe bağlı, gizli varsayılan, gizlenebilir ──
insert into public.role_attributes (
  role_id, attribute_id, is_enabled, is_required, is_public_default,
  user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order,
  is_public, owner_can_edit, admin_can_edit, visibility
)
select
  r.id, a.id, true, false, false,
  true, true, false,
  case a.key when 'education_level' then 55 else 56 end,
  false, true, true, 'private'
from public.roles r
cross join public.afs_attributes a
where a.key in ('education_level', 'education_last_school')
  and r.is_active = true
  and r.deleted_at is null
  and not exists (
    select 1 from public.role_attributes ra
    where ra.role_id = r.id and ra.attribute_id = a.id
  );

-- ── Doğrulama: sessiz eksik uygulama olmasın ────────────────────────────────
do $$
declare
  v_active_roles integer;
  v_level_rules integer;
  v_school_rules integer;
  v_wrong_rules integer;
begin
  select count(*) into v_active_roles
  from public.roles where is_active = true and deleted_at is null;

  select count(*) into v_level_rules
  from public.role_attributes ra
  join public.afs_attributes a on a.id = ra.attribute_id
  join public.roles r on r.id = ra.role_id
  where a.key = 'education_level' and r.is_active = true and r.deleted_at is null and ra.is_enabled;

  select count(*) into v_school_rules
  from public.role_attributes ra
  join public.afs_attributes a on a.id = ra.attribute_id
  join public.roles r on r.id = ra.role_id
  where a.key = 'education_last_school' and r.is_active = true and r.deleted_at is null and ra.is_enabled;

  if v_level_rules <> v_active_roles then
    raise exception 'education_level kuralı % aktif rolün yalnız %''inde var.', v_active_roles, v_level_rules;
  end if;

  if v_school_rules <> v_active_roles then
    raise exception 'education_last_school kuralı % aktif rolün yalnız %''inde var.', v_active_roles, v_school_rules;
  end if;

  -- Yeni kurallar gizlenebilir olmalı; aksi hâlde 'private' yazımı 42501 ile reddedilir.
  select count(*) into v_wrong_rules
  from public.role_attributes ra
  join public.afs_attributes a on a.id = ra.attribute_id
  where a.key in ('education_level', 'education_last_school')
    and (not ra.user_can_hide or not ra.user_can_edit);

  if v_wrong_rules <> 0 then
    raise exception 'öğrenim alanlarında % kural gizlenemez/düzenlenemez durumda.', v_wrong_rules;
  end if;
end
$$;
