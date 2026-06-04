begin;

create extension if not exists vector;

alter table public.catalog_search_documents
  add column if not exists embedding vector(1536);

create index if not exists idx_catalog_search_documents_embedding
  on public.catalog_search_documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.set_catalog_search_embedding(
  target_item_id uuid,
  next_embedding vector(1536)
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.catalog_search_documents
  set
    embedding = next_embedding,
    updated_at = now()
  where item_id = target_item_id;
end;
$$;

revoke all on function public.set_catalog_search_embedding(uuid, vector) from public;
grant execute on function public.set_catalog_search_embedding(uuid, vector) to service_role;

comment on column public.catalog_search_documents.embedding is
  'Optional semantic-search scaffold. Not required for baseline search_catalog RPC.';

commit;
