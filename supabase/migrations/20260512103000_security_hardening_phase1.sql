alter table public.submissions
  add column if not exists notification_sent_at timestamptz;

create table if not exists public.edge_rate_limits (
  scope text not null,
  client_key text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scope, client_key)
);

create or replace function public.set_edge_rate_limits_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_edge_rate_limits_updated_at on public.edge_rate_limits;
create trigger set_edge_rate_limits_updated_at
before update on public.edge_rate_limits
for each row
execute function public.set_edge_rate_limits_updated_at();

alter table public.edge_rate_limits enable row level security;

drop policy if exists "edge_rate_limits_service_role_only" on public.edge_rate_limits;
create policy "edge_rate_limits_service_role_only"
on public.edge_rate_limits
for all
to service_role
using (true)
with check (true);

update storage.buckets
set public = false
where id = 'submission-documents';

drop policy if exists "Anyone can read submission documents" on storage.objects;
drop policy if exists "Admins can read submission documents" on storage.objects;
create policy "Admins can read submission documents"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'submission-documents'
    and public.is_admin(auth.uid())
  );

drop policy if exists "Anyone can upload submission documents" on storage.objects;
drop policy if exists "Anyone can upload submission documents without overwrite" on storage.objects;
create policy "Anyone can upload submission documents without overwrite"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'submission-documents'
    and owner is null
  );

drop policy if exists "Admins can delete submission documents" on storage.objects;
create policy "Admins can delete submission documents"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'submission-documents'
    and public.is_admin(auth.uid())
  );

drop policy if exists "command_center_items_select_authenticated" on public.command_center_items;
drop policy if exists "command_center_items_write_authenticated" on public.command_center_items;
drop policy if exists "command_center_items_select_admin" on public.command_center_items;
drop policy if exists "command_center_items_write_admin" on public.command_center_items;

create policy "command_center_items_select_admin"
on public.command_center_items
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "command_center_items_write_admin"
on public.command_center_items
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "resource_entries_select_authenticated" on public.resource_entries;
drop policy if exists "resource_entries_write_authenticated" on public.resource_entries;
drop policy if exists "resource_entries_select_admin" on public.resource_entries;
drop policy if exists "resource_entries_write_admin" on public.resource_entries;

create policy "resource_entries_select_admin"
on public.resource_entries
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "resource_entries_write_admin"
on public.resource_entries
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "mvp_items_select_authenticated" on public.mvp_items;
drop policy if exists "mvp_items_write_authenticated" on public.mvp_items;
drop policy if exists "mvp_items_select_admin" on public.mvp_items;
drop policy if exists "mvp_items_write_admin" on public.mvp_items;

create policy "mvp_items_select_admin"
on public.mvp_items
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "mvp_items_write_admin"
on public.mvp_items
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "cv_files_authenticated_access" on storage.objects;
drop policy if exists "cv_files_admin_access" on storage.objects;
create policy "cv_files_admin_access"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'cv-files'
  and public.is_admin(auth.uid())
)
with check (
  bucket_id = 'cv-files'
  and public.is_admin(auth.uid())
);

drop policy if exists "arge_files_authenticated_access" on storage.objects;
drop policy if exists "arge_files_admin_access" on storage.objects;
create policy "arge_files_admin_access"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'arge-files'
  and public.is_admin(auth.uid())
)
with check (
  bucket_id = 'arge-files'
  and public.is_admin(auth.uid())
);

drop policy if exists "advisor_social_media_links_select_public" on public.advisor_social_media_links;
drop policy if exists "advisor_social_media_links_select_admin" on public.advisor_social_media_links;
create policy "advisor_social_media_links_select_admin"
  on public.advisor_social_media_links
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "consultant_social_media_links_select_public" on public.consultant_social_media_links;
drop policy if exists "consultant_social_media_links_select_admin" on public.consultant_social_media_links;
create policy "consultant_social_media_links_select_admin"
  on public.consultant_social_media_links
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "influencer_social_media_links_select_public" on public.influencer_social_media_links;
drop policy if exists "influencer_social_media_links_select_admin" on public.influencer_social_media_links;
create policy "influencer_social_media_links_select_admin"
  on public.influencer_social_media_links
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "contributor_social_media_links_select_public" on public.contributor_social_media_links;
drop policy if exists "contributor_social_media_links_select_admin" on public.contributor_social_media_links;
create policy "contributor_social_media_links_select_admin"
  on public.contributor_social_media_links
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Authenticated users can read matches" on public.matches;
drop policy if exists "Admins can read matches" on public.matches;
drop policy if exists "Admins can read matches" on public.matches;
create policy "Admins can read matches"
on public.matches
for select
to authenticated
using (public.is_admin(auth.uid()));

create index if not exists idx_edge_rate_limits_updated_at
  on public.edge_rate_limits(updated_at);
