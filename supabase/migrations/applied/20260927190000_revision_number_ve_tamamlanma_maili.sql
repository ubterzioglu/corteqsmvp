-- ============================================================
-- Purpose: (1) Her revizyon isteğine sıralı numara (`revision_number`) —
--              arayüzde ve maillerde "#REV-042" gibi anılabilsin.
--          (2) Durum 'yapildi'ye GEÇTİĞİNDE abone adminlere mail.
--
-- ⚠️ PLANDAN SAPMALAR (plan taslaktı, canlı şema ölçüldü):
--   · Planda `new.updated_by_or_created_by` geçiyordu — BÖYLE BİR KOLON YOK.
--     Tabloda yalnız `created_by` var ve o TALEBİ AÇAN kişidir, tamamlayan değil.
--     Tamamlayan için `auth.uid()` kullanılır (trigger security definer olsa da
--     auth.uid() çağıran oturumun JWT'sinden gelir; panelden yapılan güncellemede
--     doludur, sunucu tarafı/servis anahtarıyla yapılan güncellemede NULL olur ve
--     mail "-" gösterir — veri kaybı değil).
--   · Planda "mevcut 51 satır" deniyordu; ölçüm 27.09: **89** aktif satır
--     (acik 43 · yapildi 27 · inceleniyor 15 · iptal 4). Backfill sayıya bağlı değil.
--   · Numara SOFT-DELETE EDİLMİŞ satırlara da verilir: kolon UNIQUE ve numara
--     kimliktir; silinmiş satır geri gelirse numarası korunur.
--
-- ⚠️ MEVCUT 27 'yapildi' SATIRI MAİL ÜRETMEZ: tetikleyici yalnız GEÇİŞTE çalışır
--    (old.status is distinct from 'yapildi'). Backfill de UPDATE olduğu için
--    tetikleyici backfill'DEN SONRA kurulur.
--
-- Risk:    Düşük-orta. Tablo değişir (yeni kolon) ve yeni bir mail yolu açılır.
-- Rollback: iki tetikleyiciyi düşür, kolonu ve diziyi düşür, CHECK'i eski hâline al.
-- ============================================================

BEGIN;

-- ── 1) Sıra ve kolon ────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.revision_request_number_seq;

ALTER TABLE public.revision_requests
  ADD COLUMN IF NOT EXISTS revision_number integer;

-- ── 2) Backfill: eskiden yeniye, açılış sırasına göre ───────────────────────
-- Tetikleyici henüz kurulmadı, bu yüzden bu UPDATE mail üretmez.
DO $$
DECLARE
  v_row record;
BEGIN
  FOR v_row IN
    SELECT id FROM public.revision_requests
    WHERE revision_number IS NULL
    ORDER BY created_at ASC, id ASC
  LOOP
    UPDATE public.revision_requests
    SET revision_number = nextval('public.revision_request_number_seq')
    WHERE id = v_row.id;
  END LOOP;
END
$$;

-- Numaralar atandıktan SONRA benzersizlik kısıtı — backfill sırasında çakışma olmaz.
CREATE UNIQUE INDEX IF NOT EXISTS revision_requests_revision_number_key
  ON public.revision_requests (revision_number);

COMMENT ON COLUMN public.revision_requests.revision_number IS
  'Sıralı revizyon numarası (#REV-N). BEFORE INSERT tetikleyicisi atar; elle yazılmaz.';

-- ── 3) Yeni satırlara otomatik numara ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assign_revision_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.revision_number is null then
    new.revision_number := nextval('public.revision_request_number_seq');
  end if;
  return new;
end;
$function$;

DROP TRIGGER IF EXISTS trg_assign_revision_number ON public.revision_requests;
CREATE TRIGGER trg_assign_revision_number
  BEFORE INSERT ON public.revision_requests
  FOR EACH ROW EXECUTE FUNCTION public.assign_revision_number();

-- ── 4) Kuyruk olay türüne yeni değer ────────────────────────────────────────
ALTER TABLE public.notification_email_outbox
  DROP CONSTRAINT IF EXISTS notification_email_outbox_event_type_check;

ALTER TABLE public.notification_email_outbox
  ADD CONSTRAINT notification_email_outbox_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'new_member'::text,
    'admin_update'::text,
    'member_welcome'::text,
    'revision_request'::text,
    'revision_request_completed'::text,
    'relocation_tool_report'::text,
    'relocation_tool_abandonment'::text
  ]));

