begin;

alter table public.catalog_items
  add column if not exists platform_role_key text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'catalog_items_platform_role_key_fkey'
      and conrelid = 'public.catalog_items'::regclass
  ) then
    alter table public.catalog_items
      add constraint catalog_items_platform_role_key_fkey
      foreign key (platform_role_key)
      references public.roles(key)
      on update cascade
      on delete set null;
  end if;
end $$;

update public.catalog_items
set platform_role_key = attributes ->> 'platform_role_key'
where platform_role_key is null
  and attributes ? 'platform_role_key'
  and exists (
    select 1
    from public.roles r
    where r.key = public.catalog_items.attributes ->> 'platform_role_key'
  );

create index if not exists idx_catalog_items_platform_role_key
  on public.catalog_items (platform_role_key)
  where platform_role_key is not null;

commit;
