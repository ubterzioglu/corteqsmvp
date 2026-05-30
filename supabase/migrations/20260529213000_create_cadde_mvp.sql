create extension if not exists pgcrypto;

create or replace function public.is_admin_user(check_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = check_user_id
  );
$$;

create table if not exists public.cadde_countries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cadde_cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.cadde_countries(id) on delete cascade,
  name text not null,
  timezone text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (country_id, name)
);

create table if not exists public.cadde_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid references public.user_profiles(user_id) on delete set null,
  author_name_override text,
  author_role text,
  author_avatar_url text,
  content_mode text not null default 'real' check (content_mode in ('demo', 'real')),
  status text not null default 'published' check (status in ('draft', 'published', 'hidden')),
  post_type text not null default 'text' check (post_type in ('text', 'question', 'offer', 'event')),
  title text,
  body text not null,
  country_id uuid references public.cadde_countries(id) on delete set null,
  city_id uuid references public.cadde_cities(id) on delete set null,
  is_bridge boolean not null default false,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cadde_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.cadde_posts(id) on delete cascade,
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'support', 'idea')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction_type)
);

create table if not exists public.cadde_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.cadde_posts(id) on delete cascade,
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cadde_cafes (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid references public.user_profiles(user_id) on delete set null,
  host_name_override text,
  title text not null,
  summary text not null,
  country_id uuid references public.cadde_countries(id) on delete set null,
  city_id uuid references public.cadde_cities(id) on delete set null,
  content_mode text not null default 'real' check (content_mode in ('demo', 'real')),
  status text not null default 'published' check (status in ('draft', 'published', 'hidden')),
  is_bridge boolean not null default false,
  is_free boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '1 hour'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cadde_cafe_members (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cadde_cafes(id) on delete cascade,
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cafe_id, user_id)
);

