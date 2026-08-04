drop policy if exists "Anyone can upload may19 fikir files" on storage.objects;
create policy "Anyone can upload may19 fikir files"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = '19051919_fikir'
  );

drop policy if exists "Anyone can upload may19 memory files" on storage.objects;
create policy "Anyone can upload may19 memory files"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = '19051919_memory'
  );
