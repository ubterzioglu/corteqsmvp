-- G12 · Dijital Gruplar: durum makinesi (tek geçiş kapısı) + moderasyon logu
--
-- ═══ AMAÇ ═══
-- `whatsapp_landings.listing_status` (G10'da eklendi) bugüne dek yalnız G10 geri
-- doldurmasıyla yazıldı. Bu migration onu bir DURUM MAKİNESİNE bağlar:
--   • durum değişiminin TEK kapısı `set_group_status_v1(...)` RPC'sidir,
--   • her geçiş `group_moderation_log`'a yazılır (kabul testi #12),
--   • doğrudan `update ... set listing_status` bir trigger ile YASAKLANIR.
--
-- ═══ DEĞERLERİN KAYNAĞI (uydurulan kural YOK) ═══
-- Geçiş tablosu `docs/dijital-gruplar/02_motor-tasarimi.md` §2'den birebir:
--   gönderim → pending_review (varsayılan, INSERT yolu — bu RPC'nin işi değil)
--   gönderim → published      (hızlı şerit, INSERT yolu — G18)
--   pending_review → published | rejected        (moderatör kararı)
--   published → hidden (link_dead | reports | owner_request)
--   published → suspended (2. ihlal)             (30 gün sonra otomatik published)
--   hidden → published      (link düzelir / şikayet reddedilir)
--   suspended → published   (süre dolar)
--   herhangi → removed      (3. ihlal veya kırmızı çizgi 2/4/6) — removed KALICIDIR
-- Askı süresi (30 gün) §2'den; ürün sayısı olduğu için G09 `group_settings`
-- doktrinine uyup `groups.suspension_days` anahtarından okunur (kodda sabit yok).
--
-- ═══ BU MIGRATION SALT EKLEMEDİR ═══
-- Hiçbir kolon/tablo/politika DÜŞÜRÜLMEZ. Legacy `status` kolonu ve eski moderasyon
-- paketi DEĞİŞMEDEN çalışmaya devam eder: guard trigger yalnız `listing_status`
-- gerçekten değişirse engel olur; eski paket `status`'ü günceller, `listing_status`'e
-- dokunmaz → guard izin verir. İki durum sistemi G10c'ye dek paralel yaşar
-- (G03a/b/c deseni: önce hedefi kur, göç et, sonra eskisini kaldır).
--
-- ═══ YETKİ ═══
--   service_role (cron/edge)   → herhangi yasal geçiş (actor_kind='system')
--   is_admin(kullanıcı)        → herhangi yasal geçiş (actor_kind='moderator')
--   doğrulanmış sahip          → YALNIZ published→hidden(owner_request) (§3.C)
--   diğer (anon/authenticated) → group_forbidden
-- Bayrak (`group_status.via_rpc`) yalnız bu RPC tarafından, transaction-local açılır;
-- PostgREST istemcisi özel GUC koyamaz, yani dışarıdan açılamaz.

begin;

-- ── 1) Moderasyon logu (tasarım §4: kim · ne zaman · önce · sonra · not) ────

create table if not exists public.group_moderation_log (
  id bigint generated always as identity primary key,
  landing_id uuid not null references public.whatsapp_landings(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  note text,
  actor_uid uuid references auth.users(id) on delete set null,
  actor_kind text not null default 'system'
    check (actor_kind in ('system', 'moderator', 'owner')),
  created_at timestamptz not null default now()
);

comment on table public.group_moderation_log is
  'Grup listing_status durum makinesi geçiş kaydı (G12, tasarım §4). Her durum '
  'değişikliği set_group_status_v1 tarafından buraya yazılır; doğrudan yazım yoktur. '
  'İstemci erişimi kapalı, admin select politikalı.';

create index if not exists group_moderation_log_landing_idx
  on public.group_moderation_log (landing_id, created_at desc);

alter table public.group_moderation_log enable row level security;
revoke all on table public.group_moderation_log from anon, authenticated;

drop policy if exists group_moderation_log_admin_select on public.group_moderation_log;
create policy group_moderation_log_admin_select on public.group_moderation_log
  for select to authenticated using (public.is_admin(auth.uid()));

-- ── 2) Askı süresi ayarı (tasarım §2: suspended 30 gün) ─────────────────────

insert into public.group_settings (key, value)
values ('groups.suspension_days', '30'::jsonb)
on conflict (key) do nothing;

-- ── 3) Geçiş yasallığı (tasarım §2 geçiş tablosu birebir) ───────────────────

create or replace function public.group_status_transition_allowed(p_from text, p_to text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    -- herhangi → removed (3. ihlal veya kırmızı çizgi 2/4/6); removed kalıcıdır
    (p_to = 'removed' and p_from <> 'removed')
    -- moderatör kararı
    or (p_from = 'pending_review' and p_to in ('published', 'rejected'))
    -- published → hidden (link_dead/reports/owner_request) · suspended (2. ihlal)
    or (p_from = 'published' and p_to in ('hidden', 'suspended'))
    -- hidden → published (link düzeldi / şikayet reddedildi)
    or (p_from = 'hidden' and p_to = 'published')
    -- suspended → published (30 gün doldu)
    or (p_from = 'suspended' and p_to = 'published');
$$;

comment on function public.group_status_transition_allowed(text, text) is
  'Durum makinesi geçiş tablosu (tasarım §2). removed KALICIDIR (çıkış yok); '
  'rejected yalnız removed''a gidebilir; published→rejected YOKTUR. '
  'set_group_status_v1 bunu zorunlu kılar.';

-- ── 4) TEK geçiş kapısı ──────────────────────────────────────────────────────

