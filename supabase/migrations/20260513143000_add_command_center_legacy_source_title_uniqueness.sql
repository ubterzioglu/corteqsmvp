with ranked_duplicates as (
  select
    id,
    legacy_source_title,
    row_number() over (
      partition by legacy_source_title
      order by created_at asc nulls last, id asc
    ) as duplicate_rank
  from public.command_center_items
  where legacy_source_title is not null
)
update public.command_center_items as items
set
  deleted_at = coalesce(items.deleted_at, now()),
  legacy_source_title = items.legacy_source_title || '::deduped::' || items.id::text,
  updated_at = now()
from ranked_duplicates
where items.id = ranked_duplicates.id
  and ranked_duplicates.duplicate_rank > 1;

create unique index if not exists idx_command_center_items_legacy_source_title_unique
  on public.command_center_items(legacy_source_title);
