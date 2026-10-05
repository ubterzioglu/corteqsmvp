-- G14 · Dijital Gruplar: şikayet sistemi (`group_reports`)
--
-- ═══ KAYNAK (uydurulan iş kuralı YOK) ═══
--   Politika §4 (7 kırmızı çizgi) · §8 "Şikayet eşiği: en az 7 günlük, farklı ve
--   doğrulanmış 3 hesaptan gelen şikayet grubu inceleme bitene kadar gizler".
--   Tasarım §3.E: şikayet eden girişli + telefonu doğrulanmış + hesabı ≥ 7 gün;
--   aynı kişi aynı gruba 30 günde 1; sebepler kırmızı çizgilerle birebir +
--   "Diğer (açıklama zorunlu)"; eşik 3 geçerli şikayet → hidden(reports) →
--   moderatör kuyruğu; onay → uyarı sistemi (§7), red → grup published.
--   Eşikler `group_settings`'te ZATEN TOHUMLU (G09): report_threshold=3 ·
--   report_min_account_age_days=7 · report_require_phone=true ·
--   report_same_group_cooldown_days=30 — bu migration kopyasını AÇMAZ.
--
-- ═══ KARARLAR (tasarımın boş bıraktığı yerler — rapora yazıldı) ═══
--   • "Kendi grubu" = ekleyen (user_id / submitted_by) VEYA doğrulanmış sahip
--     (owner_user_id). Kendi grubuna şikayet reddedilir (AJAN KARARI).
--   • Uygun olmayan şikayet SAYILMAZ = reddedilir ve HİÇ saklanmaz.
--   • Eşik sayımı = o grubun `open` şikayetlerinden FARKLI reporter_id sayısı.
--   • Yarış: grup satırı `for update` ile kilitlenir → aynı gruba gelen tüm
--     şikayetler sıraya girer; iki eşzamanlı çağrı iki satır üretemez ve eşik
--     sayımı tutarlı kalır (READ COMMITTED: her ifade yeni anlık görüntü).
--   • Onay (upheld) TEK karar = TEK ihlal: aynı grubun diğer AÇIK şikayetleri
--     de aynı kararla kapanır. Aksi hâlde eşiği dolduran 3 şikayeti tek tek
--     onaylayan moderatör 3 ihlal → `removed` + yasak üretirdi (AJAN KARARI).
--   • Onay sonrası grup gizli kalır (uyarı yayına döndürmez — tasarım §2 yalnız
--     "şikayet reddedilir" için hidden→published der). Karar kullanıcıda.
--   • Bildirim maili EKLENMEZ (bu karar turunda konuşulmadı).
--
-- ═══ YETKİ ═══
--   Yazma YALNIZ RPC (Cadde deseni): tabloya kullanıcı INSERT/UPDATE/DELETE
--   politikası ve grant'ı YOK. Okuma: kullanıcı yalnız KENDİ satırını, admin
--   hepsini görür → grup sahibi şikayetçinin kimliğini HİÇBİR yoldan göremez.
--   Eşik geçişi şikayetçi admin/service olmadığı için G22 deseniyle geçici
--   service claim'iyle `set_group_status_v1`'den geçer ve claim GERİ YÜKLENİR.
--
-- ═══ SALT EKLEME ═══
-- Kolon/tablo düşürmez. `group_moderator_summary` yeniden tanımlanır: yalnız
-- `pending_reports` gerçek sayaca bağlanır, diğer her alan birebir aynıdır.

begin;

-- ── 1) Şikayet tablosu ──────────────────────────────────────────────────────

