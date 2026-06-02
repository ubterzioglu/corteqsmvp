begin;

with mission_base as (
  select
    tm.slug as mission_slug,
    'tc-' ||
    trim(both '-' from regexp_replace(
      lower(
        translate(
          coalesce(tm.city, '') || ' ' ||
          case tm.mission_type
            when 'embassy' then 'buyukelcilik'
            when 'consulate_general' then 'baskonsolosluk'
            when 'consulate' then 'konsolosluk'
            when 'consular_office' then 'konsolosluk-ofisi'
            else 'buyukelcilik'
          end,
          'ÇĞİIÖŞÜçğıiöşü',
          'CGIIOSUcgiiosu'
        )
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    )) as profile_slug_base,
    'embassy'::text as profile_kind,
    coalesce(
      nullif(tm.contact_fields ->> 'directory_mission_type_label', ''),
      case tm.mission_type
        when 'embassy' then 'Büyükelçilik'
        when 'consulate_general' then 'Başkonsolosluk'
        when 'consulate' then 'Konsolosluk'
        when 'consular_office' then 'Konsolosluk Ofisi'
        else 'Büyükelçilik'
      end
    ) as type_label,
    case
      when tm.mission_name ilike 'T.C.%' then tm.mission_name
      else 'T.C. ' || tm.mission_name
    end as title,
    concat_ws(
      ' ',
      coalesce(
        nullif(tm.contact_fields ->> 'directory_mission_type_label', ''),
        case tm.mission_type
          when 'embassy' then 'Büyükelçilik'
          when 'consulate_general' then 'Başkonsolosluk'
          when 'consulate' then 'Konsolosluk'
          when 'consular_office' then 'Konsolosluk Ofisi'
          else 'Temsilcilik'
        end
      ),
      'resmi profil kaydı'
    ) as subtitle,
    coalesce(nullif(tm.country, ''), 'Bilinmiyor') as country,
    coalesce(nullif(tm.city, ''), tm.country, 'Bilinmiyor') as city,
    concat_ws(
      ' ',
      case
        when tm.mission_name ilike 'T.C.%' then tm.mission_name
        else 'Türkiye Cumhuriyeti ' || tm.mission_name
      end,
      'resmi profil kaydıdır. Vatandaşlık işlemleri, resmi duyurular, iletişim ve randevu yönlendirmeleri için kullanılabilir.'
    ) as description,
    tm.website_url,
    null::text as hero_image_url,
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
      jsonb_build_object('title', 'Vatandaşlık Hizmetleri', 'description', 'Kimlik, pasaport, noter ve kayıt işlemleri için temel yönlendirme noktası.'),
      jsonb_build_object('title', 'Resmi Duyurular', 'description', 'Çalışma saatleri, tatil günleri ve güncel resmi bilgilendirmeler.'),
      jsonb_build_object('title', 'İletişim ve Randevu', 'description', 'Resmi web sitesi, randevu sistemi ve iletişim kanalları tek profilde toplanır.')
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
    row_number() over (
      order by
        case tm.mission_type
          when 'embassy' then 1
          when 'consulate_general' then 2
          when 'consulate' then 3
          when 'consular_office' then 4
          else 5
        end,
        coalesce(tm.country, ''),
        coalesce(tm.city, ''),
        tm.mission_name
    ) as sort_order
  from public.turkish_missions tm
  where tm.mission_type in ('embassy', 'consulate_general', 'consulate', 'consular_office')
),
mission_profiles as (
  select
    mission_slug,
    case
      when row_number() over (partition by profile_slug_base order by mission_slug) = 1 then profile_slug_base
      else profile_slug_base || '-' || row_number() over (partition by profile_slug_base order by mission_slug)
    end as profile_slug,
    profile_kind,
    type_label,
    title,
    subtitle,
    country,
    city,
    description,
    website_url,
    hero_image_url,
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
  from mission_base
),
upserted as (
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
    hero_image_url,
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
    hero_image_url,
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
  from mission_profiles
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
    hero_image_url = excluded.hero_image_url,
    logo_url = excluded.logo_url,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone,
    address_text = excluded.address_text,
    map_query = excluded.map_query,
    working_hours = excluded.working_hours,
    services_json = excluded.services_json,
    announcements_json = excluded.announcements_json,
    cta_json = excluded.cta_json,
    is_published = excluded.is_published,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning slug
)
update public.independent_profiles ip
set
  profile_kind = 'embassy',
  updated_at = now()
where ip.slug in (select slug from upserted);

commit;
