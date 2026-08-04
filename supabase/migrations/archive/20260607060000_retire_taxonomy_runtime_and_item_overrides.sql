begin;

comment on table public.taxonomy_groups is
'DEPRECATED: retired from active product flow. Keep temporarily for rollback and future label migration.';

comment on table public.taxonomy_options is
'DEPRECATED: retired from active product flow. Keep temporarily for rollback and future label migration.';

comment on table public.role_taxonomy_rules is
'DEPRECATED: retired from active product flow. Keep temporarily for rollback and future label migration.';

comment on table public.user_taxonomy_selections is
'DEPRECATED: retired from active product flow. Keep temporarily for rollback and future label migration.';

comment on table public.catalog_item_attribute_overrides is
'DEPRECATED: standard admin UI no longer uses item-level attribute overrides. Preserve temporarily for audit and rollback.';

comment on table public.catalog_item_feature_overrides is
'DEPRECATED: standard admin UI no longer uses item-level feature overrides. Preserve temporarily for audit and rollback.';

comment on table public.catalog_item_section_overrides is
'DEPRECATED: standard admin UI no longer uses item-level section overrides. Preserve temporarily for audit and rollback.';

do $$
declare
  v_taxonomy_groups bigint;
  v_taxonomy_options bigint;
  v_role_taxonomy_rules bigint;
  v_user_taxonomy_selections bigint;
  v_attr_overrides bigint;
  v_feature_overrides bigint;
  v_section_overrides bigint;
begin
  select count(*) into v_taxonomy_groups from public.taxonomy_groups;
  select count(*) into v_taxonomy_options from public.taxonomy_options;
  select count(*) into v_role_taxonomy_rules from public.role_taxonomy_rules;
  select count(*) into v_user_taxonomy_selections from public.user_taxonomy_selections;
  select count(*) into v_attr_overrides from public.catalog_item_attribute_overrides;
  select count(*) into v_feature_overrides from public.catalog_item_feature_overrides;
  select count(*) into v_section_overrides from public.catalog_item_section_overrides;

  raise notice 'taxonomy_groups=% taxonomy_options=% role_taxonomy_rules=% user_taxonomy_selections=%',
    v_taxonomy_groups, v_taxonomy_options, v_role_taxonomy_rules, v_user_taxonomy_selections;
  raise notice 'catalog_item_attribute_overrides=% catalog_item_feature_overrides=% catalog_item_section_overrides=%',
    v_attr_overrides, v_feature_overrides, v_section_overrides;
end;
$$;

