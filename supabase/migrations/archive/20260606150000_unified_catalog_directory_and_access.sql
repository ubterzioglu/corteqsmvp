begin;

alter table public.roles
  add column if not exists family_key text,
  add column if not exists parent_role_id uuid references public.roles(id) on delete restrict,
  add column if not exists is_assignable boolean not null default true,
  add column if not exists is_directory_visible boolean not null default true,
  add column if not exists default_item_type text,
  add column if not exists is_system boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_roles_family_key on public.roles(family_key);
create index if not exists idx_roles_parent_role_id on public.roles(parent_role_id);

update public.roles
set
  family_key = coalesce(
    family_key,
    nullif(split_part(key, '_', 1), '')
  ),
  default_item_type = coalesce(
    default_item_type,
    case
      when key = 'bireysel' or key = 'User_Bireysel' then 'member'
      when key like 'Consultant%' or key = 'danisman' then 'advisor'
      when key like 'Healthcare%' then 'advisor'
      when key like 'Business%' or key = 'isletme' then 'business'
      when key like 'Organization%' or key = 'kurulus-dernek' then 'organization'
      when key like 'Community%' then 'community_group'
      when key like 'Marketplace%' then 'marketplace_listing'
      when key like 'Job%' then 'job_posting'
      when key like 'Event%' then 'event'
      else default_item_type
    end
  );

create or replace function public.can_view_catalog_item(
  p_item_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.catalog_items ci
    where ci.id = p_item_id
      and (
        public.catalog_item_is_publicly_visible(ci.id)
        or (
          p_user_id is not null
          and ci.status = 'published'
          and ci.visibility in ('public', 'unlisted')
        )
        or public.catalog_user_can_edit_item(p_user_id, ci.id)
        or public.is_moderator(p_user_id)
      )
  );
$$;

create or replace function public.can_edit_catalog_item(
  p_item_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_moderator(p_user_id)
    or public.catalog_user_can_edit_item(p_user_id, p_item_id),
    false
  );
$$;

create or replace function public.can_manage_catalog_item_editors(
  p_item_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_moderator(p_user_id)
    or exists (
      select 1
      from public.catalog_item_memberships cim
      where cim.item_id = p_item_id
        and cim.user_id = p_user_id
        and cim.status = 'active'
        and cim.role in ('owner', 'manager')
    ),
    false
  );
$$;

create or replace function public.can_administer_catalog_item(
  p_item_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_moderator(p_user_id), false);
$$;

