begin;

create or replace function public.catalog_sync_member_visibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid := coalesce(new.item_id, old.item_id);
  v_enabled boolean;
begin
  if coalesce(new.feature_key, old.feature_key) <> 'directory.visible' then
    return coalesce(new, old);
  end if;

  select coalesce(
    case
      when tg_op = 'DELETE' then null
      else new.is_enabled
    end,
    (
      select itfd.is_enabled
      from public.catalog_items ci
      join public.item_type_feature_defaults itfd
        on itfd.item_type = ci.item_type
       and itfd.feature_key = 'directory.visible'
      where ci.id = v_item_id
      limit 1
    ),
    false
  )
  into v_enabled;

  update public.catalog_items
  set
    visibility = case when v_enabled then 'public' else 'private' end,
    updated_at = now()
  where id = v_item_id
    and item_type = 'member';

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_catalog_sync_member_visibility on public.catalog_item_feature_overrides;
create trigger trg_catalog_sync_member_visibility
after insert or update or delete on public.catalog_item_feature_overrides
for each row execute function public.catalog_sync_member_visibility();

commit;
