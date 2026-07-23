begin;

-- ─── Aşama 1: attribute_catalog'a profiles kolonlarını ekle ──────────────────

insert into public.attribute_catalog (key, label, data_type, sort_order)
values
  ('avatar_url',           'Profil Fotoğrafı',      'url',      10),
  ('phone',                'Telefon',                'phone',    20),
  ('profession',           'Meslek',                 'text',     30),
  ('school',               'Okul',                   'text',     40),
  ('address',              'Adres',                  'textarea', 50),
  ('show_on_map',          'Haritada Göster',        'boolean',  60),
  ('cv_path',              'CV',                     'url',      70),
  ('cv_name',              'CV Adı',                 'text',     71),
  ('presentation_path',    'Sunum',                  'url',      80),
  ('presentation_name',    'Sunum Adı',              'text',     81),
  ('business_name',        'İşletme Adı',            'text',     90),
  ('business_sector',      'Sektör',                 'text',     91),
  ('business_website',     'İşletme Websitesi',      'url',      92),
  ('business_description', 'İşletme Açıklaması',    'textarea', 93),
  ('is_volunteer_mentor',  'Gönüllü Mentor',         'boolean', 100),
  ('mentor_topics',        'Mentor Konuları',        'text',    101),
  ('mentor_weekly_hours',  'Haftalık Mentor Saati',  'text',    102),
  ('is_verified',          'Doğrulanmış',            'boolean', 110),
  ('hiring_mode',          'Eleman Arıyor',          'boolean', 120),
  ('phone_verified',       'Telefon Doğrulandı',     'boolean', 130)
on conflict (key) do nothing;

-- ─── Aşama 2: profiles verisini user_profile_attributes'a backfill et ────────
-- profiles.id = auth.users.id = user_profiles.user_id

-- avatar_url
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.avatar_url, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'avatar_url'
where p.avatar_url is not null
on conflict (user_id, attribute_id) do nothing;

-- phone
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.phone, 'private'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'phone'
where p.phone is not null
on conflict (user_id, attribute_id) do nothing;

-- profession
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.profession, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'profession'
where p.profession is not null
on conflict (user_id, attribute_id) do nothing;

-- school
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.school, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'school'
where p.school is not null
on conflict (user_id, attribute_id) do nothing;

-- address
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.address, 'private'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'address'
where p.address is not null
on conflict (user_id, attribute_id) do nothing;

-- show_on_map (boolean → text)
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.show_on_map::text, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'show_on_map'
where p.show_on_map is not null
on conflict (user_id, attribute_id) do nothing;

-- cv_path
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.cv_path, 'private'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'cv_path'
where p.cv_path is not null
on conflict (user_id, attribute_id) do nothing;

-- cv_name
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.cv_name, 'private'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'cv_name'
where p.cv_name is not null
on conflict (user_id, attribute_id) do nothing;

-- presentation_path
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.presentation_path, 'private'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'presentation_path'
where p.presentation_path is not null
on conflict (user_id, attribute_id) do nothing;

-- presentation_name
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.presentation_name, 'private'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'presentation_name'
where p.presentation_name is not null
on conflict (user_id, attribute_id) do nothing;

-- business_name
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.business_name, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'business_name'
where p.business_name is not null
on conflict (user_id, attribute_id) do nothing;

-- business_sector
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.business_sector, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'business_sector'
where p.business_sector is not null
on conflict (user_id, attribute_id) do nothing;

-- business_website
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.business_website, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'business_website'
where p.business_website is not null
on conflict (user_id, attribute_id) do nothing;

-- business_description
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.business_description, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'business_description'
where p.business_description is not null
on conflict (user_id, attribute_id) do nothing;

-- is_volunteer_mentor
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.is_volunteer_mentor::text, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'is_volunteer_mentor'
where p.is_volunteer_mentor is not null
on conflict (user_id, attribute_id) do nothing;

-- mentor_topics
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.mentor_topics, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'mentor_topics'
where p.mentor_topics is not null
on conflict (user_id, attribute_id) do nothing;

-- mentor_weekly_hours
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.mentor_weekly_hours, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'mentor_weekly_hours'
where p.mentor_weekly_hours is not null
on conflict (user_id, attribute_id) do nothing;

-- is_verified
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.is_verified::text, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'is_verified'
where p.is_verified is not null
on conflict (user_id, attribute_id) do nothing;

-- hiring_mode
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.hiring_mode::text, 'public'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'hiring_mode'
where p.hiring_mode is not null
on conflict (user_id, attribute_id) do nothing;

-- phone_verified
insert into public.user_profile_attributes (user_id, attribute_id, value_text, visibility)
select up.user_id, ac.id, p.phone_verified::text, 'private'
from public.profiles p
join public.user_profiles up on up.user_id = p.id
join public.attribute_catalog ac on ac.key = 'phone_verified'
where p.phone_verified is not null
on conflict (user_id, attribute_id) do nothing;

-- ─── Aşama 3a: Admin rolü + admin_users → user_role_assignments ──────────────

insert into public.roles (key, label, description, sort_order)
values ('Admin_SuperAdmin', 'Süper Admin', 'Tam sistem erişimi olan yönetici rolü', 1)
on conflict (key) do nothing;

-- admin_users tablosundaki herkesi Admin_SuperAdmin rolüne ata
-- ON CONFLICT DO UPDATE: zaten başka bir rolü varsa Admin_SuperAdmin'e yükselt
insert into public.user_role_assignments (user_id, role_id, updated_by)
select au.user_id, r.id, null
from public.admin_users au
join public.roles r on r.key = 'Admin_SuperAdmin'
on conflict (user_id) do update
  set role_id   = excluded.role_id,
      updated_at = now();

-- ─── Aşama 3b: role_feature_defaults → role_feature_flags ───────────────────
-- Tüm role_feature_defaults verisini role_feature_flags'a taşı.
-- Sadece eşleşen bir rol olan satırlar aktarılır (82 rol zaten mevcut).

insert into public.role_feature_flags (role_id, feature_key, is_enabled, updated_by)
select r.id, rfd.feature_key, rfd.is_enabled, null
from public.role_feature_defaults rfd
join public.roles r on r.key = rfd.profile_type
on conflict (role_id, feature_key) do update
  set is_enabled  = excluded.is_enabled,
      updated_at  = now();

commit;