create or replace function public.get_my_editable_catalog_items()
returns table (
  item_id uuid,
  slug text,
  title text,
  item_type text,
  platform_role_key text,
  access_level text,
  is_primary_owner boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ci.id as item_id,
    ci.slug,
    ci.title,
    ci.item_type,
    ci.platform_role_key,
    cim.role as access_level,
    (cim.role = 'owner') as is_primary_owner,
    ci.created_at
  from public.catalog_item_memberships cim
  join public.catalog_items ci on ci.id = cim.item_id
  where cim.user_id = auth.uid()
    and cim.status = 'active'
    and cim.role in ('owner', 'manager', 'editor')
  order by
    case when cim.role = 'owner' then 0 when cim.role = 'manager' then 1 else 2 end,
    ci.created_at asc;
$$;

create or replace function public.search_directory_catalog(
  p_search_text text default null,
  p_role_key text default null,
  p_country_code text default null,
  p_city text default null,
  p_featured_only boolean default false
)
returns table (
  item_id uuid,
  item_type text,
  slug text,
  title text,
  role_key text,
  role_label text,
  description text,
  city text,
  country text,
  image_url text,
  special_label text,
  special_value text,
  is_featured boolean,
  is_verified boolean,
  is_claimable boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_search_text text := nullif(btrim(coalesce(p_search_text, '')), '');
  v_role_key text := nullif(btrim(coalesce(p_role_key, '')), '');
  v_country_code text := upper(nullif(btrim(coalesce(p_country_code, '')), ''));
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
  with primary_locations as (
    select distinct on (cil.item_id)
      cil.item_id,
      cil.city,
      cil.country_code
    from public.catalog_item_locations cil
    order by cil.item_id, cil.is_primary desc, cil.created_at asc
  ),
  primary_media as (
    select distinct on (cim.item_id)
      cim.item_id,
      coalesce(cim.thumbnail_url, cim.url) as image_url
    from public.catalog_item_media cim
    where cim.is_public = true
    order by cim.item_id, cim.is_primary desc, cim.created_at asc
  ),
  claim_status as (
    select
      ccr.item_id,
      bool_or(ccr.status = 'pending') as has_pending_claim
    from public.catalog_claim_requests ccr
    group by ccr.item_id
  )
  select
    ci.id as item_id,
    ci.item_type,
    ci.slug,
    ci.title,
    coalesce(ci.platform_role_key, r.key, ci.item_type) as role_key,
    coalesce(r.label, ci.platform_role_key, ci.item_type) as role_label,
    coalesce(ci.short_description, ci.headline, left(ci.long_description, 220)) as description,
    pl.city,
    pl.country_code as country,
    pm.image_url,
    case
      when coalesce(ci.attributes ->> 'specialty_summary', '') <> '' then 'Uzmanlık / Kategori'
      when coalesce(ci.headline, '') <> '' then 'Başlık'
      else null
    end as special_label,
    nullif(coalesce(ci.attributes ->> 'specialty_summary', ci.headline), '') as special_value,
    coalesce((ci.attributes ->> 'is_featured')::boolean, false) as is_featured,
    (ci.verification_status in ('verified', 'official_source', 'claimed')) as is_verified,
    (
      ci.verification_status <> 'claimed'
      and not coalesce(cs.has_pending_claim, false)
    ) as is_claimable
  from public.catalog_items ci
  left join public.roles r
    on r.key = ci.platform_role_key
  left join primary_locations pl
    on pl.item_id = ci.id
  left join primary_media pm
    on pm.item_id = ci.id
  left join claim_status cs
    on cs.item_id = ci.id
  where ci.status = 'published'
    and ci.visibility in ('public', 'unlisted')
    and coalesce(r.is_directory_visible, true)
    and (v_role_key is null or ci.platform_role_key = v_role_key)
    and (v_country_code is null or upper(coalesce(pl.country_code, '')) = v_country_code)
    and (v_city is null or lower(coalesce(pl.city, '')) = lower(v_city))
    and (
      not p_featured_only
      or coalesce((ci.attributes ->> 'is_featured')::boolean, false)
    )
    and (
      v_search_text is null
      or ci.title ilike '%' || v_search_text || '%'
      or coalesce(ci.headline, '') ilike '%' || v_search_text || '%'
      or coalesce(ci.short_description, '') ilike '%' || v_search_text || '%'
      or coalesce(ci.long_description, '') ilike '%' || v_search_text || '%'
      or coalesce(pl.city, '') ilike '%' || v_search_text || '%'
      or coalesce(pl.country_code, '') ilike '%' || v_search_text || '%'
      or coalesce(ci.platform_role_key, '') ilike '%' || v_search_text || '%'
    )
  order by
    coalesce((ci.attributes ->> 'is_featured')::boolean, false) desc,
    (ci.verification_status in ('verified', 'official_source', 'claimed')) desc,
    ci.updated_at desc,
    ci.title asc;
end;
$$;

create or replace function public.get_catalog_item_public_profile(
  p_slug text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_item public.catalog_items%rowtype;
  v_locations jsonb := '[]'::jsonb;
  v_contacts jsonb := '[]'::jsonb;
  v_services jsonb := '[]'::jsonb;
  v_languages jsonb := '[]'::jsonb;
  v_categories jsonb := '[]'::jsonb;
begin
  select *
  into v_item
  from public.catalog_items ci
  where ci.slug = p_slug
    and ci.status = 'published'
  limit 1;

  if v_item.id is null then
    return '{}'::jsonb;
  end if;

  if not public.can_view_catalog_item(v_item.id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'contact_type', cic.contact_type,
        'contact_value', cic.contact_value,
        'label', cic.label,
        'is_primary', cic.is_primary
      )
      order by cic.is_primary desc, cic.sort_order asc, cic.created_at asc
    ),
    '[]'::jsonb
  )
  into v_contacts
  from public.catalog_item_contacts cic
  where cic.item_id = v_item.id
    and cic.is_public = true;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'country_code', cil.country_code,
        'city', cil.city,
        'region', cil.region,
        'address_line', cil.address_line,
        'is_primary', cil.is_primary
      )
      order by cil.is_primary desc, cil.created_at asc
    ),
    '[]'::jsonb
  )
  into v_locations
  from public.catalog_item_locations cil
  where cil.item_id = v_item.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'service_name', cis.service_name,
        'description', cis.description
      )
      order by cis.sort_order asc, cis.created_at asc
    ),
    '[]'::jsonb
  )
  into v_services
  from public.catalog_item_services cis
  where cis.item_id = v_item.id
    and cis.is_public = true;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'language_code', cil.language_code,
        'proficiency', cil.proficiency
      )
      order by cil.is_primary desc, cil.created_at asc
    ),
    '[]'::jsonb
  )
  into v_languages
  from public.catalog_item_languages cil
  where cil.item_id = v_item.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'is_primary', cic.is_primary,
        'catalog_categories', jsonb_build_object(
          'slug', cc.slug,
          'name', cc.name
        )
      )
      order by cic.is_primary desc, cc.name asc
    ),
    '[]'::jsonb
  )
  into v_categories
  from public.catalog_item_categories cic
  join public.catalog_categories cc on cc.id = cic.category_id
  where cic.item_id = v_item.id;

  return jsonb_build_object(
    'id', v_item.id,
    'item_type', v_item.item_type,
    'platform_role_key', v_item.platform_role_key,
    'slug', v_item.slug,
    'title', v_item.title,
    'headline', v_item.headline,
    'short_description', v_item.short_description,
    'long_description', v_item.long_description,
    'verification_status', v_item.verification_status,
    'attributes', v_item.attributes,
    'catalog_item_contacts', v_contacts,
    'catalog_item_locations', v_locations,
    'catalog_item_services', v_services,
    'catalog_item_languages', v_languages,
    'catalog_item_categories', v_categories
  );
