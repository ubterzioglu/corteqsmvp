-- A12 · İşletme ruhsatı / meslek lisansı yükleme alanı
--
-- CV/sunum deseni birebir: private bucket, yalnız sahip + admin erişir.
-- Migration: bucket + 8 politika + afs_attributes + role_attributes + feature.
--
-- Kaynak: docs/plans/2026-10-05-plan-8-urun-istegi.md A12

begin;

-- ── 1. Bucket: profile-license-files ─────────────────────────────────────────
-- 20MB sınır, pdf/jpg/png. CV ile aynı boyut sınırı.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-license-files',
  'profile-license-files',
  false,
  20971520, -- 20MB
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── 2. Storage politikaları (CV deseni) ──────────────────────────────────────
-- Sahip okur
drop policy if exists "profile_license_files_owner_read" on storage.objects;
create policy "profile_license_files_owner_read"
on storage.objects for select to authenticated
using (
  bucket_id = 'profile-license-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin okur
drop policy if exists "profile_license_files_admin_read" on storage.objects;
create policy "profile_license_files_admin_read"
on storage.objects for select to authenticated
using (
  bucket_id = 'profile-license-files'
  and public.is_admin(auth.uid())
);

-- Sahip yazar (insert)
drop policy if exists "profile_license_files_owner_insert" on storage.objects;
create policy "profile_license_files_owner_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-license-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Sahip günceller
drop policy if exists "profile_license_files_owner_update" on storage.objects;
create policy "profile_license_files_owner_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-license-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Sahip siler
drop policy if exists "profile_license_files_owner_delete" on storage.objects;
create policy "profile_license_files_owner_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-license-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin siler
drop policy if exists "profile_license_files_admin_delete" on storage.objects;
create policy "profile_license_files_admin_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-license-files'
  and public.is_admin(auth.uid())
);

-- ── 3. afs_attributes: business_license_doc ──────────────────────────────────
insert into public.afs_attributes (key, label, description, storage_strategy, data_type, is_active)
values (
  'business_license_doc',
  'İşletme Ruhsatı / Meslek Lisansı',
  'İşletme ruhsatı veya meslek lisansı belgesi (PDF, JPG, PNG). Yalnızca kullanıcı ve admin erişebilir.',
  'private_storage',
  'json',
  true
)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  storage_strategy = excluded.storage_strategy,
  data_type = excluded.data_type,
  is_active = excluded.is_active,
  updated_at = now();

-- ── 4. role_attributes: 78 aktif rol için kural ──────────────────────────────
-- CLAUDE.md profil formu md.1: kuralı olmayan alan sessizce çizilmez.
-- Tüm aktif rollere is_enabled=true ile eklenir.
insert into public.role_attributes
  (role_id, attribute_id, is_enabled, is_required, is_public_default, user_can_edit, user_can_hide)
select r.id, a.id, true, false, false, true, true
from public.roles r
cross join public.afs_attributes a
where r.is_active = true
  and a.key = 'business_license_doc'
  and not exists (
    select 1 from public.role_attributes ra
    where ra.role_id = r.id and ra.attribute_id = a.id
  );
-- ── 5. Feature: profile.license_upload ───────────────────────────────────────
-- A4'teki career yetkileri gibi, bu yetki de tüm aktif rollere is_enabled=true ile eklenir.
-- Kapalı bırakırsan herkese gizlenir.
insert into public.afs_features (key, label, description, scope_role, scope, feature_type, is_active_globally, sort_order)
values (
  'profile.license_upload',
  'Ruhsat/Lisans Yükleme',
  'Kullanıcı işletme ruhsatı veya meslek lisansı yükleyebilir',
  '*',
  'profile',
  'capability',
  true,
  150
)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  scope_role = excluded.scope_role,
  scope = excluded.scope,
  feature_type = excluded.feature_type,
  is_active_globally = excluded.is_active_globally,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Tüm aktif rollere AÇIK
insert into public.role_features (role_id, feature_key, is_enabled)
select r.id, 'profile.license_upload', true
from public.roles r
where r.is_active = true
on conflict (role_id, feature_key) do update
set is_enabled = true, updated_at = now();

-- ── 6. Yorumlar ──────────────────────────────────────────────────────────────
-- (storage.objects uzerine COMMENT kaldirildi: sahibi olmadigimiz iliski, canlida 42501)

commit;
