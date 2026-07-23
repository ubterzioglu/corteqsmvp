create table if not exists public.resource_entries (
  id uuid primary key default gen_random_uuid(),
  department text not null check (department in ('Genel', 'İnsan Kaynakları', 'ARGE')),
  record_kind text not null check (record_kind in ('Link', 'Dosya', 'CV')),
  added_by text not null default 'UBT' check (added_by in ('Şahin', 'UBT', 'Baran', 'Burak', 'Diğer')),
  title text not null,
  description text,
  url text,
  storage_bucket text,
  storage_path text,
  file_name text,
  person_first_name text,
  person_last_name text,
  person_role text,
  linkedin_url text,
  instagram_url text,
  website_url text,
  created_at timestamp with time zone not null default now(),
  constraint resource_entries_url_check check (url is null or url ~ '^https?://[^[:space:]]+$'),
  constraint resource_entries_linkedin_url_check check (linkedin_url is null or linkedin_url ~ '^https?://[^[:space:]]+$'),
  constraint resource_entries_instagram_url_check check (instagram_url is null or instagram_url ~ '^https?://[^[:space:]]+$'),
  constraint resource_entries_website_url_check check (website_url is null or website_url ~ '^https?://[^[:space:]]+$'),
  constraint resource_entries_storage_consistency_check check (
    (storage_bucket is null and storage_path is null and file_name is null)
    or
    (storage_bucket is not null and storage_path is not null and file_name is not null)
  )
);

alter table public.resource_entries enable row level security;

drop policy if exists "resource_entries_select_authenticated" on public.resource_entries;
create policy "resource_entries_select_authenticated"
on public.resource_entries
for select
to authenticated
using (true);

drop policy if exists "resource_entries_write_authenticated" on public.resource_entries;
create policy "resource_entries_write_authenticated"
on public.resource_entries
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
select 'cv-files', 'cv-files', false
where not exists (select 1 from storage.buckets where id = 'cv-files');

insert into storage.buckets (id, name, public)
select 'arge-files', 'arge-files', false
where not exists (select 1 from storage.buckets where id = 'arge-files');

drop policy if exists "cv_files_authenticated_access" on storage.objects;
create policy "cv_files_authenticated_access"
on storage.objects
for all
to authenticated
using (bucket_id = 'cv-files')
with check (bucket_id = 'cv-files');

drop policy if exists "arge_files_authenticated_access" on storage.objects;
create policy "arge_files_authenticated_access"
on storage.objects
for all
to authenticated
using (bucket_id = 'arge-files')
with check (bucket_id = 'arge-files');