end;
$$;

create or replace function public.admin_list_catalog_profiles(
  p_query text default null,
  p_item_type text default null,
  p_role_key text default null,
  p_city text default null,
  p_country_code text default null,
  p_access_role text default null
)
returns table (
  item_id uuid,
  slug text,
  title text,
  item_type text,
  platform_role_key text,
  role_label text,
  status text,
  visibility text,
  verification_status text,
  primary_city text,
  primary_country_code text,
  owner_count bigint,
  editor_count bigint,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
  v_item_type text := nullif(btrim(coalesce(p_item_type, '')), '');
  v_role_key text := nullif(btrim(coalesce(p_role_key, '')), '');
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_country_code text := upper(nullif(btrim(coalesce(p_country_code, '')), ''));
  v_access_role text := nullif(btrim(coalesce(p_access_role, '')), '');
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with primary_locations as (
    select distinct on (cil.item_id)
      cil.item_id,
      cil.city,
      cil.country_code
    from public.catalog_item_locations cil
    order by cil.item_id, cil.is_primary desc, cil.created_at asc
  ),
  access_summary as (
    select
      cim.item_id,
      count(*) filter (where cim.status = 'active' and cim.role = 'owner') as owner_count,
      count(*) filter (where cim.status = 'active' and cim.role in ('manager', 'editor')) as editor_count
    from public.catalog_item_memberships cim
    group by cim.item_id
  )
  select
    ci.id as item_id,
    ci.slug,
    ci.title,
    ci.item_type,
    ci.platform_role_key,
    coalesce(r.label, ci.platform_role_key, ci.item_type) as role_label,
    ci.status,
    ci.visibility,
    ci.verification_status,
    pl.city as primary_city,
    pl.country_code as primary_country_code,
    coalesce(acc.owner_count, 0) as owner_count,
    coalesce(acc.editor_count, 0) as editor_count,
    ci.created_at
  from public.catalog_items ci
  left join public.roles r on r.key = ci.platform_role_key
  left join primary_locations pl on pl.item_id = ci.id
  left join access_summary acc on acc.item_id = ci.id
  where (v_item_type is null or ci.item_type = v_item_type)
    and (v_role_key is null or ci.platform_role_key = v_role_key)
    and (v_city is null or lower(coalesce(pl.city, '')) = lower(v_city))
    and (v_country_code is null or upper(coalesce(pl.country_code, '')) = v_country_code)
    and (
      v_access_role is null
      or exists (
        select 1
        from public.catalog_item_memberships cim
        where cim.item_id = ci.id
          and cim.status = 'active'
          and cim.role = v_access_role
      )
    )
    and (
      v_query is null
      or ci.title ilike '%' || v_query || '%'
      or ci.slug ilike '%' || v_query || '%'
      or coalesce(ci.platform_role_key, '') ilike '%' || v_query || '%'
    )
  order by ci.updated_at desc, ci.title asc;
end;
$$;

create or replace function public.admin_list_catalog_item_access(
  p_item_id uuid
)
returns table (
  user_id uuid,
  full_name text,
  email text,
  access_level text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cim.user_id,
    coalesce(p.full_name, p.display_name, split_part(coalesce(p.email, 'corteqs-user'), '@', 1)) as full_name,
    p.email,
    cim.role as access_level,
    cim.status,
    cim.created_at
  from public.catalog_item_memberships cim
  join public.profiles p on p.id = cim.user_id
  where public.is_moderator(auth.uid())
    and cim.item_id = p_item_id
  order by
    case when cim.role = 'owner' then 0 when cim.role = 'manager' then 1 when cim.role = 'editor' then 2 else 3 end,
    cim.created_at asc;
$$;

create or replace function public.admin_grant_catalog_item_access(
  p_item_id uuid,
  p_user_id uuid,
  p_access_level text,
  p_is_primary_owner boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_moderator(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_access_level not in ('owner', 'manager', 'editor', 'viewer') then
    raise exception 'invalid access level' using errcode = '22023';
  end if;

  insert into public.catalog_item_memberships (item_id, user_id, role, status)
  values (p_item_id, p_user_id, p_access_level, 'active')
  on conflict (item_id, user_id, role) do update
  set
    status = 'active',
    updated_at = now();

  if p_is_primary_owner and p_access_level = 'owner' then
    update public.catalog_items
    set linked_user_id = p_user_id,
        updated_at = now()
    where id = p_item_id;
  end if;

  perform public.write_admin_audit_log(
    'catalog_item.access_granted',
    p_user_id,
    'catalog_item',
    p_item_id,
    null,
    jsonb_build_object('access_level', p_access_level, 'is_primary_owner', p_is_primary_owner)
  );
end;
$$;

create or replace function public.admin_update_catalog_item_access(
  p_item_id uuid,
  p_user_id uuid,
  p_access_level text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_role text;
begin
  if auth.uid() is null or not public.is_moderator(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_access_level not in ('owner', 'manager', 'editor', 'viewer') then
    raise exception 'invalid access level' using errcode = '22023';
  end if;

  select cim.role
  into v_existing_role
  from public.catalog_item_memberships cim
  where cim.item_id = p_item_id
    and cim.user_id = p_user_id
    and cim.status = 'active'
  order by cim.created_at asc
  limit 1;

  if v_existing_role is null then
    raise exception 'access row not found' using errcode = 'P0002';
  end if;

  if v_existing_role = p_access_level then
    return;
  end if;

  update public.catalog_item_memberships
  set status = 'revoked',
      updated_at = now()
  where item_id = p_item_id
    and user_id = p_user_id
    and status = 'active';

  insert into public.catalog_item_memberships (item_id, user_id, role, status)
  values (p_item_id, p_user_id, p_access_level, 'active')
  on conflict (item_id, user_id, role) do update
  set
    status = 'active',
    updated_at = now();

  perform public.write_admin_audit_log(
    'catalog_item.access_updated',
    p_user_id,
    'catalog_item',
    p_item_id,
    null,
    jsonb_build_object('old_access_level', v_existing_role, 'new_access_level', p_access_level)
  );
end;
$$;

create or replace function public.admin_revoke_catalog_item_access(
  p_item_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_moderator(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.catalog_item_memberships
  set status = 'revoked',
      updated_at = now()
  where item_id = p_item_id
    and user_id = p_user_id
    and status = 'active';

  perform public.write_admin_audit_log(
    'catalog_item.access_revoked',
    p_user_id,
    'catalog_item',
    p_item_id,
    null,
    null
  );
end;
$$;

create or replace function public.admin_change_catalog_item_role(
  p_item_id uuid,
  p_role_key text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_role_key text;
  v_role public.roles%rowtype;
begin
  if auth.uid() is null or not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select ci.platform_role_key
  into v_current_role_key
  from public.catalog_items ci
  where ci.id = p_item_id
  limit 1;

  if v_current_role_key is null then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  select *
  into v_role
  from public.roles r
  where r.key = p_role_key
    and r.is_active = true
  limit 1;

  if v_role.id is null then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  if not v_role.is_assignable then
    raise exception 'role is not assignable' using errcode = '22023';
  end if;

  update public.catalog_items
  set
    platform_role_key = p_role_key,
    attributes = coalesce(attributes, '{}'::jsonb) || jsonb_build_object('platform_role_key', p_role_key),
    updated_at = now()
  where id = p_item_id;

  perform public.write_admin_audit_log(
    'catalog_item.role_changed',
    null,
    'catalog_item',
    p_item_id,
    null,
    jsonb_build_object(
      'old_role_key', v_current_role_key,
      'new_role_key', p_role_key,
      'reason', nullif(btrim(coalesce(p_reason, '')), '')
    )
  );

  return jsonb_build_object(
    'item_id', p_item_id,
    'old_role_key', v_current_role_key,
    'new_role_key', p_role_key
  );
end;
$$;

create or replace function public.admin_set_catalog_item_role(
  p_item_id uuid,
  p_role_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_change_catalog_item_role(p_item_id, p_role_key, null);
end;
$$;

revoke all on function public.can_view_catalog_item(uuid, uuid) from public;
revoke all on function public.can_edit_catalog_item(uuid, uuid) from public;
revoke all on function public.can_manage_catalog_item_editors(uuid, uuid) from public;
revoke all on function public.can_administer_catalog_item(uuid, uuid) from public;
revoke all on function public.get_my_editable_catalog_items() from public;
revoke all on function public.search_directory_catalog(text, text, text, text, boolean) from public;
revoke all on function public.get_catalog_item_public_profile(text) from public;
revoke all on function public.admin_list_catalog_profiles(text, text, text, text, text, text) from public;
revoke all on function public.admin_list_catalog_item_access(uuid) from public;
revoke all on function public.admin_grant_catalog_item_access(uuid, uuid, text, boolean) from public;
revoke all on function public.admin_update_catalog_item_access(uuid, uuid, text) from public;
revoke all on function public.admin_revoke_catalog_item_access(uuid, uuid) from public;
revoke all on function public.admin_change_catalog_item_role(uuid, text, text) from public;

grant execute on function public.can_view_catalog_item(uuid, uuid) to authenticated;
grant execute on function public.can_edit_catalog_item(uuid, uuid) to authenticated;
grant execute on function public.can_manage_catalog_item_editors(uuid, uuid) to authenticated;
grant execute on function public.can_administer_catalog_item(uuid, uuid) to authenticated;
grant execute on function public.get_my_editable_catalog_items() to authenticated;
grant execute on function public.search_directory_catalog(text, text, text, text, boolean) to authenticated;
grant execute on function public.get_catalog_item_public_profile(text) to authenticated;
grant execute on function public.admin_list_catalog_profiles(text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_list_catalog_item_access(uuid) to authenticated;
grant execute on function public.admin_grant_catalog_item_access(uuid, uuid, text, boolean) to authenticated;
grant execute on function public.admin_update_catalog_item_access(uuid, uuid, text) to authenticated;
grant execute on function public.admin_revoke_catalog_item_access(uuid, uuid) to authenticated;
grant execute on function public.admin_change_catalog_item_role(uuid, text, text) to authenticated;

commit;
