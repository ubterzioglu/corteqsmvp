create or replace function public.get_submission_documents_bucket_stats()
returns table (
  bucket_id text,
  file_count bigint,
  total_bytes bigint,
  file_size_limit bigint,
  usage_ratio numeric
)
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if not exists (
    select 1
    from public.admin_users admin
    where admin.user_id = auth.uid()
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  select
    bucket_row.id::text as bucket_id,
    count(storage_object.id)::bigint as file_count,
    coalesce(sum(coalesce((storage_object.metadata ->> 'size')::bigint, 0)), 0)::bigint as total_bytes,
    coalesce(bucket_row.file_size_limit, 0)::bigint as file_size_limit,
    case
      when coalesce(bucket_row.file_size_limit, 0) > 0 then
        round(
          coalesce(sum(coalesce((storage_object.metadata ->> 'size')::bigint, 0)), 0)::numeric
          / bucket_row.file_size_limit::numeric,
          6
        )
      else 0::numeric
    end as usage_ratio
  from storage.buckets bucket_row
  left join storage.objects storage_object
    on storage_object.bucket_id = bucket_row.id
  where bucket_row.id = 'submission-documents'
  group by bucket_row.id, bucket_row.file_size_limit;
end;
$$;

revoke all on function public.get_submission_documents_bucket_stats() from public;
grant execute on function public.get_submission_documents_bucket_stats() to authenticated;
