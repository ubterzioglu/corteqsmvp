-- Cadde post reaksiyon aktörlerini listeleme RPC'si.
-- "Kimler beğendi?" popover'ı için: belirli bir post'a belirli bir reaksiyonu
-- veren kullanıcıların listesini döner.
--
-- Güvenlik: security definer, çağrı yapan kullanıcı authenticated olmalı.
-- Yalnızca aktif (silinmemiş) reaksiyonlar ve yayınlanmış post'lar döner.
-- RLS: cadde_post_reactions tablosunda authenticated SELECT politikası var.

begin;

create or replace function public.list_cadde_post_reactors_v1(
  p_post_id uuid,
  p_reaction_type text,
  p_limit integer default 50
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  role_label text,
  reacted_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  -- Post var ve yayınlanmış mı?
  -- Reaksiyon tipi geçerli mi? (CADDE_REACTION_TYPES: like, support, unsure)
  -- Limit: 50 varsayılan, max 100 (popover için yeterli)
  select
    r.user_id,
    coalesce(
      -- Profil adını çek: catalog_items.title veya auth.users.raw_user_meta_data->>'full_name'
      (select ci.title from public.catalog_items ci
       join public.catalog_item_managers m on m.item_id = ci.id
       where m.user_id = r.user_id and m.status = 'active' and ci.status = 'published'
       limit 1),
      (select raw_user_meta_data->>'full_name' from auth.users where id = r.user_id),
      'Kullanıcı'
    ) as display_name,
    -- Avatar: catalog_items'te gorsel kolonu YOK (canlida olculdu); popover bas harfe duser.
    null::text as avatar_url,
    -- Rol etiketi: roles.label
    (select r2.label from public.user_role_assignments ura
     join public.roles r2 on r2.id = ura.role_id
     where ura.user_id = r.user_id and ura.status = 'active'
     limit 1) as role_label,
    r.created_at as reacted_at
  from public.cadde_post_reactions r
  join public.cadde_posts p on p.id = r.post_id
  where r.post_id = p_post_id
    and r.reaction_type = p_reaction_type
    and p.status = 'published'
  order by r.created_at desc
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.list_cadde_post_reactors_v1(uuid, text, integer) from public, anon;
grant execute on function public.list_cadde_post_reactors_v1(uuid, text, integer) to authenticated;

comment on function public.list_cadde_post_reactors_v1 is
  'Cadde post reaksiyon aktörlerini listeler (kimler beğendi/destekledi/emin olmadı). '
  'Popover için: p_limit varsayılan 50, max 100. Yalnızca yayınlanmış post ve geçerli reaksiyon tipleri.';

commit;
