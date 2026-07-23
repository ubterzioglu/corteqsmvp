begin;

create extension if not exists postgis;

alter table public.catalog_item_locations
  add column if not exists geo geography(Point, 4326);

create or replace function public.catalog_sync_location_geo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.geo := geography(st_setsrid(st_makepoint(new.longitude::double precision, new.latitude::double precision), 4326));
  else
    new.geo := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_catalog_item_locations_geo on public.catalog_item_locations;
create trigger trg_catalog_item_locations_geo
before insert or update of latitude, longitude on public.catalog_item_locations
for each row execute function public.catalog_sync_location_geo();

update public.catalog_item_locations
set
  geo = geography(st_setsrid(st_makepoint(longitude::double precision, latitude::double precision), 4326))
where latitude is not null
  and longitude is not null
  and geo is null;

create index if not exists idx_catalog_item_locations_geo
  on public.catalog_item_locations
  using gist (geo);

comment on column public.catalog_item_locations.geo is
  'Optional PostGIS geography point for radius and nearest-neighbor geo queries.';

commit;
