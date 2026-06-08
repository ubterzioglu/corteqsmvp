begin;

-- ─── get_current_user_features: rfd fallback + user_profiles fallback kaldır ──
-- Tüm üyeler artık user_role_assignments'ta. fallback_profile_role ve rfd gereksiz.
-- scope_role = '*' veya role_key eşleşmesi — eski versiyon sadece exact match yapıyordu.

create or replace function public.get_current_user_features()
returns table(feature_key text, is_enabled boolean, source text)
language sql
security definer
set search_path = public
as $$
  with effective_role as (
    select r.id as role_id, r.key as role_key
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = auth.uid()
    limit 1
  )
  select
    fc.key as feature_key,
    (
      fc.is_active_globally
      and coalesce(ufo.is_enabled, rff.is_enabled, false)
    ) as is_enabled,
    case
      when ufo.user_id is not null then 'override'
      when rff.role_id is not null then 'role_default'
      else 'fallback'
    end as source
  from public.feature_catalog fc
  join effective_role er
    on fc.scope_role = '*'
    or fc.scope_role = er.role_key
  left join public.role_feature_flags rff
    on rff.role_id = er.role_id
   and rff.feature_key = fc.key
  left join public.user_feature_overrides ufo
    on ufo.user_id = auth.uid()
   and ufo.feature_key = fc.key
  order by fc.key;
$$;

-- ─── sync_role_feature_default trigger'ını kaldır ────────────────────────────
-- Bu trigger role_feature_defaults'a otomatik insert yapıyordu.
-- role_feature_defaults kaldırılacağından trigger da gereksiz.

drop trigger if exists trg_sync_role_feature_default_on_catalog_insert on public.feature_catalog;
drop function if exists public.sync_role_feature_default_on_catalog_insert() cascade;

-- ─── FK'ları user_profiles → auth.users(id) olarak değiştir ──────────────────
-- user_profiles kaldırılmadan önce tüm FK bağımlılıkları auth.users'a taşınmalı.
-- Postgres implicit constraint adı: <tablo>_<kolon>_fkey

-- user_role_assignments.user_id
alter table public.user_role_assignments
  drop constraint if exists user_role_assignments_user_id_fkey;
alter table public.user_role_assignments
  add constraint user_role_assignments_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- user_profile_attributes.user_id
alter table public.user_profile_attributes
  drop constraint if exists user_profile_attributes_user_id_fkey;
alter table public.user_profile_attributes
  add constraint user_profile_attributes_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- user_feature_overrides.user_id
alter table public.user_feature_overrides
  drop constraint if exists user_feature_overrides_user_id_fkey;
alter table public.user_feature_overrides
  add constraint user_feature_overrides_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- approval_requests.user_id
alter table public.approval_requests
  drop constraint if exists approval_requests_user_id_fkey;
alter table public.approval_requests
  add constraint approval_requests_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- individual_profile_details.user_id (varsa)
alter table public.individual_profile_details
  drop constraint if exists individual_profile_details_user_id_fkey;
alter table public.individual_profile_details
  add constraint individual_profile_details_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- whatsapp_landing_editors.user_id
alter table public.whatsapp_landing_editors
  drop constraint if exists whatsapp_landing_editors_user_id_fkey;
alter table public.whatsapp_landing_editors
  add constraint whatsapp_landing_editors_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- whatsapp_landing_editors.granted_by → admin_users(user_id) yerine auth.users(id)
alter table public.whatsapp_landing_editors
  drop constraint if exists whatsapp_landing_editors_granted_by_fkey;
alter table public.whatsapp_landing_editors
  add constraint whatsapp_landing_editors_granted_by_fkey
  foreign key (granted_by) references auth.users(id) on delete set null;

-- profile_onboarding_imports.profile_user_id → user_profiles(user_id) yerine auth.users(id)
alter table public.profile_onboarding_imports
  drop constraint if exists profile_onboarding_imports_profile_user_id_fkey;
alter table public.profile_onboarding_imports
  add constraint profile_onboarding_imports_profile_user_id_fkey
  foreign key (profile_user_id) references auth.users(id) on delete set null;

-- cadde_posts.author_user_id → user_profiles yerine auth.users
alter table public.cadde_posts
  drop constraint if exists cadde_posts_author_user_id_fkey;
alter table public.cadde_posts
  add constraint cadde_posts_author_user_id_fkey
  foreign key (author_user_id) references auth.users(id) on delete set null;

-- cadde_post_reactions.user_id → user_profiles yerine auth.users
alter table public.cadde_post_reactions
  drop constraint if exists cadde_post_reactions_user_id_fkey;
alter table public.cadde_post_reactions
  add constraint cadde_post_reactions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- cadde_post_comments.user_id → user_profiles yerine auth.users
alter table public.cadde_post_comments
  drop constraint if exists cadde_post_comments_user_id_fkey;
alter table public.cadde_post_comments
  add constraint cadde_post_comments_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- cadde_cafes.host_user_id → user_profiles yerine auth.users
alter table public.cadde_cafes
  drop constraint if exists cadde_cafes_host_user_id_fkey;
alter table public.cadde_cafes
  add constraint cadde_cafes_host_user_id_fkey
  foreign key (host_user_id) references auth.users(id) on delete set null;

-- cadde_cafe_members.user_id → user_profiles yerine auth.users
alter table public.cadde_cafe_members
  drop constraint if exists cadde_cafe_members_user_id_fkey;
alter table public.cadde_cafe_members
  add constraint cadde_cafe_members_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- ─── SQL fonksiyonlarını güncelle: is_admin + is_admin_user ──────────────────
-- CREATE OR REPLACE ile aynı imza korunur, sadece body değişir.

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = uid
      and r.key ilike 'Admin_%'
  );
$$;

create or replace function public.is_admin_user(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin(check_user_id);
$$;

commit;
