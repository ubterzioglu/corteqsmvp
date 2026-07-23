create table if not exists public.command_center_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('todo', 'meeting_note')),
  title text not null,
  detail text not null,
  category_label text not null default '',
  assignee text not null default 'Atanmadi' check (assignee in ('Atanmadi', 'UBT', 'Burak')),
  status text not null default 'Baslanmadi' check (status in ('Baslanmadi', 'Beklemede', 'Devam ediyor', 'Tamamlandi')),
  priority integer not null default 5 check (priority between 1 and 10),
  due_date date,
  urgent boolean not null default false,
  legacy_source_type text,
  legacy_source_code text,
  legacy_source_date_label text,
  legacy_source_category text,
  legacy_source_title text,
  sort_order integer not null default 0,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.command_center_items
  add column if not exists priority integer,
  add column if not exists deleted_at timestamp with time zone,
  add column if not exists legacy_source_type text,
  add column if not exists legacy_source_code text,
  add column if not exists legacy_source_date_label text,
  add column if not exists legacy_source_category text,
  add column if not exists legacy_source_title text,
  add column if not exists sort_order integer,
  add column if not exists urgent boolean,
  add column if not exists due_date date,
  add column if not exists created_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone;

update public.command_center_items
set
  priority = coalesce(priority, 5),
  sort_order = coalesce(sort_order, 0),
  urgent = coalesce(urgent, false),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.command_center_items
  alter column priority set default 5,
  alter column sort_order set default 0,
  alter column urgent set default false,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.command_center_items
  alter column priority set not null,
  alter column sort_order set not null,
  alter column urgent set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'command_center_items_priority_check'
      and conrelid = 'public.command_center_items'::regclass
  ) then
    alter table public.command_center_items
      add constraint command_center_items_priority_check
      check (priority between 1 and 10);
  end if;
end
$$;

create or replace function public.set_command_center_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_command_center_items_updated_at on public.command_center_items;
create trigger set_command_center_items_updated_at
before update on public.command_center_items
for each row
execute function public.set_command_center_items_updated_at();

alter table public.command_center_items enable row level security;

drop policy if exists "command_center_items_select_authenticated" on public.command_center_items;
create policy "command_center_items_select_authenticated"
on public.command_center_items
for select
to authenticated
using (true);

drop policy if exists "command_center_items_write_authenticated" on public.command_center_items;
create policy "command_center_items_write_authenticated"
on public.command_center_items
for all
to authenticated
using (true)
with check (true);

create index if not exists idx_command_center_items_deleted_at on public.command_center_items(deleted_at);
create index if not exists idx_command_center_items_type on public.command_center_items(item_type);
create index if not exists idx_command_center_items_priority on public.command_center_items(priority desc);
