-- A5.2 · CV paylaşım anahtarı (sahibin rızasıyla Premium görüntüleme)
--
-- Kaynak: docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md §2.1
--
-- Doğru şema:
--   afs_attributes: attribute tanımları (id, key, label, storage_strategy, ...)
--   user_profile_attributes: kullanıcı değerleri (user_id, attribute_id FK, value_json)
--   role_attributes: rol kuralları (role_id, attribute_id FK -> afs_attributes, is_enabled, ...)
--
-- Bu migration:
--   1. afs_attributes'a cv_share_with_premium ekle (boolean, private_storage)
--   2. Tüm aktif roller için role_attributes kuralı ekle (is_enabled=true)
--   3. Varsayılan değer YOK (her kullanıcı için ayrı satır açılır)

begin;

-- 1. afs_attributes: cv_share_with_premium
insert into public.afs_attributes (key, label, description, storage_strategy, data_type, is_active)
values (
  'cv_share_with_premium',
  'CV''mi Premium üyeler görebilsin',
  'Kullanıcı CV''sini Premium üyelerle paylaşmayı kabul eder (varsayılan kapalı).',
  'private_storage',
  'boolean',
  true
)
on conflict (key) do update set
  label = excluded.label,
  description = excluded.description,
  storage_strategy = excluded.storage_strategy,
  data_type = excluded.data_type,
  is_active = excluded.is_active,
  updated_at = now();

-- 2. role_attributes: tüm aktif roller için kural
-- CLAUDE.md profil formu md.1: kuralı olmayan alan sessizce çizilmez.
-- Tüm aktif rollere is_enabled=true ile eklenir.
insert into public.role_attributes
  (role_id, attribute_id, is_enabled, is_required, is_public_default, user_can_edit, user_can_hide)
select r.id, a.id, true, false, false, true, true
from public.roles r
cross join public.afs_attributes a
where r.is_active = true
  and a.key = 'cv_share_with_premium'
  and not exists (
    select 1 from public.role_attributes ra
    where ra.role_id = r.id and ra.attribute_id = a.id
  );
comment on table public.afs_attributes is
  'A5.2: cv_share_with_premium attribute''ü eklendi. Varsayılan kapalı (false).';

commit;
