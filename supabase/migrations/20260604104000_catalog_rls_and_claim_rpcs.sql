begin;

create or replace function public.catalog_item_is_publicly_visible(p_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.catalog_items ci
    left join public.person_profile_details ppd on ppd.item_id = ci.id
    where ci.id = p_item_id
      and ci.status = 'published'
      and ci.visibility = 'public'
      and (
        ci.item_type <> 'person_profile'
        or coalesce(ppd.directory_opt_in, false) = true
      )
  );
$$;

create or replace function public.catalog_user_can_manage_item(
  p_user_id uuid,
  p_item_id uuid,
  p_allowed_roles text[] default array['owner', 'manager']
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_moderator(p_user_id)
    or exists (
      select 1
      from public.catalog_item_memberships cim
      where cim.item_id = p_item_id
        and cim.user_id = p_user_id
        and cim.status = 'active'
        and cim.role = any (p_allowed_roles)
    );
$$;

create or replace function public.catalog_user_can_edit_item(
  p_user_id uuid,
  p_item_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.catalog_user_can_manage_item(p_user_id, p_item_id, array['owner', 'manager', 'editor']);
$$;

do $$
declare
  v_table_name text;
begin
  FOREACH v_table_name IN ARRAY ARRAY[
    'catalog_item_types',
    'feature_definitions',
    'item_type_features',
    'catalog_items',
    'catalog_item_memberships',
    'catalog_claim_requests',
    'catalog_categories',
    'catalog_item_categories',
    'catalog_item_contacts',
    'catalog_item_locations',
    'catalog_item_links',
    'catalog_item_media',
    'catalog_item_languages',
    'catalog_item_tags',
    'catalog_item_services',
    'catalog_item_relations',
    'catalog_item_favorites',
    'catalog_item_reviews',
    'catalog_item_reports',
    'catalog_item_verification_records',
    'catalog_audit_logs',
    'source_records',
    'duplicate_candidates',
    'merge_history',
    'moderation_queue',
    'advisor_details',
    'organization_details',
    'business_details',
    'event_details',
    'marketplace_listing_details',
    'job_posting_details',
    'community_group_details',
    'person_profile_details'
  ]
  LOOP
    execute format('alter table public.%I enable row level security', v_table_name);
  END LOOP;
end
$$;

drop policy if exists "catalog_item_types_public_read" on public.catalog_item_types;
create policy "catalog_item_types_public_read"
on public.catalog_item_types
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "feature_definitions_public_read" on public.feature_definitions;
create policy "feature_definitions_public_read"
on public.feature_definitions
for select
to anon, authenticated
using (true);

drop policy if exists "item_type_features_public_read" on public.item_type_features;
create policy "item_type_features_public_read"
on public.item_type_features
for select
to anon, authenticated
using (is_enabled = true);

drop policy if exists "catalog_categories_public_read" on public.catalog_categories;
create policy "catalog_categories_public_read"
on public.catalog_categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "catalog_items_public_or_manager_read" on public.catalog_items;
create policy "catalog_items_public_or_manager_read"
on public.catalog_items
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(id)
  or public.catalog_user_can_manage_item(auth.uid(), id, array['owner', 'manager', 'editor', 'contributor', 'viewer'])
);

drop policy if exists "catalog_items_owner_insert" on public.catalog_items;
create policy "catalog_items_owner_insert"
on public.catalog_items
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  or public.is_moderator(auth.uid())
);

drop policy if exists "catalog_items_owner_update" on public.catalog_items;
create policy "catalog_items_owner_update"
on public.catalog_items
for update
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), id, array['owner', 'manager']))
with check (public.catalog_user_can_manage_item(auth.uid(), id, array['owner', 'manager']));

drop policy if exists "catalog_items_owner_delete" on public.catalog_items;
create policy "catalog_items_owner_delete"
on public.catalog_items
for delete
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), id, array['owner']));

drop policy if exists "catalog_items_service_role_all" on public.catalog_items;
create policy "catalog_items_service_role_all"
on public.catalog_items
for all
to service_role
using (true)
with check (true);