create table if not exists public.group_reports (
  id uuid primary key default gen_random_uuid(),
  -- cascade DEĞİL: şikayet kaydı grubun silinmesiyle sessizce kaybolmaz.
  landing_id uuid not null references public.whatsapp_landings(id) on delete restrict,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  -- Politika §4'ün 7 kırmızı çizgisi (sırası = kırmızı çizgi numarası) + diger.
  reason text not null check (reason in (
    'link_broken',            -- 1 · link çalışmıyor, grup dolu/kapalı
    'visa_slot_sale',         -- 2 · vize/oturum/izin/denklik/randevu slotu satışı
    'crypto_mlm_finance',     -- 3 · kripto sinyal, MLM, garantili getiri, kredi aracılığı
    'personal_data_request',  -- 4 · katılım için kimlik/pasaport/adres isteme
    'hate_violence_adult',    -- 5 · nefret, şiddet, taciz, yetişkin içerik
    'minors_unverified',      -- 6 · reşit olmayanlara yönelik, doğrulanmamış kuruluş
    'political_campaign',     -- 7 · parti/seçim kampanyası aracı
    'diger'                   -- Diğer (açıklama zorunlu)
  )),
  note text check (note is null or char_length(note) <= 1000),
  status text not null default 'open' check (status in ('open', 'upheld', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 1000),
  constraint group_reports_other_needs_note
    check (reason <> 'diger' or (note is not null and btrim(note) <> ''))
);

comment on table public.group_reports is
  'Grup şikayetleri (G14, tasarım §3.E). Tek yazma yolu submit_group_report_v1 / '
  'review_group_report_v1. Kullanıcı yalnız kendi satırını, admin hepsini okur; '
  'grup sahibi şikayetçiyi göremez.';

create index if not exists group_reports_landing_status_idx
  on public.group_reports (landing_id, status);
create index if not exists group_reports_reporter_landing_idx
  on public.group_reports (reporter_id, landing_id, created_at desc);

alter table public.group_reports enable row level security;
revoke all on table public.group_reports from public, anon, authenticated;
grant select on table public.group_reports to authenticated;

drop policy if exists group_reports_select_own_or_admin on public.group_reports;
create policy group_reports_select_own_or_admin on public.group_reports
  for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin(auth.uid()));

-- ── 2) Sebep → kırmızı çizgi numarası (tek kaynak, review + TS eşlemesi) ────

create or replace function public.group_report_redline_number(p_reason text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case p_reason
    when 'link_broken' then 1
    when 'visa_slot_sale' then 2
    when 'crypto_mlm_finance' then 3
    when 'personal_data_request' then 4
    when 'hate_violence_adult' then 5
    when 'minors_unverified' then 6
    when 'political_campaign' then 7
    else null
  end;
$$;

comment on function public.group_report_redline_number(text) is
  'Şikayet sebebi → politika §4 kırmızı çizgi numarası (1..7); diger → NULL (G14).';

revoke all on function public.group_report_redline_number(text) from public, anon;

-- ── 3) Şikayet gönderme (tek yazma kapısı) ──────────────────────────────────

