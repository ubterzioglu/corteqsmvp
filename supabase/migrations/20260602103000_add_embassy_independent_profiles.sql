alter table public.independent_profiles
  drop constraint if exists independent_profiles_profile_kind_check;

alter table public.independent_profiles
  add constraint independent_profiles_profile_kind_check
  check (profile_kind in ('consulate', 'embassy'));

update public.independent_profiles
set
  profile_kind = 'embassy',
  type_label = 'Büyükelçilik',
  updated_at = now()
where profile_kind = 'consulate'
  and (
    coalesce(type_label, '') ilike '%büyükelçilik%'
    or coalesce(title, '') ilike '%büyükelçili%'
  );

with embassy_source as (
  select
    tm.slug as mission_slug,
    'tc-' || trim(both '-' from regexp_replace(
      lower(
        translate(
          coalesce(tm.city, '') || ' ' || coalesce(tm.mission_name, ''),
          'ÇĞİIÖŞÜçğıiöşü',
          'CGIIOSUcgiiosu'
        )
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    )) as profile_slug,
    'embassy'::text as profile_kind,
    'Büyükelçilik'::text as type_label,
    case
      when tm.mission_name ilike 'T.C.%' then tm.mission_name
      else 'T.C. ' || tm.mission_name
    end as title,
    'Resmi duyurular, vatandaşlık hizmetleri ve diplomatik temsil bilgileri'::text as subtitle,
    coalesce(nullif(tm.country, ''), 'Bilinmiyor') as country,
    coalesce(nullif(tm.city, ''), tm.country, 'Bilinmiyor') as city,
    concat_ws(
      ' ',
      case
        when tm.mission_name ilike 'T.C.%' then tm.mission_name
        else 'Türkiye Cumhuriyeti ' || tm.mission_name
      end,
      'resmi profil kaydıdır. Vatandaşlık hizmetleri, resmi duyurular ve diplomatik temsil bilgileri için referans noktası olarak kullanılabilir.'
    ) as description,
    tm.website_url,
    '🏛️'::text as logo_url,
    case
      when jsonb_typeof(tm.emails) = 'array' and jsonb_array_length(tm.emails) > 0 then tm.emails ->> 0
      else null
    end as contact_email,
    case
      when jsonb_typeof(tm.phones) = 'array' and jsonb_array_length(tm.phones) > 0 then tm.phones ->> 0
      else null
    end as contact_phone,
    tm.address as address_text,
    concat_ws(', ', tm.mission_name, tm.city, tm.country) as map_query,
    tm.working_hours,
    jsonb_build_array(
      jsonb_build_object('title', 'Vatandaşlık Hizmetleri', 'description', 'Kimlik, pasaport ve resmi kayıt süreçleri için temel yönlendirme noktası.'),
      jsonb_build_object('title', 'Resmi Duyurular', 'description', 'Çalışma saatleri, tatil günleri ve güncel resmi bilgilendirmeler.'),
      jsonb_build_object('title', 'Diplomatik Temsil', 'description', 'Türkiye Cumhuriyeti resmi temsil, koordinasyon ve yönlendirme hizmetleri.')
    ) as services_json,
    '[]'::jsonb as announcements_json,
    (
      case
        when tm.website_url is not null and btrim(tm.website_url) <> '' then
          jsonb_build_array(
            jsonb_build_object('label', 'Resmi Web Sitesi', 'url', tm.website_url, 'variant', 'default')
          )
        else '[]'::jsonb
      end
      ||
      case
        when tm.appointment_url is not null and btrim(tm.appointment_url) <> '' then
          jsonb_build_array(
            jsonb_build_object('label', 'Randevu', 'url', tm.appointment_url, 'variant', 'outline')
          )
        else '[]'::jsonb
      end
    ) as cta_json,
    true as is_published,
    1000 + row_number() over (order by coalesce(tm.country, ''), coalesce(tm.city, ''), tm.mission_name) as sort_order
  from public.turkish_missions tm
  where tm.mission_type = 'embassy'
)
insert into public.independent_profiles (
  slug,
  profile_kind,
  type_label,
  title,
  subtitle,
  country,
  city,
  description,
  website_url,
  logo_url,
  contact_email,
  contact_phone,
  address_text,
  map_query,
  working_hours,
  services_json,
  announcements_json,
  cta_json,
  is_published,
  sort_order
)
select
  profile_slug,
  profile_kind,
  type_label,
  title,
  subtitle,
  country,
  city,
  description,
  website_url,
  logo_url,
  contact_email,
  contact_phone,
  address_text,
  map_query,
  working_hours,
  services_json,
  announcements_json,
  cta_json,
  is_published,
  sort_order
from embassy_source
where profile_slug <> 'tc-'
on conflict (slug) do update
set
  profile_kind = excluded.profile_kind,
  type_label = excluded.type_label,
  title = excluded.title,
  subtitle = excluded.subtitle,
  country = excluded.country,
  city = excluded.city,
  description = excluded.description,
  website_url = excluded.website_url,
  logo_url = excluded.logo_url,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  address_text = excluded.address_text,
  map_query = excluded.map_query,
  working_hours = excluded.working_hours,
  services_json = excluded.services_json,
  cta_json = excluded.cta_json,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order,
  updated_at = now();
