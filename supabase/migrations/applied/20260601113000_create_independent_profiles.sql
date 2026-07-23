create table if not exists public.independent_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  profile_kind text not null check (profile_kind in ('consulate')),
  type_label text not null default 'Konsolosluk',
  title text not null,
  subtitle text,
  country text not null,
  city text not null,
  description text not null,
  website_url text,
  hero_image_url text,
  logo_url text,
  contact_email text,
  contact_phone text,
  address_text text,
  map_query text,
  working_hours text,
  services_json jsonb not null default '[]'::jsonb,
  announcements_json jsonb not null default '[]'::jsonb,
  cta_json jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint independent_profiles_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

alter table public.independent_profiles enable row level security;

drop policy if exists "Public can view published independent profiles" on public.independent_profiles;
create policy "Public can view published independent profiles"
on public.independent_profiles
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Admins can manage independent profiles" on public.independent_profiles;
create policy "Admins can manage independent profiles"
on public.independent_profiles
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  )
);

grant select on public.independent_profiles to anon, authenticated;
grant insert, update, delete on public.independent_profiles to authenticated;

drop trigger if exists update_independent_profiles_updated_at on public.independent_profiles;
create trigger update_independent_profiles_updated_at
before update on public.independent_profiles
for each row execute function public.update_updated_at_column();

create or replace function public.get_public_independent_profile(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.independent_profiles%rowtype;
begin
  select *
  into v_profile
  from public.independent_profiles
  where slug = p_slug
    and is_published = true
  limit 1;

  if v_profile.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_profile.id,
    'slug', v_profile.slug,
    'profile_kind', v_profile.profile_kind,
    'type_label', v_profile.type_label,
    'title', v_profile.title,
    'subtitle', v_profile.subtitle,
    'country', v_profile.country,
    'city', v_profile.city,
    'description', v_profile.description,
    'website_url', v_profile.website_url,
    'hero_image_url', v_profile.hero_image_url,
    'logo_url', v_profile.logo_url,
    'contact_email', v_profile.contact_email,
    'contact_phone', v_profile.contact_phone,
    'address_text', v_profile.address_text,
    'map_query', v_profile.map_query,
    'working_hours', v_profile.working_hours,
    'services_json', coalesce(v_profile.services_json, '[]'::jsonb),
    'announcements_json', coalesce(v_profile.announcements_json, '[]'::jsonb),
    'cta_json', coalesce(v_profile.cta_json, '[]'::jsonb),
    'is_published', v_profile.is_published,
    'sort_order', v_profile.sort_order,
    'created_at', v_profile.created_at,
    'updated_at', v_profile.updated_at
  );
end;
$$;