-- ── 5) Açılış bildirimine numarayı ekle ─────────────────────────────────────
-- Gövde 20260804160000'dekiyle aynıdır; tek fark payload'a revision_number eklenmesi.
CREATE OR REPLACE FUNCTION public.enqueue_revision_request_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_author text;
begin
  if coalesce(current_setting('corteqs.skip_revision_notify', true), '') = 'on' then
    return new;
  end if;

  -- Soft-delete edilmiş olarak eklenen satır (seed/geri yükleme) bildirim üretmez.
  if new.deleted_at is not null then
    return new;
  end if;

  select au.email::text into v_author
  from auth.users au
  where au.id = new.created_by;

  insert into public.notification_email_outbox (event_type, dedupe_key, payload)
  values (
    'revision_request',
    'revision_request:' || new.id::text,
    jsonb_build_object(
      'request_id', new.id::text,
      'revision_number', new.revision_number,
      'title', new.title,
      'detail', new.detail,
      'status', new.status,
      'priority', new.priority,
      'area_label', new.area_label,
      'author_email', v_author,
      'created_at', coalesce(new.created_at, now())
    )
  )
  on conflict (dedupe_key) do nothing;

  perform public.poke_notification_dispatcher();

  return new;
exception when others then
  -- Bildirim ASLA talebin kaydedilmesini bloklamaz.
  return new;
end;
$function$;

-- ── 6) Tamamlanma bildirimi ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enqueue_revision_completion_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_completer text;
begin
  if coalesce(current_setting('corteqs.skip_revision_notify', true), '') = 'on' then
    return new;
  end if;

  -- YALNIZ geçişte: zaten 'yapildi' olan satırın başka bir alanı güncellenirse
  -- ikinci mail gitmez. Mevcut 27 tamamlanmış satır da bu yüzden sessiz kalır.
  if new.status <> 'yapildi' or old.status is not distinct from 'yapildi' then
    return new;
  end if;

  -- Soft-delete edilmiş satır bildirim üretmez (açılış tetikleyicisiyle aynı kural).
  if new.deleted_at is not null then
    return new;
  end if;

  -- Tabloda "kim güncelledi" kolonu YOK; tamamlayan, güncellemeyi yapan oturumdur.
  select au.email::text into v_completer
  from auth.users au
  where au.id = auth.uid();

  insert into public.notification_email_outbox (event_type, dedupe_key, payload)
  values (
    'revision_request_completed',
    'revision_request_completed:' || new.id::text,
    jsonb_build_object(
      'request_id', new.id::text,
      'revision_number', new.revision_number,
      'title', new.title,
      'detail', new.detail,
      'priority', new.priority,
      'area_label', new.area_label,
      'completed_by', v_completer,
      'completed_at', now()
    )
  )
  on conflict (dedupe_key) do nothing;

  perform public.poke_notification_dispatcher();

  return new;
exception when others then
  -- Bildirim ASLA güncellemeyi bloklamaz.
  return new;
end;
$function$;

-- ── 7) Abone listesi RPC'si yeni türü TANIMALI ─────────────────────────────
-- ⚠️ Bu adım plan taslağında YOKTU ve atlansaydı mail hiç gitmezdi:
-- admin_get_notification_subscribers() beyaz listeye dayanır ve tanımadığı türde
-- `unknown_event_type` (22023) FIRLATIR. Tamamlanma bildirimi, açılış bildirimiyle
-- aynı aboneliği (revision_request_email sütunu) kullanır — yeni sütun eklenmez.
CREATE OR REPLACE FUNCTION public.admin_get_notification_subscribers(p_event_type text)
 RETURNS TABLE(user_id uuid, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_event_type not in (
    'new_member', 'admin_update', 'revision_request',
    'revision_request_completed', 'radar_scan_digest'
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
      else s.admin_update_email
    end;
end;
$function$;

DROP TRIGGER IF EXISTS on_revision_request_completed_notify ON public.revision_requests;
CREATE TRIGGER on_revision_request_completed_notify
  AFTER UPDATE ON public.revision_requests
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_revision_completion_notification();

COMMENT ON FUNCTION public.enqueue_revision_completion_notification() IS
  'revision_requests durumu yapildi''ye GEÇTİĞİNDE kuyruğa mail yazar. Tekrar güncellemede mail üretmez (dedupe_key + geçiş kontrolü).';

COMMIT;
