create table if not exists public.interest_registrations (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'genel',
  name text,
  email text,
  phone text,
  country text,
  city text,
  role text,
  message text,
  referral_code text,
  source text,
  created_at timestamptz not null default now()
);

alter table public.interest_registrations enable row level security;

create policy "anyone can insert interest"
  on public.interest_registrations
  for insert
  to anon, authenticated
  with check (true);

create policy "admins can view interest"
  on public.interest_registrations
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "admins can update interest"
  on public.interest_registrations
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "admins can delete interest"
  on public.interest_registrations
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create index if not exists idx_interest_category on public.interest_registrations(category);
create index if not exists idx_interest_created on public.interest_registrations(created_at desc);