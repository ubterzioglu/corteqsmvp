begin;

alter table public.resource_entries
  add column if not exists is_hidden boolean not null default false;

create index if not exists idx_resource_entries_is_hidden
  on public.resource_entries (is_hidden);

update public.resource_entries
set is_hidden = false
where is_hidden is null;

commit;
