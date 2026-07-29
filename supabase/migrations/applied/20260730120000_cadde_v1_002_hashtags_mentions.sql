-- Cadde V1 (2/6): serbest hashtag + @mention.
--
-- Küratörlü etiket sistemi (cadde_interest_catalog / cadde_post_interests) AYNEN KALIR —
-- list_cadde_feed_v1'in band/skor hesabı ona bağlı ve bozulmamalı. Hashtag onun YANINA
-- gelir: kullanıcının serbestçe yazdığı, tıklanınca akışı filtreleyen etiket.
--
-- ⚠ TÜRKÇE NORMALİZASYON — bu migration'ın en kritik parçası.
-- Hem JS'in hem PostgreSQL'in varsayılan lower()'ı Türkçe'de yanlıştır: ikisi de "İ"yi
-- "i + birleşen nokta" (U+0069 U+0307) yapar ve sade "i" ile EŞLEŞMEZ. Denetlendi:
--   select lower(U&'\0130stanbul');  →  i̇stanbul   (sade "istanbul" DEĞİL)
-- Bu yüzden anahtar üretimi lower(unaccent(...)) ile yapılır; unaccent önce çalışıp
-- İ'yi I'ya indirger, lower() yalnız ASCII ile uğraşır.
--   TS aynası: src/lib/cadde-text.ts normalizeHashtag (trFold tabanlı)
--   Ayna külliyatı: src/lib/cadde-text.test.ts — beklenen değerler bu DB'den ÖLÇÜLDÜ.
-- Birini değiştiren diğerini de günceller, yoksa "#İstanbul" ve "#istanbul" ayrı
-- etiketlere bölünür.

begin;

