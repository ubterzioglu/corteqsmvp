begin;

with bireysel_users as (
  select
    up.user_id,
    coalesce(nullif(trim(up.full_name), ''), split_part(coalesce(up.email, ''), '@', 1), 'CorteQS Uyesi') as display_name,
    coalesce(up.email, '') as email
  from public.user_profiles up
  where up.profile_type = 'bireysel'
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
  bu.user_id,
  'CorteQS diaspora uyesi',
  'Profilini tamamlayarak toplulukta daha gorunur olabilirsin.',
  'offline',
  'locked',
  0,
  0,
  0,
  null,
  null,
  null,
  false,
  false,
  false,
  jsonb_build_object(
    'profile_image_url', null,
    'passport_status', 'Dogrulama bilgisi eklenmedi',
    'previous_cities', jsonb_build_array(),
    'mini_event', null,
    'follow_request_state', 'locked',
    'follow_request_note', 'Profil baglantisi beklemede',
    'profile_preview_note', 'On izleme modu',
    'world_message', '',
    'corteqs_passport', false,
    'linkedin_url', null,
    'linkedin_visible', true,
    'cv_doc', null,
    'presentation_doc', null,
    'birthday_days', null,
    'gift_acceptance', false
  ),
  jsonb_build_object(
    'about_text', '',
    'interests', jsonb_build_array(),
    'languages', jsonb_build_array(),
    'lived_countries', jsonb_build_array(),
    'service_requests', jsonb_build_array(),
    'events', jsonb_build_array(),
    'follows_preview', jsonb_build_array(),
    'whatsapp_groups', jsonb_build_array(),
    'activities', jsonb_build_array(),
    'recent_events', jsonb_build_array(),
    'countries_lived', jsonb_build_array(),
    'relocation', jsonb_build_object('enabled', false, 'country', null, 'city', null),
    'cv_request_enabled', false,
    'wishlist_status', 'V2'
  ),
  jsonb_build_object(
    'panel_tagline', 'Bireysel Panelim',
    'panel_badges', jsonb_build_array(),
    'nav_actions', jsonb_build_array(
      'Hizmet Talepleri',
      'Etkinlikler',
      'Takip',
      'WhatsApp',
      'Mesaj Kutusu',
      'Profil Ayarlari'
    ),
    'reminder', 'Profil alanlarini tamamlayarak panel kilidini kaldirabilirsin.',
    'location_summary', '-'
  ),
  jsonb_build_object(
    'country', null,
    'city', null,
    'years_in_city', null,
    'phone', null,
    'birth_date', null,
    'education', null,
    'school', null,
    'institution', null,
    'bio', null,
    'linkedin', null,
    'website_links', jsonb_build_array(),
    'websites', jsonb_build_array(),
    'skills', jsonb_build_array(),
    'profile_visible', true,
    'job_seeking', false,
    'profile_steps', jsonb_build_array(
      jsonb_build_object('label', 'Telefon Dogrulama', 'completed', false),
      jsonb_build_object('label', 'Profil Fotografi', 'completed', false),
      jsonb_build_object('label', 'Bio / Hakkinda', 'completed', false),
      jsonb_build_object('label', 'Ilgi Alanlari', 'completed', false)
    )
  )
from bireysel_users bu
on conflict (user_id) do nothing;

with defaults as (
  select
    jsonb_build_object(
      'profile_image_url', null,
      'passport_status', 'Dogrulama bilgisi eklenmedi',
      'previous_cities', jsonb_build_array(),
      'mini_event', null,
      'follow_request_state', 'locked',
      'follow_request_note', 'Profil baglantisi beklemede',
      'profile_preview_note', 'On izleme modu',
      'world_message', '',
      'corteqs_passport', false,
      'linkedin_url', null,
      'linkedin_visible', true,
      'cv_doc', null,
      'presentation_doc', null,
      'birthday_days', null,
      'gift_acceptance', false
    ) as front_default,
    jsonb_build_object(
      'about_text', '',
      'interests', jsonb_build_array(),
      'languages', jsonb_build_array(),
      'lived_countries', jsonb_build_array(),
      'service_requests', jsonb_build_array(),
      'events', jsonb_build_array(),
      'follows_preview', jsonb_build_array(),
      'whatsapp_groups', jsonb_build_array(),
      'activities', jsonb_build_array(),
      'recent_events', jsonb_build_array(),
      'countries_lived', jsonb_build_array(),
      'relocation', jsonb_build_object('enabled', false, 'country', null, 'city', null),
      'cv_request_enabled', false,
      'wishlist_status', 'V2'
    ) as detail_default,
    jsonb_build_object(
      'panel_tagline', 'Bireysel Panelim',
      'panel_badges', jsonb_build_array(),
      'nav_actions', jsonb_build_array(
        'Hizmet Talepleri',
        'Etkinlikler',
        'Takip',
        'WhatsApp',
        'Mesaj Kutusu',
        'Profil Ayarlari'
      ),
      'reminder', 'Profil alanlarini tamamlayarak panel kilidini kaldirabilirsin.',
      'location_summary', '-'
    ) as control_default,
    jsonb_build_object(
      'country', null,
      'city', null,
      'years_in_city', null,
      'phone', null,
      'birth_date', null,
      'education', null,
      'school', null,
      'institution', null,
      'bio', null,
      'linkedin', null,
      'website_links', jsonb_build_array(),
      'websites', jsonb_build_array(),
      'skills', jsonb_build_array(),
      'profile_visible', true,
      'job_seeking', false,
      'profile_steps', jsonb_build_array(
        jsonb_build_object('label', 'Telefon Dogrulama', 'completed', false),
        jsonb_build_object('label', 'Profil Fotografi', 'completed', false),
        jsonb_build_object('label', 'Bio / Hakkinda', 'completed', false),
        jsonb_build_object('label', 'Ilgi Alanlari', 'completed', false)
      )
    ) as settings_default
)
update public.individual_profile_details ipd
set
  front_card = d.front_default || coalesce(ipd.front_card, '{}'::jsonb),
  detail_card = d.detail_default || coalesce(ipd.detail_card, '{}'::jsonb),
  control_panel = d.control_default || coalesce(ipd.control_panel, '{}'::jsonb),
  profile_settings = d.settings_default || coalesce(ipd.profile_settings, '{}'::jsonb),
  tagline = coalesce(nullif(ipd.tagline, ''), 'CorteQS diaspora uyesi'),
  status_text = coalesce(nullif(ipd.status_text, ''), 'Profilini tamamlayarak toplulukta daha gorunur olabilirsin.'),
  updated_at = now()
from public.user_profiles up
cross join defaults d
where up.user_id = ipd.user_id
  and up.profile_type = 'bireysel';

commit;
