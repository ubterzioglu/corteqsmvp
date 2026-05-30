alter table public.command_center_items
  add column if not exists archived_at timestamp with time zone;

create index if not exists idx_command_center_items_archived_at
  on public.command_center_items(archived_at);
