-- G23 · Dijital Gruplar: 8 bildirim metni (tasarım §9) — outbox + trigger zinciri
--
-- ═══ OLAY → ALICI → METİN (tasarım §9 birebir; metinler edge şablonunda) ═══
--   group_submission_received  Ekleyen        "Grubun alındı. İnceleme genelde 24 saat sürer."
--   group_published            Ekleyen+Sahip  "{Grup} yayında. Sayfanı paylaşmak için hazır: {link}"
--   group_rejected             Ekleyen        "{Grup} yayınlanamadı. Sebep: {sebep}. Grup Sözü: {link}"
--   group_ownership_verified   Sahip          "Artık {Grup} sayfasının sahibisin. Kodu grup adından silebilirsin."
--   group_post_pending         Sahip          "{Grup} sayfasında onay bekleyen {n} gönderi var; 48 saat…"
--   group_link_dead            Sahip          "{Grup} davet linkin çalışmıyor, grup geçici olarak gizlendi…"
--   group_score_badge          Sahip          "Tebrikler, {Grup} Onaylı Grup oldu. Rozet görselin hazır: {link}"
--   group_strike_warning       Sahip          "{Grup} için bir ihlal kaydı oluştu: {sebep}…"
--
-- ═══ KARARLAR ═══
--   • ⚠️ outbox `event_type` CHECK'i canlıda 9 değere kilitliydi (KR09 dersi:
--     TS birliğini tek başına genişletirsen RPC reddeder, kayıt SESSİZCE
--     kaybolur) → CHECK 8 yeni değeri alacak şekilde GENİŞLETİLİR (eski 9 korunur).
--   • Kuyruğa yazım TRIGGER zinciriyle: fonksiyon redefine YOK (G12/G13/G15/G16/
--     G17/G18 kapalı batch fonksiyonlarına dokunulmaz — davranışları aynı kalır).
--   • Hızlı şerit yayınında ÇİFT mail gitmez: INSERT trigger'ı `listing_status=
--     'published'` gelirse doğrudan `group_published` yazar ("alındı"yı atlar);
--     `group_moderation_log` trigger'ı `from_status IS NULL` satırları (fast_lane
--     logu) ATLAR. Moderatör yayını (pending_review→published) log trigger'ından gider.
--   • hidden(link_dead)/suspended→published geri açılışları da `group_published`
--     üretir ("grubun tekrar yayında" doğru haber; tasarımın tek yayın metni var).
--   • Sahip yoksa (unclaimed grupta link_dead/strike) alıcı `submitted_by`'a düşer
--     (design "Sahip" der; sahipsiz grupta tek muhatap ekleyendir — kimse yoksa
--     satır hiç yazılmaz, sessiz düşme YERİNE).
--   • `group_post_pending` günde GRUP BAŞINA TEK mail (dedupe_key gün damgalı) —
--     {n} güncel sayıyı taşır; spam yok.
--   • `corteqs.skip_group_notify=on` bayrağı: G11/G10c toplu veri işlemleri
--     bildirim üretmesin (career `skip_career_notify` deseni).
--   • 🔴 KURAL 8: payload'a davet linki/invite_code YAZILMAZ — yalnız slug
--     (site linki edge'de kurulur) + grup adı + metin alanları. Trigger
--     fonksiyonları `whatsapp_link` kolonuna HİÇ dokunmaz (sözleşme kilitler).
--   • E-posta adresi payload'da (member_welcome deseni); alıcının auth.users
--     maili yoksa satır YAZILMAZ (edge "no_recipient_email" skip'ine düşmez).
--
-- ═══ SALT EKLEME ═══
-- CHECK genişletmesi dışında şema değişikliği YOK; tablo/fonksiyon düşürmez.

begin;

-- ── 1) event_type CHECK: 9 eski + 8 yeni ────────────────────────────────────

alter table public.notification_email_outbox
  drop constraint if exists notification_email_outbox_event_type_check;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_event_type_check
  check (event_type in (
    'new_member', 'admin_update', 'member_welcome',
    'revision_request', 'revision_request_completed',
    'relocation_tool_report', 'relocation_tool_abandonment',
    'radar_scan_digest', 'career_application',
    -- G23 · tasarım §9
    'group_submission_received', 'group_published', 'group_rejected',
    'group_ownership_verified', 'group_post_pending', 'group_link_dead',
    'group_score_badge', 'group_strike_warning'
  ));

-- ── 2) Genel anahtarlar (notification_settings; edge bunlardan okur) ─────────

insert into public.notification_settings (key, value)
values
  ('email.group_submission_received.enabled', 'true'::jsonb),
  ('email.group_published.enabled', 'true'::jsonb),
  ('email.group_rejected.enabled', 'true'::jsonb),
  ('email.group_ownership_verified.enabled', 'true'::jsonb),
  ('email.group_post_pending.enabled', 'true'::jsonb),
  ('email.group_link_dead.enabled', 'true'::jsonb),
  ('email.group_score_badge.enabled', 'true'::jsonb),
  ('email.group_strike_warning.enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- ── 3) Yardımcı: tek enqueue kapısı ─────────────────────────────────────────

create or replace function public.enqueue_group_notification(
  p_event_type text,
  p_dedupe text,
  p_recipient_user uuid,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  -- Toplu veri işlemleri (G11/G10c) bildirim üretmesin (career deseni).
  if coalesce(current_setting('corteqs.skip_group_notify', true), '') = 'on' then
    return;
  end if;
  if p_recipient_user is null then
    return;
  end if;

  select email into v_email from auth.users where id = p_recipient_user;
  if v_email is null or btrim(v_email) = '' then
    return; -- adresi olmayana satır yazılmaz (sessiz skip yerine hiç enqueue yok)
  end if;

  insert into public.notification_email_outbox (event_type, dedupe_key, payload)
  values (p_event_type, p_dedupe, p_payload || jsonb_build_object('email', v_email))
  on conflict (dedupe_key) do nothing;

  if found then
    perform public.poke_notification_dispatcher();
  end if;
end;
$$;

comment on function public.enqueue_group_notification(text, text, uuid, jsonb) is
  'G23 grup bildirimlerinin TEK enqueue kapısı: alıcı mailini auth.users''tan '
  'çözer (yoksa satır yazmaz), dedupe_key ile idempotent, yeni satırda '
  'dispatcher''ı dürtür. 🔴 payload''a davet linki/invite_code KONMAZ (kural 8).';

revoke all on function public.enqueue_group_notification(text, text, uuid, jsonb) from public, anon;
grant execute on function public.enqueue_group_notification(text, text, uuid, jsonb) to authenticated, service_role;

-- ── 4) Trigger: yeni grup kaydı (gönderim alındı / hızlı şerit yayını) ──────

create or replace function public.group_notify_landing_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.submitted_by, new.user_id) is null then
    return new;
  end if;

  if new.listing_status = 'published' then
    -- Hızlı şerit: "alındı"yı atla, doğrudan yayın maili (çift bildirim yok).
    perform public.enqueue_group_notification(
      'group_published',
      'group_published:' || new.id::text || ':submitter',
      coalesce(new.submitted_by, new.user_id),
      jsonb_build_object('group_name', new.group_name, 'slug', new.slug));
    if new.owner_user_id is not null and new.owner_user_id is distinct from new.submitted_by then
      perform public.enqueue_group_notification(
        'group_published',
        'group_published:' || new.id::text || ':owner',
        new.owner_user_id,
        jsonb_build_object('group_name', new.group_name, 'slug', new.slug));
    end if;
  else
    perform public.enqueue_group_notification(
      'group_submission_received',
      'group_submission_received:' || new.id::text,
      coalesce(new.submitted_by, new.user_id),
      jsonb_build_object('group_name', new.group_name, 'slug', new.slug));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_group_notify_landing_insert on public.whatsapp_landings;
create trigger trg_group_notify_landing_insert
  after insert on public.whatsapp_landings
  for each row execute function public.group_notify_landing_insert();

-- ── 5) Trigger: moderasyon logu → yayın/red/link_dead/strike ────────────────

create or replace function public.group_notify_moderation_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landing record;
  v_owner uuid;
  v_reason_text text;
begin
  -- fast_lane log satırı (from_status NULL) INSERT trigger'ında zaten işlendi.
  if new.from_status is null then
    return new;
  end if;

  select w.group_name, w.slug, w.submitted_by, w.user_id, w.owner_user_id
    into v_landing
  from public.whatsapp_landings w
  where w.id = new.landing_id;
  if not found then
    return new;
  end if;
  v_owner := coalesce(v_landing.owner_user_id, v_landing.submitted_by, v_landing.user_id);

  if new.to_status = 'published' then
    perform public.enqueue_group_notification(
      'group_published', 'group_published:' || new.id::text || ':submitter',
      coalesce(v_landing.submitted_by, v_landing.user_id),
      jsonb_build_object('group_name', v_landing.group_name, 'slug', v_landing.slug));
    if v_landing.owner_user_id is not null
       and v_landing.owner_user_id is distinct from v_landing.submitted_by then
      perform public.enqueue_group_notification(
        'group_published', 'group_published:' || new.id::text || ':owner',
        v_landing.owner_user_id,
        jsonb_build_object('group_name', v_landing.group_name, 'slug', v_landing.slug));
    end if;
  elsif new.to_status = 'rejected' then
    perform public.enqueue_group_notification(
      'group_rejected', 'group_rejected:' || new.id::text,
      coalesce(v_landing.submitted_by, v_landing.user_id),
      jsonb_build_object(
        'group_name', v_landing.group_name, 'slug', v_landing.slug,
        'reason', coalesce(nullif(btrim(coalesce(new.note, '')), ''), new.reason, 'belirtilmedi')));
  elsif new.to_status = 'hidden' and new.reason = 'link_dead' then
    perform public.enqueue_group_notification(
      'group_link_dead', 'group_link_dead:' || new.id::text,
      v_owner,
      jsonb_build_object('group_name', v_landing.group_name, 'slug', v_landing.slug));
  elsif new.reason in ('strike_1', 'strike_2', 'strike_3') then
    v_reason_text := case new.reason
      when 'strike_1' then '1. ihlal — uyarı'
      when 'strike_2' then '2. ihlal — 30 gün askı'
      else '3. ihlal — listeden kaldırma'
    end;
    perform public.enqueue_group_notification(
      'group_strike_warning', 'group_strike_warning:' || new.id::text,
      v_owner,
      jsonb_build_object(
        'group_name', v_landing.group_name, 'slug', v_landing.slug,
        'reason', v_reason_text));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_group_notify_moderation_log on public.group_moderation_log;
create trigger trg_group_notify_moderation_log
  after insert on public.group_moderation_log
  for each row execute function public.group_notify_moderation_log();

-- ── 6) Trigger: sahiplik doğrulandı ─────────────────────────────────────────

create or replace function public.group_notify_claim_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landing record;
begin
  select w.group_name, w.slug into v_landing
  from public.whatsapp_landings w
  where w.id = new.landing_id;

  perform public.enqueue_group_notification(
    'group_ownership_verified',
    'group_ownership_verified:' || new.id::text,
    new.user_id,
    jsonb_build_object(
      'group_name', coalesce(v_landing.group_name, 'Grubun'),
      'slug', v_landing.slug));

  return new;
end;
$$;

drop trigger if exists trg_group_notify_claim_verified on public.group_claims;
create trigger trg_group_notify_claim_verified
  after update on public.group_claims
  for each row
  when (new.status = 'verified' and old.status is distinct from 'verified')
  execute function public.group_notify_claim_verified();

-- ── 7) Trigger: onay bekleyen gönderi (günde grup başına tek mail) ──────────

create or replace function public.group_notify_post_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landing record;
  v_count integer;
begin
  select w.group_name, w.slug, w.owner_user_id, w.submitted_by, w.user_id
    into v_landing
  from public.whatsapp_landings w
  where w.id = new.landing_id;
  if not found then
    return new;
  end if;

  select count(*) into v_count
  from public.group_posts
  where landing_id = new.landing_id and post_status = 'pending_group_admin';

  perform public.enqueue_group_notification(
    'group_post_pending',
    -- Gün damgalı dedupe: aynı gruba aynı gün TEK mail (n güncel sayıyı taşır).
    'group_post_pending:' || new.landing_id::text || ':' || to_char(now(), 'YYYY-MM-DD'),
    coalesce(v_landing.owner_user_id, v_landing.submitted_by, v_landing.user_id),
    jsonb_build_object(
      'group_name', v_landing.group_name, 'slug', v_landing.slug, 'n', v_count));

  return new;
end;
$$;

drop trigger if exists trg_group_notify_post_pending on public.group_posts;
create trigger trg_group_notify_post_pending
  after insert on public.group_posts
  for each row
  when (new.post_status = 'pending_group_admin')
  execute function public.group_notify_post_pending();

-- ── 8) Trigger: rozet kazanımı (G17 recompute false→true geçişi) ────────────

create or replace function public.group_notify_badge_earned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enqueue_group_notification(
    'group_score_badge',
    'group_score_badge:' || new.id::text || ':' || to_char(now(), 'YYYY-MM-DD'),
    coalesce(new.owner_user_id, new.submitted_by, new.user_id),
    jsonb_build_object(
      'group_name', new.group_name, 'slug', new.slug, 'score', new.group_score));

  return new;
end;
$$;

drop trigger if exists trg_group_notify_badge_earned on public.whatsapp_landings;
create trigger trg_group_notify_badge_earned
  after update on public.whatsapp_landings
  for each row
  when (new.has_approved_badge is true and coalesce(old.has_approved_badge, false) is false)
  execute function public.group_notify_badge_earned();

commit;
