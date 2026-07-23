alter table public.whatsapp_landings
  alter column user_id drop not null;

alter table public.whatsapp_join_requests
  alter column user_id drop not null;

alter table public.whatsapp_landings
  drop constraint if exists whatsapp_landings_category_check;

alter table public.whatsapp_landings
  add constraint whatsapp_landings_category_check
  check (category in ('alumni', 'hobi', 'is', 'doktor', 'yatirim', 'girisim', 'akademik', 'dayanisma', 'diger'));

drop policy if exists "Authenticated users can insert whatsapp landings" on public.whatsapp_landings;
create policy "Anyone can insert whatsapp landings"
  on public.whatsapp_landings
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Authenticated users can insert whatsapp join requests" on public.whatsapp_join_requests;
create policy "Anyone can insert whatsapp join requests"
  on public.whatsapp_join_requests
  for insert
  to anon, authenticated
  with check (true);

grant insert on public.whatsapp_landings to anon, authenticated;
grant insert on public.whatsapp_join_requests to anon, authenticated;

drop policy if exists "Authenticated users can upload whatsapp landing hero images" on storage.objects;
create policy "Anyone can upload whatsapp landing hero images"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'whatsapp-landing-hero');