drop policy if exists "catalog_memberships_visible_to_self_manager" on public.catalog_item_memberships;
create policy "catalog_memberships_visible_to_self_manager"
on public.catalog_item_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager'])
);

drop policy if exists "catalog_memberships_manageable_by_owner_manager" on public.catalog_item_memberships;
create policy "catalog_memberships_manageable_by_owner_manager"
on public.catalog_item_memberships
for all
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']))
with check (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']));

drop policy if exists "catalog_memberships_service_role_all" on public.catalog_item_memberships;
create policy "catalog_memberships_service_role_all"
on public.catalog_item_memberships
for all
to service_role
using (true)
with check (true);

drop policy if exists "catalog_claim_requests_self_or_reviewer_read" on public.catalog_claim_requests;
create policy "catalog_claim_requests_self_or_reviewer_read"
on public.catalog_claim_requests
for select
to authenticated
using (
  requested_by_user_id = auth.uid()
  or public.is_moderator(auth.uid())
);

drop policy if exists "catalog_claim_requests_self_insert" on public.catalog_claim_requests;
create policy "catalog_claim_requests_self_insert"
on public.catalog_claim_requests
for insert
to authenticated
with check (requested_by_user_id = auth.uid());

drop policy if exists "catalog_claim_requests_reviewer_update" on public.catalog_claim_requests;
create policy "catalog_claim_requests_reviewer_update"
on public.catalog_claim_requests
for update
to authenticated
using (public.is_moderator(auth.uid()))
with check (public.is_moderator(auth.uid()));

drop policy if exists "catalog_claim_requests_service_role_all" on public.catalog_claim_requests;
create policy "catalog_claim_requests_service_role_all"
on public.catalog_claim_requests
for all
to service_role
using (true)
with check (true);

drop policy if exists "catalog_item_categories_public_read" on public.catalog_item_categories;
create policy "catalog_item_categories_public_read"
on public.catalog_item_categories
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_item_categories_manage_write" on public.catalog_item_categories;
create policy "catalog_item_categories_manage_write"
on public.catalog_item_categories
for all
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']))
with check (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']));

drop policy if exists "catalog_item_contacts_public_read" on public.catalog_item_contacts;
create policy "catalog_item_contacts_public_read"
on public.catalog_item_contacts
for select
to anon, authenticated
using (
  (
    is_public = true
    and public.catalog_item_is_publicly_visible(item_id)
  )
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_item_contacts_manage_write" on public.catalog_item_contacts;
create policy "catalog_item_contacts_manage_write"
on public.catalog_item_contacts
for all
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']))
with check (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']));

drop policy if exists "catalog_item_locations_public_read" on public.catalog_item_locations;
create policy "catalog_item_locations_public_read"
on public.catalog_item_locations
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_item_locations_manage_write" on public.catalog_item_locations;
create policy "catalog_item_locations_manage_write"
on public.catalog_item_locations
for all
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']))
with check (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']));

drop policy if exists "catalog_item_links_public_read" on public.catalog_item_links;
create policy "catalog_item_links_public_read"
on public.catalog_item_links
for select
to anon, authenticated
using (
  (
    is_public = true
    and public.catalog_item_is_publicly_visible(item_id)
  )
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_item_links_manage_write" on public.catalog_item_links;
create policy "catalog_item_links_manage_write"
on public.catalog_item_links
for all
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']))
with check (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']));

drop policy if exists "catalog_item_media_public_read" on public.catalog_item_media;
create policy "catalog_item_media_public_read"
on public.catalog_item_media
for select
to anon, authenticated
using (
  (
    is_public = true
    and public.catalog_item_is_publicly_visible(item_id)
  )
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_item_media_manage_write" on public.catalog_item_media;
create policy "catalog_item_media_manage_write"
on public.catalog_item_media
for all
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']))
with check (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']));

drop policy if exists "catalog_item_languages_public_read" on public.catalog_item_languages;
create policy "catalog_item_languages_public_read"
on public.catalog_item_languages
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_item_languages_manage_write" on public.catalog_item_languages;
create policy "catalog_item_languages_manage_write"
on public.catalog_item_languages
for all
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']))
with check (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']));

drop policy if exists "catalog_item_tags_public_read" on public.catalog_item_tags;
create policy "catalog_item_tags_public_read"
on public.catalog_item_tags
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_item_tags_manage_write" on public.catalog_item_tags;
create policy "catalog_item_tags_manage_write"
on public.catalog_item_tags
for all
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']))
with check (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']));

drop policy if exists "catalog_item_services_public_read" on public.catalog_item_services;
create policy "catalog_item_services_public_read"
on public.catalog_item_services
for select
to anon, authenticated
using (
  (
    is_public = true
    and public.catalog_item_is_publicly_visible(item_id)
  )
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_item_services_manage_write" on public.catalog_item_services;
create policy "catalog_item_services_manage_write"
on public.catalog_item_services
for all
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']))
with check (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']));

drop policy if exists "catalog_item_relations_public_read" on public.catalog_item_relations;
create policy "catalog_item_relations_public_read"
on public.catalog_item_relations
for select
to anon, authenticated
using (
  (
    public.catalog_item_is_publicly_visible(item_id)
    and public.catalog_item_is_publicly_visible(related_item_id)
  )
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
  or public.catalog_user_can_edit_item(auth.uid(), related_item_id)
);

drop policy if exists "catalog_item_relations_manage_write" on public.catalog_item_relations;
create policy "catalog_item_relations_manage_write"
on public.catalog_item_relations
for all
to authenticated
using (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']))
with check (public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager']));

drop policy if exists "catalog_item_favorites_self_read" on public.catalog_item_favorites;
create policy "catalog_item_favorites_self_read"
on public.catalog_item_favorites
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "catalog_item_favorites_self_write" on public.catalog_item_favorites;
create policy "catalog_item_favorites_self_write"
on public.catalog_item_favorites
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "catalog_item_reviews_public_read" on public.catalog_item_reviews;
create policy "catalog_item_reviews_public_read"
on public.catalog_item_reviews
for select
to anon, authenticated
using (
  status = 'published'
  and is_public = true
  and public.catalog_item_is_publicly_visible(item_id)
);

drop policy if exists "catalog_item_reviews_self_insert" on public.catalog_item_reviews;
create policy "catalog_item_reviews_self_insert"
on public.catalog_item_reviews
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "catalog_item_reviews_self_or_reviewer_update" on public.catalog_item_reviews;
create policy "catalog_item_reviews_self_or_reviewer_update"
on public.catalog_item_reviews
for update
to authenticated
using (
  (user_id = auth.uid() and status = 'pending')
  or public.is_moderator(auth.uid())
)
with check (
  (user_id = auth.uid() and status in ('pending', 'published'))
  or public.is_moderator(auth.uid())
);

drop policy if exists "catalog_item_reports_self_or_reviewer_read" on public.catalog_item_reports;
create policy "catalog_item_reports_self_or_reviewer_read"
on public.catalog_item_reports
for select
to authenticated
using (
  reporter_user_id = auth.uid()
  or public.is_moderator(auth.uid())
);

drop policy if exists "catalog_item_reports_self_insert" on public.catalog_item_reports;
create policy "catalog_item_reports_self_insert"
on public.catalog_item_reports
for insert
to authenticated
with check (reporter_user_id = auth.uid());

drop policy if exists "catalog_item_reports_reviewer_update" on public.catalog_item_reports;
create policy "catalog_item_reports_reviewer_update"
on public.catalog_item_reports
for update
to authenticated
using (public.is_moderator(auth.uid()))
with check (public.is_moderator(auth.uid()));

drop policy if exists "catalog_item_verification_records_manage_read" on public.catalog_item_verification_records;
create policy "catalog_item_verification_records_manage_read"
on public.catalog_item_verification_records
for select
to authenticated
using (
  public.catalog_user_can_manage_item(auth.uid(), item_id, array['owner', 'manager'])
  or public.is_moderator(auth.uid())
);

drop policy if exists "catalog_item_verification_records_reviewer_write" on public.catalog_item_verification_records;
create policy "catalog_item_verification_records_reviewer_write"
on public.catalog_item_verification_records
for all
to authenticated
using (public.is_moderator(auth.uid()))
with check (public.is_moderator(auth.uid()));

drop policy if exists "catalog_internal_reviewer_read_logs" on public.catalog_audit_logs;
create policy "catalog_internal_reviewer_read_logs"
on public.catalog_audit_logs
for select
to authenticated
using (public.is_moderator(auth.uid()));

drop policy if exists "catalog_internal_reviewer_read_sources" on public.source_records;
create policy "catalog_internal_reviewer_read_sources"
on public.source_records
for select
to authenticated
using (public.is_moderator(auth.uid()));

drop policy if exists "catalog_internal_service_role_sources" on public.source_records;
create policy "catalog_internal_service_role_sources"
on public.source_records
for all
to service_role
using (true)
with check (true);

drop policy if exists "catalog_internal_reviewer_read_duplicates" on public.duplicate_candidates;
create policy "catalog_internal_reviewer_read_duplicates"
on public.duplicate_candidates
for select
to authenticated
using (public.is_moderator(auth.uid()));

drop policy if exists "catalog_internal_reviewer_write_duplicates" on public.duplicate_candidates;
create policy "catalog_internal_reviewer_write_duplicates"
on public.duplicate_candidates
for all
to authenticated
using (public.is_moderator(auth.uid()))
with check (public.is_moderator(auth.uid()));

drop policy if exists "catalog_internal_reviewer_read_merge_history" on public.merge_history;
create policy "catalog_internal_reviewer_read_merge_history"
on public.merge_history
for select
to authenticated
using (public.is_moderator(auth.uid()));

drop policy if exists "catalog_internal_reviewer_read_moderation_queue" on public.moderation_queue;
create policy "catalog_internal_reviewer_read_moderation_queue"
on public.moderation_queue
for select
to authenticated
using (public.is_moderator(auth.uid()));

drop policy if exists "catalog_internal_reviewer_write_moderation_queue" on public.moderation_queue;
create policy "catalog_internal_reviewer_write_moderation_queue"
on public.moderation_queue
for all
to authenticated
using (public.is_moderator(auth.uid()))
with check (public.is_moderator(auth.uid()));

drop policy if exists "catalog_extension_manage_or_visible_advisor" on public.advisor_details;
create policy "catalog_extension_manage_or_visible_advisor"
on public.advisor_details
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_extension_manage_write_advisor" on public.advisor_details;
create policy "catalog_extension_manage_write_advisor"
on public.advisor_details
for all
to authenticated
using (public.catalog_user_can_edit_item(auth.uid(), item_id))
with check (public.catalog_user_can_edit_item(auth.uid(), item_id));

drop policy if exists "catalog_extension_manage_or_visible_organization" on public.organization_details;
create policy "catalog_extension_manage_or_visible_organization"
on public.organization_details
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_extension_manage_write_organization" on public.organization_details;
create policy "catalog_extension_manage_write_organization"
on public.organization_details
for all
to authenticated
using (public.catalog_user_can_edit_item(auth.uid(), item_id))
with check (public.catalog_user_can_edit_item(auth.uid(), item_id));

drop policy if exists "catalog_extension_manage_or_visible_business" on public.business_details;
create policy "catalog_extension_manage_or_visible_business"
on public.business_details
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_extension_manage_write_business" on public.business_details;
create policy "catalog_extension_manage_write_business"
on public.business_details
for all
to authenticated
using (public.catalog_user_can_edit_item(auth.uid(), item_id))
with check (public.catalog_user_can_edit_item(auth.uid(), item_id));

drop policy if exists "catalog_extension_manage_or_visible_event" on public.event_details;
create policy "catalog_extension_manage_or_visible_event"
on public.event_details
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_extension_manage_write_event" on public.event_details;
create policy "catalog_extension_manage_write_event"
on public.event_details
for all
to authenticated
using (public.catalog_user_can_edit_item(auth.uid(), item_id))
with check (public.catalog_user_can_edit_item(auth.uid(), item_id));

drop policy if exists "catalog_extension_manage_or_visible_marketplace" on public.marketplace_listing_details;
create policy "catalog_extension_manage_or_visible_marketplace"
on public.marketplace_listing_details
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_extension_manage_write_marketplace" on public.marketplace_listing_details;
create policy "catalog_extension_manage_write_marketplace"
on public.marketplace_listing_details
for all
to authenticated
using (public.catalog_user_can_edit_item(auth.uid(), item_id))
with check (public.catalog_user_can_edit_item(auth.uid(), item_id));

drop policy if exists "catalog_extension_manage_or_visible_job" on public.job_posting_details;
create policy "catalog_extension_manage_or_visible_job"
on public.job_posting_details
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_extension_manage_write_job" on public.job_posting_details;
create policy "catalog_extension_manage_write_job"
on public.job_posting_details
for all
to authenticated
using (public.catalog_user_can_edit_item(auth.uid(), item_id))
with check (public.catalog_user_can_edit_item(auth.uid(), item_id));

drop policy if exists "catalog_extension_manage_or_visible_group" on public.community_group_details;
create policy "catalog_extension_manage_or_visible_group"
on public.community_group_details
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_extension_manage_write_group" on public.community_group_details;
create policy "catalog_extension_manage_write_group"
on public.community_group_details
for all
to authenticated
using (public.catalog_user_can_edit_item(auth.uid(), item_id))
with check (public.catalog_user_can_edit_item(auth.uid(), item_id));

drop policy if exists "catalog_extension_manage_or_visible_person" on public.person_profile_details;
create policy "catalog_extension_manage_or_visible_person"
on public.person_profile_details
for select
to anon, authenticated
using (
  public.catalog_item_is_publicly_visible(item_id)
  or linked_profile_id = auth.uid()
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

drop policy if exists "catalog_extension_manage_write_person" on public.person_profile_details;
create policy "catalog_extension_manage_write_person"
on public.person_profile_details
for all
to authenticated
using (
  linked_profile_id = auth.uid()
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
)
with check (
  linked_profile_id = auth.uid()
  or public.catalog_user_can_edit_item(auth.uid(), item_id)
);

create or replace function public.submit_catalog_claim_request(
  target_item_id uuid,
  claim_type text default 'ownership',
  evidence jsonb default '{}'::jsonb,
  note text default null
)
returns public.catalog_claim_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_claim public.catalog_claim_requests%rowtype;
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if target_item_id is null then
    raise exception 'item_id is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.catalog_items ci
    where ci.id = target_item_id
  ) then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  if public.catalog_user_can_manage_item(v_user_id, target_item_id, array['owner']) then
    raise exception 'item already owned by current user' using errcode = '23505';
  end if;

  insert into public.catalog_claim_requests (
    item_id,
    requested_by_user_id,
    claim_type,
    evidence,
    note,
    status
  )
  values (
    target_item_id,
    v_user_id,
    coalesce(nullif(btrim(claim_type), ''), 'ownership'),
    coalesce(evidence, '{}'::jsonb),
    note,
    'pending'
  )
  returning * into v_claim;

  insert into public.catalog_audit_logs (
    item_id,
    actor_user_id,
    action,
    details,
    after_data
  )
  values (
    target_item_id,
    v_user_id,
    'catalog_claim_request_submitted',
    jsonb_build_object('claim_request_id', v_claim.id),
    to_jsonb(v_claim)
  );

  return v_claim;
end;
$$;

create or replace function public.review_catalog_claim_request(
  target_claim_request_id uuid,
  decision text,
  review_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_claim public.catalog_claim_requests%rowtype;
  v_before_item public.catalog_items%rowtype;
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if decision not in ('approved', 'rejected', 'cancelled') then
    raise exception 'invalid decision' using errcode = '22023';
  end if;

  select *
  into v_claim
  from public.catalog_claim_requests
  where id = target_claim_request_id
  for update;

  if v_claim.id is null then
    raise exception 'claim request not found' using errcode = 'P0002';
  end if;

  if v_claim.status <> 'pending' then
    raise exception 'claim request already reviewed' using errcode = '22023';
  end if;

  select *
  into v_before_item
  from public.catalog_items
  where id = v_claim.item_id
  for update;

  update public.catalog_claim_requests
  set
    status = decision,
    note = coalesce(note, review_note),
    reviewed_by_user_id = v_actor_id,
    reviewed_at = now(),
    updated_at = now()
  where id = v_claim.id;

  if decision = 'approved' then
    insert into public.catalog_item_memberships (
      item_id,
      user_id,
      role,
      status
    )
    values (
      v_claim.item_id,
      v_claim.requested_by_user_id,
      'owner',
      'active'
    )
    on conflict (item_id, user_id, role) do update
    set
      status = 'active',
      updated_at = now();

    update public.catalog_items
    set
      created_by_user_id = coalesce(created_by_user_id, v_claim.requested_by_user_id),
      verification_status = case
        when verification_status = 'unverified' then 'claimed'
        else verification_status
      end,
      updated_at = now()
    where id = v_claim.item_id;
  end if;

  insert into public.catalog_audit_logs (
    item_id,
    actor_user_id,
    action,
    details,
    before_data,
    after_data
  )
  values (
    v_claim.item_id,
    v_actor_id,
    'catalog_claim_request_reviewed',
    jsonb_build_object(
      'claim_request_id', v_claim.id,
      'decision', decision,
      'review_note', review_note
    ),
    to_jsonb(v_before_item),
    (
      select to_jsonb(ci)
      from public.catalog_items ci
      where ci.id = v_claim.item_id
    )
  );

  return jsonb_build_object(
    'claim_request_id', v_claim.id,
    'item_id', v_claim.item_id,
    'decision', decision,
    'reviewed_by_user_id', v_actor_id
  );
end;
$$;

create or replace function public.update_catalog_item_editor_content(
  target_item_id uuid,
  next_headline text default null,
  next_short_description text default null,
  next_long_description text default null,
  attributes_patch jsonb default '{}'::jsonb
)
returns public.catalog_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_item public.catalog_items%rowtype;
begin
  if v_actor_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not public.catalog_user_can_edit_item(v_actor_id, target_item_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.catalog_items
  set
    headline = coalesce(next_headline, headline),
    short_description = coalesce(next_short_description, short_description),
    long_description = coalesce(next_long_description, long_description),
    attributes = coalesce(attributes, '{}'::jsonb) || coalesce(attributes_patch, '{}'::jsonb),
    updated_at = now()
  where id = target_item_id
  returning * into v_item;

  if v_item.id is null then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  return v_item;
end;
$$;

revoke all on function public.submit_catalog_claim_request(uuid, text, jsonb, text) from public;
revoke all on function public.review_catalog_claim_request(uuid, text, text) from public;
revoke all on function public.update_catalog_item_editor_content(uuid, text, text, text, jsonb) from public;

grant execute on function public.submit_catalog_claim_request(uuid, text, jsonb, text) to authenticated;
grant execute on function public.review_catalog_claim_request(uuid, text, text) to authenticated;
grant execute on function public.update_catalog_item_editor_content(uuid, text, text, text, jsonb) to authenticated;

grant select on public.catalog_item_types, public.catalog_categories, public.feature_definitions, public.item_type_features to anon, authenticated;
grant select on public.catalog_items, public.catalog_item_categories, public.catalog_item_contacts, public.catalog_item_locations, public.catalog_item_links, public.catalog_item_media, public.catalog_item_languages, public.catalog_item_tags, public.catalog_item_services, public.catalog_item_relations, public.advisor_details, public.organization_details, public.business_details, public.event_details, public.marketplace_listing_details, public.job_posting_details, public.community_group_details, public.person_profile_details to anon, authenticated;
grant select, insert, update, delete on public.catalog_items, public.catalog_item_memberships, public.catalog_claim_requests, public.catalog_item_categories, public.catalog_item_contacts, public.catalog_item_locations, public.catalog_item_links, public.catalog_item_media, public.catalog_item_languages, public.catalog_item_tags, public.catalog_item_services, public.catalog_item_relations, public.catalog_item_favorites, public.catalog_item_reviews, public.catalog_item_reports, public.catalog_item_verification_records, public.catalog_audit_logs, public.source_records, public.duplicate_candidates, public.merge_history, public.moderation_queue, public.advisor_details, public.organization_details, public.business_details, public.event_details, public.marketplace_listing_details, public.job_posting_details, public.community_group_details, public.person_profile_details to authenticated, service_role;

commit;
