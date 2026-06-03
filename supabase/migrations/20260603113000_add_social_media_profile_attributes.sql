begin;

insert into public.attribute_catalog (key, label, description, data_type, is_active, is_system, sort_order)
values
  ('instagram_url', 'Instagram', 'Public Instagram profil veya hesap linki', 'url', true, false, 171),
  ('facebook_url', 'Facebook', 'Public Facebook sayfa veya profil linki', 'url', true, false, 172),
  ('youtube_url', 'YouTube', 'Public YouTube kanal veya video linki', 'url', true, false, 173),
  ('tiktok_url', 'TikTok', 'Public TikTok profil linki', 'url', true, false, 174),
  ('x_url', 'X (Twitter)', 'Public X veya Twitter profil linki', 'url', true, false, 175),
  ('reddit_url', 'Reddit', 'Public Reddit profil veya subreddit linki', 'url', true, false, 176)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  data_type = excluded.data_type,
  is_active = excluded.is_active,
  is_system = excluded.is_system,
  sort_order = excluded.sort_order,
  updated_at = now();

update public.profile_section_catalog
set
  description = 'Public website ve sosyal medya linkleri',
  metadata = jsonb_build_object(
    'attribute_keys',
    jsonb_build_array(
      'website_url',
      'linkedin_url',
      'instagram_url',
      'facebook_url',
      'youtube_url',
      'tiktok_url',
      'x_url',
      'reddit_url'
    )
  ),
  updated_at = now()
where key = 'detail.iletisim_linkleri';

insert into public.role_attribute_rules (
  role_id,
  attribute_id,
  is_enabled,
  is_required,
  is_public_default,
  user_can_edit,
  user_can_hide,
  requires_admin_approval_on_change,
  sort_order
)
select
  r.id,
  ac.id,
  true,
  false,
  true,
  true,
  true,
  false,
  ac.sort_order
from public.roles r
join public.attribute_catalog ac
  on ac.key in (
    'linkedin_url',
    'instagram_url',
    'facebook_url',
    'youtube_url',
    'tiktok_url',
    'x_url',
    'reddit_url'
  )
where r.key in (
  'bireysel',
  'danisman',
  'isletme',
  'kurulus-dernek',
  'blogger-vlogger-youtuber',
  'sehir-elcisi'
)
on conflict (role_id, attribute_id) do update
set
  is_enabled = true,
  is_required = false,
  is_public_default = true,
  user_can_edit = true,
  user_can_hide = true,
  requires_admin_approval_on_change = false,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.role_profile_section_rules (role_id, section_id, is_enabled, requires_approval, sort_order)
select
  r.id,
  psc.id,
  true,
  false,
  130
from public.roles r
join public.profile_section_catalog psc
  on psc.key = 'detail.iletisim_linkleri'
where r.key in (
  'bireysel',
  'danisman',
  'isletme',
  'kurulus-dernek',
  'blogger-vlogger-youtuber',
  'sehir-elcisi'
)
on conflict (role_id, section_id) do update
set
  is_enabled = true,
  requires_approval = false,
  sort_order = excluded.sort_order,
  updated_at = now();

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
    select up.user_id, up.profile_type, coalesce(nullif(up.full_name, ''), 'CorteQS Üyesi') as display_name
    from public.user_profiles up
    where up.user_id = target_user_id
  ),
  visibility_gate as (
    select
      up.user_id,
      coalesce(dir_override.is_enabled, dir_role.is_enabled, false) and coalesce(dir_catalog.is_active_globally, false) as directory_visible
    from public.user_profiles up
    join public.roles r on r.key = up.profile_type
    left join public.feature_catalog dir_catalog on dir_catalog.key = 'directory.visible'
    left join public.role_feature_flags dir_role on dir_role.role_id = r.id and dir_role.feature_key = 'directory.visible'
    left join public.user_feature_overrides dir_override on dir_override.user_id = up.user_id and dir_override.feature_key = 'directory.visible'
    where up.user_id = target_user_id
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
  taxonomy_labels as (
    select
      tg.key as group_key,
      jsonb_agg(
        jsonb_build_object('key', topt.key, 'label', topt.label)
        order by topt.sort_order, topt.label
      ) as options
    from public.user_taxonomy_selections uts
    join public.taxonomy_groups tg on tg.id = uts.group_id and tg.is_active = true
    join public.taxonomy_options topt on topt.id = uts.option_id and topt.is_active = true
    where uts.user_id = target_user_id
    group by tg.key
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
          null
        ),
        'taxonomy',
        coalesce((select jsonb_agg(option_item ->> 'label') from taxonomy_labels tl, jsonb_array_elements(tl.options) option_item), '[]'::jsonb)
      )
      when 'detail.hakkinda_bio' then jsonb_build_object('text', (select value_text from public_attributes where key = 'bio_short'))
      when 'detail.taxonomy_etiketleri' then jsonb_build_object(
        'groups',
        coalesce(
          (
            select jsonb_object_agg(group_key, options)
            from taxonomy_labels
          ),
          '{}'::jsonb
        )
      )
      when 'detail.iletisim_linkleri' then jsonb_build_object(
        'links',
        jsonb_strip_nulls(
          jsonb_build_array(
            case when (select value_text from public_attributes where key = 'website_url') is not null then jsonb_build_object('label', 'Website', 'url', (select value_text from public_attributes where key = 'website_url')) end,
            case when (select value_text from public_attributes where key = 'linkedin_url') is not null then jsonb_build_object('label', 'LinkedIn', 'url', (select value_text from public_attributes where key = 'linkedin_url')) end,
            case when (select value_text from public_attributes where key = 'instagram_url') is not null then jsonb_build_object('label', 'Instagram', 'url', (select value_text from public_attributes where key = 'instagram_url')) end,
            case when (select value_text from public_attributes where key = 'facebook_url') is not null then jsonb_build_object('label', 'Facebook', 'url', (select value_text from public_attributes where key = 'facebook_url')) end,
            case when (select value_text from public_attributes where key = 'youtube_url') is not null then jsonb_build_object('label', 'YouTube', 'url', (select value_text from public_attributes where key = 'youtube_url')) end,
            case when (select value_text from public_attributes where key = 'tiktok_url') is not null then jsonb_build_object('label', 'TikTok', 'url', (select value_text from public_attributes where key = 'tiktok_url')) end,
            case when (select value_text from public_attributes where key = 'x_url') is not null then jsonb_build_object('label', 'X (Twitter)', 'url', (select value_text from public_attributes where key = 'x_url')) end,
            case when (select value_text from public_attributes where key = 'reddit_url') is not null then jsonb_build_object('label', 'Reddit', 'url', (select value_text from public_attributes where key = 'reddit_url')) end
          )
        )
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
        or exists (select 1 from taxonomy_labels)
      ))
      or (s.key = 'detail.hakkinda_bio' and exists (select 1 from public_attributes where key = 'bio_short'))
      or (s.key = 'detail.taxonomy_etiketleri' and exists (select 1 from taxonomy_labels))
      or (
        s.key = 'detail.iletisim_linkleri'
        and exists (
          select 1
          from public_attributes
          where key in ('website_url', 'linkedin_url', 'instagram_url', 'facebook_url', 'youtube_url', 'tiktok_url', 'x_url', 'reddit_url')
        )
      )
    )
  order by s.sort_order, s.key;
$$;

commit;
