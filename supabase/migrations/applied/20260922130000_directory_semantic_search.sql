-- B21.3: search_directory_catalog semantik dali.
--
-- Canli fonksiyon daha once pg_get_functiondef yamalariyla degistirildi. Bu migration
-- o son canli govdeyi kaynak alir; null featured ve demo placeholder kararlarini geri
-- almaz. Semantik vektor opsiyoneldir: yoksa mevcut lexical davranis aynen surer.
-- catalog_search_documents tablosundan yalniz item_id + embedding okunur; iletisim
-- degerleri tasiyabilen metin kolonu anonim arama yuzeyine girmez.
--
-- Geri alma: yeni bir forward migration ile 8 argumanli surumu dusurup bu migration
-- oncesi 7 argumanli govdeyi yeniden yarat.

do $migration$
declare
  v_definition text;
  v_next text;
begin
  select pg_get_functiondef(
    'public.search_directory_catalog(text,text,text,text,boolean,integer,integer)'::regprocedure
  ) into v_definition;

  if v_definition is null then
    raise exception 'search_directory_catalog 7-arg definition not found';
  end if;

  -- Onceki canli yamalar ve B20 guvenlik kosullari kaybolamaz.
  if position('v_featured_only boolean := coalesce(p_featured_only, false)' in v_definition) = 0
    or position('not ilike ''Admin_%''' in v_definition) = 0
    or position('not ilike ''Moderator_%''' in v_definition) = 0
    or position('r_x.key ilike ''Admin_%''' in v_definition) = 0
    or position('r_x.key ilike ''Moderator_%''' in v_definition) = 0
  then
    raise exception 'live directory safety contract differs; refusing semantic patch';
  end if;

  v_next := replace(
    v_definition,
    'p_offset integer DEFAULT 0)',
    'p_offset integer DEFAULT 0, p_query_embedding vector(1536) DEFAULT NULL::vector)'
  );
  if v_next = v_definition then raise exception 'signature patch point not found'; end if;
  v_definition := v_next;

  v_next := replace(
    v_definition,
    '  with primary_locations as (',
    $insert$  with semantic_hits as materialized (
    select
      d.item_id,
      d.embedding <=> p_query_embedding as distance
    from public.catalog_search_documents d
    where p_query_embedding is not null
      and d.embedding is not null
    order by d.embedding <=> p_query_embedding
    limit 100
  ),
  primary_locations as ($insert$
  );
  if v_next = v_definition then raise exception 'semantic CTE patch point not found'; end if;
  v_definition := v_next;

  v_next := replace(
    v_definition,
    $find$      ) as row_is_claimable,
      public.catalog_search_normalize(ci.title) as row_title_folded,$find$,
    $insert$      ) as row_is_claimable,
      sh.distance as row_semantic_distance,
      public.catalog_search_normalize(ci.title) as row_title_folded,$insert$
  );
  if v_next = v_definition then raise exception 'catalog distance patch point not found'; end if;
  v_definition := v_next;

  v_next := replace(
    v_definition,
    $find$      false as row_is_claimable,
      public.catalog_search_normalize(coalesce(member_name.full_name, 'CorteQS Üyesi')) as row_title_folded,$find$,
    $insert$      false as row_is_claimable,
      null::double precision as row_semantic_distance,
      public.catalog_search_normalize(coalesce(member_name.full_name, 'CorteQS Üyesi')) as row_title_folded,$insert$
  );
  if v_next = v_definition then raise exception 'member distance patch point not found'; end if;
  v_definition := v_next;

  v_next := replace(
    v_definition,
    $find$    left join public.catalog_search_documents d
      on d.item_id = ci.id
    where ci.status = 'published'$find$,
    $insert$    left join public.catalog_search_documents d
      on d.item_id = ci.id
    left join semantic_hits sh
      on sh.item_id = ci.id
    where ci.status = 'published'$insert$
  );
  if v_next = v_definition then raise exception 'semantic join patch point not found'; end if;
  v_definition := v_next;

  v_next := replace(
    v_definition,
    $find$        else 9
      end as row_match_rank$find$,
    $insert$        when c.row_semantic_distance <= 0.35 then 4
        else 9
      end as row_match_rank$insert$
  );
  if v_next = v_definition then raise exception 'semantic rank patch point not found'; end if;
  v_definition := v_next;

  v_next := replace(v_definition, 'where q.row_match_rank <= 3', 'where q.row_match_rank <= 4');
  if v_next = v_definition then raise exception 'semantic filter patch point not found'; end if;
  v_definition := v_next;

  v_next := replace(
    v_definition,
    $find$    q.row_match_rank asc,
    q.row_is_featured desc,$find$,
    $insert$    q.row_match_rank asc,
    q.row_semantic_distance asc nulls last,
    q.row_is_featured desc,$insert$
  );
  if v_next = v_definition then raise exception 'semantic order patch point not found'; end if;

  execute v_next;
end;
$migration$;

drop function public.search_directory_catalog(text, text, text, text, boolean, integer, integer);

revoke all on function public.search_directory_catalog(
  text, text, text, text, boolean, integer, integer, vector
) from public;
grant execute on function public.search_directory_catalog(
  text, text, text, text, boolean, integer, integer, vector
) to anon, authenticated, service_role;

comment on function public.search_directory_catalog(
  text, text, text, text, boolean, integer, integer, vector
) is 'Public directory search: lexical ranking with optional server-generated semantic vector; B20 admin guards preserved.';
