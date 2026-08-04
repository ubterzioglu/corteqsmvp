alter table public.may19_campaign_submissions
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists file_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    '19051919_fikir',
    '19051919_fikir',
    false,
    5242880,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'video/mp4'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    '19051919_memory',
    '19051919_memory',
    false,
    15728640,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload may19 fikir files" on storage.objects;
create policy "Anyone can upload may19 fikir files"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = '19051919_fikir'
    and owner is null
  );

drop policy if exists "Anyone can upload may19 memory files" on storage.objects;
create policy "Anyone can upload may19 memory files"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = '19051919_memory'
    and owner is null
  );

drop policy if exists "Admins can read may19 fikir files" on storage.objects;
create policy "Admins can read may19 fikir files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = '19051919_fikir'
    and public.is_admin(auth.uid())
  );

drop policy if exists "Admins can read may19 memory files" on storage.objects;
create policy "Admins can read may19 memory files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = '19051919_memory'
    and public.is_admin(auth.uid())
  );

drop policy if exists "Admins can delete may19 fikir files" on storage.objects;
create policy "Admins can delete may19 fikir files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = '19051919_fikir'
    and public.is_admin(auth.uid())
  );

drop policy if exists "Admins can delete may19 memory files" on storage.objects;
create policy "Admins can delete may19 memory files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = '19051919_memory'
    and public.is_admin(auth.uid())
  );