-- ── 1. Normalizasyon ─────────────────────────────────────────────────────────
-- unaccent STABLE olduğu için bu fonksiyon da STABLE (IMMUTABLE değil) — index/generated
-- column'da kullanılamaz, bilerek böyle; anahtar yazma anında üretilip saklanır.
create or replace function public.cadde_normalize_tag(p_tag text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select regexp_replace(lower(unaccent(ltrim(coalesce(p_tag, ''), '#'))), '[^a-z0-9]', '', 'g');
$$;

revoke all on function public.cadde_normalize_tag(text) from public, anon;
grant execute on function public.cadde_normalize_tag(text) to authenticated;

-- ── 2. Tablolar ──────────────────────────────────────────────────────────────
create table if not exists public.cadde_hashtags (
  tag text primary key,
  display_tag text not null,
  usage_count integer not null default 0,
  first_seen_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

comment on table public.cadde_hashtags is
  'Serbest hashtag kataloğu. tag = cadde_normalize_tag çıktısı (ASCII, küçük harf); display_tag ilk görülen özgün yazım (#İstanbul).';

create table if not exists public.cadde_post_hashtags (
  post_id uuid not null references public.cadde_posts(id) on delete cascade,
  tag text not null references public.cadde_hashtags(tag) on delete cascade,
  primary key (post_id, tag)
);

create index if not exists cadde_post_hashtags_tag_idx on public.cadde_post_hashtags (tag);

create table if not exists public.cadde_post_mentions (
  post_id uuid not null references public.cadde_posts(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  primary key (post_id, target_type, target_id)
);

do $$ begin
  alter table public.cadde_post_mentions
    add constraint cadde_post_mentions_type_check
    check (target_type in ('user', 'catalog_item', 'cafe', 'carsi_item'));
exception when duplicate_object then null; end $$;

create index if not exists cadde_post_mentions_target_idx
  on public.cadde_post_mentions (target_type, target_id);

-- ── 3. RLS — okuma authenticated, yazma yalnız RPC (D-02 + RPC-only mutation) ─
alter table public.cadde_hashtags enable row level security;
alter table public.cadde_post_hashtags enable row level security;
alter table public.cadde_post_mentions enable row level security;

drop policy if exists "cadde hashtags authenticated read" on public.cadde_hashtags;
create policy "cadde hashtags authenticated read"
  on public.cadde_hashtags for select using (auth.uid() is not null);

drop policy if exists "cadde post hashtags authenticated read" on public.cadde_post_hashtags;
create policy "cadde post hashtags authenticated read"
  on public.cadde_post_hashtags for select using (auth.uid() is not null);

drop policy if exists "cadde post mentions authenticated read" on public.cadde_post_mentions;
create policy "cadde post mentions authenticated read"
  on public.cadde_post_mentions for select using (auth.uid() is not null);

drop policy if exists "cadde hashtags admin write" on public.cadde_hashtags;
create policy "cadde hashtags admin write"
  on public.cadde_hashtags for all
  using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));

-- ── 4. Hashtag senkronu ──────────────────────────────────────────────────────
-- Trigger DEĞİL, RPC içinden çağrılır: limit aşımı kullanıcıya hata olarak dönebilsin.
create or replace function public.cadde_sync_post_hashtags(p_post_id uuid, p_body text)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_max int := public.cadde_setting_int('cadde.hashtag.max_per_post', 8);
  v_display text;
  v_tag text;
  v_count int := 0;
begin
  delete from public.cadde_post_hashtags where post_id = p_post_id;

  for v_display in
    select m[1] from regexp_matches(coalesce(p_body, ''), '#([[:alnum:]_]{2,32})', 'g') m
  loop
    v_tag := public.cadde_normalize_tag(v_display);
    -- Yalnız noktalama/emoji içeren etiketler normalize sonrası boşalır — atlanır.
    if v_tag is null or v_tag = '' then
      continue;
    end if;

    -- Aynı gövdede tekrar eden etiket bir kez sayılır (PK çakışması sessizce geçilir).
    if exists (select 1 from public.cadde_post_hashtags where post_id = p_post_id and tag = v_tag) then
      continue;
    end if;

    if v_count >= v_max then
      raise exception 'cadde_hashtag_limit';
    end if;

    insert into public.cadde_hashtags (tag, display_tag, usage_count, last_used_at)
    values (v_tag, v_display, 1, now())
    on conflict (tag) do update
      set usage_count = public.cadde_hashtags.usage_count + 1,
          last_used_at = now();

    insert into public.cadde_post_hashtags (post_id, tag) values (p_post_id, v_tag);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.cadde_sync_post_hashtags(uuid, text) from public, anon, authenticated;

-- ── 5. Mention senkronu + bildirim ───────────────────────────────────────────
-- p_mentions: [{"type":"user|catalog_item|cafe|carsi_item","id":"<uuid>"}]
-- Hedef doğrulaması burada yapılır; görünmeyen/olmayan hedef SESSİZCE atlanır
-- (kullanıcı yazarken hedef arşivlenmiş olabilir — paylaşımı düşürmek doğru değil).
create or replace function public.cadde_sync_post_mentions(
  p_post_id uuid,
  p_mentions jsonb,
  p_author_user_id uuid,
  p_post_title text
)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_max int := public.cadde_setting_int('cadde.mention.max_per_post', 10);
  v_item jsonb;
  v_type text;
  v_id uuid;
  v_count int := 0;
  v_notify_user uuid;
  v_manager record;
  v_preview text := left(coalesce(nullif(p_post_title, ''), 'Bir paylaşımda senden söz edildi'), 120);
begin
  delete from public.cadde_post_mentions where post_id = p_post_id;

  if p_mentions is null or jsonb_typeof(p_mentions) <> 'array' then
    return 0;
  end if;

  if jsonb_array_length(p_mentions) > v_max then
    raise exception 'cadde_mention_limit';
  end if;

  for v_item in select value from jsonb_array_elements(p_mentions) loop
    v_type := v_item ->> 'type';
    begin
      v_id := (v_item ->> 'id')::uuid;
    exception when others then
      continue;
    end;

    if v_type not in ('user', 'catalog_item', 'cafe', 'carsi_item') or v_id is null then
      continue;
    end if;

    v_notify_user := null;

    if v_type = 'user' then
      if not exists (select 1 from auth.users where id = v_id) then continue; end if;
      v_notify_user := v_id;

    elsif v_type = 'cafe' then
      select host_user_id into v_notify_user
      from public.cadde_cafes
      where id = v_id and status = 'published' and archived_at is null;
      if not found then continue; end if;

    elsif v_type = 'carsi_item' then
      select owner_user_id into v_notify_user
      from public.carsi_items
      where id = v_id and status = 'published' and moderation_status = 'approved' and deleted_at is null;
      if not found then continue; end if;

    elsif v_type = 'catalog_item' then
      if not exists (select 1 from public.catalog_items where id = v_id and status = 'published') then
        continue;
      end if;
    end if;

    insert into public.cadde_post_mentions (post_id, target_type, target_id)
    values (p_post_id, v_type, v_id)
    on conflict do nothing;

    v_count := v_count + 1;

    -- Bildirim: kendine mention bildirim üretmez.
    if v_notify_user is not null and v_notify_user is distinct from p_author_user_id then
      perform public.cadde_notify(
        v_notify_user, p_author_user_id, 'cadde.post.mentioned',
        'Bir paylaşımda senden söz edildi', v_preview,
        'post', p_post_id, jsonb_build_object('targetType', v_type)
      );
    end if;

    -- catalog_item'da bildirim yöneticilerine gider (tek bir sahip yok).
    if v_type = 'catalog_item' then
      for v_manager in
        select user_id from public.catalog_item_managers
        where item_id = v_id and status = 'active' and user_id is distinct from p_author_user_id
      loop
        perform public.cadde_notify(
          v_manager.user_id, p_author_user_id, 'cadde.post.mentioned',
          'Bir paylaşımda işletmenden söz edildi', v_preview,
          'post', p_post_id, jsonb_build_object('targetType', v_type, 'itemId', v_id)
        );
      end loop;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.cadde_sync_post_mentions(uuid, jsonb, uuid, text) from public, anon, authenticated;

-- ── 6. Mention arama (composer autocomplete) ─────────────────────────────────
-- Türkçe-toleranslı: "uskudar" yazınca "Üsküdar" bulunur (unaccent iki tarafta da).
create or replace function public.search_cadde_mentions_v1(
  p_query text,
  p_limit integer default 8
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_q text := lower(unaccent(trim(coalesce(p_query, ''))));
  v_limit int := least(greatest(coalesce(p_limit, 8), 1), 20);
  v_result jsonb;
begin
  if v_uid is null or length(v_q) < 2 then
    return '[]'::jsonb;
  end if;

  with matches as (
    -- Üyeler: yalnız full_name'i public görünürlükte olanlar.
    select 'user' as type, upa.user_id as id, upa.value_text as label,
           'Üye'::text as subtitle, 1 as rank_group
    from public.user_profile_attributes upa
    join public.afs_attributes a on a.id = upa.attribute_id
    where a.key = 'full_name'
      and upa.visibility = 'public'
      and coalesce(upa.value_text, '') <> ''
      and lower(unaccent(upa.value_text)) like '%' || v_q || '%'

    union all

    select 'catalog_item', ci.id, ci.title, 'İşletme / Kuruluş', 2
    from public.catalog_items ci
    where ci.status = 'published'
      and lower(unaccent(ci.title)) like '%' || v_q || '%'

    union all

    select 'cafe', c.id, c.title, 'Cafe', 3
    from public.cadde_cafes c
    where c.status = 'published' and c.archived_at is null and c.is_active = true
      and lower(unaccent(c.title)) like '%' || v_q || '%'

    union all

    select 'carsi_item', i.id, i.title, 'Çarşı ilanı', 4
    from public.carsi_items i
    where i.status = 'published' and i.moderation_status = 'approved' and i.deleted_at is null
      and (i.expires_at is null or i.expires_at > now())
      and lower(unaccent(i.title)) like '%' || v_q || '%'
  ),
  ranked as (
    select *,
      -- Baştan eşleşme daha alakalı sayılır.
      case when lower(unaccent(label)) like v_q || '%' then 0 else 1 end as prefix_rank
    from matches
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'type', type, 'id', id, 'label', label, 'subtitle', subtitle
  ) order by prefix_rank, rank_group, label), '[]'::jsonb)
  into v_result
  from (select * from ranked order by prefix_rank, rank_group, label limit v_limit) capped;

  return v_result;
