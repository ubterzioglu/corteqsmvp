-- F19 / m12: Cadde paylaşım kaydı + share_count.
-- Paylaşım UI'si Web Share veya link kopyalama sonrası bu RPC'yi çağırır.

begin;

create table if not exists public.cadde_post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.cadde_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('web_share', 'copy_link')),
  created_at timestamptz not null default now()
);

alter table public.cadde_post_shares enable row level security;

grant select on table public.cadde_post_shares to authenticated;

drop policy if exists "cadde post shares self read" on public.cadde_post_shares;
create policy "cadde post shares self read"
on public.cadde_post_shares for select
using (auth.uid() = user_id or public.is_admin(auth.uid()) or public.is_moderator(auth.uid()));

create index if not exists cadde_post_shares_post_idx
  on public.cadde_post_shares (post_id, created_at desc);

create index if not exists cadde_post_shares_user_recent_idx
  on public.cadde_post_shares (user_id, created_at desc);

alter table public.cadde_posts
  add column if not exists share_count integer not null default 0;

update public.cadde_posts p
set share_count = s.count
from (
  select post_id, count(*)::integer as count
  from public.cadde_post_shares
  group by post_id
) s
where p.id = s.post_id;

insert into public.cadde_settings (key, value)
values ('cadde.share.minute_limit', '20'::jsonb)
on conflict (key) do nothing;

create or replace function public.record_cadde_share_v1(
  p_post_id uuid,
  p_channel text
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_post public.cadde_posts%rowtype;
  v_recent int;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if public.is_cadde_banned(v_uid) then
    raise exception 'cadde_banned';
  end if;

  if p_channel not in ('web_share', 'copy_link') then
    raise exception 'cadde_invalid_share_channel';
  end if;

  select * into v_post
  from public.cadde_posts
  where id = p_post_id;

  if v_post.id is null or v_post.status <> 'published' then
    raise exception 'cadde_share_post_not_found';
  end if;

  if not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    select count(*) into v_recent
    from public.cadde_post_shares
    where user_id = v_uid and created_at > now() - interval '1 minute';

    if v_recent >= public.cadde_setting_int('cadde.share.minute_limit', 20) then
      raise exception 'cadde_share_rate_limited';
    end if;
  end if;

  insert into public.cadde_post_shares (post_id, user_id, channel)
  values (p_post_id, v_uid, p_channel);

  update public.cadde_posts
  set share_count = share_count + 1
  where id = p_post_id;
end;
$$;

revoke all on function public.record_cadde_share_v1(uuid, text) from public, anon;
grant execute on function public.record_cadde_share_v1(uuid, text) to authenticated;

commit;
