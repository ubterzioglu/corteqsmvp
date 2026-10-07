-- G14b · Şikayet karar süresi: 15 gün (moderatör SLA'si)
--
-- ═══ KAYNAK ═══
--   6 Ekim 2026 kullanıcı kararı: "15 günlük karar süresi".
--   Mevcut: Şikayet eşiği (3) geçildiğinde grup hidden(reports) olur, moderatör
--   inceler, karar verir (onay/red). Ama karar süresi YOK — grup süresiz hidden kalabilir.
--
-- ═══ TASARIM ═══
--   15 gün içinde karar verilmezse:
--     • Grup suspended olur (30 gün, groups.suspension_days ile aynı)
--     • suspended_until = now() + 30 gün
--     • Şikayetler rejected sayılır (karar verilmedi = onaylanmadı)
--   Bu, moderatöre baskı yapar (karar vermeli) ve grup sahibine adil (30 gün sonra otomatik yayın).
--
-- ═══ DEĞİŞİKLİKLER ═══
--   1. group_settings ekle: groups.report_decision_deadline_days = 15
--   2. Yeni fonksiyon: group_reports_expire_unreviewed()
--      • 15 günü geçmiş açık şikayetleri bul
--      • Grupları suspended yap (set_group_status_v1)
--      • Şikayetleri rejected yap (review_note: "Karar süresi doldu")
--   3. pg_cron job: group_report_decision_deadline (günlük 04:47 UTC)
--
-- ═══ SALT EKLEME ═══
--   Tablo/kolon düşürmez. Yalnızca yeni ayar, fonksiyon, cron job ekler.
--
-- ═══ ETKİ ═══
--   15 günden eski açık şikayetler otomatik reddedilir, gruplar suspended olur.
--   Moderatör 15 gün içinde karar vermeli (onay/red).

begin;

-- ── 1) Karar süresi ayarı ─────────────────────────────────────────────────────

insert into public.group_settings (key, value)
values ('groups.report_decision_deadline_days', '15'::jsonb)
on conflict (key) do nothing;

-- ── 2) Süresi dolan şikayetleri reddeden fonksiyon ────────────────────────────

create or replace function public.group_reports_expire_unreviewed()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deadline_days integer;
  v_suspension_days integer;
  v_row record;
  v_expired integer := 0;
  v_prev_claims text;
  v_prev_role text;
  v_prev_sub text;
begin
  v_deadline_days := public.group_setting_int('groups.report_decision_deadline_days', 15);
  v_suspension_days := public.group_setting_int('groups.suspension_days', 30);

  -- 15 günü geçmiş açık şikayetler (grup bazlı)
  for v_row in
    select distinct r.landing_id
    from public.group_reports r
    where r.status = 'open'
      and r.created_at < now() - make_interval(days => v_deadline_days)
  loop
    -- Grup suspended değilse, suspended yap
    perform 1 from public.whatsapp_landings
    where id = v_row.landing_id and listing_status = 'hidden' and hidden_reason = 'reports'
    for update;

    if found then
      -- G22 deseni: set_group_status_v1 servisi JWT claim'inden tanır;
      -- cron service_role ile çalışır, geçici claim değişikliği GEREKMEZ.
      -- Ama güvenlik için aynı deseni kullanalım (group_reports migration'ındaki gibi).
      v_prev_claims := current_setting('request.jwt.claims', true);
      v_prev_role := current_setting('request.jwt.claim.role', true);
      v_prev_sub := current_setting('request.jwt.claim.sub', true);
      perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
      perform set_config('request.jwt.claim.role', 'service_role', true);
      perform set_config('request.jwt.claim.sub', '', true);

      begin
        perform public.set_group_status_v1(
          v_row.landing_id, 'suspended', 'reports_deadline',
          'Karar süresi doldu (' || v_deadline_days || ' gün) — otomatik askı');
      exception when others then
        -- Matris izin vermezse (grup zaten suspended/removed) sessizce atla
        null;
      end;

      perform set_config('request.jwt.claims', coalesce(v_prev_claims, ''), true);
      perform set_config('request.jwt.claim.role', coalesce(v_prev_role, ''), true);
      perform set_config('request.jwt.claim.sub', coalesce(v_prev_sub, ''), true);
    end if;

    -- Bu grubun tüm açık şikayetlerini rejected yap
    update public.group_reports
       set status = 'rejected',
           reviewed_at = now(),
           review_note = 'Karar süresi doldu (' || v_deadline_days || ' gün) — otomatik red'
     where landing_id = v_row.landing_id
       and status = 'open';

    v_expired := v_expired + 1;
  end loop;

  return jsonb_build_object('expired_groups', v_expired);
end;
$$;

comment on function public.group_reports_expire_unreviewed() is
  'G14b: 15 günü geçmiş açık şikayetleri otomatik reddeder. Grup hidden(reports) ise
   suspended olur (30 gün). Moderatör 15 gün içinde karar vermeli (onay/red).
   pg_cron job: group_report_decision_deadline (günlük 04:47 UTC).';

revoke all on function public.group_reports_expire_unreviewed() from public, anon, authenticated;
grant execute on function public.group_reports_expire_unreviewed() to service_role;

-- ── 3) pg_cron job ────────────────────────────────────────────────────────────

do $$
begin
  perform cron.unschedule('group_report_decision_deadline');
exception when others then null;
end $$;
select cron.schedule('group_report_decision_deadline', '47 4 * * *',
  $cron$ select public.group_reports_expire_unreviewed() $cron$);

commit;