end;
$$;

revoke all on function public.search_cadde_mentions_v1(text, integer) from public, anon;
grant execute on function public.search_cadde_mentions_v1(text, integer) to authenticated;

-- ── 7. Trend etiketler ───────────────────────────────────────────────────────
create or replace function public.list_trending_cadde_hashtags_v1(
  p_limit integer default 10,
  p_days integer default 7
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int := least(greatest(coalesce(p_limit, 10), 1), 30);
  v_days int := least(greatest(coalesce(p_days, 7), 1), 90);
  v_result jsonb;
begin
  if v_uid is null then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'tag', t.tag, 'displayTag', t.display_tag, 'postCount', t.post_count
  ) order by t.post_count desc, t.tag), '[]'::jsonb)
  into v_result
  from (
    select h.tag, h.display_tag, count(*)::int as post_count
    from public.cadde_post_hashtags ph
    join public.cadde_hashtags h on h.tag = ph.tag
    join public.cadde_posts p on p.id = ph.post_id
    where p.status = 'published' and p.visibility = 'public'
      and coalesce(p.published_at, p.created_at) > now() - make_interval(days => v_days)
    group by h.tag, h.display_tag
    order by count(*) desc, h.tag
    limit v_limit
  ) t;

  return v_result;
end;
$$;