create or replace function public.get_public_profile_sections(target_user_id uuid)
returns table (
  section_key text,
  section_area text,
  label text,
  component_name text,
  sort_order integer,
  content jsonb
)
language sql
security definer
set search_path = public
as $$
  with base_user as (
    select
      up.user_id,
      up.profile_type,
      coalesce(nullif(up.full_name, ''), 'CorteQS Üyesi') as display_name
    from public.user_profiles up
    where up.user_id = target_user_id
  ),
  feature_state as (
    select
      fc.key,
      coalesce(ufo.is_enabled, rff.is_enabled, rfd.is_enabled, false)
        and coalesce(fc.is_active_globally, false) as is_enabled
    from base_user bu
    join public.roles r on r.key = bu.profile_type
    join public.feature_catalog fc
      on fc.key in (
        'directory.visible',
        'profile.linkedin_card',
        'profile.website_card',
        'individual.job_seeking_badge',
        'individual.moving_soon_badge',
        'individual.volunteer_mentorship'
      )
    left join public.role_feature_flags rff
      on rff.role_id = r.id
     and rff.feature_key = fc.key
    left join public.role_feature_defaults rfd
      on rfd.profile_type = bu.profile_type
     and rfd.feature_key = fc.key
    left join public.user_feature_overrides ufo
      on ufo.user_id = bu.user_id
     and ufo.feature_key = fc.key
  ),
  visibility_gate as (
    select
      bu.user_id,
      coalesce(
        (select fs.is_enabled from feature_state fs where fs.key = 'directory.visible'),
        false
      ) as directory_visible
    from base_user bu
  ),
  role_meta as (
    select
      r.key,
      r.label
    from base_user bu
    join public.roles r on r.key = bu.profile_type
  ),
  public_attributes as (
    select
      ac.key,
      upa.value_text,
      upa.value_json
    from public.user_profile_attributes upa
    join public.attribute_catalog ac on ac.id = upa.attribute_id
    where upa.user_id = target_user_id
      and upa.visibility = 'public'
      and upa.approval_status = 'approved'
  ),
  extra_badges as (
    select coalesce(jsonb_agg(label order by sort_order), '[]'::jsonb) as labels
    from (
      select 10 as sort_order, 'İş Arıyorum' as label
      where exists (
        select 1
        from public_attributes pa
        where pa.key = 'job_seeking_opt_in'
          and pa.value_json = 'true'::jsonb
      )
        and coalesce((select fs.is_enabled from feature_state fs where fs.key = 'individual.job_seeking_badge'), false)

      union all

      select 20 as sort_order, 'Yakında Taşınacağım' as label
      where exists (
        select 1
        from public_attributes pa
        where pa.key = 'moving_soon_opt_in'
          and pa.value_json = 'true'::jsonb
      )
        and coalesce((select fs.is_enabled from feature_state fs where fs.key = 'individual.moving_soon_badge'), false)

      union all

      select 30 as sort_order, 'Gönüllü Mentör' as label
      where exists (
        select 1
        from public_attributes pa
        where pa.key = 'volunteer_mentorship_opt_in'
          and pa.value_json = 'true'::jsonb
      )
        and coalesce((select fs.is_enabled from feature_state fs where fs.key = 'individual.volunteer_mentorship'), false)
    ) badges
  ),
  public_links as (
    select 10 as sort_order, jsonb_build_object('label', 'Website', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'website_url'
      and coalesce((select fs.is_enabled from feature_state fs where fs.key = 'profile.website_card'), false)

    union all

    select 20 as sort_order, jsonb_build_object('label', 'LinkedIn', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'linkedin_url'
      and coalesce((select fs.is_enabled from feature_state fs where fs.key = 'profile.linkedin_card'), false)

    union all

    select 30 as sort_order, jsonb_build_object('label', 'Instagram', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'instagram_url'

    union all

    select 40 as sort_order, jsonb_build_object('label', 'Facebook', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'facebook_url'

    union all

    select 50 as sort_order, jsonb_build_object('label', 'YouTube', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'youtube_url'

    union all

    select 60 as sort_order, jsonb_build_object('label', 'TikTok', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'tiktok_url'

    union all

    select 70 as sort_order, jsonb_build_object('label', 'X (Twitter)', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'x_url'

    union all

    select 80 as sort_order, jsonb_build_object('label', 'Reddit', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'reddit_url'
  ),
  allowed_sections as (
    select
      psc.key,
      psc.section_area,
      psc.label,
      psc.component_name,
      coalesce(rpsr.sort_order, psc.sort_order) as sort_order
    from base_user bu
    join public.roles r on r.key = bu.profile_type
    join public.role_profile_section_rules rpsr on rpsr.role_id = r.id and rpsr.is_enabled = true
    join public.profile_section_catalog psc on psc.id = rpsr.section_id and psc.is_active = true
    where psc.key <> 'detail.taxonomy_etiketleri'
  )
  select
    s.key as section_key,
    s.section_area,
    s.label,
    s.component_name,
    s.sort_order,
    case s.key
      when 'preview.isim_kurulus_adi' then jsonb_build_object('text', (select display_name from base_user))
      when 'preview.konum' then jsonb_build_object(
        'city', (select value_text from public_attributes where key = 'city'),
        'country', (select value_text from public_attributes where key = 'country')
      )
      when 'preview.profil_logo_gorseli' then jsonb_build_object('url', (select value_text from public_attributes where key = 'profile_photo_url'))
      when 'preview.kategori_sektor_etiketi' then jsonb_build_object(
        'primary_label',
        coalesce(
          (select value_text from public_attributes where key in ('interests', 'expertise_area', 'business_category', 'organization_type', 'main_platform', 'ambassador_city') limit 1),
          (select label from role_meta limit 1)
        ),
        'extra_badges',
        coalesce((select labels from extra_badges), '[]'::jsonb)
      )
      when 'detail.hakkinda_bio' then jsonb_build_object('text', (select value_text from public_attributes where key = 'bio_short'))
      when 'detail.iletisim_linkleri' then jsonb_build_object(
        'links',
        coalesce((select jsonb_agg(pl.link order by pl.sort_order) from public_links pl), '[]'::jsonb)
      )
      else '{}'::jsonb
    end as content
  from allowed_sections s
  join visibility_gate vg on vg.directory_visible = true
  where (
      s.key = 'preview.isim_kurulus_adi'
      or (s.key = 'preview.konum' and exists (select 1 from public_attributes where key in ('city', 'country')))
      or (s.key = 'preview.profil_logo_gorseli' and exists (select 1 from public_attributes where key = 'profile_photo_url'))
      or (s.key = 'preview.kategori_sektor_etiketi' and (
        exists (select 1 from public_attributes where key in ('interests', 'expertise_area', 'business_category', 'organization_type', 'main_platform', 'ambassador_city'))
        or exists (select 1 from role_meta)
        or exists (select 1 from extra_badges eb, jsonb_array_elements_text(eb.labels) badge)
      ))
      or (s.key = 'detail.hakkinda_bio' and exists (select 1 from public_attributes where key = 'bio_short'))
      or (s.key = 'detail.iletisim_linkleri' and exists (select 1 from public_links))
    )
  order by s.sort_order, s.key;
$$;

create or replace function public.get_catalog_item_rules(p_item_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with item_role as (
    select
      ci.id as item_id,
      ci.platform_role_key,
      r.id as role_id
    from public.catalog_items ci
    left join public.roles r on r.key = ci.platform_role_key and r.is_active = true
    where ci.id = p_item_id
      and (
        public.catalog_item_is_publicly_visible(ci.id)
        or public.catalog_user_can_edit_item(auth.uid(), ci.id)
        or public.is_admin(auth.uid())
      )
  ),
  attribute_base as (
    select
      ac.key,
      ac.label,
      ac.data_type,
      case when rar.is_public_default then 'public' else 'private' end as visibility,
      rar.is_required,
      rar.sort_order as display_order
    from item_role ir
    join public.role_attribute_rules rar
      on rar.role_id = ir.role_id
     and rar.is_enabled = true
    join public.attribute_catalog ac
      on ac.id = rar.attribute_id
     and ac.is_active = true
  ),
  feature_base as (
    select
      fc.key,
      fc.label,
      rff.is_enabled,
      coalesce(fc.sort_order, 0) as sort_order
    from item_role ir
    join public.role_feature_flags rff
      on rff.role_id = ir.role_id
     and rff.is_enabled = true
    join public.feature_catalog fc
      on fc.key = rff.feature_key
     and fc.is_active_globally = true
  ),
  section_base as (
    select
      psc.key,
      psc.label,
      rpsr.is_enabled as is_visible,
      rpsr.sort_order as display_order
    from item_role ir
    join public.role_profile_section_rules rpsr
      on rpsr.role_id = ir.role_id
     and rpsr.is_enabled = true
    join public.profile_section_catalog psc
      on psc.id = rpsr.section_id
     and psc.is_active = true
  )
  select jsonb_build_object(
    'platformRoleKey', (select platform_role_key from item_role),
    'attributes', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'label', label,
            'dataType', data_type,
            'visibility', visibility,
            'isRequired', is_required,
            'displayOrder', display_order,
            'isOverride', false,
            'isEnabled', true
          )
          order by display_order, label
        )
        from attribute_base
      ),
      '[]'::jsonb
    ),
    'features', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'label', label,
            'isEnabled', is_enabled,
            'isOverride', false
          )
          order by sort_order, label
        )
        from feature_base
      ),
      '[]'::jsonb
    ),
    'sections', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'label', label,
            'isVisible', is_visible,
            'displayOrder', display_order,
            'isOverride', false
          )
          order by display_order, label
        )
        from section_base
      ),
      '[]'::jsonb
    ),
    'overrides', jsonb_build_object(
      'attributes', '[]'::jsonb,
      'features', '[]'::jsonb,
      'sections', '[]'::jsonb
    )
  )
  where exists (select 1 from item_role);
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
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if auth.uid() is null or not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_reason is null then
    raise exception 'reason is required' using errcode = '22023';
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
    'catalog_item.role_repaired',
    null,
    'catalog_item',
    p_item_id,
    jsonb_build_object('old_role_key', v_current_role_key),
    jsonb_build_object(
      'old_role_key', v_current_role_key,
      'new_role_key', p_role_key,
      'reason', v_reason
    )
  );

  return jsonb_build_object(
    'item_id', p_item_id,
    'old_role_key', v_current_role_key,
    'new_role_key', p_role_key
  );
end;
$$;

create or replace function public.admin_repair_catalog_item_role(
  p_item_id uuid,
  p_role_key text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.admin_change_catalog_item_role(p_item_id, p_role_key, p_reason);
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
  perform public.admin_change_catalog_item_role(
    p_item_id,
    p_role_key,
    'legacy wrapper: admin_set_catalog_item_role'
  );
end;
$$;

grant execute on function public.admin_repair_catalog_item_role(uuid, text, text) to authenticated;

commit;
