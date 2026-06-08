begin;

-- is_moderator was querying public.profiles which was dropped in 20260609003000.
-- Rewrite to use user_role_assignments + roles (the canonical source post-migration).
-- Moderators are users with role key starting with 'Admin_' or exactly 'moderator'.

create or replace function public.is_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = uid
      and (r.key ilike 'Admin_%' or r.key = 'moderator')
  );
$$;

comment on function public.is_moderator(uuid) is
  'Returns true for moderators and admins. Uses user_role_assignments (profiles table removed in 20260609003000).';

commit;
