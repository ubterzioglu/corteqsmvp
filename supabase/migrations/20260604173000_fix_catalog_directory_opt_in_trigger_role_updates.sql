begin;

create or replace function public.catalog_sync_directory_opt_in_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_feature_key text;
begin
  v_user_id := coalesce(new.user_id, old.user_id);

  if tg_table_name = 'user_feature_overrides' then
    v_feature_key := coalesce(new.feature_key, old.feature_key);

    if v_feature_key <> 'directory.visible' then
      return coalesce(new, old);
    end if;
  end if;

  perform public.catalog_sync_profile_directory_opt_in(v_user_id);
  return coalesce(new, old);
end;
$$;

commit;