create table if not exists public.cadde_billboard_cards (
  id uuid primary key default gen_random_uuid(),
  card_type text not null check (card_type in ('consultant', 'business', 'event')),
  title text not null,
  subtitle text,
  description text not null,
  badge_text text,
  cta_label text not null,
  cta_url text not null,
  image_url text,
  content_mode text not null default 'real' check (content_mode in ('demo', 'real')),
  status text not null default 'published' check (status in ('draft', 'published', 'hidden')),
  country_id uuid references public.cadde_countries(id) on delete set null,
  city_id uuid references public.cadde_cities(id) on delete set null,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cadde_sponsored_placements (
  id uuid primary key default gen_random_uuid(),
  placement_key text not null default 'feed-inline',
  title text not null,
  description text not null,
  badge_text text,
  cta_label text not null,
  cta_url text not null,
  image_url text,
  content_mode text not null default 'real' check (content_mode in ('demo', 'real')),
  status text not null default 'published' check (status in ('draft', 'published', 'hidden')),
  country_id uuid references public.cadde_countries(id) on delete set null,
  city_id uuid references public.cadde_cities(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cadde_posts_status_mode_created_idx
  on public.cadde_posts (status, content_mode, created_at desc);
create index if not exists cadde_posts_country_city_idx
  on public.cadde_posts (country_id, city_id);
create index if not exists cadde_posts_bridge_idx
  on public.cadde_posts (is_bridge);
create index if not exists cadde_reactions_post_idx
  on public.cadde_post_reactions (post_id);
create index if not exists cadde_comments_post_idx
  on public.cadde_post_comments (post_id, created_at desc);
create index if not exists cadde_cafes_mode_status_idx
  on public.cadde_cafes (content_mode, status, is_active, starts_at desc);
create index if not exists cadde_billboard_mode_status_idx
  on public.cadde_billboard_cards (content_mode, status, sort_order);
create index if not exists cadde_sponsored_mode_status_idx
  on public.cadde_sponsored_placements (content_mode, status, sort_order);

alter table public.cadde_countries enable row level security;
alter table public.cadde_cities enable row level security;
alter table public.cadde_posts enable row level security;
alter table public.cadde_post_reactions enable row level security;
alter table public.cadde_post_comments enable row level security;
alter table public.cadde_cafes enable row level security;
alter table public.cadde_cafe_members enable row level security;
alter table public.cadde_billboard_cards enable row level security;
alter table public.cadde_sponsored_placements enable row level security;

create policy "cadde countries public read"
on public.cadde_countries for select
using (is_active = true or public.is_admin_user(auth.uid()));

create policy "cadde countries admin write"
on public.cadde_countries for all
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

create policy "cadde cities public read"
on public.cadde_cities for select
using (is_active = true or public.is_admin_user(auth.uid()));

create policy "cadde cities admin write"
on public.cadde_cities for all
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

create policy "cadde posts public read"
on public.cadde_posts for select
using (status = 'published' or public.is_admin_user(auth.uid()));

create policy "cadde posts self insert"
on public.cadde_posts for insert
with check (
  auth.uid() is not null
  and content_mode = 'real'
  and author_user_id = auth.uid()
);

create policy "cadde posts self update"
on public.cadde_posts for update
using (author_user_id = auth.uid() or public.is_admin_user(auth.uid()))
with check (author_user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "cadde posts self delete"
on public.cadde_posts for delete
using (author_user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "cadde reactions public read"
on public.cadde_post_reactions for select
using (true);

create policy "cadde reactions self insert"
on public.cadde_post_reactions for insert
with check (auth.uid() is not null and user_id = auth.uid());

create policy "cadde reactions self delete"
on public.cadde_post_reactions for delete
using (user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "cadde comments public read"
on public.cadde_post_comments for select
using (true);

create policy "cadde comments self insert"
on public.cadde_post_comments for insert
with check (auth.uid() is not null and user_id = auth.uid());

create policy "cadde comments self update"
on public.cadde_post_comments for update
using (user_id = auth.uid() or public.is_admin_user(auth.uid()))
with check (user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "cadde comments self delete"
on public.cadde_post_comments for delete
using (user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "cadde cafes public read"
on public.cadde_cafes for select
using (status = 'published' or public.is_admin_user(auth.uid()));

create policy "cadde cafes self insert"
on public.cadde_cafes for insert
with check (
  auth.uid() is not null
  and content_mode = 'real'
  and host_user_id = auth.uid()
);

create policy "cadde cafes self update"
on public.cadde_cafes for update
using (host_user_id = auth.uid() or public.is_admin_user(auth.uid()))
with check (host_user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "cadde cafes self delete"
on public.cadde_cafes for delete
using (host_user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "cadde cafe members public read"
on public.cadde_cafe_members for select
using (true);

create policy "cadde cafe members self insert"
on public.cadde_cafe_members for insert
with check (auth.uid() is not null and user_id = auth.uid());

create policy "cadde cafe members self delete"
on public.cadde_cafe_members for delete
using (user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "cadde billboards public read"
on public.cadde_billboard_cards for select
using (status = 'published' or public.is_admin_user(auth.uid()));

create policy "cadde billboards admin write"
on public.cadde_billboard_cards for all
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

create policy "cadde sponsored public read"
on public.cadde_sponsored_placements for select
using (status = 'published' or public.is_admin_user(auth.uid()));

create policy "cadde sponsored admin write"
on public.cadde_sponsored_placements for all
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

insert into public.cadde_countries (code, name, sort_order)
values
  ('DE', 'Almanya', 10),
  ('NL', 'Hollanda', 20),
  ('GB', 'Birlesik Krallik', 30),
  ('US', 'Amerika Birlesik Devletleri', 40),
  ('TR', 'Turkiye', 50)
on conflict (code) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

insert into public.cadde_cities (country_id, name, timezone, sort_order)
select countries.id, seed.city_name, seed.timezone_name, seed.sort_order
from (
  values
    ('DE', 'Berlin', 'Europe/Berlin', 10),
    ('DE', 'Hamburg', 'Europe/Berlin', 20),
    ('NL', 'Amsterdam', 'Europe/Amsterdam', 30),
    ('GB', 'Londra', 'Europe/London', 40),
    ('US', 'New York', 'America/New_York', 50),
    ('TR', 'Istanbul', 'Europe/Istanbul', 60)
) as seed(country_code, city_name, timezone_name, sort_order)
join public.cadde_countries countries on countries.code = seed.country_code
on conflict (country_id, name) do update
set timezone = excluded.timezone,
    sort_order = excluded.sort_order;

insert into public.cadde_posts (
  content_mode,
  status,
  post_type,
  title,
  body,
  author_name_override,
  author_role,
  is_bridge,
  country_id,
  city_id,
  pinned
)
select
  'demo',
  'published',
  post_type,
  title,
  body,
  author_name,
  author_role,
  is_bridge,
  countries.id,
  cities.id,
  pinned
from (
  values
    ('question', 'Berlin''de yaz staji icin tech toplulugu arayan var mi?', '2 haftadir Berlin''deyim. Hem urun tarafinda hem de etkinliklerde dahil olabilecegim samimi bir cevre ariyorum.', 'Elif Demir', 'Yeni Tasinan', false, 'DE', 'Berlin', true),
    ('offer', 'Amsterdam''da ortak calisma bulusmasi', 'Persembe gunu saat 19:00''da merkezde serbest calisma + networking oturumu yapiyoruz. Urun, ihracat ve freelancer herkes gelebilir.', 'Mert Koca', 'Topluluk Lideri', false, 'NL', 'Amsterdam', false),
    ('event', 'Londra girisimci kahvesi acildi', 'Bu hafta sonu Londra''da yatirim, diaspora networku ve yeni pazar acilisi konularini konusacagiz.', 'Seda Yalcin', 'Kurucu', true, 'GB', 'Londra', false)
) as seed(post_type, title, body, author_name, author_role, is_bridge, country_code, city_name, pinned)
join public.cadde_countries countries on countries.code = seed.country_code
join public.cadde_cities cities on cities.country_id = countries.id and cities.name = seed.city_name
where not exists (
  select 1
  from public.cadde_posts existing
  where existing.content_mode = 'demo'
    and existing.title = seed.title
);

insert into public.cadde_cafes (
  content_mode,
  status,
  title,
  summary,
  host_name_override,
  country_id,
  city_id,
  is_bridge,
  is_free,
  starts_at,
  ends_at,
  is_active
)
select
  'demo',
  'published',
  title,
  summary,
  host_name,
  countries.id,
  cities.id,
  is_bridge,
  true,
  now(),
  now() + interval '3 hour',
  true
from (
  values
    ('Berlin Sabah Kahvesi', 'Yeni gelenler ve uzun suredir burada olanlar icin hizli tanisma odasi.', 'Ayse U.', 'DE', 'Berlin', false),
    ('TR-Kopru Mentor Cafe', 'Turkiye ile diaspora arasinda tasinma ve is baglantilari icin ortak oda.', 'Can E.', 'TR', 'Istanbul', true)
) as seed(title, summary, host_name, country_code, city_name, is_bridge)
join public.cadde_countries countries on countries.code = seed.country_code
join public.cadde_cities cities on cities.country_id = countries.id and cities.name = seed.city_name
where not exists (
  select 1
  from public.cadde_cafes existing
  where existing.content_mode = 'demo'
    and existing.title = seed.title
);

insert into public.cadde_billboard_cards (
  card_type,
  title,
  subtitle,
  description,
  badge_text,
  cta_label,
  cta_url,
  content_mode,
  status,
  country_id,
  city_id,
  is_featured,
  sort_order
)
select
  card_type,
  title,
  subtitle,
  description,
  badge_text,
  cta_label,
  cta_url,
  'demo',
  'published',
  countries.id,
  cities.id,
  is_featured,
  seed.sort_order
from (
  values
    ('consultant', 'Oturum ve Tasinma Danismani', 'Berlin', 'Yeni tasinanlar icin resmi surecler, oturum ve ilk 90 gun kontrol listesi.', 'Danisman', 'Gorusme Talep Et', '/directory?country=Almanya&city=Berlin', true, 10),
    ('business', 'Anadolu Taste Kitchen', 'Amsterdam', 'Hafta ici networking masasi ve topluluk kampanyalariyla isletmenizi one cikarın.', 'Business', 'Mekani Kesfet', '/commercial/community-leader', false, 20),
    ('event', 'Londra Diaspora Growth Night', 'Haziran 2026', 'Kurucular, icerik ureticileri ve topluluk liderleri icin aksiyon odakli bulusma.', 'Etkinlik', 'Etkinlige Git', '/anket', true, 30)
) as seed(card_type, title, subtitle, description, badge_text, cta_label, cta_url, is_featured, sort_order)
join public.cadde_countries countries on countries.code = case when seed.subtitle = 'Amsterdam' then 'NL' when seed.subtitle = 'Berlin' then 'DE' else 'GB' end
join public.cadde_cities cities on cities.country_id = countries.id and cities.name = seed.subtitle
where not exists (
  select 1
  from public.cadde_billboard_cards existing
  where existing.content_mode = 'demo'
    and existing.title = seed.title
);

insert into public.cadde_sponsored_placements (
  placement_key,
  title,
  description,
  badge_text,
  cta_label,
  cta_url,
  content_mode,
  status,
  sort_order
)
values (
  'feed-inline',
  'Sponsorlu Gorunum',
  'Danisman, etkinlik veya topluluk teklifinizi Cadde akisinda gorunur hale getirin.',
  'Sponsorlu',
  'Talep Birak',
  '/form',
  'demo',
  'published',
  10
)
on conflict do nothing;