grant execute on function public.get_public_independent_profile(text) to anon, authenticated;

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
  address_text,
  map_query,
  working_hours,
  services_json,
  announcements_json,
  cta_json,
  is_published,
  sort_order
)
values
  (
    'tc-berlin-buyukelcilik',
    'consulate',
    'Büyükelçilik',
    'T.C. Berlin Büyükelçiliği',
    'Resmi işlemler, vatandaşlık hizmetleri ve duyurular',
    'Almanya',
    'Berlin',
    'Türkiye Cumhuriyeti Berlin Büyükelçiliği. Pasaport, noter, nüfus, seçim ve konsolosluk işlemleri için resmi başvuru noktası.',
    'https://berlin.be.mfa.gov.tr',
    '🇹🇷',
    'Tiergartenstrasse 19-21, 10785 Berlin',
    'T.C. Berlin Büyükelçiliği, Berlin, Almanya',
    'Hafta içi 09:00 - 17:00',
    jsonb_build_array(
      jsonb_build_object('title', 'Pasaport İşlemleri', 'description', 'Yeni başvuru, yenileme ve kayıp pasaport işlemleri'),
      jsonb_build_object('title', 'Noter ve Tasdik', 'description', 'Vekaletname, belge onayı ve imza tasdiki'),
      jsonb_build_object('title', 'Vatandaşlık ve Nüfus', 'description', 'Doğum, evlilik, adres ve nüfus kayıt işlemleri')
    ),
    jsonb_build_array(
      jsonb_build_object('title', '29 Ekim Cumhuriyet Bayramı Resepsiyonu', 'date', '2026-10-29', 'type', 'Resmi Davet', 'description', 'Berlin ve çevresindeki Türk topluluğuna yönelik resmi resepsiyon.'),
      jsonb_build_object('title', 'Seçim Duyurusu', 'date', '2026-06-10', 'type', 'Duyuru', 'description', 'Yurt dışı seçmen kayıt ve oy kullanma saatleri güncellendi.')
    ),
    jsonb_build_array(
      jsonb_build_object('label', 'Web Sitesi', 'url', 'https://berlin.be.mfa.gov.tr', 'variant', 'outline'),
      jsonb_build_object('label', 'Haritada Aç', 'url', 'https://www.google.com/maps/search/?api=1&query=T.C.%20Berlin%20Buyukelciligi%2C%20Berlin%2C%20Almanya', 'variant', 'outline')
    ),
    true,
    10
  ),
  (
    'tc-londra-baskonsolosluk',
    'consulate',
    'Konsolosluk',
    'T.C. Londra Başkonsolosluğu',
    'Pasaport, noter, nüfus ve konsolosluk randevu hizmetleri',
    'İngiltere',
    'Londra',
    'Türkiye Cumhuriyeti Londra Başkonsolosluğu. Pasaport, noter, askerlik, nüfus ve vatandaşlık işlemlerinde hizmet verir.',
    'https://londra.bk.mfa.gov.tr',
    '🇹🇷',
    'Rutland Lodge, Rutland Gardens, London',
    'T.C. Londra Başkonsolosluğu, Londra, İngiltere',
    'Hafta içi 09:00 - 16:30',
    jsonb_build_array(
      jsonb_build_object('title', 'Pasaport ve Kimlik', 'description', 'Kimlik yenileme ve pasaport başvuruları'),
      jsonb_build_object('title', 'Askerlik İşlemleri', 'description', 'Tecil ve dövizle askerlik işlemleri'),
      jsonb_build_object('title', 'Noter İşlemleri', 'description', 'Vekaletname ve resmi belge işlemleri')
    ),
    jsonb_build_array(
      jsonb_build_object('title', 'Konsolosluk Günleri', 'date', '2026-09-14', 'type', 'Hizmet', 'description', 'Gezici hizmet günleri için ön kayıt açıldı.'),
      jsonb_build_object('title', '23 Nisan Çocuk Etkinliği', 'date', '2027-04-23', 'type', 'Etkinlik', 'description', 'Aileler ve çocuklar için açık katılımlı bayram programı.')
    ),
    jsonb_build_array(
      jsonb_build_object('label', 'Web Sitesi', 'url', 'https://londra.bk.mfa.gov.tr', 'variant', 'outline'),
      jsonb_build_object('label', 'Haritada Aç', 'url', 'https://www.google.com/maps/search/?api=1&query=T.C.%20Londra%20Baskonsoloslugu%2C%20Londra%2C%20Ingiltere', 'variant', 'outline')
    ),
    true,
    20
  ),
  (
    'tc-washington-buyukelcilik',
    'consulate',
    'Büyükelçilik',
    'T.C. Washington Büyükelçiliği',
    'Diplomatik temsil, resmi duyurular ve vatandaş hizmetleri',
    'ABD',
    'Washington',
    'Türkiye Cumhuriyeti Washington Büyükelçiliği. Diplomatik temsil, vatandaş işlemleri ve resmi bilgilendirme hizmetleri sunar.',
    'https://washington.emb.mfa.gov.tr',
    '🇹🇷',
    '2525 Massachusetts Ave NW, Washington, DC',
    'T.C. Washington Büyükelçiliği, Washington, ABD',
    'Hafta içi 09:00 - 17:00',
    jsonb_build_array(
      jsonb_build_object('title', 'Vatandaşlık Hizmetleri', 'description', 'Kimlik, kayıt ve resmi belge süreçleri'),
      jsonb_build_object('title', 'Diplomatik Bilgilendirme', 'description', 'Resmi duyurular ve kamu bilgilendirmeleri'),
      jsonb_build_object('title', 'Seçim İşlemleri', 'description', 'Yurt dışı seçmen kayıt ve bilgilendirme')
    ),
    jsonb_build_array(
      jsonb_build_object('title', 'Resmi Basın Duyurusu', 'date', '2026-07-05', 'type', 'Duyuru', 'description', 'Yeni resmi tatil çalışma saatleri yayınlandı.')
    ),
    jsonb_build_array(
      jsonb_build_object('label', 'Web Sitesi', 'url', 'https://washington.emb.mfa.gov.tr', 'variant', 'outline'),
      jsonb_build_object('label', 'Haritada Aç', 'url', 'https://www.google.com/maps/search/?api=1&query=T.C.%20Washington%20Buyukelciligi%2C%20Washington%2C%20ABD', 'variant', 'outline')
    ),
    true,
    30
  ),
  (
    'tc-dubai-baskonsolosluk',
    'consulate',
    'Konsolosluk',
    'T.C. Dubai Başkonsolosluğu',
    'Konsolosluk ve ticari temsil hizmetleri',
    'BAE',
    'Dubai',
    'Türkiye Cumhuriyeti Dubai Başkonsolosluğu. Konsolosluk işlemleri, resmi başvurular ve ticaret ofisi koordinasyonu sağlar.',
    'https://dubai.bk.mfa.gov.tr',
    '🇹🇷',
    'World Trade Center Residence, Dubai',
    'T.C. Dubai Başkonsolosluğu, Dubai, BAE',
    'Hafta içi 09:00 - 16:00',
    jsonb_build_array(
      jsonb_build_object('title', 'Pasaport ve Kimlik', 'description', 'Başvuru, yenileme ve teslim süreçleri'),
      jsonb_build_object('title', 'Noter İşlemleri', 'description', 'Belge tasdiki, vekaletname ve onay süreçleri'),
      jsonb_build_object('title', 'Ticaret Ofisi İletişimi', 'description', 'Resmi yönlendirme ve kurum bağlantıları')
    ),
    jsonb_build_array(
      jsonb_build_object('title', 'Bayramlaşma Programı', 'date', '2026-06-18', 'type', 'Etkinlik', 'description', 'Dubai Türk topluluğuna açık bayramlaşma programı.')
    ),
    jsonb_build_array(
      jsonb_build_object('label', 'Web Sitesi', 'url', 'https://dubai.bk.mfa.gov.tr', 'variant', 'outline'),
      jsonb_build_object('label', 'Haritada Aç', 'url', 'https://www.google.com/maps/search/?api=1&query=T.C.%20Dubai%20Baskonsoloslugu%2C%20Dubai%2C%20BAE', 'variant', 'outline')
    ),
    true,
    40
  )
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
  address_text = excluded.address_text,
  map_query = excluded.map_query,
  working_hours = excluded.working_hours,
  services_json = excluded.services_json,
  announcements_json = excluded.announcements_json,
  cta_json = excluded.cta_json,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order,
  updated_at = now();
