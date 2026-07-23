create table if not exists public.mvp_items (
  id uuid primary key default gen_random_uuid(),
  konu text not null,
  sub text,
  ayrinti text,
  mvp_level text not null default 'Atanmadi' check (mvp_level in ('MVP1', 'MVP2', 'MVP3', 'Atanmadi')),
  added_by text not null default 'All' check (added_by in ('UBT', 'Burak', 'Diğer', 'All')),
  is_seed boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create or replace function public.set_mvp_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_mvp_items_updated_at on public.mvp_items;
create trigger set_mvp_items_updated_at
before update on public.mvp_items
for each row
execute function public.set_mvp_items_updated_at();

alter table public.mvp_items enable row level security;

drop policy if exists "mvp_items_select_authenticated" on public.mvp_items;
create policy "mvp_items_select_authenticated"
on public.mvp_items
for select
to authenticated
using (true);

drop policy if exists "mvp_items_write_authenticated" on public.mvp_items;
create policy "mvp_items_write_authenticated"
on public.mvp_items
for all
to authenticated
using (true)
with check (true);
