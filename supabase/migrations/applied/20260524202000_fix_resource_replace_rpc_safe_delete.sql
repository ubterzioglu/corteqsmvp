begin;

create or replace function public.admin_replace_resource_entries_from_csv(
  payload jsonb,
  expected_count integer,
  batch_id text
)
returns table(inserted_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer := 0;
begin
  if not public.is_admin(auth.uid()) and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if payload is null or jsonb_typeof(payload) <> 'array' then
    raise exception 'payload must be a json array'
      using errcode = '22023';
  end if;

  if expected_count is null or expected_count < 0 then
    raise exception 'expected_count must be a non-negative integer'
      using errcode = '22023';
  end if;

  if expected_count <> jsonb_array_length(payload) then
    raise exception 'expected_count mismatch'
      using errcode = '22023';
  end if;

  if batch_id is null or btrim(batch_id) = '' then
    raise exception 'batch_id is required'
      using errcode = '22023';
  end if;

  delete from public.resource_entries
  where id is not null;

  insert into public.resource_entries (
    order_no,
    slug,
    section,
    subsection,
    department,
    record_kind,
    added_by,
    title,
    description,
    url,
    file_id,
    file_type,
    mime_type,
    privacy_level,
    is_public_import,
    import_suggestion,
    tags,
    source_path,
    status,
    source_folder,
    source_subfolder,
    source_snapshot_date,
    import_batch,
    storage_bucket,
    storage_path,
    file_name,
    person_first_name,
    person_last_name,
    person_role,
    linkedin_url,
    instagram_url,
    website_url
  )
  select
    t.order_no,
    t.slug,
    t.section,
    t.subsection,
    t.department,
    t.record_kind,
    t.added_by,
    t.title,
    t.description,
    t.url,
    t.file_id,
    t.file_type,
    t.mime_type,
    t.privacy_level,
    t.is_public_import,
    t.import_suggestion,
    t.tags,
    t.source_path,
    t.status,
    t.source_folder,
    t.source_subfolder,
    t.source_snapshot_date,
    batch_id,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  from jsonb_to_recordset(payload) as t(
    order_no integer,
    slug text,
    section text,
    subsection text,
    department text,
    record_kind text,
    added_by text,
    title text,
    description text,
    url text,
    file_id text,
    file_type text,
    mime_type text,
    privacy_level text,
    is_public_import boolean,
    import_suggestion text,
    tags text,
    source_path text,
    status text,
    source_folder text,
    source_subfolder text,
    source_snapshot_date date
  )
  where coalesce(btrim(t.title), '') <> '';

  get diagnostics v_inserted = row_count;

  if v_inserted <> expected_count then
    raise exception 'inserted_count mismatch: expected %, got %', expected_count, v_inserted
      using errcode = 'P0001';
  end if;

  return query select v_inserted;
end;
$$;

grant execute on function public.admin_replace_resource_entries_from_csv(jsonb, integer, text) to authenticated;
grant execute on function public.admin_replace_resource_entries_from_csv(jsonb, integer, text) to service_role;

commit;
