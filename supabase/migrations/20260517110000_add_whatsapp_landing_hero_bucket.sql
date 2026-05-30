insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'whatsapp-landing-hero',
  'whatsapp-landing-hero',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where not exists (
  select 1
  from storage.buckets
  where id = 'whatsapp-landing-hero'
);

drop policy if exists "Public can read whatsapp landing hero images" on storage.objects;
create policy "Public can read whatsapp landing hero images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'whatsapp-landing-hero');

drop policy if exists "Authenticated users can upload whatsapp landing hero images" on storage.objects;
create policy "Authenticated users can upload whatsapp landing hero images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'whatsapp-landing-hero'
    and owner = auth.uid()
  );

drop policy if exists "Owners can update whatsapp landing hero images" on storage.objects;
create policy "Owners can update whatsapp landing hero images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'whatsapp-landing-hero'
    and owner = auth.uid()
  )
  with check (
    bucket_id = 'whatsapp-landing-hero'
    and owner = auth.uid()
  );

drop policy if exists "Owners can delete whatsapp landing hero images" on storage.objects;
create policy "Owners can delete whatsapp landing hero images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'whatsapp-landing-hero'
    and owner = auth.uid()
  );
