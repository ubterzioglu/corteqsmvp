begin;

with feature_seed(feature_key, label, description, sort_order) as (
  values
    ('profile.linkedin_card', 'LinkedIn Kartı', 'Kullanıcının LinkedIn kartını profilinde yönetmesini sağlar.', 178),
    ('profile.website_card', 'Web Sitesi Kartı', 'Kullanıcının web sitesi kartını profilinde yönetmesini sağlar.', 179),
    ('profile.cv_upload', 'CV Yükleme', 'Kullanıcının profiline CV / özgeçmiş dosyası yüklemesini sağlar.', 180),
    ('profile.presentation_upload', 'Sunum Yükleme', 'Kullanıcının profiline sunum / tanıtım dosyası yüklemesini sağlar.', 181)
)
insert into public.feature_catalog (
  key,
  label,
  description,
  scope_role,
  scope,
  feature_type,
  metadata,
  sort_order,
  is_active_globally
)
select
  feature_key,
  label,
  description,
  '*',
  'profile',
  'capability',
  '{}'::jsonb,
  sort_order,
  true
from feature_seed
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  scope_role = excluded.scope_role,
  scope = excluded.scope,
  feature_type = excluded.feature_type,
  metadata = excluded.metadata,
  sort_order = excluded.sort_order,
  is_active_globally = excluded.is_active_globally,
  updated_at = now();

insert into public.role_feature_flags (role_id, feature_key, is_enabled, updated_by)
select
  r.id,
  fs.feature_key,
  true,
  null
from public.roles r
cross join (
  values
    ('profile.linkedin_card'),
    ('profile.website_card'),
    ('profile.cv_upload'),
    ('profile.presentation_upload')
) as fs(feature_key)
where r.is_active = true
on conflict (role_id, feature_key) do update
set
  is_enabled = excluded.is_enabled,
  updated_at = now();

insert into public.role_feature_defaults (profile_type, feature_key, is_enabled)
select
  r.key,
  fs.feature_key,
  true
from public.roles r
cross join (
  values
    ('profile.linkedin_card'),
    ('profile.website_card'),
    ('profile.cv_upload'),
    ('profile.presentation_upload')
) as fs(feature_key)
where r.is_active = true
on conflict (profile_type, feature_key) do update
set
  is_enabled = excluded.is_enabled;

insert into public.attribute_catalog (key, label, description, data_type, is_active, is_system, sort_order)
values
  ('job_seeking_opt_in', 'İş Arıyorum Badge''i', 'Profilinde iş aradığını belirten rozet tercih kaydı', 'boolean', true, false, 177),
  ('moving_soon_opt_in', 'Yakında Taşınacağım', 'Yakında taşınacağını belirten rozet tercih kaydı', 'boolean', true, false, 178),
  ('volunteer_mentorship_opt_in', 'Gönüllü Mentörlük', 'Gönüllü mentörlük görünürlüğü tercih kaydı', 'boolean', true, false, 179),
  ('cv_doc', 'CV / Özgeçmiş', 'Profil sahibinin yüklediği özel CV dosyası', 'json', true, false, 180),
  ('presentation_doc', 'Sunum / Tanıtım', 'Profil sahibinin yüklediği özel sunum veya tanıtım dosyası', 'json', true, false, 181)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  data_type = excluded.data_type,
  is_active = excluded.is_active,
  is_system = excluded.is_system,
  sort_order = excluded.sort_order,
  updated_at = now();

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
join public.attribute_catalog ac on ac.key in ('linkedin_url', 'website_url')
where r.is_active = true
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
  false,
  true,
  false,
  false,
  ac.sort_order
from public.roles r
join public.attribute_catalog ac
  on ac.key in (
    'job_seeking_opt_in',
    'moving_soon_opt_in',
    'volunteer_mentorship_opt_in',
    'cv_doc',
    'presentation_doc'
  )
where r.is_active = true
on conflict (role_id, attribute_id) do update
set
  is_enabled = true,
  is_required = false,
  is_public_default = false,
  user_can_edit = true,
  user_can_hide = false,
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
join public.profile_section_catalog psc on psc.key = 'detail.iletisim_linkleri'
where r.is_active = true
on conflict (role_id, section_id) do update
set
  is_enabled = true,
  requires_approval = false,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'profile-cv-files',
    'profile-cv-files',
    false,
    20971520,
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
  ),
  (
    'profile-presentation-files',
    'profile-presentation-files',
    false,
    52428800,
    array[
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/x-iwork-keynote-sffkey'
    ]::text[]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_cv_files_owner_read" on storage.objects;
create policy "profile_cv_files_owner_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-cv-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "profile_cv_files_admin_read" on storage.objects;
create policy "profile_cv_files_admin_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-cv-files'
  and public.is_admin(auth.uid())
);

drop policy if exists "profile_cv_files_owner_insert" on storage.objects;
create policy "profile_cv_files_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-cv-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "profile_cv_files_owner_update" on storage.objects;
create policy "profile_cv_files_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-cv-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "profile_cv_files_owner_delete" on storage.objects;
create policy "profile_cv_files_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-cv-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "profile_cv_files_admin_delete" on storage.objects;
create policy "profile_cv_files_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-cv-files'
  and public.is_admin(auth.uid())
);

drop policy if exists "profile_presentation_files_owner_read" on storage.objects;
create policy "profile_presentation_files_owner_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-presentation-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "profile_presentation_files_admin_read" on storage.objects;
create policy "profile_presentation_files_admin_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-presentation-files'
  and public.is_admin(auth.uid())
);

drop policy if exists "profile_presentation_files_owner_insert" on storage.objects;
create policy "profile_presentation_files_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-presentation-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "profile_presentation_files_owner_update" on storage.objects;
create policy "profile_presentation_files_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-presentation-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "profile_presentation_files_owner_delete" on storage.objects;
create policy "profile_presentation_files_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-presentation-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "profile_presentation_files_admin_delete" on storage.objects;
create policy "profile_presentation_files_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-presentation-files'
  and public.is_admin(auth.uid())
);

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
        coalesce((select jsonb_agg(option_item ->> 'label') from taxonomy_labels tl, jsonb_array_elements(tl.options) option_item), '[]'::jsonb),
        'extra_badges',
        coalesce((select labels from extra_badges), '[]'::jsonb)
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
        or exists (select 1 from taxonomy_labels)
        or exists (select 1 from extra_badges eb, jsonb_array_elements_text(eb.labels) badge)
      ))
      or (s.key = 'detail.hakkinda_bio' and exists (select 1 from public_attributes where key = 'bio_short'))
      or (s.key = 'detail.taxonomy_etiketleri' and exists (select 1 from taxonomy_labels))
      or (s.key = 'detail.iletisim_linkleri' and exists (select 1 from public_links))
    )
  order by s.sort_order, s.key;
$$;

commit;
