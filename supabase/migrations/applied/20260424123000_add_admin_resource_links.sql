-- Add shared admin-managed link tables used by the dashboard and landing admin.

create table if not exists public.social_media_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'Diğer',
  description text,
  link text,
  added_by text not null default 'UBT',
  created_at timestamp with time zone not null default now(),
  constraint social_media_links_platform_check
    check (platform in ('Instagram', 'LinkedIn', 'Twitter (X)', 'YouTube', 'TikTok', 'Facebook', 'Reddit', 'Discord', 'Diğer')),
  constraint social_media_links_added_by_check
    check (added_by in ('UBT', 'Burak', 'Diğer'))
);

create table if not exists public.advisor_social_media_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'Diğer',
  description text,
  link text,
  added_by text not null default 'UBT',
  created_at timestamp with time zone not null default now(),
  constraint advisor_social_media_links_platform_check
    check (platform in ('Instagram', 'LinkedIn', 'Twitter (X)', 'YouTube', 'TikTok', 'Facebook', 'Reddit', 'Discord', 'Diğer')),
  constraint advisor_social_media_links_added_by_check
    check (added_by in ('UBT', 'Burak', 'Diğer'))
);

alter table public.social_media_links enable row level security;
alter table public.advisor_social_media_links enable row level security;

drop policy if exists "Allow all" on public.social_media_links;
drop policy if exists "social_media_links_select_public" on public.social_media_links;
drop policy if exists "social_media_links_all_authenticated" on public.social_media_links;
drop policy if exists "social_media_links_insert_admin" on public.social_media_links;
drop policy if exists "social_media_links_update_admin" on public.social_media_links;
drop policy if exists "social_media_links_delete_admin" on public.social_media_links;

drop policy if exists "Allow all" on public.advisor_social_media_links;
drop policy if exists "advisor_social_media_links_select_public" on public.advisor_social_media_links;
drop policy if exists "advisor_social_media_links_all_authenticated" on public.advisor_social_media_links;
drop policy if exists "advisor_social_media_links_insert_admin" on public.advisor_social_media_links;
drop policy if exists "advisor_social_media_links_update_admin" on public.advisor_social_media_links;
drop policy if exists "advisor_social_media_links_delete_admin" on public.advisor_social_media_links;

create policy "social_media_links_select_public"
  on public.social_media_links
  for select
  to anon, authenticated
  using (true);

create policy "social_media_links_insert_admin"
  on public.social_media_links
  for insert
  to authenticated
  with check (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "social_media_links_update_admin"
  on public.social_media_links
  for update
  to authenticated
  using (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "social_media_links_delete_admin"
  on public.social_media_links
  for delete
  to authenticated
  using (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "advisor_social_media_links_select_public"
  on public.advisor_social_media_links
  for select
  to anon, authenticated
  using (true);

create policy "advisor_social_media_links_insert_admin"
  on public.advisor_social_media_links
  for insert
  to authenticated
  with check (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "advisor_social_media_links_update_admin"
  on public.advisor_social_media_links
  for update
  to authenticated
  using (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create policy "advisor_social_media_links_delete_admin"
  on public.advisor_social_media_links
  for delete
  to authenticated
  using (exists (select 1 from public.admin_users admin where admin.user_id = auth.uid()));

create index if not exists social_media_links_created_at_idx
  on public.social_media_links (created_at desc);

create index if not exists advisor_social_media_links_created_at_idx
  on public.advisor_social_media_links (created_at desc);
