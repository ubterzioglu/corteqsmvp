-- Cadde 3.0 Faz 7 (1/1): Bildirim + Moderasyon altyapısı.
-- Spec §17 (bildirim/realtime), §18 (moderasyon), §9.8-9.9; plan R-03.
--
-- * notifications: YENİ TABLO AÇILMAZ (R-03) — mevcut tablo genişletilir
--   (actor_user_id, entity_type, payload). Gevşek "System can insert" policy'si KALDIRILIR;
--   bildirim üretimi yalnız security-definer producer'lardan (cadde_notify) geçer.
--   Alıcı kolonu tarihsel olarak `user_id`dir (recipient); realtime filtresi user_id=eq.<uid>.
--   `related_id` entity id olarak kullanılmaya devam eder (yeniden adlandırılmaz).
-- * Moderasyon: cadde_user_bans + cadde_moderation_queue (spec §9.8) + cadde_reports
--   (plan 'cadde_post_reports' diyordu; RPC entity-generic olduğundan tablo da generic —
--   sapma docs/cadde-300'de not edildi). report → queue upsert → moderator aksiyonu → audit.
-- * BAN UYGULAMASI: is_cadde_banned() has_cadde_feature() içine bağlanır — aktif banlı
--   kullanıcı için TÜM cadde.* feature'ları false döner; böylece post/cafe/carsi/promotion/
--   yorum/reaksiyon RPC'lerinin tamamı tek noktadan kapanır (yazma kısıtı; okuma serbest).
-- * Yorum + reaksiyon mutation'ları RPC'ye taşınır (Faz 2'den beri direct insert'tü);
--   self-insert policy'leri kaldırılır. Rate limitler cadde_settings'ten (ürün kararıyla ayarlanır).
-- * Producer'lar: yorum/reaksiyon → post sahibine; cafe katılım talebi → host'a; üye onayı →
--   üyeye; kampanya incelemesi → sahibine; moderasyon aksiyonu → içerik sahibine.

begin;

-- ── 1. notifications genişletme (R-03) ───────────────────────────────────────
alter table public.notifications
  add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
  add column if not exists entity_type text,
  add column if not exists payload jsonb not null default '{}'::jsonb;

drop policy if exists "System can insert notifications" on public.notifications;

create index if not exists notifications_recipient_idx
  on public.notifications (user_id, is_read, created_at desc);

-- İç producer: kendi kendine bildirim atmaz; tüm cadde producer'ları bunu kullanır.
create or replace function public.cadde_notify(
  p_recipient uuid,
  p_actor uuid,
  p_type text,
  p_title text,
  p_message text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if p_recipient is null or p_recipient = p_actor then
    return;
  end if;
  insert into public.notifications (user_id, actor_user_id, type, title, message, related_id, entity_type, payload)
  values (p_recipient, p_actor, p_type, p_title, p_message, p_entity_id, p_entity_type, coalesce(p_payload, '{}'::jsonb));
end;
$$;

-- ── 2. Moderasyon tabloları (spec §9.8 + generic reports) ────────────────────
create table if not exists public.cadde_user_bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'cadde',
  reason text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.cadde_moderation_queue (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  reason text not null,
  status text not null default 'open',
  risk_score numeric,
  report_count int not null default 1,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  resolution_note text
);

do $$ begin
  alter table public.cadde_moderation_queue
    add constraint cadde_moderation_queue_status_check check (status in ('open', 'resolved'));
exception when duplicate_object then null; end $$;

create table if not exists public.cadde_reports (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, reporter_user_id)
);

create index if not exists cadde_user_bans_active_idx
  on public.cadde_user_bans (user_id, starts_at, ends_at);
create index if not exists cadde_moderation_queue_open_idx
  on public.cadde_moderation_queue (status, created_at desc);
create index if not exists cadde_moderation_queue_entity_idx
  on public.cadde_moderation_queue (entity_type, entity_id);
create index if not exists cadde_reports_entity_idx
  on public.cadde_reports (entity_type, entity_id);

alter table public.cadde_user_bans enable row level security;
alter table public.cadde_moderation_queue enable row level security;
alter table public.cadde_reports enable row level security;

-- Yazmalar RPC/definer'dan; okuma yalnız admin (panel). Reporter kendi raporunu görür.
drop policy if exists "cadde bans admin all" on public.cadde_user_bans;
create policy "cadde bans admin all"
on public.cadde_user_bans for all
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "cadde moderation queue admin all" on public.cadde_moderation_queue;
create policy "cadde moderation queue admin all"
on public.cadde_moderation_queue for all
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "cadde reports reporter read" on public.cadde_reports;
create policy "cadde reports reporter read"
on public.cadde_reports for select
using (reporter_user_id = auth.uid() or public.is_admin_user(auth.uid()));

-- ── 3. Moderatör + ban helper'ları ───────────────────────────────────────────
create or replace function public.is_cadde_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select uid is not null
     and (public.is_admin(uid) or public.is_moderator(uid));
$$;

create or replace function public.is_cadde_banned(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cadde_user_bans
    where user_id = uid
      and scope = 'cadde'
      and starts_at <= now()
      and (ends_at is null or ends_at > now())
  );
$$;

-- BAN KILL-SWITCH: banlı kullanıcı için tüm cadde.* feature'ları kapanır → bütün yazma
-- RPC'leri tek noktadan reddedilir (cadde_post_permission_denied vb. yerine net mesaj
-- için RPC'ler ayrıca is_cadde_banned kontrolü yapabilir; davranış DB'de garanti).
create or replace function public.has_cadde_feature(uid uuid, fkey text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with effective_role as (
    select r.id as role_id, r.key as role_key
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = uid
    limit 1
  )
  select not public.is_cadde_banned(uid)
     and coalesce((
    select fc.is_active_globally and coalesce(ufo.is_enabled, rff.is_enabled, false)
    from public.afs_features fc
    join effective_role er
      on fc.scope_role = '*' or fc.scope_role = er.role_key
    left join public.role_features rff
      on rff.role_id = er.role_id and rff.feature_key = fc.key
    left join public.user_feature_overrides ufo
      on ufo.user_id = uid and ufo.feature_key = fc.key
    where fc.key = fkey
  ), false);
$$;

-- ── 4. Rate limit ayarları (ürün kararıyla güncellenebilir, spec §18.3) ──────
insert into public.cadde_settings (key, value) values
  ('cadde.comment.minute_limit', '5'::jsonb),
  ('cadde.reaction.minute_limit', '30'::jsonb),
  ('cadde.report.daily_limit', '10'::jsonb)
on conflict (key) do nothing;

-- ── 5. Yorum + reaksiyon RPC'leri (direct insert kapanır) ────────────────────
drop policy if exists "cadde comments self insert" on public.cadde_post_comments;
drop policy if exists "cadde reactions self insert" on public.cadde_post_reactions;
-- self update/delete (kendi yorumunu düzenleme/silme, reaksiyon geri çekme RPC'de) korunur.

create or replace function public.create_cadde_comment_v1(
  p_post_id uuid,
  p_body text
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
  v_post public.cadde_posts%rowtype;
  v_recent int;
  v_comment_id uuid;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if public.is_cadde_banned(v_uid) then
    raise exception 'cadde_banned';
  end if;

  if not public.is_cadde_profile_complete(v_uid) then
    if public.cadde_phone_required() and not public.is_phone_verified(v_uid) then
      raise exception 'phone_verification_required';
    end if;
    raise exception 'cadde_profile_incomplete';
  end if;

  if length(v_body) < 1 or length(v_body) > 2000 then
    raise exception 'cadde_invalid_comment';
  end if;

  select * into v_post from public.cadde_posts where id = p_post_id;
  if v_post.id is null or v_post.status <> 'published' then
    raise exception 'cadde_post_not_found';
  end if;

  if not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    select count(*) into v_recent
    from public.cadde_post_comments
    where user_id = v_uid and created_at > now() - interval '1 minute';
    if v_recent >= public.cadde_setting_int('cadde.comment.minute_limit', 5) then
      raise exception 'cadde_rate_limit';
    end if;
  end if;

  insert into public.cadde_post_comments (post_id, user_id, body)
  values (p_post_id, v_uid, v_body)
  returning id into v_comment_id;

  perform public.cadde_notify(
    v_post.author_user_id, v_uid, 'cadde.comment.created',
    'Paylaşımına yorum geldi',
    left(v_body, 140),
    'post', p_post_id,
    jsonb_build_object('commentId', v_comment_id)
  );

  return v_comment_id;
end;
$$;

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

  if p_reaction_type not in ('like', 'support', 'idea') then
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
    case p_reaction_type when 'like' then 'Beğendim' when 'support' then 'Destek' else 'Fikir' end,
    'post', p_post_id,
    jsonb_build_object('reactionType', p_reaction_type)
  );

  return true;
end;
$$;

-- ── 6. report_cadde_entity_v1 ────────────────────────────────────────────────
create or replace function public.report_cadde_entity_v1(
  p_entity_type text,
  p_entity_id uuid,
  p_reason text,
  p_details text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reason text := trim(coalesce(p_reason, ''));
  v_exists boolean;
  v_today int;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if public.is_cadde_banned(v_uid) then
    raise exception 'cadde_banned';
  end if;

  if p_entity_type not in ('post', 'comment', 'cafe', 'carsi_item') then
    raise exception 'cadde_invalid_report_entity';
  end if;

  if length(v_reason) < 3 or length(v_reason) > 200 then
    raise exception 'cadde_invalid_report_reason';
  end if;

  v_exists := case p_entity_type
    when 'post' then exists (select 1 from public.cadde_posts where id = p_entity_id)
    when 'comment' then exists (select 1 from public.cadde_post_comments where id = p_entity_id)
    when 'cafe' then exists (select 1 from public.cadde_cafes where id = p_entity_id)
    when 'carsi_item' then exists (select 1 from public.carsi_items where id = p_entity_id)
  end;
  if not v_exists then
    raise exception 'cadde_entity_not_found';
  end if;

  select count(*) into v_today
  from public.cadde_reports
  where reporter_user_id = v_uid and created_at > now() - interval '24 hours';
  if v_today >= public.cadde_setting_int('cadde.report.daily_limit', 10) then
    raise exception 'cadde_rate_limit';
  end if;

  insert into public.cadde_reports (entity_type, entity_id, reporter_user_id, reason, details)
  values (p_entity_type, p_entity_id, v_uid, v_reason, nullif(trim(coalesce(p_details, '')), ''))
  on conflict (entity_type, entity_id, reporter_user_id) do nothing;

  -- Açık kuyruk kaydı varsa rapor sayısını artır; yoksa aç.
  update public.cadde_moderation_queue
  set report_count = report_count + 1
  where entity_type = p_entity_type and entity_id = p_entity_id and status = 'open';

  if not found then
    insert into public.cadde_moderation_queue (entity_type, entity_id, reason, status)
    values (p_entity_type, p_entity_id, v_reason, 'open');
  end if;
end;
$$;

-- ── 7. admin_moderate_cadde_entity_v1 ────────────────────────────────────────
-- Aksiyonlar: dismiss (kuyruğu kapat) | hide (içeriği gizle) | publish (geri yayınla) |
--             ban_owner (içerik sahibine p_ban_days ban) | unban_owner.
create or replace function public.admin_moderate_cadde_entity_v1(
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_note text default null,
  p_ban_days integer default 7
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_note text := nullif(trim(coalesce(p_note, '')), '');
  v_owner uuid;
begin
  if not public.is_cadde_moderator(v_uid) then
    raise exception 'cadde_moderation_permission_denied';
  end if;

  if p_entity_type not in ('post', 'comment', 'cafe', 'carsi_item') then
    raise exception 'cadde_invalid_report_entity';
  end if;

  if p_action not in ('dismiss', 'hide', 'publish', 'ban_owner', 'unban_owner') then
    raise exception 'cadde_invalid_moderation_action';
  end if;

  v_owner := case p_entity_type
    when 'post' then (select author_user_id from public.cadde_posts where id = p_entity_id)
    when 'comment' then (select user_id from public.cadde_post_comments where id = p_entity_id)
    when 'cafe' then (select host_user_id from public.cadde_cafes where id = p_entity_id)
    when 'carsi_item' then (select owner_user_id from public.carsi_items where id = p_entity_id)
  end;
  if v_owner is null and p_action <> 'dismiss' then
    raise exception 'cadde_entity_not_found';
  end if;

  if p_action = 'hide' then
    case p_entity_type
      when 'post' then update public.cadde_posts set status = 'hidden' where id = p_entity_id;
      when 'comment' then delete from public.cadde_post_comments where id = p_entity_id;
      when 'cafe' then update public.cadde_cafes set status = 'hidden', is_active = false, archived_at = coalesce(archived_at, now()) where id = p_entity_id;
      when 'carsi_item' then update public.carsi_items set moderation_status = 'rejected', status = 'paused', updated_at = now() where id = p_entity_id;
    end case;
  elsif p_action = 'publish' then
    case p_entity_type
      when 'post' then update public.cadde_posts set status = 'published' where id = p_entity_id;
      when 'comment' then null; -- silinen yorum geri getirilemez
      when 'cafe' then update public.cadde_cafes set status = 'published' where id = p_entity_id;
      when 'carsi_item' then update public.carsi_items set moderation_status = 'approved', status = 'published', updated_at = now() where id = p_entity_id;
    end case;
  elsif p_action = 'ban_owner' then
    insert into public.cadde_user_bans (user_id, scope, reason, ends_at, created_by)
    values (v_owner, 'cadde', coalesce(v_note, 'moderasyon aksiyonu'),
            case when coalesce(p_ban_days, 0) > 0 then now() + make_interval(days => p_ban_days) end,
            v_uid);
  elsif p_action = 'unban_owner' then
    update public.cadde_user_bans
    set ends_at = now()
    where user_id = v_owner and scope = 'cadde'
      and starts_at <= now() and (ends_at is null or ends_at > now());
  end if;

  -- Açık kuyruk kayıtlarını kapat (audit notu ile).
  update public.cadde_moderation_queue
  set status = 'resolved', resolved_at = now(), resolved_by = v_uid,
      resolution_note = coalesce(v_note, p_action)
  where entity_type = p_entity_type and entity_id = p_entity_id and status = 'open';

  if p_action in ('hide', 'ban_owner') then
    perform public.cadde_notify(
      v_owner, v_uid, 'cadde.moderation.action',
      case when p_action = 'hide' then 'İçeriğin moderasyon tarafından gizlendi' else 'Hesabına Cadde kısıtlaması uygulandı' end,
      coalesce(v_note, 'Topluluk kurallarını ihlal eden içerik.'),
      p_entity_type, p_entity_id,
      jsonb_build_object('action', p_action)
    );
  end if;
end;
$$;

-- ── 8. Mevcut RPC'lere bildirim producer'ları (imzalar AYNI; create or replace) ──
-- join_cadde_cafe_v1: pending talep → host'a bildirim.
-- approve_cadde_cafe_member_v1: onay/red → üyeye bildirim.
-- admin_review_cadde_promotion_v1: inceleme → kampanya sahibine bildirim.

create or replace function public.join_cadde_cafe_v1(
  p_cafe_id uuid,
  p_referral_code text default null,
  p_answer text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_cafe public.cadde_cafes%rowtype;
  v_policy_error text;
  v_existing public.cadde_cafe_members%rowtype;
  v_answer text := nullif(trim(coalesce(p_answer, '')), '');
  v_referral text := nullif(trim(coalesce(p_referral_code, '')), '');
  v_today_joins integer;
  v_member_id uuid;
  v_status text;
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

  if not public.has_cadde_feature(v_uid, 'cadde.cafe.join') then
    if public.is_cadde_banned(v_uid) then
      raise exception 'cadde_banned';
    end if;
    raise exception 'cadde_cafe_join_permission_denied';
  end if;

  select * into v_existing
  from public.cadde_cafe_members
  where cafe_id = p_cafe_id and user_id = v_uid;

  if v_existing.id is not null then
    if v_existing.status = 'rejected' then
      raise exception 'cadde_cafe_join_denied';
    end if;
    return jsonb_build_object('memberId', v_existing.id, 'status', v_existing.status);
  end if;

  v_policy_error := public.can_join_cadde_cafe(v_uid, p_cafe_id);
  if v_policy_error is not null then
    raise exception '%', v_policy_error;
  end if;

  if not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    select count(*) into v_today_joins
    from public.cadde_cafe_members
    where user_id = v_uid and joined_at > now() - interval '24 hours';
    if v_today_joins >= public.cadde_setting_int('cadde.cafe.daily_join_limit', 10) then
      raise exception 'cadde_rate_limit';
    end if;
  end if;

  select * into v_cafe from public.cadde_cafes where id = p_cafe_id;

  if v_cafe.entry_mode = 'referral' then
    if v_referral is null
       or v_cafe.referral_code_hash is distinct from encode(digest(upper(v_referral), 'sha256'), 'hex') then
      raise exception 'cadde_cafe_invalid_referral';
    end if;
    v_status := 'approved';
  elsif v_cafe.entry_mode = 'approval' then
    if v_answer is null then
      raise exception 'cadde_cafe_answer_required';
    end if;
    v_status := 'pending';
  else
    v_status := 'approved';
  end if;

  insert into public.cadde_cafe_members (cafe_id, user_id, status, answer, approved_at, approved_by)
  values (
    p_cafe_id, v_uid, v_status, v_answer,
    case when v_status = 'approved' then now() end,
    case when v_status = 'approved' then v_uid end
  )
  returning id into v_member_id;

  if v_status = 'pending' then
    perform public.cadde_notify(
      v_cafe.host_user_id, v_uid, 'cadde.cafe.joined',
      'Cafe katılım talebi',
      coalesce(v_answer, 'Yeni katılım talebi bekliyor.'),
      'cafe', p_cafe_id,
      jsonb_build_object('memberId', v_member_id)
    );
  end if;

  return jsonb_build_object('memberId', v_member_id, 'status', v_status);
end;
$$;

create or replace function public.approve_cadde_cafe_member_v1(
  p_member_id uuid,
  p_approve boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_member public.cadde_cafe_members%rowtype;
  v_cafe public.cadde_cafes%rowtype;
  v_approved_count integer;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  select * into v_member from public.cadde_cafe_members where id = p_member_id;
  if v_member.id is null then
    raise exception 'cadde_cafe_member_not_found';
  end if;

  select * into v_cafe from public.cadde_cafes where id = v_member.cafe_id;

  if v_cafe.host_user_id is distinct from v_uid
     and not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    raise exception 'cadde_cafe_owner_required';
  end if;

  if v_member.status <> 'pending' then
    raise exception 'cadde_cafe_not_pending';
  end if;

  if p_approve and v_cafe.capacity is not null then
    select count(*) into v_approved_count
    from public.cadde_cafe_members
    where cafe_id = v_cafe.id and status = 'approved';
    if v_approved_count >= v_cafe.capacity then
      raise exception 'cadde_cafe_full';
    end if;
  end if;

  update public.cadde_cafe_members
  set status = case when p_approve then 'approved' else 'rejected' end,
      approved_at = case when p_approve then now() end,
      approved_by = v_uid
  where id = p_member_id;

  perform public.cadde_notify(
    v_member.user_id, v_uid, 'cadde.cafe.member_approved',
    case when p_approve then 'Cafe katılımın onaylandı' else 'Cafe katılım talebin reddedildi' end,
    v_cafe.title,
    'cafe', v_cafe.id,
    jsonb_build_object('approved', p_approve)
  );
end;
$$;

create or replace function public.admin_review_cadde_promotion_v1(
  p_campaign_id uuid,
  p_approve boolean,
  p_note text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_campaign public.cadde_promotion_campaigns%rowtype;
begin
  if v_uid is null or not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    raise exception 'cadde_admin_required';
  end if;

  select * into v_campaign from public.cadde_promotion_campaigns where id = p_campaign_id;
  if v_campaign.id is null then
    raise exception 'cadde_promotion_not_found';
  end if;
  if v_campaign.status <> 'pending' then
    raise exception 'cadde_promotion_not_pending';
  end if;

  update public.cadde_promotion_campaigns
  set status = case when p_approve then 'approved' else 'rejected' end,
      approved_at = case when p_approve then now() end,
      approved_by = v_uid,
      review_note = nullif(trim(coalesce(p_note, '')), ''),
      updated_at = now()
  where id = p_campaign_id;

  perform public.cadde_notify(
    v_campaign.owner_user_id, v_uid, 'cadde.promotion.approved',
    case when p_approve then 'Tanıtım kampanyan onaylandı' else 'Tanıtım kampanyan reddedildi' end,
    v_campaign.title,
    'promotion', p_campaign_id,
    jsonb_build_object('approved', p_approve, 'note', nullif(trim(coalesce(p_note, '')), ''))
  );
end;
$$;

-- ── 9. Grant'ler ─────────────────────────────────────────────────────────────
revoke all on function public.cadde_notify(uuid, uuid, text, text, text, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.is_cadde_moderator(uuid) from public, anon;
revoke all on function public.is_cadde_banned(uuid) from public, anon;
revoke all on function public.create_cadde_comment_v1(uuid, text) from public, anon;
revoke all on function public.toggle_cadde_reaction_v1(uuid, text) from public, anon;
revoke all on function public.report_cadde_entity_v1(text, uuid, text, text) from public, anon;
revoke all on function public.admin_moderate_cadde_entity_v1(text, uuid, text, text, integer) from public, anon;

grant execute on function public.is_cadde_moderator(uuid) to authenticated;
grant execute on function public.create_cadde_comment_v1(uuid, text) to authenticated;
grant execute on function public.toggle_cadde_reaction_v1(uuid, text) to authenticated;
grant execute on function public.report_cadde_entity_v1(text, uuid, text, text) to authenticated;
grant execute on function public.admin_moderate_cadde_entity_v1(text, uuid, text, text, integer) to authenticated;

commit;
