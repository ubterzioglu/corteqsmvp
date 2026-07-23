-- Split advisor CRM records into dedicated Consultant, Influencer, and Contributor tables.

create table if not exists public.consultant_social_media_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'Diğer',
  description text,
  link text,
  added_by text not null default 'UBT',
  created_at timestamp with time zone not null default now(),
  name text not null default 'İsimsiz',
  email text,
  phone text,
  whatsapp text,
  instagram text,
  contacted_whatsapp boolean not null default false,
  contacted_instagram boolean not null default false,
  contacted_email boolean not null default false,
  contacted_phone boolean not null default false,
  constraint consultant_social_media_links_platform_check
    check (platform in ('Instagram', 'LinkedIn', 'Twitter (X)', 'YouTube', 'TikTok', 'Facebook', 'Reddit', 'Discord', 'Diğer')),
  constraint consultant_social_media_links_added_by_check
    check (added_by in ('UBT', 'Burak', 'Diğer'))
);

create table if not exists public.influencer_social_media_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'Diğer',
  description text,
  link text,
  added_by text not null default 'UBT',
  created_at timestamp with time zone not null default now(),
  name text not null default 'İsimsiz',
  email text,
  phone text,
  whatsapp text,
  instagram text,
  contacted_whatsapp boolean not null default false,
  contacted_instagram boolean not null default false,
  contacted_email boolean not null default false,
  contacted_phone boolean not null default false,
  constraint influencer_social_media_links_platform_check
    check (platform in ('Instagram', 'LinkedIn', 'Twitter (X)', 'YouTube', 'TikTok', 'Facebook', 'Reddit', 'Discord', 'Diğer')),
  constraint influencer_social_media_links_added_by_check
    check (added_by in ('UBT', 'Burak', 'Diğer'))
);

create table if not exists public.contributor_social_media_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'Diğer',
  description text,
  link text,
  added_by text not null default 'UBT',
  created_at timestamp with time zone not null default now(),
  name text not null default 'İsimsiz',
  email text,
  phone text,
  whatsapp text,
  instagram text,
  contacted_whatsapp boolean not null default false,
  contacted_instagram boolean not null default false,
  contacted_email boolean not null default false,
  contacted_phone boolean not null default false,
  constraint contributor_social_media_links_platform_check
    check (platform in ('Instagram', 'LinkedIn', 'Twitter (X)', 'YouTube', 'TikTok', 'Facebook', 'Reddit', 'Discord', 'Diğer')),
  constraint contributor_social_media_links_added_by_check
    check (added_by in ('UBT', 'Burak', 'Diğer'))
);

alter table public.consultant_social_media_links enable row level security;
alter table public.influencer_social_media_links enable row level security;
alter table public.contributor_social_media_links enable row level security;

drop policy if exists "consultant_social_media_links_select_public" on public.consultant_social_media_links;
drop policy if exists "consultant_social_media_links_insert_admin" on public.consultant_social_media_links;
drop policy if exists "consultant_social_media_links_update_admin" on public.consultant_social_media_links;
drop policy if exists "consultant_social_media_links_delete_admin" on public.consultant_social_media_links;

drop policy if exists "influencer_social_media_links_select_public" on public.influencer_social_media_links;
drop policy if exists "influencer_social_media_links_insert_admin" on public.influencer_social_media_links;
drop policy if exists "influencer_social_media_links_update_admin" on public.influencer_social_media_links;
drop policy if exists "influencer_social_media_links_delete_admin" on public.influencer_social_media_links;

drop policy if exists "contributor_social_media_links_select_public" on public.contributor_social_media_links;
drop policy if exists "contributor_social_media_links_insert_admin" on public.contributor_social_media_links;
drop policy if exists "contributor_social_media_links_update_admin" on public.contributor_social_media_links;
drop policy if exists "contributor_social_media_links_delete_admin" on public.contributor_social_media_links;

create policy "consultant_social_media_links_select_public"
  on public.consultant_social_media_links
  for select
  to anon, authenticated
  using (true);

create policy "consultant_social_media_links_insert_admin"
  on public.consultant_social_media_links
  for insert
  to authenticated
  with check (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "consultant_social_media_links_update_admin"
  on public.consultant_social_media_links
  for update
  to authenticated
  using (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "consultant_social_media_links_delete_admin"
  on public.consultant_social_media_links
  for delete
  to authenticated
  using (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "influencer_social_media_links_select_public"
  on public.influencer_social_media_links
  for select
  to anon, authenticated
  using (true);

create policy "influencer_social_media_links_insert_admin"
  on public.influencer_social_media_links
  for insert
  to authenticated
  with check (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "influencer_social_media_links_update_admin"
  on public.influencer_social_media_links
  for update
  to authenticated
  using (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "influencer_social_media_links_delete_admin"
  on public.influencer_social_media_links
  for delete
  to authenticated
  using (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "contributor_social_media_links_select_public"
  on public.contributor_social_media_links
  for select
  to anon, authenticated
  using (true);

create policy "contributor_social_media_links_insert_admin"
  on public.contributor_social_media_links
  for insert
  to authenticated
  with check (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "contributor_social_media_links_update_admin"
  on public.contributor_social_media_links
  for update
  to authenticated
  using (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "contributor_social_media_links_delete_admin"
  on public.contributor_social_media_links
  for delete
  to authenticated
  using (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create index if not exists consultant_social_media_links_created_at_idx
  on public.consultant_social_media_links (created_at desc);
create index if not exists consultant_social_media_links_name_idx
  on public.consultant_social_media_links (name);

create index if not exists influencer_social_media_links_created_at_idx
  on public.influencer_social_media_links (created_at desc);
create index if not exists influencer_social_media_links_name_idx
  on public.influencer_social_media_links (name);

create index if not exists contributor_social_media_links_created_at_idx
  on public.contributor_social_media_links (created_at desc);
create index if not exists contributor_social_media_links_name_idx
  on public.contributor_social_media_links (name);

insert into public.influencer_social_media_links (
  id,
  platform,
  description,
  link,
  added_by,
  created_at,
  name,
  email,
  phone,
  whatsapp,
  instagram,
  contacted_whatsapp,
  contacted_instagram,
  contacted_email,
  contacted_phone
)
select
  id,
  platform,
  description,
  link,
  added_by,
  created_at,
  name,
  email,
  phone,
  whatsapp,
  instagram,
  contacted_whatsapp,
  contacted_instagram,
  contacted_email,
  contacted_phone
from public.advisor_social_media_links
on conflict (id) do nothing;