revoke all on function public.list_trending_cadde_hashtags_v1(integer, integer) from public, anon;
grant execute on function public.list_trending_cadde_hashtags_v1(integer, integer) to authenticated;


-- ── 8. create_cadde_post_v1 + p_mentions, hashtag/mention senkronu ───────────
-- Gövde migration 001'deki sürümden TÜRETİLDİ (elle kopyalanmadı): tek fark
-- p_mentions parametresi ve her iki INSERT yolunda iki senkron çağrısı.
-- Hashtag gövdeden otomatik çıkarılır; mention'lar composer'ın seçtiği hedeflerdir.
drop function if exists public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[], uuid, text, jsonb);

create or replace function public.create_cadde_post_v1(
  p_post_type text,
  p_title text,
  p_body text,
  p_country text,
  p_city text,
  p_is_bridge boolean,
  p_need_category text default null,
  p_interests text[] default null,
  p_cafe_id uuid default null,
  p_diaspora_key text default 'tr',
  p_media jsonb default '[]'::jsonb,
  p_mentions jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_body text := trim(coalesce(p_body, ''));
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_need text := nullif(trim(coalesce(p_need_category, '')), '');
  v_interests text[] := coalesce(p_interests, '{}');
  v_diaspora text := coalesce(nullif(trim(coalesce(p_diaspora_key, '')), ''), 'tr');
  v_media jsonb := coalesce(p_media, '[]'::jsonb);
  v_country_id uuid;
  v_city_id uuid;
  v_is_privileged boolean;
  v_post_id uuid;
  v_valid_count int;
  v_cafe public.cadde_cafes%rowtype;
  v_is_cafe_member boolean;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if public.is_cadde_banned(v_uid) then
    raise exception 'cadde_banned';
  end if;

  if v_diaspora not in ('tr', 'in', 'cn', 'ph') then
    raise exception 'cadde_invalid_diaspora';
  end if;

  if not public.is_cadde_profile_complete(v_uid) then
    if public.cadde_phone_required() and not public.is_phone_verified(v_uid) then
      raise exception 'phone_verification_required';
    end if;
    raise exception 'cadde_profile_incomplete';
  end if;

  if not public.has_cadde_feature(v_uid, 'cadde.post.create') then
    raise exception 'cadde_post_permission_denied';
  end if;

  if p_post_type not in ('text', 'question', 'offer', 'event') then
    raise exception 'cadde_invalid_post_type';
  end if;

  -- Medya varsa gövde zorunluluğu gevşer: salt görsel/video paylaşımı meşrudur.
  if jsonb_array_length(v_media) = 0 and length(v_body) < 1 then
    raise exception 'cadde_invalid_body';
  end if;
  if length(v_body) > 4000 then
    raise exception 'cadde_invalid_body';
  end if;

  if v_title is not null and length(v_title) > 160 then
    raise exception 'cadde_invalid_title';
  end if;

  v_media := public.cadde_validate_media(v_media);

  v_interests := (select coalesce(array_agg(distinct k), '{}') from unnest(v_interests) k where trim(k) <> '');
  if cardinality(v_interests) > 3 then
    raise exception 'cadde_invalid_interests';
  end if;
  if cardinality(v_interests) > 0 then
    select count(*) into v_valid_count
    from public.cadde_interest_catalog c
    where c.key = any(v_interests) and c.is_active = true;
    if v_valid_count <> cardinality(v_interests) then
      raise exception 'cadde_invalid_interests';
    end if;
  end if;

  if v_need is not null and not exists (
    select 1 from public.cadde_interest_catalog c where c.key = v_need and c.is_active = true
  ) then
    raise exception 'cadde_invalid_need_category';
  end if;

  v_is_privileged := public.is_admin(v_uid) or public.is_moderator(v_uid);

  if p_cafe_id is not null then
    select * into v_cafe from public.cadde_cafes where id = p_cafe_id;
    if v_cafe.id is null or v_cafe.status <> 'published' or v_cafe.content_mode <> 'real' then
      raise exception 'cadde_cafe_not_found';
    end if;
    if v_cafe.archived_at is not null or not v_cafe.is_active then
      raise exception 'cadde_cafe_archived';
    end if;
    if now() >= v_cafe.ends_at then
      raise exception 'cadde_cafe_ended';
    end if;

    v_is_cafe_member := exists (
      select 1 from public.cadde_cafe_members
      where cafe_id = p_cafe_id and user_id = v_uid and status = 'approved'
    );
    if not (v_is_cafe_member or v_cafe.host_user_id = v_uid or v_is_privileged) then
      raise exception 'cadde_cafe_membership_required';
    end if;

    insert into public.cadde_posts (
      author_user_id, content_mode, status, post_type,
      title, body, country_id, city_id, is_bridge,
      need_category, published_at, cafe_id, visibility, diaspora_key, media
    )
    values (
      v_uid, 'real', 'published', p_post_type,
      v_title, v_body, v_cafe.country_id, v_cafe.city_id, v_cafe.is_bridge,
      v_need, now(), p_cafe_id, 'cafe', v_cafe.diaspora_key, v_media
    )
    returning id into v_post_id;

    insert into public.cadde_post_interests (post_id, interest_key)
    select v_post_id, k from unnest(v_interests) k;

    perform public.cadde_sync_post_hashtags(v_post_id, v_body);
    perform public.cadde_sync_post_mentions(v_post_id, p_mentions, v_uid, coalesce(v_title, left(v_body, 120)));

    return v_post_id;
  end if;

  select c.id into v_country_id
  from public.cadde_countries c
  where c.name = nullif(trim(coalesce(p_country, '')), '') and c.is_active = true
  limit 1;

  select ci.id into v_city_id
  from public.cadde_cities ci
  where ci.name = nullif(trim(coalesce(p_city, '')), '')
    and (v_country_id is null or ci.country_id = v_country_id)
    and ci.is_active = true
  limit 1;

  if p_is_bridge and not public.can_post_kopru(v_uid) then
    raise exception 'cadde_bridge_permission_denied';
  end if;

  if not p_is_bridge
     and public.is_tr_resident(v_uid)
     and not v_is_privileged
     and (v_country_id is null
          or v_country_id not in (select id from public.cadde_countries where code = 'TR')) then
    raise exception 'cadde_tr_scope_restricted';
  end if;

  insert into public.cadde_posts (
    author_user_id, content_mode, status, post_type,
    title, body, country_id, city_id, is_bridge,
    need_category, published_at, diaspora_key, media
  )
  values (
    v_uid, 'real', 'published', p_post_type,
    v_title, v_body, v_country_id, v_city_id, coalesce(p_is_bridge, false),
    v_need, now(), v_diaspora, v_media
  )
  returning id into v_post_id;

  insert into public.cadde_post_interests (post_id, interest_key)
  select v_post_id, k from unnest(v_interests) k;

  perform public.cadde_sync_post_hashtags(v_post_id, v_body);
  perform public.cadde_sync_post_mentions(v_post_id, p_mentions, v_uid, coalesce(v_title, left(v_body, 120)));

  return v_post_id;
end;
$$;

revoke all on function public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[], uuid, text, jsonb, jsonb) from public, anon;
grant execute on function public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[], uuid, text, jsonb, jsonb) to authenticated;

commit;