create or replace function public.submit_group_report_v1(
  p_landing_id uuid,
  p_reason text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_landing record;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_created timestamptz;
  v_min_age integer;
  v_cooldown integer;
  v_threshold integer;
  v_reporters integer;
  v_report_id uuid;
  v_prev_claims text;
  v_prev_role text;
  v_prev_sub text;
  v_err text;
  v_hidden boolean := false;
begin
  if v_uid is null then
    raise exception 'group_report_auth_required';
  end if;

  -- Grup satırı KİLİTLENİR: aynı gruba gelen şikayetler sıraya girer (yarış kapalı).
  select id, listing_status, user_id, submitted_by, owner_user_id
    into v_landing
  from public.whatsapp_landings
  where id = p_landing_id
  for update;
  if not found then
    raise exception 'group_report_group_not_found';
  end if;
  if v_landing.listing_status <> 'published' then
    raise exception 'group_report_group_not_published';
  end if;

  if v_uid = v_landing.user_id or v_uid = v_landing.submitted_by or v_uid = v_landing.owner_user_id then
    raise exception 'group_report_own_group';
  end if;

  if p_reason is null or (public.group_report_redline_number(p_reason) is null and p_reason <> 'diger') then
    raise exception 'group_report_invalid_reason';
  end if;
  if p_reason = 'diger' and v_note is null then
    raise exception 'group_report_note_required';
  end if;
  if v_note is not null and char_length(v_note) > 1000 then
    raise exception 'group_report_note_too_long';
  end if;

  if public.group_setting_bool('groups.report_require_phone', true)
     and not public.is_phone_verified(v_uid) then
    raise exception 'group_report_phone_required';
  end if;

  v_min_age := public.group_setting_int('groups.report_min_account_age_days', 7);
  select created_at into v_created from auth.users where id = v_uid;
  if v_created is null or v_created > now() - make_interval(days => v_min_age) then
    raise exception 'group_report_account_too_new';
  end if;

  v_cooldown := public.group_setting_int('groups.report_same_group_cooldown_days', 30);
  if exists (
    select 1 from public.group_reports
    where reporter_id = v_uid
      and landing_id = p_landing_id
      and created_at > now() - make_interval(days => v_cooldown)
  ) then
    raise exception 'group_report_cooldown';
  end if;

  insert into public.group_reports (landing_id, reporter_id, reason, note)
  values (p_landing_id, v_uid, p_reason, v_note)
  returning id into v_report_id;

  -- ── Eşik: farklı şikayetçi sayısı ──
  v_threshold := public.group_setting_int('groups.report_threshold', 3);
  select count(distinct reporter_id) into v_reporters
  from public.group_reports
  where landing_id = p_landing_id and status = 'open';

  if v_reporters >= v_threshold then
    -- G22 deseni: set_group_status_v1 servisi JWT claim'inden tanır; şikayetçi
    -- admin/service değildir → geçici service kimliği, SONRA GERİ YÜKLEME.
    -- Geri yükleme alt-işlemin DIŞINDA yapılır: hata yakalansa da çalışır.
    -- auth.role()/auth.uid() önce eski tekil GUC'leri (request.jwt.claim.role/sub)
    -- okur (canlı tanım ölçüldü) → üçü birlikte saklanır, ezilir, geri yüklenir.
    v_prev_claims := current_setting('request.jwt.claims', true);
    v_prev_role := current_setting('request.jwt.claim.role', true);
    v_prev_sub := current_setting('request.jwt.claim.sub', true);
    perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
    perform set_config('request.jwt.claim.role', 'service_role', true);
    perform set_config('request.jwt.claim.sub', '', true);
    begin
      perform public.set_group_status_v1(
        p_landing_id, 'hidden', 'reports',
        v_reporters || ' farkli hesaptan sikayet (G14)');
      v_hidden := true;
    exception when others then
      v_err := sqlerrm;
    end;
    perform set_config('request.jwt.claims', coalesce(v_prev_claims, ''), true);
    perform set_config('request.jwt.claim.role', coalesce(v_prev_role, ''), true);
    perform set_config('request.jwt.claim.sub', coalesce(v_prev_sub, ''), true);

    -- Matris izin vermezse (grup zaten gizli/askıda) şikayet KAYBOLMAZ, durum değişmez.
    if v_err is not null and v_err <> 'group_illegal_transition' then
      raise exception '%', v_err;
    end if;
  end if;

  return jsonb_build_object('report_id', v_report_id, 'group_hidden', v_hidden);
end;
$$;

comment on function public.submit_group_report_v1(uuid, text, text) is
  'Şikayet gönderme TEK kapısı (G14, tasarım §3.E). Uygun olmayan şikayet '
  'reddedilir ve saklanmaz. Farklı şikayetçi sayısı groups.report_threshold''a '
  'ulaşınca grup hidden(reports) olur (set_group_status_v1, geçici service claim + geri yükleme).';

revoke all on function public.submit_group_report_v1(uuid, text, text) from public, anon;
grant execute on function public.submit_group_report_v1(uuid, text, text) to authenticated;

-- ── 4) Arayüz durumu (düğmenin dürüst metni için) ───────────────────────────

create or replace function public.group_report_state_v1(p_landing_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_landing record;
  v_created timestamptz;
  v_last timestamptz;
  v_cooldown integer;
  v_own boolean;
  v_phone_missing boolean;
  v_too_new boolean;
  v_cooldown_until timestamptz;
begin
  if v_uid is null then
    raise exception 'group_report_auth_required';
  end if;

  select listing_status, user_id, submitted_by, owner_user_id
    into v_landing
  from public.whatsapp_landings
  where id = p_landing_id;
  if not found then
    raise exception 'group_report_group_not_found';
  end if;

  v_own := v_uid = v_landing.user_id or v_uid = v_landing.submitted_by or v_uid = v_landing.owner_user_id;
  v_own := coalesce(v_own, false);
  v_phone_missing := public.group_setting_bool('groups.report_require_phone', true)
                     and not public.is_phone_verified(v_uid);
  select created_at into v_created from auth.users where id = v_uid;
  v_too_new := v_created is null
               or v_created > now() - make_interval(days => public.group_setting_int('groups.report_min_account_age_days', 7));

  v_cooldown := public.group_setting_int('groups.report_same_group_cooldown_days', 30);
  select max(created_at) into v_last
  from public.group_reports
  where reporter_id = v_uid and landing_id = p_landing_id;
  if v_last is not null and v_last > now() - make_interval(days => v_cooldown) then
    v_cooldown_until := v_last + make_interval(days => v_cooldown);
  end if;

  return jsonb_build_object(
    'own_group', v_own,
    'published', v_landing.listing_status = 'published',
    'phone_required', v_phone_missing,
    'account_too_new', v_too_new,
    'cooldown_until', v_cooldown_until,
    'can_report', not v_own and v_landing.listing_status = 'published'
                  and not v_phone_missing and not v_too_new and v_cooldown_until is null);
end;
$$;

comment on function public.group_report_state_v1(uuid) is
  'Şikayet düğmesinin durumu (G14): kendi grubu · yayında mı · telefon · hesap yaşı · '
  'bekleme süresi. Yalnız çağıranın kendi durumunu döner; başka şikayetçi bilgisi YOK.';

revoke all on function public.group_report_state_v1(uuid) from public, anon;
grant execute on function public.group_report_state_v1(uuid) to authenticated;

-- ── 5) Moderatör kararı ─────────────────────────────────────────────────────

