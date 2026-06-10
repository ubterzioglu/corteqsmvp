-- Cadde 3.0 Faz 3 (2/3): D-04 — cadde_* geo referans bağlama + kontrollü genişletme.
-- cadde_countries/cities ile geo_countries/cities AYRI dünyalar olarak kalır
-- (mevcut FK'ler bozulmaz); bu migration yalnız:
--  1. cadde_* tablolarına nullable geo_* link kolonları ekler,
--  2. mevcut satırları code/name eşleşmesiyle backfill'ler,
--  3. admin'in geo kataloğundan cadde'ye ülke/şehir AKTARMASINI sağlayan
--     admin_import_cadde_geo_v1 RPC'sini ekler (toplu 77k şehir importu BİLİNÇLİ yok —
--     genişletme ülke + ad listesi bazlı ve admin kontrollüdür).
-- Not: geo_cities'te timezone yok; aktarılan şehirler 'UTC' default'u ile gelir,
-- admin panelden düzeltilebilir.

begin;

alter table public.cadde_countries
  add column if not exists geo_country_id uuid references public.geo_countries(id) on delete set null;

alter table public.cadde_cities
  add column if not exists geo_city_id uuid references public.geo_cities(id) on delete set null;

alter table public.cadde_cities alter column timezone set default 'UTC';

create unique index if not exists cadde_countries_geo_link_uidx
  on public.cadde_countries (geo_country_id) where geo_country_id is not null;
create unique index if not exists cadde_cities_geo_link_uidx
  on public.cadde_cities (geo_city_id) where geo_city_id is not null;

-- ── Backfill: önce code, sonra name eşleşmesi ───────────────────────────────
update public.cadde_countries cc
set geo_country_id = gc.id
from public.geo_countries gc
where cc.geo_country_id is null and gc.code = cc.code;

update public.cadde_countries cc
set geo_country_id = gc.id
from public.geo_countries gc
where cc.geo_country_id is null and lower(gc.name) = lower(cc.name);

update public.cadde_cities ci
set geo_city_id = gci.id
from public.cadde_countries cc
join public.geo_cities gci on gci.country_id = cc.geo_country_id
where ci.geo_city_id is null
  and ci.country_id = cc.id
  and lower(gci.name) = lower(ci.name);

-- ── Kontrollü genişletme RPC'si (yalnız admin) ──────────────────────────────
create or replace function public.admin_import_cadde_geo_v1(
  p_country_code text,
  p_city_names text[] default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_geo_country public.geo_countries%rowtype;
  v_country_id uuid;
  v_cities_added int := 0;
  v_cities_missing text[] := '{}';
  v_city text;
  v_geo_city_id uuid;
begin
  if v_uid is null or not public.is_admin_user(v_uid) then
    raise exception 'cadde_admin_required';
  end if;

  select * into v_geo_country
  from public.geo_countries
  where code = upper(trim(coalesce(p_country_code, ''))) and is_active = true;

  if v_geo_country.id is null then
    raise exception 'cadde_geo_country_not_found';
  end if;

  select id into v_country_id
  from public.cadde_countries
  where geo_country_id = v_geo_country.id or code = v_geo_country.code
  limit 1;

  if v_country_id is null then
    insert into public.cadde_countries (code, name, sort_order, is_active, geo_country_id)
    values (
      v_geo_country.code,
      v_geo_country.name,
      coalesce((select max(sort_order) + 10 from public.cadde_countries), 10),
      true,
      v_geo_country.id
    )
    returning id into v_country_id;
  else
    update public.cadde_countries
    set geo_country_id = coalesce(geo_country_id, v_geo_country.id), is_active = true
    where id = v_country_id;
  end if;

  foreach v_city in array coalesce(p_city_names, '{}') loop
    v_city := trim(v_city);
    if v_city = '' then continue; end if;

    select id into v_geo_city_id
    from public.geo_cities
    where country_id = v_geo_country.id and lower(name) = lower(v_city) and is_active = true
    limit 1;

    if v_geo_city_id is null then
      v_cities_missing := array_append(v_cities_missing, v_city);
      continue;
    end if;

    if not exists (
      select 1 from public.cadde_cities
      where country_id = v_country_id and (geo_city_id = v_geo_city_id or lower(name) = lower(v_city))
    ) then
      insert into public.cadde_cities (country_id, name, timezone, sort_order, is_active, geo_city_id)
      values (
        v_country_id,
        v_city,
        'UTC',
        coalesce((select max(sort_order) + 10 from public.cadde_cities where country_id = v_country_id), 10),
        true,
        v_geo_city_id
      );
      v_cities_added := v_cities_added + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'countryId', v_country_id,
    'countryCode', v_geo_country.code,
    'citiesAdded', v_cities_added,
    'citiesNotFound', to_jsonb(v_cities_missing)
  );
end;
$$;

revoke all on function public.admin_import_cadde_geo_v1(text, text[]) from public, anon;
grant execute on function public.admin_import_cadde_geo_v1(text, text[]) to authenticated;

commit;
