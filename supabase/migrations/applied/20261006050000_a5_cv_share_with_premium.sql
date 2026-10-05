-- A5.2 · CV paylaşım anahtarı (sahibin rızasıyla Premium görüntüleme)
--
-- Kaynak: docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md §2.1
--
-- Doğru şema:
--   afs_attributes: attribute tanımları (id, key, label, storage_strategy, ...)
--   user_profile_attributes: kullanıcı değerleri (user_id, attribute_id FK, value_json)
--   role_attributes: rol kuralları (role_id, attribute_key, is_enabled, ...)
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
insert into public.role_attributes (role_id, attribute_key, is_enabled, is_required, visibility_default)
select r.id, 'cv_share_with_premium', true, false, 'private'
from public.roles r
where r.is_active = true
on conflict (role_id, attribute_key) do update set
  is_enabled = true,
  is_required = false,
  visibility_default = 'private',
  updated_at = now();

comment on table public.afs_attributes is
  'A5.2: cv_share_with_premium attribute''ü eklendi. Varsayılan kapalı (false).';

commit;
