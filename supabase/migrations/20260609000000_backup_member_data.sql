begin;

-- Aşama 0: Tüm üye verisinin tam yedeği
-- 4 legacy tablo kaldırılmadan önce güvenlik ağı olarak saklanır.
-- Tablo prod'da kalıcı olarak tutulur, silinmez.

create table if not exists public._member_backup_20260609 as
select
  u.id                          as auth_user_id,
  u.email                       as auth_email,
  u.created_at                  as auth_created_at,
  u.raw_user_meta_data          as auth_meta,
  up.full_name,
  up.profile_type,
  up.auth_provider,
  p.avatar_url,
  p.phone,
  p.profession,
  p.school,
  p.address,
  p.show_on_map,
  p.cv_path,
  p.cv_name,
  p.presentation_path,
  p.presentation_name,
  p.business_name,
  p.business_sector,
  p.business_website,
  p.business_description,
  p.is_volunteer_mentor,
  p.mentor_topics,
  p.mentor_weekly_hours,
  p.is_verified,
  p.hiring_mode,
  p.phone_verified,
  p.platform_role,
  case when au.user_id is not null then true else false end as is_admin
from auth.users u
left join public.user_profiles up on up.user_id = u.id
left join public.profiles p on p.id = u.id
left join public.admin_users au on au.user_id = u.id;

-- Yedek tabloya RLS veya grant gerekmez; sadece service role erişimi yeterli.
-- Satır sayısı doğrulaması:
-- SELECT COUNT(*) FROM public._member_backup_20260609;

commit;
