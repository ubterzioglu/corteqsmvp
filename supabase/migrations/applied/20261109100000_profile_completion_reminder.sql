-- L10b — Profil doluluk hatırlatma e-postası (profile_completion_reminder).
--
-- ⚠️ YAZILDI, UYGULANMADI. VARSAYILAN KAPALI: `email.profile_completion_reminder.enabled`
-- = false. Bayrak kapalıyken `enqueue_profile_completion_reminders()` 0 döner ve HİÇBİR ŞEY
-- yazmaz; cron bugünden kurulur ama etkisizdir (G22/G17 dersi). Açmak bir İNSAN kararıdır
-- (metin onayı + opt-out/hukuk değerlendirmesi sonrası).
--
-- ── ÖLÇÜM (yazmadan önce, dosyadan) ─────────────────────────────────────────
--   Doluluk % kaynağı ..... get_current_user_profile().profile_completion
--                           (baseline satır ~9449): rolün is_enabled + is_required
--                           role_attributes satırlarından DOLU olanların oranı,
--                           floor(), toplam 0 ise 100. Bu migration o hesabı SET-BASED
--                           yansıtır (üye başına RPC çağrısı YOK).
--   CHECK'in son tanımı ... 20261006130000 (20 değer) — hepsi AŞAĞIDA korunur + 1 yeni.
--                           ⚠️ 20261005100500 bir kez `weekly_city_digest`'i düşürmüştü.
--   Cron deseni ........... guarded do-block (relocation 20260830142000) veya
--                           unschedule+schedule (weekly 20261004130000). Burada
--                           guarded + unschedule-if-exists.
--   Alıcı ................. üyenin KENDİSİ (payload.email) → edge `directEvents`.
--
-- ── AKIŞ ────────────────────────────────────────────────────────────────────
--   Takvim `profile_completion_reminder.schedule_days` ([0,3,10]) — kayıttan sonra
--   geçen TAM gün. Her adım için pencere: gün <= yaş < gün + grace_days. Pencere, bayrak
--   geç açıldığında eski üyelere bayat adım mailinin yağmasını önler (backfill YOK).
--   Eşik altı = `threshold_percent` (60) ALTINDA doluluk. En fazla takvim uzunluğu kadar
--   (3) mail: dedupe_key = profile_completion_reminder:<user_id>:d<GÜN> UNIQUE.
--   ⚠️ Anahtar GÜNE bağlıdır, takvimdeki SIRA numarasına DEĞİL: takvim değişince (gün
--   çıkarma/ekleme) sıra kayar ve sıra-anahtarı süreçteki üyeye adımı sessizce kaçırtır.
--   `step` payload'da yalnız bilgidir. Pencereler çakışırsa (grace ≥ adım aralığı) üye
--   başına YALNIZ en geç vadeli adım seçilir — aynı gün iki mail gitmez.
--   Her çalışmada en fazla `batch_limit` (200) satır; kalan sonraki gün (pencere içindeyse).
--   Kill switch FAIL-CLOSED: anahtar satırı YOKSA notification_setting_enabled() NULL döner;
--   `if not NULL` dalı ÇALIŞMAZ, bu yüzden `is not true` ile sınanır.
--
-- ── AÇMA SIRASI (bayrağı açmadan ÖNCE) ──────────────────────────────────────
--   1) supabase functions deploy send-notification-emails  (Coolify edge DEPLOY ETMEZ)
--   2) npm run check:functions  → canlı edge bu tipi tanıyor mu
--   3) metin onayı (Burak) + hukuk/opt-out kararı
--   4) ancak sonra: update notification_settings set value='true'::jsonb where key=…enabled
--   ⚠️ Eski edge yeni tipi TANIMAZ (F13): satırı ertelemek için claim'i geri bırakır ama
--   deliver_after'a dokunmaz; claim `order by created_at limit 50` olduğundan günde 200'e
--   kadar ertelenen satır kuyruk başını TIKAR ve diğer TÜM mailler (member_welcome,
--   career_application…) sessizce bekler.
--
-- ⚠️ 1 GB RAM: auth.users yalnız kayıt penceresine (en büyük gün + grace) göre daralır;
--    geo_cities vb. büyük tablolara DOKUNULMAZ.
-- ⚠️ day 0 maili member_welcome ile AYNI gün gider (ikisi de e-posta doğrulamasının
--    ardından). Gün 0'ı takvimden çıkarmak = settings satırını güncellemek (anahtar güne
--    bağlı olduğu için kalan adımlar kaymaz).
-- ⚠️ Ayna farkı YOK: full_name, get_current_user_profile'daki gibi ONAY DURUMUNA BAKMADAN
--    dolu sayılır (v_full_name); diğer alanlar yalnız approved satırla.
--
-- GERİ ALMA:
--   select cron.unschedule('profile-completion-reminder');
--   drop function public.enqueue_profile_completion_reminders();
--   delete from public.notification_settings where key like 'profile_completion_reminder.%'
--      or key = 'email.profile_completion_reminder.enabled';
--   CHECK: aynı drop + 20261006130000'deki 20 değerlik listeyle add constraint.
--   (Outbox'ta profile_completion_reminder satırı varsa önce silinmelidir.)

begin;

-- ── 1. Outbox event_type CHECK (önceki 20 değer KORUNUR + 1 yeni) ────────────
do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.notification_email_outbox'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%event_type%'
  loop
    execute format(
      'alter table public.notification_email_outbox drop constraint %I',
      v_constraint.conname
    );
  end loop;
end $$;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_event_type_check
  check (event_type = any (array[
    'new_member','admin_update','member_welcome','revision_request',
    'revision_request_completed','relocation_tool_report','relocation_tool_abandonment',
    'radar_scan_digest','career_application','group_submission_received','group_published',
    'group_rejected','group_ownership_verified','group_post_pending','group_link_dead',
    'group_score_badge','group_strike_warning',
    'recommendation_match',
    'event_published',
    'weekly_city_digest',
    'profile_completion_reminder'
  ]::text[]));

-- ── 2. Ayarlar (bayrak KAPALI doğar; sayılar kodda değil burada) ─────────────
insert into public.notification_settings (key, value)
values
  ('email.profile_completion_reminder.enabled', 'false'::jsonb),
  ('profile_completion_reminder.threshold_percent', '60'::jsonb),
  ('profile_completion_reminder.schedule_days', '[0,3,10]'::jsonb),
  ('profile_completion_reminder.grace_days', '2'::jsonb),
  ('profile_completion_reminder.batch_limit', '200'::jsonb)
on conflict (key) do nothing;

-- ── 3. Kuyruğa yazan fonksiyon ───────────────────────────────────────────────
create or replace function public.enqueue_profile_completion_reminders()
returns integer
language plpgsql
volatile
security definer
set search_path = public, auth
as $$
declare
  v_threshold integer;
  v_days      jsonb;
  v_grace     integer;
  v_limit     integer;
  v_max_day   integer;
  v_count     integer := 0;
begin
  -- Kill switch: kapalıyken sessizce 0 — cron'un koşması zarar vermez. Anahtar satırı
  -- YOKSA fonksiyon NULL döner; `is not true` bunu da KAPALI sayar (fail-closed). Aksi
  -- hâlde satırlar yazılır, edge onları global_switch_off ile yakar ve dedupe harcanır.
  if public.notification_setting_enabled('email.profile_completion_reminder.enabled') is not true then
    return 0;
  end if;

  select (value #>> '{}')::integer into v_threshold
    from public.notification_settings where key = 'profile_completion_reminder.threshold_percent';
  select value into v_days
    from public.notification_settings where key = 'profile_completion_reminder.schedule_days';
  select (value #>> '{}')::integer into v_grace
    from public.notification_settings where key = 'profile_completion_reminder.grace_days';
  select (value #>> '{}')::integer into v_limit
    from public.notification_settings where key = 'profile_completion_reminder.batch_limit';

  -- Ayar eksik/bozuksa FAIL-CLOSED: varsayılan uydurup mail atmak yerine hiçbir şey yapma.
  if v_threshold is null or v_grace is null or v_limit is null
     or v_days is null or jsonb_typeof(v_days) <> 'array'
     or jsonb_array_length(v_days) = 0 then
    return 0;
  end if;

  -- "Durdur" niyetli değerler de 0 döner: batch_limit=0 eskiden greatest(1,…) ile 1 satır
  -- yazıyordu; grace 0 her pencereyi boşaltır; eşik 1–100 dışıysa anlamsızdır.
  if v_limit <= 0 or v_grace < 1 or v_threshold not between 1 and 100 then
    return 0;
  end if;

  select max(d::integer) into v_max_day from jsonb_array_elements_text(v_days) d;

  with steps as (
    select (s.ord - 1)::integer as step, s.val::integer as day
      from jsonb_array_elements_text(v_days) with ordinality as s(val, ord)
  ),
  cand as (
    -- Yalnız kayıt penceresindeki, e-postası doğrulanmış, silinmemiş/banlanmamış üyeler.
    -- @wa.local = eski WhatsApp-bot kaydının sahte adresi (SMTP'de bounce eder).
    select u.id, u.email::text as email, u.created_at,
           u.raw_user_meta_data as meta,
           floor(extract(epoch from (now() - u.created_at)) / 86400)::integer as age_days
      from auth.users u
     where u.email_confirmed_at is not null
       and u.email is not null
       and u.deleted_at is null
       and (u.banned_until is null or u.banned_until <= now())
       and u.email not ilike '%@wa.local'
       and u.created_at > now() - make_interval(days => v_max_day + v_grace + 1)
  ),
  due as (
    -- Üye başına TEK adım: pencereler çakışırsa yalnız en geç vadeli adım (eski adım geç
    -- gitmez, aynı gün iki mail gitmez).
    select distinct on (c.id) c.*, st.step, st.day
      from cand c
      join steps st on c.age_days >= st.day and c.age_days < st.day + v_grace
     order by c.id, st.day desc
  ),
  unsent as (
    select d.*
      from due d
     where not exists (
       select 1 from public.notification_email_outbox o
        where o.dedupe_key = 'profile_completion_reminder:' || d.id::text || ':d' || d.day::text
     )
  ),
  completion as (
    -- get_current_user_profile().profile_completion yansıması (set-based). full_name orada
    -- ONAYA BAKMADAN dolu sayılır (v_full_name) → `fn` onay filtresiz ayrı join.
    select n.id as user_id,
           count(distinct rar.attribute_id) as required_total,
           count(distinct rar.attribute_id) filter (
             where (ac.key = 'full_name' and coalesce(fn.value_text, '') <> '')
                or upa.value_text is not null or upa.value_json is not null
           ) as required_completed,
           coalesce(jsonb_agg(ac.label order by ac.sort_order, ac.label) filter (
             where not ((ac.key = 'full_name' and coalesce(fn.value_text, '') <> '')
                or upa.value_text is not null or upa.value_json is not null)
           ), '[]'::jsonb) as missing_labels,
           max(fn.value_text) as profile_full_name
      from (select distinct id from unsent) n
      join public.user_role_assignments ura on ura.user_id = n.id
      join public.role_attributes rar
        on rar.role_id = ura.role_id and rar.is_enabled and rar.is_required
      join public.afs_attributes ac on ac.id = rar.attribute_id and ac.is_active
      left join public.user_profile_attributes upa
        on upa.user_id = n.id and upa.attribute_id = ac.id and upa.approval_status = 'approved'
      left join public.user_profile_attributes fn
        on fn.user_id = n.id and fn.attribute_id = ac.id and ac.key = 'full_name'
     group by n.id
  ),
  scored as (
    select n.*, cp.missing_labels, cp.profile_full_name,
           floor((cp.required_completed::numeric / cp.required_total::numeric) * 100)::integer as pct
      from unsent n
      join completion cp on cp.user_id = n.id
     -- Inner join'ler zaten required_total ≥ 1 sağlar; koşul ikinci savunma olarak DURUR.
     where cp.required_total > 0   -- toplam 0 → profil sistemi yüzde 100 sayar → mail yok
  )
  insert into public.notification_email_outbox (event_type, dedupe_key, payload, status)
  select 'profile_completion_reminder',
         'profile_completion_reminder:' || s.id::text || ':d' || s.day::text,
         jsonb_build_object(
           'user_id', s.id::text,
           'email', s.email,
           'full_name', coalesce(
             nullif(trim(s.profile_full_name), ''),
             nullif(trim(coalesce(s.meta ->> 'full_name', s.meta ->> 'name')), '')
           ),
           'percentage', s.pct,
           'threshold', v_threshold,
           'missing_labels', s.missing_labels,
           'step', s.step,
           'day', s.day
         ),
         'pending'
    from scored s
   where s.pct < v_threshold
   order by s.created_at
   limit greatest(1, least(v_limit, 500))
  on conflict (dedupe_key) do nothing;

  get diagnostics v_count = row_count;

  if v_count > 0 then
    perform public.poke_notification_dispatcher();
  end if;

  return v_count;
end;
$$;

comment on function public.enqueue_profile_completion_reminders() is
  'Profil doluluk hatırlatmasını outbox''a yazar (üye başına takvim günü başına TEK satır, '
  'dedupe_key = profile_completion_reminder:<user_id>:d<gün>). Eşik/takvim/sınır '
  'notification_settings''ten okunur. Ana bayrak kapalıyken ya da satırı yokken '
  '(varsayılan kapalı) 0 döner.';

revoke all on function public.enqueue_profile_completion_reminders()
  from public, anon, authenticated;
grant execute on function public.enqueue_profile_completion_reminders() to service_role;

-- ── 4. Günlük pg_cron ────────────────────────────────────────────────────────
-- Gönderimi mevcut `notification-email-drain` (*/15) yapar; bu iş yalnız kuyruğa yazar.
-- ⚠️ "cron yeşil" KANIT DEĞİLDİR (Radar dersi) — açıldığında gerçek outbox satırını ve
--    dolu `sent_at`'i ölç.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'profile-completion-reminder') then
      perform cron.unschedule('profile-completion-reminder');
    end if;
    perform cron.schedule(
      'profile-completion-reminder',
      '23 7 * * *',
      'select public.enqueue_profile_completion_reminders()'
    );
  end if;
end;
$$;

commit;
