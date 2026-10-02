-- KR09 · Yeni kariyer başvurusunda e-posta bildirimi
--
-- BU MIGRATION SALT EKLEMEDİR. Mevcut bildirim tipleri aynen çalışmaya devam eder.
--
-- ═══ BEŞ PARÇA BİRLİKTE DEĞİŞİR ═══
-- Bildirim hattı dört ayrı yerde tanımlıdır ve biri eksik kalırsa **hata vermez,
-- yalnız mail gitmez**:
--   1. `notification_settings` anahtarı — yoksa `notification_setting_enabled`
--      varsayılana düşer ve olay sessizce kapalı/açık kalır.
--   2. `admin_notification_subscriptions` sütunu — yoksa abone listesi boş döner.
--   3. `admin_get_notification_subscribers` eşlemesi — olay tipi beyaz listede
--      değilse RPC `unknown_event_type` ile DÜŞER ve dağıtıcı o satırı atlar.
--   4. Trigger — kuyruğa satır yazan.
-- Beşincisi repoda: `send-notification-emails/index.ts` içindeki `buildEmail`
-- kolu ve `SETTING_KEY_BY_EVENT` satırı. ⚠️ **Edge function Coolify ile deploy
-- EDİLMEZ**, elle `supabase functions deploy send-notification-emails` gerekir.
--
-- ⚠️ Payload'a **dosya yolu KONMAZ**. Kova private'tır ve maile gömülen bir
-- bağlantı mail kutusunda süresiz kalır; iletilen her kopya başvuranın CV'sine
-- erişim açardı. Mail yalnız panele yönlendirir.

begin;

-- ── 0) Kuyruğun CHECK kısıtı ────────────────────────────────────────────────
--
-- ⚠️ `notification_email_outbox.event_type` CHECK ile kapalı bir listeye kilitli.
-- Yeni olay tipini yalnız TS'te ve trigger'da tanımlamak YETMEZ: insert
-- `23514` ile reddedilir. (`client_error_reports.source` ile aynı sınıf —
-- CLAUDE.md'de yazılı.)
--
-- 🔴 **Bu kısıt BUGÜN CANLIDA BİR KUSUR TAŞIYOR ve burada kapatılıyor:**
-- `radar_scan_digest` listede YOK, ama `supabase/functions/radar-news-scan`
-- (satır 440) tam da o tiple kuyruğa yazmaya çalışıyor. Ölçüldü (02.10):
-- kuyrukta `radar_scan_digest` satırı **0** — yani özellik 19 Eylül'de
-- kurulduğundan beri radar özet maili HİÇ gönderilmemiş, insert her seferinde
-- sessizce reddedilmiş. Değer listeye eklendi.
--
-- Not: `relocation_tool_report` / `relocation_tool_abandonment` listede zaten var.

alter table public.notification_email_outbox
  drop constraint if exists notification_email_outbox_event_type_check;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_event_type_check
  check (event_type = any (array[
    'new_member',
    'admin_update',
    'member_welcome',
    'revision_request',
    'revision_request_completed',
    'relocation_tool_report',
    'relocation_tool_abandonment',
    'radar_scan_digest',
    'career_application'
  ]));

-- ── 1) Bildirim ayarı (varsayılan AÇIK) ─────────────────────────────────────

insert into public.notification_settings (key, value)
values ('email.career_application.enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- ── 2) Abonelik sütunu ──────────────────────────────────────────────────────
-- Varsayılan `true`: bugünkü iki abone de kariyer başvurusu bildirimini alır.
-- Kapatmak panelden tek tıktır; açılmamış olması "bildirim hiç gitmedi"
-- şikâyetine dönüşürdü.

alter table public.admin_notification_subscriptions
  add column if not exists career_application_email boolean not null default true;

-- ── 3) Alıcı çözücüye yeni olay tipi ────────────────────────────────────────

create or replace function public.admin_get_notification_subscribers(p_event_type text)
returns table(user_id uuid, email text)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if p_event_type not in (
    'new_member', 'admin_update', 'revision_request',
    'revision_request_completed', 'radar_scan_digest', 'career_application'
  ) then
    raise exception 'unknown_event_type' using errcode = '22023';
  end if;

  return query
  select s.user_id, au.email::text
  from public.admin_notification_subscriptions s
  join auth.users au on au.id = s.user_id
  where au.email is not null
    and public.is_moderator(s.user_id)
    and case p_event_type
      when 'new_member' then s.new_member_email
      when 'revision_request' then s.revision_request_email
      -- Tamamlanma, açılışla AYNI aboneliği paylaşır (ayrı sütun yok).
      when 'revision_request_completed' then s.revision_request_email
      when 'radar_scan_digest' then s.radar_scan_digest_email
      when 'career_application' then s.career_application_email
      else s.admin_update_email
    end;
end;
$function$;

-- ── 4) Kuyruğa yazan trigger ────────────────────────────────────────────────

create or replace function public.enqueue_career_application_notification()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Toplu veri yükleme/geri yükleme bildirim üretmesin (revizyon deseni).
  if coalesce(current_setting('corteqs.skip_career_notify', true), '') = 'on' then
    return new;
  end if;

  insert into public.notification_email_outbox (event_type, dedupe_key, payload)
  values (
    'career_application',
    'career_application:' || new.id::text,
    jsonb_build_object(
      'application_id', new.id::text,
      'full_name', new.full_name,
      'email', new.email,
      'position_id', new.position,
      'model', new.model,
      'country', new.country,
      'city', new.city,
      'created_at', coalesce(new.created_at, now())
    )
  )
  on conflict (dedupe_key) do nothing;

  perform public.poke_notification_dispatcher();
  return new;
end;
$function$;

drop trigger if exists trg_career_application_notify on public.career_applications;
create trigger trg_career_application_notify
  after insert on public.career_applications
  for each row execute function public.enqueue_career_application_notification();

commit;
