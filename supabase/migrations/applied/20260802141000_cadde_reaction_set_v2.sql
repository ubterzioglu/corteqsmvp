-- Cadde F15: reaction set v2.
-- Eski `idea` tepkileri kullanıcı kararıyla `unsure` değerine taşınır.

begin;

alter table public.cadde_post_reactions
  drop constraint if exists cadde_post_reactions_reaction_type_check;

alter table public.cadde_post_reactions
  add constraint cadde_post_reactions_reaction_type_check
  check (reaction_type in ('like', 'support', 'idea', 'love', 'haha', 'unsure'));

update public.cadde_post_reactions
set reaction_type = 'unsure'
where reaction_type = 'idea';

alter table public.cadde_post_reactions
  drop constraint if exists cadde_post_reactions_reaction_type_check;

alter table public.cadde_post_reactions
  add constraint cadde_post_reactions_reaction_type_check
  check (reaction_type in ('like', 'love', 'haha', 'support', 'unsure'));

-- Toggle: varsa kaldırır (false), yoksa ekler (true) + sahibine bildirim.
create or replace function public.toggle_cadde_reaction_v1(
  p_post_id uuid,
  p_reaction_type text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_post public.cadde_posts%rowtype;
  v_existing uuid;
  v_recent int;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if public.is_cadde_banned(v_uid) then
    raise exception 'cadde_banned';
  end if;

  if p_reaction_type not in ('like', 'love', 'haha', 'support', 'unsure') then
    raise exception 'cadde_invalid_reaction';
  end if;

  select * into v_post from public.cadde_posts where id = p_post_id;
  if v_post.id is null or v_post.status <> 'published' then
    raise exception 'cadde_post_not_found';
  end if;

  select id into v_existing
  from public.cadde_post_reactions
  where post_id = p_post_id and user_id = v_uid and reaction_type = p_reaction_type;

  if v_existing is not null then
    delete from public.cadde_post_reactions where id = v_existing;
    return false;
  end if;

  if not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    select count(*) into v_recent
    from public.cadde_post_reactions
    where user_id = v_uid and created_at > now() - interval '1 minute';
    if v_recent >= public.cadde_setting_int('cadde.reaction.minute_limit', 30) then
      raise exception 'cadde_rate_limit';
    end if;
  end if;

  insert into public.cadde_post_reactions (post_id, user_id, reaction_type)
  values (p_post_id, v_uid, p_reaction_type);

  perform public.cadde_notify(
    v_post.author_user_id, v_uid, 'cadde.reaction.created',
    'Paylaşımına reaksiyon geldi',
    case p_reaction_type
      when 'like' then 'Beğendim'
      when 'love' then 'Kalp'
      when 'haha' then 'Gülme'
      when 'support' then 'Destek'
      else 'Emin olamadım'
    end,
    'post', p_post_id,
    jsonb_build_object('reactionType', p_reaction_type)
  );

  return true;
end;
$$;

revoke all on function public.toggle_cadde_reaction_v1(uuid, text) from public, anon;
grant execute on function public.toggle_cadde_reaction_v1(uuid, text) to authenticated;

commit;
