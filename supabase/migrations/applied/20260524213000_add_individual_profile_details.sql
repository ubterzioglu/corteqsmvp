begin;

create table if not exists public.individual_profile_details (
  user_id uuid primary key references public.user_profiles(user_id) on delete cascade,
  tagline text,
  status_text text,
  presence_status text not null default 'offline'
    check (presence_status in ('online', 'cadde', 'offline')),
  visibility_status text not null default 'locked'
    check (visibility_status in ('open', 'locked')),
  follower_count integer not null default 0,
  following_count integer not null default 0,
  event_count integer not null default 0,
  active_city text,
  active_country text,
  hometown text,
  phone_verified boolean not null default false,
  job_seeking boolean not null default false,
  mentor_opt_in boolean not null default false,
  front_card jsonb not null default '{}'::jsonb,
  detail_card jsonb not null default '{}'::jsonb,
  control_panel jsonb not null default '{}'::jsonb,
  profile_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_individual_profile_details_updated_at on public.individual_profile_details;
create trigger trg_individual_profile_details_updated_at
before update on public.individual_profile_details
for each row execute function public.set_updated_at();

alter table public.individual_profile_details enable row level security;

drop policy if exists "individual_profile_details_self_select" on public.individual_profile_details;
create policy "individual_profile_details_self_select"
on public.individual_profile_details
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "individual_profile_details_admin_select_all" on public.individual_profile_details;
create policy "individual_profile_details_admin_select_all"
on public.individual_profile_details
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "individual_profile_details_admin_update" on public.individual_profile_details;
create policy "individual_profile_details_admin_update"
on public.individual_profile_details
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

revoke all on public.individual_profile_details from authenticated;
grant select, update on public.individual_profile_details to authenticated;

with target_user as (
  select up.user_id, coalesce(up.full_name, split_part(up.email, '@', 1), 'CorteQS Üyesi') as full_name
  from public.user_profiles up
  where lower(coalesce(up.email, '')) = lower('firmascope@gmail.com')
  limit 1
)
insert into public.individual_profile_details (
  user_id,
  tagline,
  status_text,
  presence_status,
  visibility_status,
  follower_count,
  following_count,
  event_count,
  active_city,
  active_country,
  hometown,
  phone_verified,
  job_seeking,
  mentor_opt_in,
  front_card,
  detail_card,
  control_panel,
  profile_settings
)
select
  tu.user_id,
  'Londra''da Pazarlama Uzmanı',
  'Diaspora için iş birliği ve mentorluk fırsatlarına açığım.',
  'online',
  'open',
  128,
  64,
  12,
  'Londra',
  'Birleşik Krallık',
  'İzmir',
  true,
  true,
  true,
  jsonb_build_object(
    'profile_image_url', null,
    'passport_status', 'Yurt dışı telefon doğrulaması tamamlandı',
    'previous_cities', jsonb_build_array(
      jsonb_build_object('city', 'Berlin', 'period', '2021-2023'),
      jsonb_build_object('city', 'İstanbul', 'period', '2018-2021')
    ),
    'mini_event', jsonb_build_object('title', 'Londra Networking Buluşması', 'date', '2026-06-14'),
    'follow_request_state', 'connected',
    'follow_request_note', 'Takiptesin',
    'profile_preview_note', 'Ön izleme modunda'
  ),
  jsonb_build_object(
    'about_text', 'Pazarlama, topluluk büyütme ve diaspora bağlantıları üzerine çalışıyorum. Uluslararası ekiplerde proje yönetimi deneyimim var.',
    'interests', jsonb_build_array('Growth Marketing', 'Topluluk Yönetimi', 'Mentorluk'),
    'languages', jsonb_build_array('Türkçe', 'İngilizce', 'Almanca'),
    'lived_countries', jsonb_build_array(
      jsonb_build_object('country', 'Türkiye', 'period', '2010-2018'),
      jsonb_build_object('country', 'Almanya', 'period', '2018-2021'),
      jsonb_build_object('country', 'Birleşik Krallık', 'period', '2021-Devam')
    ),
    'service_requests', jsonb_build_array('Pazar araştırması desteği', 'Go-to-market danışmanlığı'),
    'events', jsonb_build_array('Londra Networking Buluşması', 'Diaspora İş Birliği Atölyesi'),
    'follows_preview', jsonb_build_array('CAL Community', 'CorteQS Radar'),
    'whatsapp_groups', jsonb_build_array('Londra Türk Profesyoneller', 'CorteQS Mentorluk'),
    'activities', jsonb_build_array('Yeni etkinliğe kayıt oldu', '2 yeni takipçi kazandı', 'Mentorluk talebini yanıtladı'),
    'cv_request_enabled', true,
    'wishlist_status', 'V2'
  ),
  jsonb_build_object(
    'panel_tagline', 'Bireysel Panelim',
    'panel_badges', jsonb_build_array('Ön İzleme Modu', 'İş Arıyorum'),
    'nav_actions', jsonb_build_array(
      'Hizmet Talepleri',
      'Hizmet Talepleri Yönetimi',
      'Taşınma Yönetimi',
      'Takvim',
      'Etkinlikler',
      'Kuponlar',
      'Takip',
      'Whatsapp Waadd.',
      'Bildirimler',
      'Mesaj Kutusu',
      'Profil Ayarları'
    ),
    'reminder', 'Panel kilitli görünüyorsa profil ayarlarınızı tamamlayın.',
    'location_summary', 'Londra, Birleşik Krallık'
  ),
  jsonb_build_object(
    'country', 'Birleşik Krallık',
    'city', 'Londra',
    'years_in_city', '5',
    'phone', '+44 7700 900123',
    'birth_date', '1992-04-18',
    'education', 'Yüksek Lisans',
    'institution', 'University of Westminster',
    'bio', 'Uluslararası pazarlama ve diaspora topluluk projeleri üzerine çalışıyorum.',
    'linkedin', 'https://www.linkedin.com/in/firmascope',
    'website_links', jsonb_build_array('https://corteqs.net'),
    'skills', jsonb_build_array('Growth', 'CRM', 'B2B'),
    'profile_steps', jsonb_build_array(
      jsonb_build_object('label', 'Telefon Doğrulama', 'completed', true),
      jsonb_build_object('label', 'Profil Fotoğrafı', 'completed', true),
      jsonb_build_object('label', 'Bio / Hakkında', 'completed', true),
      jsonb_build_object('label', 'İlgi Alanları', 'completed', true)
    )
  )
from target_user tu
on conflict (user_id) do update
set
  tagline = excluded.tagline,
  status_text = excluded.status_text,
  presence_status = excluded.presence_status,
  visibility_status = excluded.visibility_status,
  follower_count = excluded.follower_count,
  following_count = excluded.following_count,
  event_count = excluded.event_count,
  active_city = excluded.active_city,
  active_country = excluded.active_country,
  hometown = excluded.hometown,
  phone_verified = excluded.phone_verified,
  job_seeking = excluded.job_seeking,
  mentor_opt_in = excluded.mentor_opt_in,
  front_card = excluded.front_card,
  detail_card = excluded.detail_card,
  control_panel = excluded.control_panel,
  profile_settings = excluded.profile_settings,
  updated_at = now();

commit;
