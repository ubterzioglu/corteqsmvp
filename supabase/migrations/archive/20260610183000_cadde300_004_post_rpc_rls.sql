-- Cadde 3.0 Faz 2 (4/4): create_cadde_post_v1 RPC + RLS sıkılaştırma.
-- * Kullanıcı post INSERT'i artık yalnız security-definer RPC üzerinden (direct insert policy kaldırılır).
-- * Admin paneli için eksik olan admin INSERT policy'si eklenir (mevcut bug fix: admin panelden
--   demo/real post eklemek bugüne kadar RLS'e takılıyordu — self-insert policy'si author=auth.uid()
--   ve content_mode='real' şartı koyuyordu).
-- * D-02 (login zorunlu): post/cafe/yorum/reaksiyon/üyelik SELECT'leri authenticated'a daraltılır.
--   countries/cities/billboard/sponsored public read kalır (referans + pazarlama yüzeyi).
-- RPC hata mesajları frontend'de kullanıcı dostu metne çevrilen sabit kodlardır (spec §23).

begin;

create or replace function public.create_cadde_post_v1(
  p_post_type text,
  p_title text,
  p_body text,
  p_country text,
  p_city text,
  p_is_bridge boolean
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
  v_country_id uuid;
  v_city_id uuid;
  v_is_privileged boolean;
  v_post_id uuid;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
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

  if length(v_body) < 1 or length(v_body) > 4000 then
    raise exception 'cadde_invalid_body';
  end if;

  if v_title is not null and length(v_title) > 160 then
    raise exception 'cadde_invalid_title';
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

  v_is_privileged := public.is_admin(v_uid) or public.is_moderator(v_uid);

  if p_is_bridge and not public.can_post_kopru(v_uid) then
    raise exception 'cadde_bridge_permission_denied';
  end if;

  -- CKS §7.1: TR yerleşik kullanıcı normal Cadde'de yalnız @Türkiye'ye paylaşır.
  if not p_is_bridge
     and public.is_tr_resident(v_uid)
     and not v_is_privileged
     and (v_country_id is null
          or v_country_id not in (select id from public.cadde_countries where code = 'TR')) then
    raise exception 'cadde_tr_scope_restricted';
  end if;

  insert into public.cadde_posts (
    author_user_id, content_mode, status, post_type,
    title, body, country_id, city_id, is_bridge
  )
  values (
    v_uid, 'real', 'published', p_post_type,
    v_title, v_body, v_country_id, v_city_id, coalesce(p_is_bridge, false)
  )
  returning id into v_post_id;

  return v_post_id;
end;
$$;

revoke all on function public.create_cadde_post_v1(text, text, text, text, text, boolean) from public, anon;
grant execute on function public.create_cadde_post_v1(text, text, text, text, text, boolean) to authenticated;

-- ── RLS: kullanıcı direct insert kapanır, admin insert açılır ───────────────
drop policy if exists "cadde posts self insert" on public.cadde_posts;

create policy "cadde posts admin insert"
on public.cadde_posts for insert
with check (public.is_admin_user(auth.uid()));

-- ── RLS: SELECT'ler authenticated'a daraltılır (D-02) ───────────────────────
drop policy if exists "cadde posts public read" on public.cadde_posts;
create policy "cadde posts authenticated read"
on public.cadde_posts for select
using (auth.uid() is not null and (status = 'published' or public.is_admin_user(auth.uid())));

drop policy if exists "cadde cafes public read" on public.cadde_cafes;
create policy "cadde cafes authenticated read"
on public.cadde_cafes for select
using (auth.uid() is not null and (status = 'published' or public.is_admin_user(auth.uid())));

drop policy if exists "cadde comments public read" on public.cadde_post_comments;
create policy "cadde comments authenticated read"
on public.cadde_post_comments for select
using (auth.uid() is not null);

drop policy if exists "cadde reactions public read" on public.cadde_post_reactions;
create policy "cadde reactions authenticated read"
on public.cadde_post_reactions for select
using (auth.uid() is not null);

drop policy if exists "cadde cafe members public read" on public.cadde_cafe_members;
create policy "cadde cafe members authenticated read"
on public.cadde_cafe_members for select
using (auth.uid() is not null);

commit;