create or replace function public.review_group_report_v1(
  p_report_id uuid,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_report record;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_closed integer := 0;
  v_strike jsonb;
  v_republished boolean := false;
  v_listing text;
  v_hidden_reason text;
begin
  if not public.is_admin(v_uid) then
    raise exception 'group_report_review_forbidden';
  end if;
  if p_decision is null or p_decision not in ('upheld', 'rejected') then
    raise exception 'group_report_invalid_decision';
  end if;
  if v_note is not null and char_length(v_note) > 1000 then
    raise exception 'group_report_note_too_long';
  end if;

  select id, landing_id, reason, status
    into v_report
  from public.group_reports
  where id = p_report_id
  for update;
  if not found then
    raise exception 'group_report_not_found';
  end if;
  if v_report.status <> 'open' then
    raise exception 'group_report_already_reviewed';
  end if;

  if p_decision = 'upheld' then
    -- TEK karar = TEK ihlal: grubun tüm AÇIK şikayetleri aynı kararla kapanır.
    update public.group_reports
       set status = 'upheld', reviewed_by = v_uid, reviewed_at = now(), review_note = v_note
     where landing_id = v_report.landing_id and status = 'open';
    get diagnostics v_closed = row_count;

    -- G15 uyarı merdiveni (tek ihlal kapısı; is_admin kendi içinde yeniden denetler).
    v_strike := public.admin_record_group_strike(
      v_report.landing_id,
      coalesce(v_note, 'Onaylanan şikayet'),
      public.group_report_redline_number(v_report.reason),
      'G14 sikayet ' || v_report.id::text);
  else
    update public.group_reports
       set status = 'rejected', reviewed_by = v_uid, reviewed_at = now(), review_note = v_note
     where id = v_report.id;
    v_closed := 1;

    -- Politika: "şikayet reddedilirse grup yayına döner" — yalnız başka AÇIK
    -- şikayet kalmadıysa ve gizleme sebebi şikayetse.
    select listing_status, hidden_reason into v_listing, v_hidden_reason
    from public.whatsapp_landings where id = v_report.landing_id;
    if v_listing = 'hidden' and v_hidden_reason = 'reports'
       and not exists (
         select 1 from public.group_reports
         where landing_id = v_report.landing_id and status = 'open') then
      perform public.set_group_status_v1(
        v_report.landing_id, 'published', 'reports_rejected',
        coalesce(v_note, 'Sikayetler reddedildi (G14)'));
      v_republished := true;
    end if;
  end if;

  select listing_status into v_listing from public.whatsapp_landings where id = v_report.landing_id;

  return jsonb_build_object(
    'report_id', v_report.id,
    'decision', p_decision,
    'closed_reports', v_closed,
    'strike', v_strike,
    'group_republished', v_republished,
    'listing_status', v_listing);
end;
$$;

comment on function public.review_group_report_v1(uuid, text, text) is
  'Şikayet kararı (G14, is_admin tek kapı). upheld → grubun açık şikayetleri kapanır + '
  'admin_record_group_strike (sebep → kırmızı çizgi 1..7, diger → NULL). rejected → '
  'başka açık şikayet yoksa ve hidden_reason=reports ise grup published (G12 kapısı).';

revoke all on function public.review_group_report_v1(uuid, text, text) from public, anon;
grant execute on function public.review_group_report_v1(uuid, text, text) to authenticated;

-- ── 6) Moderatör okuma kapısı (şikayetçi kimliği YALNIZ admin'e) ────────────

create or replace function public.admin_list_group_reports()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rows jsonb;
begin
  if not public.is_admin(v_uid) then
    raise exception 'group_report_review_forbidden';
  end if;

  select coalesce(jsonb_agg(g order by g->>'first_report_at'), '[]'::jsonb)
    into v_rows
  from (
    select jsonb_build_object(
             'landing_id', w.id,
             'slug', w.slug,
             'group_name', w.group_name,
             'listing_status', w.listing_status,
             'hidden_reason', w.hidden_reason,
             'open_count', count(*),
             'distinct_reporters', count(distinct r.reporter_id),
             'first_report_at', min(r.created_at),
             'reason_counts', (
               select jsonb_object_agg(x.reason, x.n)
               from (
                 select r2.reason, count(*) as n
                 from public.group_reports r2
                 where r2.landing_id = w.id and r2.status = 'open'
                 group by r2.reason
               ) x),
             'reports', jsonb_agg(jsonb_build_object(
               'id', r.id,
               'reason', r.reason,
               'note', r.note,
               'reporter_id', r.reporter_id,
               'created_at', r.created_at) order by r.created_at)
           ) as g
    from public.group_reports r
    join public.whatsapp_landings w on w.id = r.landing_id
    where r.status = 'open'
    group by w.id, w.slug, w.group_name, w.listing_status, w.hidden_reason
  ) t;

  return v_rows;
end;
$$;

comment on function public.admin_list_group_reports() is
  'Moderatör şikayet kuyruğu (G14): açık şikayetler grup bazlı — sebep dağılımı, farklı '
  'şikayetçi sayısı, notlar. Şikayetçi kimliği yalnız admin''e döner.';

revoke all on function public.admin_list_group_reports() from public, anon;
grant execute on function public.admin_list_group_reports() to authenticated;

-- ── 7) Üst şerit: pending_reports artık gerçek sayaç (diğer her şey AYNI) ────