create or replace function public.set_group_status_v1(
  p_landing_id uuid,
  p_to_status text,
  p_reason text default null,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text := auth.role();
  v_from text;
  v_owner uuid;
  v_ownership text;
  v_is_admin boolean;
  v_is_service boolean;
  v_is_owner boolean;
  v_actor_kind text;
  v_suspension_days integer;
begin
  -- hedef durum geçerli mi (G10 CHECK ile aynı altı ad). ⚠️ NULL-safe: SQL'de
  -- `null not in (...)` NULL döner (TRUE değil), `if NULL` raise'i atlardı.
  if p_to_status is null or p_to_status not in ('pending_review', 'published', 'rejected', 'hidden', 'suspended', 'removed') then
    raise exception 'group_invalid_status';
  end if;

  -- hidden'a geçiş bir gizleme sebebi taşımak zorunda (tasarım §2). NULL-safe.
  if p_to_status = 'hidden' and (p_reason is null or p_reason not in ('link_dead', 'reports', 'owner_request')) then
    raise exception 'group_hidden_reason_required';
  end if;

  select listing_status, owner_user_id, ownership
    into v_from, v_owner, v_ownership
  from public.whatsapp_landings
  where id = p_landing_id
  for update;

  if not found then
    raise exception 'group_not_found';
  end if;

  -- no-op: aynı duruma geçiş log YAZMAZ, sessizce döner
  if v_from = p_to_status then
    return v_from;
  end if;

  -- geçiş yasal mı
  if not public.group_status_transition_allowed(v_from, p_to_status) then
    raise exception 'group_illegal_transition';
  end if;

  -- yetki
  v_is_admin := public.is_admin(v_uid);
  v_is_service := (v_role = 'service_role');
  v_is_owner := (v_ownership = 'verified' and v_owner is not null and v_owner = v_uid);

  if v_is_service then
    v_actor_kind := 'system';
  elsif v_is_admin then
    v_actor_kind := 'moderator';
  elsif v_is_owner and p_to_status = 'hidden' and p_reason = 'owner_request' then
    v_actor_kind := 'owner';
  else
    raise exception 'group_forbidden';
  end if;

  v_suspension_days := public.group_setting_int('groups.suspension_days', 30);

  -- guard trigger'ı bu transaction için aç, güncelle, sonra kapat (savunma)
  perform set_config('group_status.via_rpc', 'on', true);

  update public.whatsapp_landings
  set
    listing_status = p_to_status,
    hidden_reason = case when p_to_status = 'hidden' then p_reason else null end,
    suspended_until = case
      when p_to_status = 'suspended' then now() + (interval '1 day' * v_suspension_days)
      else null
    end,
    published_at = case
      when p_to_status = 'published' then coalesce(published_at, now())
      else published_at
    end
  where id = p_landing_id;

  perform set_config('group_status.via_rpc', '', true);

  -- kabul testi #12: her durum değişikliği logda
  insert into public.group_moderation_log
    (landing_id, from_status, to_status, reason, note, actor_uid, actor_kind)
  values
    (p_landing_id, v_from, p_to_status, p_reason, p_note, v_uid, v_actor_kind);

  return p_to_status;
end;
$$;

comment on function public.set_group_status_v1(uuid, text, text, text) is
  'Grup yayın durumunu değiştiren TEK kapı (G12). Geçiş tablosu (tasarım §2) ve '
  'yetki zorunlu; her değişim group_moderation_log''a yazılır. Doğrudan '
  'update...set listing_status trg_guard_listing_status tarafından reddedilir. '
  'Yeni listing_status''i döner.';

revoke all on function public.set_group_status_v1(uuid, text, text, text) from public, anon;
grant execute on function public.set_group_status_v1(uuid, text, text, text) to authenticated, service_role;

-- ── 5) Guard: doğrudan listing_status update'i YASAK ────────────────────────

create or replace function public.whatsapp_landings_guard_listing_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- RPC yolu: transaction-local bayrak açıksa izin ver
  if coalesce(current_setting('group_status.via_rpc', true), '') = 'on' then
    return new;
  end if;
  -- Eski paket legacy `status`'ü günceller, listing_status'ü DEĞİŞTİRMEZ → serbest.
  -- Yalnız listing_status gerçekten değişiyorsa engelle.
  if new.listing_status is distinct from old.listing_status then
    raise exception 'group_status_direct_update_forbidden';
  end if;
  return new;
end;
$$;

comment on function public.whatsapp_landings_guard_listing_status() is
  'listing_status''i doğrudan update''e karşı korur (G12). Yalnız '
  'set_group_status_v1''in açtığı transaction-local bayrakla geçilir.';

drop trigger if exists trg_guard_listing_status on public.whatsapp_landings;
create trigger trg_guard_listing_status
  before update on public.whatsapp_landings
  for each row execute function public.whatsapp_landings_guard_listing_status();

comment on trigger trg_guard_listing_status on public.whatsapp_landings is
  'listing_status yalnız set_group_status_v1 ile değişir (G12).';

commit;