create or replace function public.group_moderator_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pending_groups integer;
  v_pending_claims integer;
  v_pending_posts integer;
  v_pending_reports integer;
  v_moderated integer;
  v_threshold integer;
  v_fast boolean;
  v_runs jsonb;
begin
  if not public.is_admin(v_uid) then
    raise exception 'group_moderator_forbidden';
  end if;

  select count(*) into v_pending_groups
  from public.whatsapp_landings where listing_status = 'pending_review';

  -- Tasarım §10: sahiplik kuyruğu = ekran görüntüsü yöntemi (kod yolu otomatik).
  select count(*) into v_pending_claims
  from public.group_claims
  where status = 'pending' and method = 'screenshot';

  select count(*) into v_pending_posts
  from public.group_posts where post_status = 'pending_platform';

  -- G14: açık şikayet sayısı.
  select count(*) into v_pending_reports
  from public.group_reports where status = 'open';

  select count(*) into v_moderated
  from public.whatsapp_landings where listing_status = 'published';

  v_threshold := public.group_setting_int('groups.fast_lane_suggest_threshold', 100);
  v_fast := public.group_setting_bool('groups.fast_lane_enabled', false);

  select coalesce(jsonb_agg(jsonb_build_object(
           'jobname', j.jobname,
           'schedule', j.schedule,
           'last_status', r.status,
           'last_end_time', r.end_time
         ) order by j.jobname), '[]'::jsonb)
    into v_runs
  from cron.job j
  left join lateral (
    select d.status, d.end_time
    from cron.job_run_details d
    where d.jobid = j.jobid
    order by d.start_time desc
    limit 1
  ) r on true
  where j.jobname like 'group\_%';

  return jsonb_build_object(
    'pending_groups', v_pending_groups,
    'pending_claims', v_pending_claims,
    'pending_posts', v_pending_posts,
    'pending_reports', v_pending_reports,
    'moderated_count', v_moderated,
    'fast_lane_suggest_threshold', v_threshold,
    'fast_lane_enabled', v_fast,
    'task_runs', v_runs
  );
end;
$$;

comment on function public.group_moderator_summary() is
  'M5 üst şeridi (G24, tasarım §10): dört kuyruk sayacı · moderasyondan geçen '
  'grup (published) sayacı + eşik · hızlı şerit bayrağı · group_% cron işlerinin '
  'son koşuları. G14: pending_reports = group_reports''taki açık şikayet sayısı.';

revoke all on function public.group_moderator_summary() from public, anon;
grant execute on function public.group_moderator_summary() to authenticated;

commit;
